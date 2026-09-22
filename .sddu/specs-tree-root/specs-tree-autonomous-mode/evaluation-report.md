# 评价报告：FR-AUTONOMY-001「自主模式 sddu-auto」真实用户体验复盘

> **评价对象**: Feature `specs-tree-autonomous-mode`（FR-AUTONOMY-001「自主模式 sddu-auto」）
> **评价依据**: 真实用户体验会话 `sddu-test-user-login-6/session-ses_ff9c.md`（8/16 00:23→01:02，约 40 分钟全程无中断）
> **对照**: spec.md（FR-001~010 / NFR-001~003 / EC-001~005）、plan.md v3.2、ADR-018~021
> **评价人**: SDDU 评价 Agent
> **评价时间**: 2026-08-16
> **结论**: **基本满足**（7/10 FR 满足，2 部分满足，1 运行实证失败——FR-006）
> **2026-08-16 更新**: O1/P1-1 已补运行实证（`verify-decision-proxy.md`）。结论更新：decision-proxy 拦截/识别/决策/追溯四步真实工作（decision_count 首次 =1），但 **reply 代答通道失败，闭环断裂**；并查明既往 decision_count=0 的真正根因是插件加载失败（opencode 不加载子目录插件）。

---

## 1. 结论总评

**总体结论：基本满足需求目标（FR-007 全套产物、FR-002 全流程、FR-004 绝不问人等核心目标达成），但存在两项结构性缺口：**

1. **FR-006 核心机制运行实证失败**——已按 O1 补「强制提问」e2e 验证（`verify-decision-proxy.md`）：decision-proxy 能真实拦截 question.asked 并完成识别/决策/追溯（decision_count 首次 =1），但 **reply 代答步骤失败**，闭环断裂。同时查明既往 decision_count=0 的真正根因是**插件加载失败**（opencode 不加载子目录 `sddu/` 插件，event hook 从未注册），而非仅"子 Agent 从不提问"。机制存在但代答通道不可用，「可靠性 100%」的承诺缺乏运行证据。
2. **决策追溯（ADR-020）运行实证可用但需修复 reply 通道**——`auto-decisions.md` 在运行实证中已由协议层真实产出（首次落盘，decision_count=1），证明追溯机制本身可用；但该产出依赖的 reply 通道 bug 需修复（见问题 2），sddu-auto 自身关键自主决策仍建议按 O3 记录。

**产物沉淀疑点系误报**——`.sddu/specs-tree-root/specs-tree-user-login/` 下 discovery.md ~ validate-report.md 全套产物**完整存在**。初步 glob「无产物」是因 glob 工具默认忽略隐藏目录（`.sddu` 为 dot 目录），非路径错误、非写入失败、未违反 FR-007。

**决策质量评价**：总体合格。A-002/A-004 确定性裁决合理、P1（落盘未 await）主动修复得当、七阶段产物链条自洽。主要瑕疵集中在「启动问卷被完全跳过」和「决策过程无痕」。

---

## 2. 需求满足度对照表

### 2.1 功能需求（FR）

| ID | 需求 | 判定 | 证据 |
|----|------|:--:|------|
| FR-001 | 新增独立调度入口 sddu-auto | ✅ 满足 | 会话以 `Sddu-Auto` 身份运行；`.opencode/plugins/sddu/agents/sddu-auto.md` 存在 |
| FR-002 | 走完整 7 流程（discovery→validate） | ✅ 满足 | 7 次 task 调度逐一完成；state.json phase 推进至 `validated` / status `completed` |
| FR-003 | 启动阶段为唯一人机交互点，启动时提问澄清诉求 | ⚠️ 部分满足 | **全程零提问**。提示词已含完整六维信息，sddu-auto 判定「最小充分信息集采满 + 用户表态全程自动」直接切分进入执行（合规于 ADR-019），但字面验收「向用户发起提问」未发生，问卷从未呈现 |
| FR-004 | 执行阶段绝不向用户提问，拿不准也硬决策 | ✅ 满足 | 全流程无任何面向用户的提问；决策通过注入契约实现（软约束路径） |
| FR-005 | 7 个子 Agent 执行流程零改动 | ✅ 满足 | 所有约束经 task prompt 注入，未修改任何子 Agent prompt 文件 |
| FR-006 | 子 Agent 提问接收方由用户变为 sddu-auto（协议层代答） | ❌ 运行实证失败 | **已运行实证（见 `verify-decision-proxy.md`）**：拦截→识别→决策→追溯四步真实工作（decision_count 首次 =1，auto-decisions.md 落盘），但 **reply 代答步骤失败**（三级通道全失效：v2/client 访问器缺失 + session 级端点 404；正确通道为全局 `/question/{requestID}/reply` 未采用）。闭环在最后一步断裂 |
| FR-007 | 沉淀全套过程产物（discovery.md ~ validate.md） | ✅ 满足 | Feature 目录下 9 份标准产物 + 4 个 ADR + state.json + TREE.md 全部落盘 |
| FR-008 | 选择入口即进入自主决策模式，无判定/开关 | ✅ 满足 | 无复杂度判定、无配置项，直接进入执行阶段 |
| FR-009 | 边界限定新增代理决策层，不改造子 Agent、无 autonomyLevel | ✅ 满足 | 子 Agent 定义未改；无 L0/L1/L2 分级配置 |
| FR-010 | 跑完 7 流程 + 全套产物即完成，无修正/回退/迭代 | ✅ 满足 | validated 后收尾；P2 遗留（超长 body）保留未修（符合 NG-003）。⚠️ 注：sddu-auto 主动修复 review P1 行为经复核判定为**职责越界**（调度者不应亲自实施 bugfix），已作为 F7 记录并在 build.md §6 修复（补「调度者不实施」硬约束） |

