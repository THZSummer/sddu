# FR-AUTONOMY-001 关键技术假设验证：prompt_async 能否打断阻塞中的 turn

> **验证对象**: FR-AUTONOMY-001「自主模式 sddu-auto」方案 B（协议层拦截 + 回传 sddu-auto 思考）落地的**先决条件** —— 「opencode 会话收到 prompt_async 消息时，能否【打断】当前正在处理的 turn（中断 task 工具调用的等待），先处理新消息？」
> **验证方法**: 只读反编译 opencode 1.18.18 二进制（`strings` / `grep` / `dd` 提取 JS 源码片段），不修改任何文件
> **验证二进制**: `/home/usb/.nvm/versions/node/v24.15.0/lib/node_modules/opencode-ai/bin/opencode.exe`（Bun 编译 ELF，183MB，`strings` 可直接提取嵌入 JS 源码）
> **验证时间**: 2026-08-16
> **验证人**: SDDU Plan Agent（file-search specialist）
> **结论先行**: **❌ 不支持打断** —— prompt_async 注入的新消息**排队等待**当前 turn 完成，**不能**中断「阻塞等待 task 工具返回」的状态。**方案 B 判定为不可行（死锁），必须走变体 B'（sddu-auto 改轮询调度）**。

---

## 1. 验证结论摘要

| 验证问题 | 结论 |
|---|---|
| 1. prompt_async 消息如何进入会话 | `POST /session/{id}/prompt_async` → `SessionHttpApi.promptAsync` → `SessionPrompt.prompt`（写入 user 消息）→ `SessionPrompt.loop` → `SessionRunState.ensureRunning`（forkIn 异步，HTTP 立即返回 204） |
| 2. 消息打断/排队模型 | **排队模型（❌ 不打断）**：Runner 状态机在 `Running` 状态收到新 `ensureRunning` 请求时，返回 `y(m.run.done)` —— 等待当前 run 的 done promise（等价 FIFO 排队），**不 interrupt 当前 fiber**。唯一打断途径是 `cancel`（abort API / 用户 Esc），语义为「取消整个当前 turn」，而非「插入新消息优先处理」 |
| 3. task 工具等待模型 | **同步阻塞等待**：`TaskTool.execute` 前台任务执行 `s.raceFirst(e.wait({id:O.id}), ...)` 阻塞等待子 Agent 会话完成；主会话 `SessionPrompt.run` 主循环 `yield* c({task:ie,...})`（handleSubtask）阻塞等待 task 工具返回 |
| 4. 最终判定 | **❌ 不能打断 → 方案 B 死锁 → 变体 B'（轮询调度）** |

---

## 2. 反编译证据

> 所有代码片段均直接提取自二进制（`dd bs=1 skip=<offset> count=<n>` + `strings`）。offset 标注便于复核。

### 2.1 prompt_async 消息进入会话的完整链路

**① HTTP 路由注册**（offset 96119879）：
```js
C.post("promptAsync", Dn.promptAsync, {
  params:{sessionID:p}, query:J, payload:v$, success:A(B.NoContent,"Prompt accepted"),
  ...
}).annotateMerge(M.annotations({
  identifier:"session.prompt_async",
  summary:"Send async message",
  description:"Create and send a new message to a session asynchronously, starting the session if needed and returning immediately."
}))
```

**② 服务端 handler**（offset 96125982）：
```js
fn("SessionHttpApi.promptAsync")(function*(Y){
  return yield*z(Y.params.sessionID),
  yield*r.prompt({...Y.payload, sessionID:Y.params.sessionID})
    .pipe(I.catchCause(...)),                 // 失败仅记日志 + 发布 error 事件，不阻塞
  I.forkIn(Z, {startImmediately:!0}),          // ★ forkIn：异步启动，HTTP 立即返回
  B.NoContent.make()                            // ★ 返回 204，不等待消息被处理
})
```