**FR 汇总：满足 8 项 / 部分满足 1 项（FR-003）/ 运行实证失败 1 项（FR-006，见 `verify-decision-proxy.md`）**

### 2.2 非功能需求（NFR）

| ID | 需求 | 判定 | 证据 |
|----|------|:--:|------|
| NFR-001 | 启动提问覆盖必要信息维度，表达不完整时启动阶段内补全 | ✅ 满足 | 六维信息在 `auto-context.json` 完整固化；本场景提示词已覆盖全部维度，未触发追问（EC-001） |
| NFR-002 | 产物文件命名与结构同普通 sddu 一致 | ✅ 满足 | discovery.md/spec.md/plan.md/tasks.md/build.md/review*.md/validate*.md 命名、位置与标准流程一致 |
| NFR-003 | 执行阶段面对信息不足必须返回确定决策，不阻塞/反问 | ✅ 满足 | 全程无阻塞、无反问；spec 阶段对 A-002/A-004 做确定性裁决 |

### 2.3 边界情况（EC）

| ID | 场景 | 判定 | 证据 |
|----|------|:--:|------|
| EC-001 | 启动诉求不完整 | ⚠️ 未触发 | 提示词已完整，未进入追问路径 |
| EC-002 | 执行阶段未覆盖决策点 | ✅ 满足 | A-002（依赖边界）、A-004（密码重置形态）在 spec 阶段硬裁决并注入下游 |
| EC-003 | 需外部信息缺失 | ⚠️ 未触发 | 本场景无外部 API 依赖 |
| EC-004 | 复杂项目误交 sddu-auto | ⚠️ 未触发 | 测试为简单项目 |
| EC-005 | 产物不满意不修正 | ✅ 满足 | P2 遗留不修，汇总提示可改走 @sddu / @sddu-fast |

---

## 3. 产物沉淀调查结果

### 3.1 结论：产物完整沉淀，疑点系 glob 工具误报

**「无产物」疑点调查结论**：
- `.sddu/` 目录存在，`.sddu/specs-tree-root/` 下产物**完整**：

```
.sddu/specs-tree-root/
├── auto-context.json                     # sddu-auto 自主执行上下文（六维诉求）
└── specs-tree-user-login/
    ├── discovery.md / spec.md / plan.md
    ├── tasks.md + tasks.json
    ├── build.md
    ├── review.md + review-report.md
    ├── validate.md + validate-report.md
    ├── ADR-001~004（scrypt / 会话 / 持久化 / 重置令牌）
    ├── state.json（phase: validated, status: completed）
    └── TREE.md
```

- **误报根因**：`glob('**/*.md')` 对隐藏目录（`.sddu` 为 dot 目录）默认忽略，复现返回 `No files found`；而 `find` 可正常列出全部文件。**非路径错误、非写入失败、非未写**，FR-007 验收实际通过。
- **仅一处小的产物瑕疵**：父链 TREE.md（`.sddu/specs-tree-root/TREE.md`、`.sddu/TREE.md`）未生成，generate-tree.cjs 将其标记为 `skipped（文件不存在）`——sddu-auto 也识别到了但未修复。

### 3.2 会话声称 vs 实际落盘

| sddu-auto 声称 | 实际落盘 |
|------|------|
| 固化自主上下文写入 auto-context.json | ✅ `.sddu/specs-tree-root/auto-context.json` |
| discovery.md 产出 | ✅ 存在（10KB） |
| spec.md 产出（12 FR/8 NFR/10 EC） | ✅ 存在（16KB） |
| plan.md + 4 ADR 产出 | ✅ 全部存在 |
| tasks.md + tasks.json（15 任务/7 波次） | ✅ 存在 |
| build.md + src/ 22 文件 | ✅ build.md + src/ 完整 |
| review.md + review-report.md | ✅ 存在 |
| validate.md + validate-report.md | ✅ 存在（V13 场景 37 通过/1 偏差） |
| **auto-decisions.md（决策追溯）** | ✅ **运行实证已产出**（`verify-decision-proxy.md`，2026-08-16）：强制提问场景下由 decision-proxy 协议层真实追加 1 条决策记录（decision_count=1）。⚠️ 注：该产出伴随 reply 通道 bug（见问题 2），且既往 7 流程 run 未产出（插件未加载根因所致） |