**③ `r` = SessionPrompt 服务**（offset 96479672 依赖注入 + 96502574 定义）：
```js
jo=s.fn("SessionPrompt.loop")(function*(t){
  return yield*x.ensureRunning(t.sessionID, ye(t.sessionID), $e(t.sessionID))
})                                        // ★ x = SessionRunState；ye = onInterrupt；$e = run 主循环
```

**④ 关键：`SessionPrompt.prompt`（we）在写入消息后只调用 `loop`，不做任何打断**（offset 96497196）：
```js
we=s.fn("SessionPrompt.prompt")(function*(t){
  let O=yield*o.get(t.sessionID).pipe(s.orDie);
  yield*m.cleanup(O);
  let U=yield*le(t);                       // 写入 user 消息
  yield*o.touch(t.sessionID);
  ...
  if(t.noReply===!0)return U;
  return yield*jo({sessionID:t.sessionID}) // → SessionPrompt.loop → ensureRunning
})
```

### 2.2 核心机制：Runner 状态机（排队 vs 打断）

**`SessionRunState`**（offset 96283868）：
```js
i=s.fn("SessionRunState.runner")(function*(k,g){
  let W=Io.make(y.scope,{
    onIdle: ..., onBusy:o.set(k,{type:"busy"}), onInterrupt:g
  });                                        // onInterrupt 仅在 cancel 时触发
  ...
}),
d=s.fn("SessionRunState.ensureRunning")(function*(k,g,y){
  return yield*(yield*i(k,g)).ensureRunning(y)
})
```

**Runner 状态机 `ensureRunning` 实现**（offset 96284855 附近，`h` 函数）：
```js
h=(x)=>Se.modifyEffect(l,s.fnUntraced(function*(m){
  switch(m._tag){
    case"Running": case"ShellThenRun":
      return[y(m.run.done),m];     // ★★★ 已 Running → 等待当前 run 的 done promise（排队！）
    case"Shell":{
      let q={id:k(),done:yield*Ze.make(),work:x};
      return[y(q.done),{_tag:"ShellThenRun",shell:m.shell,run:q}]
    }
    case"Idle":{
      let q=yield*Ze.make(),z=yield*b(x,q);   // 仅 Idle 时才真正启动新 run
      return[y(q),{_tag:"Running",run:z}]
    }
  }
})).pipe(s.flatten)
```
- `y=(x)=>Ze.await(x).pipe(s.catchTag("RunnerCancelled",...))` —— `y(m.run.done)` = **等待当前 run 完成**，期间不做任何 interrupt。
- `get busy(){return f()._tag!=="Idle"}` —— 会话运行中（含 task 工具等待）即为 busy，busy 期间新 prompt 一律排队。

**唯一打断路径：`cancel`**（offset 96284878）：
```js
K=Se.modify(l,(x)=>{
  switch(x._tag){
    case"Running":return[s.gen(function*(){
      yield*Wl.interrupt(x.run.fiber),        // ★ interrupt 当前 fiber
      yield*Ze.fail(x.run.done,new No)...,{_tag:"Idle"}];
    ...
```
`cancel` 仅由 abort 通道触发（`SessionHttpApi.abort` → `r.cancel(sessionID)`，offset 96209505），**prompt_async 不调用 cancel**。

**结论：新 prompt_async 消息在会话 busy（Running）时被 FIFO 排队，等待当前 turn 完全结束后才由新的 run 处理。不能打断。**

### 2.3 task 工具等待模型（主会话阻塞确认）

**`TaskTool.execute` 前台任务**（offset 96580000 附近）：
```js
// run:A() 里 A = TaskTool.runTask = J.prompt({sessionID:O.id, ...}) —— 向子会话发 prompt
let j=yield*e.start({id:O.id, type:sr, title:m.description, metadata:N,
  onPromote:...,
  run:A().pipe(s.onInterrupt(()=>J.cancel(O.id)))});
...
// 前台执行：★ 阻塞等待子 Agent 会话完成
return yield*s.acquireUseRelease(
  s.sync(()=>{l.abort.addEventListener("abort",W)}),
  ()=>s.gen(function*(){
    let G=yield*s.raceFirst(e.wait({id:O.id})...);   // ★★★ 等子任务（子会话 run）完成
    ...
    return{title:m.description, metadata:N, output:Ur({...})}
  }),
  ...)
```

**主会话主循环 `SessionPrompt.run`（$e）阻塞在 task 工具**（offset 96497861）：
```js
let ie=Ge.pop();
if(ie?.type==="subtask"){
  yield*c({task:ie, model:Z, lastUser:X, sessionID:t, session:Q, msgs:C});  // ★ handleSubtask，阻塞
  continue
}
```

**`handleSubtask` 内部**（offset 96482423）：
```js
let L=new AbortController,
G=yield*Ge.execute(ie,{agent:O.agent, messageID:fe.id, sessionID:Q,
  abort:L.signal, callID:Z.callID, ...})      // ★ yield* 阻塞等待 task 工具返回
  .pipe(s.catchCause(...), s.onInterrupt(()=>{L.abort(), ...}))  // 仅 interrupt 时 abort 子任务
```

**确认：sddu-auto 主会话执行 task 工具时处于「阻塞等待」状态，Runner 状态 = Running，fiber 挂起在 `e.wait`。整个等待期间主会话不消费任何新消息。**

### 2.2b 补充证据：v2 协议（serve RPC 通道）同样不打断

opencode 1.18.18 同时包含 v1 HTTP（`/session/{id}/prompt_async`，serve-api.cjs 使用的通道）与 v2 RPC（`server.session.prompt`）。两者语义一致，均为排队：

**v2 `V2Session.prompt`**（offset 102816929）：
```js
prompt:Z.fn("V2Session.prompt")((H)=>Z.uninterruptible(Z.gen(function*(){
  ...
  u=yield*Gx.admit($,J,{id:i, sessionID:H.sessionID, prompt:F, delivery:o})...;  // 消息落库
  if(H.resume!==!1)yield*X.wake(u.sessionID);   // ★ 走 coordinator.wake
  return u
})))
```

**`SessionRunCoordinator`**（offset 98118550）：
```js
J=(X)=>U.sync(()=>{                              // wake
  let z=$.get(X);
  if(z!==void 0){ z.pendingWake=!0; return }     // ★★★ 已有运行 → 仅标记 pendingWake（排队）
  let F=Y(); $.set(X,F), W(X,F,!1)              // 仅空闲时立即启动 drain
}),
Z=(X)=>U.uninterruptibleMask((z)=>{              // run（resume）
  let F=$.get(X);
  if(F!==void 0){ ...; return z(p.await(F.done)) }  // ★★★ 已有运行 → 排队等待完成
  let R=Y(); return $.set(X,R), W(X,R,!0), z(p.await(R.done))
}),
V=(X)=>U.suspend(()=>{                           // interrupt（唯一打断路径）
  ...; return z.stopping=!0, z.pendingWake=!1, j6.interrupt(z.owner)
})
```
- `wake` 在会话 busy 时**只置 `pendingWake=!0`**，由 drain 完成回调 `H` 在**当前 drain 结束后**才触发下一次 drain（offset 98118500 `H`：`if(isSuccess(F)&&!z.stopping&&z.pendingWake){...W(X,z,!1,!0)}`）——即**排队后处理，非打断**。
- `interrupt` 才真正 `j6.interrupt(z.owner)`，且仅由 abort 通道调用（`SessionHttpApi.abort` / v2 `session.interrupt`）。

**结论：v1 HTTP 与 v2 RPC 的 prompt 注入通道，在会话 busy（task 工具等待中）时均不打断，仅排队。**

### 2.4 question 工具等待模型（子会话阻塞确认）