---

## 4. 瑕疵清单（按严重度）

| # | 严重度 | 瑕疵 | 说明 |
|---|:--:|------|------|
| F1 | 🔴 高 | FR-006 协议层拦截未经运行实证（已实证，结论：闭环断裂） | 原判定「decision-proxy 已实装但从未触发」**根因已查明**：① 环境级——opencode 本地插件自动发现 glob `{plugin,plugins}/*.{ts,js}` 不匹配子目录 `sddu/`，serve/run 模式插件从未加载（无 `SDDU Plugin loaded` 日志），故 event hook 从未注册、任何提问都不可能被拦截（这才是既往 decision_count=0 的真正根因）；② 强制加载插件后运行实证：拦截/识别/决策/追溯四步真实工作（decision_count=1），但 **reply 三级通道全部失效**（v2/client 访问器缺失 + session 级端点 404，正确通道为全局 `/question/{requestID}/reply` 未被采用），代答闭环在最后一步断裂。详见 `verify-decision-proxy.md` |
| F2 | 🟡 中 | 决策追溯运行实证已打通但存在通道 bug + 既往 run 未产出 | ADR-020 机制运行实证可用（`verify-decision-proxy.md`：decision_count=1、auto-decisions.md 落盘）；但 ① reply 通道 bug（见问题 2）需修复；② 既往 7 流程 run 因插件加载失败未产出；③ sddu-auto 自身关键自主决策（跳过问卷、P1 修复、A-002/A-004 裁决）仍未记录，用户对「代答了什么/为什么」零可见（O3 待办） |
| F3 | 🟡 中 | 启动问卷被完全跳过 | 六维问卷从未呈现给用户。虽符合 ADR-019 切分点判定（信息已采满），但「启动问一次」的体验退化为「不问即跑」，用户无机会确认/修正 sddu-auto 对诉求的理解 |
| F4 | 🟢 低 | 父链 TREE.md 缺失 | `.sddu/specs-tree-root/TREE.md` 与 `.sddu/TREE.md` 未生成（脚本 skip「文件不存在」），目录导航链不完整 |
| F5 | 🟢 低 | 长任务无中间可见性 | 7 阶段耗时约 40 分钟，期间无阶段间进度输出；build 单次 task 阻塞 648s、validate 636s，用户全程静默等待 |
| F6 | 🟢 低 | 阶段间产物校验浅 | 每阶段完成仅 grep state.json 的 phase/status + ls 目录，未对产物内容做非空/有效性断言（依赖子 Agent 自报） |
| F7 | 🔴 高 | sddu-auto 职责越界（调度者亲自实施 bugfix） | 真实体验中 sddu-auto 在 review 发现 P1 后**亲自修改代码**（`userService.ts` + `meHandlers.ts`）并编译验证，违反「每个 Agent 只做自己阶段的事」核心原则。根因两层：① sddu-auto 模板缺「调度者不实施」硬约束；② 注入给 review 的契约含「发现 P0 可直接修复」授权。**修复进展（已分两步落地，仅改 `src/templates/agents/sddu-auto.md.hbs`）**：① build.md §6 — 补文字硬约束 + 问题派发修复流程（v1.2）；② build.md §7 — **权限层面硬性落实**：frontmatter `edit`/`bash`/`webfetch` 由 allow 改 deny（保留 task/skill），所有实施动作（含写文件）一律派发子 Agent，§4.1/§5.2/§5.3/§8/§9/§10 六处同步强化（v1.3，`npm run build:agents` 已重新生成 dist，逐字节一致） |

---

## 5. 优化项清单

| # | 优化项 | 价值 |
|---|--------|------|
| O1 | 补一条「强制提问注入」e2e 场景：让某个子 Agent 在特定条件下真实调用 question 工具，验证 decision-proxy 拦截→代答→回复闭环 | ✅ **已执行**（见 `verify-decision-proxy.md`）。拦截→识别→决策→追溯四步运行实证通过（decision_count=1），**但 reply 代答步骤失败**（三级通道全失效），闭环未闭合 → 转为修复项（问题 2），补 FR-006 运行实证缺口的目标部分达成（实证了拦截/决策可用，暴露了 reply 通道 bug） |
| O2 | 启动问卷即使信息已齐，也应向用户展示一次「已识别诉求摘要 + 最小确认」（或显式声明「检测到完整诉求，直接进入执行」） | 恢复「启动问一次」体验，保证用户对诉求理解的知情与纠偏机会 |
| O3 | 将 sddu-auto 自身关键自主决策（跳过问卷、P1 修复、A-002/A-004 裁决）写入 `auto-decisions.md` 或独立决策日志 | 使决策追溯有意义（当前追溯能力为零） |
| O4 | generate-tree.cjs 对不存在的父目录改为创建（而非 skip），或明确定义为已知边界 | 补全目录导航链 |
| O5 | 长 task 运行期间输出阶段进度/心跳（如「阶段 5/7 build 进行中…」） | 改善 40 分钟静默等待体验 |
| O6 | 每阶段校验产物文件存在且非空后再进入下一阶段 | 防「假完成」链条向下传递 |