**`Question.ask`**（offset 96512744）：
```js
r=s.fn("Question.ask")(function*(y){
  let l=yield*jo.make(), $={id:m, sessionID:y.sessionID, questions:y.questions, tool:y.tool};
  u.set(m,{info:$,deferred:l});
  yield*o.publish(wr.Asked,$);      // ★ 发布 question.asked 事件（插件可捕获）
  yield*s.ensuring(jo.await(l), ...) // ★★★ 阻塞等待 reply/reject
})
```
- `Question.reply`（offset 96513358）：`jo.succeed(m.deferred, y.answers)` —— 解除阻塞。
- `Question.reject`：`jo.fail(m.deferred, ...)` —— 解除阻塞。

**确认：子 Agent 调用 question 工具后子会话 turn 阻塞等待回答，只有 `reply`/`reject` 端点才能解除。**

---

## 3. 死锁闭环推导（方案 B 判定依据）

```
[1] sddu-auto 主会话 turn 运行中
    Runner 状态 = Running
    SessionPrompt.run 主循环 → yield* handleSubtask → yield* TaskTool.execute
    → s.raceFirst(e.wait({id:子会话}))       // 阻塞等待子 Agent 完成
          │
[2] 子 Agent 会话 turn 运行中，调用 question 工具
    → Question.ask → publish question.asked → jo.await(l)   // 子会话阻塞等待回答
          │
[3] decision-proxy 拦截 question.asked 事件
    → 调用 prompt_async 向 sddu-auto 主会话注入 [DECISION-REQUEST]
    → SessionPrompt.prompt 写入消息 → SessionPrompt.loop → SessionRunState.ensureRunning
    → Runner 状态 = Running → y(m.run.done)   // ★ 新消息排队，等待当前 turn 完成
          │
[4] 主会话当前 turn 完成的前提 = task 工具返回 = 子 Agent 完成
    子 Agent 完成的前提 = question 得到回答
    question 回答的前提 = decision-proxy 注入的答案被主会话处理
    主会话处理答案的前提 = 当前 turn 结束 = task 工具返回
          └────────── 循环依赖，死锁 ──────────┘
```

**唯一解除手段**：`cancel`（abort API / 用户 Esc）会 interrupt 当前 fiber，但语义是**取消整个当前 turn**（`handleSubtask` 的 `onInterrupt` 会 `L.abort()` 连带取消子任务），**不是**「先处理新消息再恢复 task」。因此 abort 无法充当方案 B 的「打断后继续」通道。

---

## 4. 对方案 B vs B' 的判定

### ❌ 方案 B（协议层拦截 + 回传 sddu-auto 思考）—— 判定不可行

- **死锁已由反编译证实**：prompt_async 在会话 busy 时只排队（Runner `ensureRunning` 的 `case"Running"` 分支），不打断；而当前 turn 恰因 task 工具阻塞而 busy，且该阻塞又依赖新消息被处理——构成循环依赖。
- **ADR-018 / plan.md 中的「核心风险 1」在此得到反编译级确认**（此前为「零命中、从未实证」，现升级为「实证不可行」）。
- 即使变通为「prompt_async 后主动调用 abort 再恢复」，abort 会取消整个 turn 连带子任务，无法在保持 task 上下文的前提下插入思考——不满足方案 B 语义。

### ✅ 变体 B'（sddu-auto 提交 task 后轮询，间隙响应 DECISION-REQUEST）—— 判定为必选路径

- **机制可行性**：task 工具支持前台/后台两种模式。后台模式（`background: true`）返回 `output: Ur({state:"running", text:Bs})` 并 `forkIn` 后台运行（offset 96579137 `zs` 结构含 `background:p.optional(p.Boolean)`）；`e.wait({id:O.id})` / `waitForPromotion` 支持「提交后异步查询任务状态」。sddu-auto 可改为「提交后台任务 → 轮询任务状态 → 间隙消费 DECISION-REQUEST 消息 → 回答后继续轮询」，从而绕开死锁。
- **复杂度**：需重构 sddu-auto 调度循环（同步等待 → 提交 + 轮询 + 间隙响应），复杂度显著升高（plan.md 已预估为 L 级），但这是**当前唯一可行路径**。
- **B' 自身需前置 spike**：验证后台 task 的轮询 API 形状（`e.wait` 状态查询）、DECISION-REQUEST 注入后主会话在「无运行中 turn」时能否正常启动 run（Idle 态 ensureRunning 会启动新 run，反编译已确认 Idle 分支可用）。

### 方案 C（双会话代理 resume）—— 维持作为最终退路

- 方案 B 已判定死锁，B' 为必选；若 B' 的轮询改造在 spike 中被证明不可行，才降级方案 C。

---

## 5. 关键反编译证据位置索引（复核用）

| 证据 | offset（十进制） | 内容 |
|---|---|---|
| `prompt_async` 路由/API 定义 | 95940035 / 96119879 / 96125982 | HTTP 路由注册 + `SessionHttpApi.promptAsync`（forkIn + 204） |
| `SessionPrompt.prompt`（we） | 96497196 | 写消息后仅调 `loop` |
| `SessionPrompt.loop`（jo） | 96502574 | → `x.ensureRunning(t.sessionID, ye, $e)` |
| `SessionRunState` | 96283868 | runner/ensureRunning/assertNotBusy/cancel |
| **Runner `ensureRunning`（h）** | 96284855 附近 | **`case"Running"→y(m.run.done)` 排队；仅 Idle 启动新 run** |
| **Runner `cancel`（K）** | 96284878 | interrupt fiber（唯一打断，仅 abort 触发） |
| `SessionHttpApi.abort` | 96209505 | `r.cancel(sessionID)` |
| `SessionPrompt.run`（$e 主循环） | 96497861 | `yield*c({task:...})` 阻塞 |
| `handleSubtask` | 96482423 | `yield* Ge.execute(...)` 阻塞 + `onInterrupt`→`L.abort()` |
| `TaskTool.execute` 前台等待 | 96579800-96582400 | `e.start` + `s.raceFirst(e.wait({id:O.id})...)` |
| `Question.ask` | 96512744 | publish `question.asked` + `jo.await(l)` 阻塞 |
| `Question.reply/reject` | 96513358 | `jo.succeed/fail` 解除阻塞 |
| `question.asked` 事件 schema | 96512179 | `dr({type:"question.asked",...})`（插件可捕获） |
| `SessionRunCoordinator`（v2 run/wake/interrupt） | 98118550-98120160 | v2 同样为排队语义（`run` 等待 done / `wake` 标记 pending），佐证不打断 |
| `V2Session.prompt`（v2 RPC 通道） | 102816929 | `admit` 落库 + `X.wake`（coordinator.wake），同样不打断 |

---

## 6. 附带确认（方案 B 其它要素的可行性）

| 要素 | 状态 | 证据 |
|---|---|---|
| 插件 event hook 捕获 question.asked | ✅ 已实证 | verify-decision-proxy.md（运行时实证） |
| `POST /question/{requestID}/reply` 代答端点 | ✅ 已实证 | QuestionHttpApi（offset 96205000 附近）+ verify-decision-proxy.md |
| `SessionRegistry.getAutoParent` 关联 | ✅ 已实证 | verify-decision-proxy.md |
| **prompt_async 打断阻塞中 turn** | **❌ 不可行（本次验证）** | 本文 §2.2 / §3 |
| task 后台模式（B' 依赖） | ⚠️ 需 B' 前置 spike | offset 96579137 `background` 字段存在；轮询 API 形状待实测 |

---

## 7. 建议下一步（Plan 阶段即可定）

1. **plan.md / ADR-018 更新**：将「核心风险 1」结论从「需 spike 实测」升级为「反编译实证：prompt_async 不打断，方案 B 死锁」；方案判定改为**变体 B'（轮询调度）**为落地路径。
2. **新增 B' 前置 spike（TASK 级）**：验证「task 后台模式提交 + `e.wait` 状态轮询」的 API 契约，确认轮询间隙可消费 DECISION-REQUEST（主会话 Idle 态 `ensureRunning` 可启动新 run，反编译已确认）。
3. **方案 C** 降级为 B' 失败时的兜底，不再与方案 B 并行考虑。