---

## 6. 问题清单（含严重度分级）

| # | 级别 | 问题 | 描述 |
|---|:--:|------|------|
| P1-1 | 🔴 P1 | FR-006 可靠性未经运行实证（方案 D 零激活样本） | ✅ **已运行实证**（见 `verify-decision-proxy.md`，2026-08-16）：构造强制提问场景，decision-proxy 真实拦截 question.asked 并完成识别/决策/追溯（decision_count 首次 =1，auto-decisions.md 落盘）。**但发现两个运行时 bug 导致闭环断裂**：① 环境级——opencode 插件自动发现不加载子目录 `sddu/`，serve/run 模式插件从未加载（既往 decision_count=0 的真正根因）；② decision-proxy reply 三级通道全失效（v2/client 访问器缺失 + session 级端点 404），代答无法送达子 Agent。**结论：拦截/决策可用，代答闭环未闭合**，需修复 reply 通道 + 插件加载布局后重验 |
| P1-2 | 🔴 P1 | 决策追溯能力运行实证已打通，但 reply 通道 bug + 既往 run 未产出 | `auto-decisions.md` 已由协议层真实产出（运行实证 decision_count=1）；但 reply 通道 bug（问题 2）阻断闭环，且既往 7 流程 run 因插件加载失败未产出，用户事后仍无可回溯的决策记录（O3 待办） |
| P2-1 | 🟡 P2 | 父链 TREE.md 未生成 | 导航链不完整（Feature 级 TREE.md 有，父级缺失） |
| P2-2 | 🟡 P2 | glob 工具对隐藏目录（`.sddu`）假阴性 | 引发「产物丢失」误判；对 SDDU 这类产物全在 `.sddu/` 下的体系，建议排查工具链检测手段 |
| P3 | 🟢 P3 | 产物中留有小偏差：超长 body 返回连接重置而非 400 JSON | validate V9 记录的非阻塞 P2 偏差，按 NG-003 保留未修 |

### 2026-08-16 运行实证新增问题（详见 `verify-decision-proxy.md`）

| # | 级别 | 问题 | 描述 |
|---|:--:|------|------|
| P1-3 | 🔴 P1 | **插件加载失败（环境级根因）** | opencode 本地插件自动发现 glob `{plugin,plugins}/*.{ts,js}` 只匹配 `.opencode/plugins/` 下直接 `.ts/.js` 文件，不匹配子目录 `sddu/`。SDDU 插件位于子目录 → serve/run 模式插件从未加载（无 `SDDU Plugin loaded` 日志、无 sddu_* 工具、event hook 从未注册）。这是既往 decision_count=0 的真正根因。修复方向：插件入口以直接文件形式放入 `.opencode/plugins/`（或安装脚本调整布局 / file: 路径引用）。**本次仅记录，未修复** |
| P1-4 | 🔴 P1 | **decision-proxy replyQuestion 三级代答通道全部失效** | ① 通道 1/2（`client.v2.session.question.reply` / `client.question.reply`）访问器在运行时客户端（`OpencodeClient` v1 SDK）上不存在，被 `if` 短路静默跳过；② 通道 3（HTTP `POST /api/session/{sessionID}/question/{requestID}/reply`）返回 404 `QuestionNotFoundError`（子会话提问不在该 session 作用域）；③ 正确通道为全局 `POST /question/{requestID}/reply`（实测可用，能解除 pending 并让子 Agent 继续），未被采用。**FR-006 代答闭环在最后一步断裂**。本次仅记录，未修复 |

---

## 7. 附：评价方法论

- 逐段通读 `session-ses_ff9c.md`（2560 行），追踪 sddu-auto 全部调度动作、产物校验、决策点。
- 用 `find`/`ls`/`cat` 实测产物落盘，与会话声称逐项对照；复现 glob 假阴性。
- 对照 spec.md FR/NFR/EC 逐项取证（判定基于会话证据链，不基于声称）。
- 检查运行时插件实装：`.opencode/plugins/sddu/adapters/opencode/decision-proxy.js`（实装）与 `plugin.js`（已注册 event/chatMessage hooks）。
