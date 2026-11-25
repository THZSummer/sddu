# ADR-002：命令入口以「路由 Skill + 文本前缀识别」承载

## 状态
PROPOSED

## 背景

用户的唯一对齐面（既定约束）是「**命令入口：`/sddu` 路由与阶段命令**」（spec §1 / Q-003），而 dsh 侧只有 Web UI、无 CLI / TUI（用户权威口径），SDDU 现有入口是 OpenCode 内的 `@sddu` 智能路由 + Agent 模式，两者机制不同。FR-002 要求：在 dsh Web 会话中提供命令入口，启动 SDDU 并路由到正确的阶段 Agent；非法阶段输入须被明确提示且不误推进；入口清单（命令名 → 目标阶段）成文。

已确认的 dsh 事实（2026-08-14 快照）：

- skill 是「**可选的指令而非会话事件**」，不携带执行能力，加载与否不影响日志一致性（§3.4）。
- 快照中出现的斜杠交互仅来自方法论插件（如 plan mode 的 `/plan [message]`、`/plan off`），即**命令由插件提供**；快照**未记录**可由 Skill 包注册平台级命令的 seam。
- 因此「注册一个真正的 `/sddu` 平台命令」在「Skill 包」既定交付形态内**没有可靠载体**；若强行实现需自研 dsh 插件（超出既定形态，见 ADR-003 同类判断）。

## 决策

**1. 入口承载方式：路由 Skill + 文本前缀识别（不依赖平台命令注册）**

交付一个路由 Skill `sddu`（内容主体 = 现有 `sddu.md.hbs` 路由表），其指令显式声明入口识别规则：

- `/sddu` → 输出状态仪表盘 / 推荐下一步（路由调度语义）。
- `/sddu <phase> <feature>` → 解析阶段标识与 Feature 名，执行前置检查后路由到对应阶段 Skill。
- `<phase>` 允许既有 `legacyStatusToPhase` 别名集（如 `plan`/`planning` → `planned`），保持与 OpenCode 侧一致的输入宽容度。
- **非法阶段标识** → 输出 `[SDDU-ROUTE-REJECT] {"input":"<原样输入>","valid":[...],"hint":"<建议>"}`，**不进入任何阶段**、不写任何文件（FR-002②）。
- 段落式自然语言亦可（模型按路由表解析），但 `/sddu ...` 前缀是**确定性入口**。

**2. 入口清单（FR-002③）**：以 `src/adapters/dsh/templates/router-command-map.json` 为单一来源（构建期由 `contract.ts` 单向 import `../../state` 校验 `PHASE`/别名枚举一致性，防漂移），构建时渲染进 `docs/dsh/README.md` §入口清单：

| 入口 | 目标 | 前置 | 产出 |
|------|------|------|------|
| `/sddu` | 路由 Skill（仪表盘 / 推荐） | `.sddu/specs-tree-root/` 存在 | 状态视图 + 推荐下一步 |
| `/sddu discovery <feature>` | `sddu-discovery` | 无（工作流起点） | `discovery.md` |
| `/sddu spec <feature>` | `sddu-spec` | `discovery.md` | `spec.md` |
| `/sddu plan <feature>` | `sddu-plan` | `spec.md` | `plan.md`（+ ADR） |
| `/sddu tasks <feature>` | `sddu-tasks` | `plan.md` | `tasks.md` |
| `/sddu build <feature>` | `sddu-build` | `tasks.md` | 代码/产物 + `build.md` |
| `/sddu review <feature>` | `sddu-review` | `build.md`（报告执行） | `review.md` / `review-report.md` |
| `/sddu validate <feature>` | `sddu-validate` | `build.md`（报告执行） | `validate.md` / `validate-report.md` |
| `/sddu roadmap` | `sddu-roadmap` | 无 | `ROADMAP.md` |
| `/sddu docs <feature>` | `sddu-docs` | Feature 产物 | `docs-*.md` |
| `/sddu fast <task>` | `sddu-fast` | 无 | 直接解决（零产物） |

**3. 入口与门禁的分工**：入口 Skill 只负责「解析 + 前置检查 + 路由」，**阶段推进的门禁由 gate-protocol 承载**（ADR-003），状态落盘由 state-sync-protocol 承载（ADR-004）。三者不得互相越权，避免「入口即放行」的语义漏洞。

**4. 明确登记的缺口**：把「无法在 Skill 包形态内注册平台级 `/sddu` 命令」作为**已知缺口**写入 `docs/dsh/README.md` 与契约清单（`dsh-contract-manifest.json` 的 `command-registration` 依赖点，标注「快照未覆盖 / 需插件」）。若未来用户要求平台级命令体验，走 ADR-003 的演进点评估（需 dsh 插件）。

## 后果

**正面**

- 不依赖任何快照未证实的机制，纯文本识别在 Web 会话中**必然可用**（只要 skill 指令被加载），R-009 因此可控。
- 入口清单单一来源 + 构建期枚举校验，使「命令 → 阶段」映射不会与核心 `PHASE` 定义漂移（NFR-002）。
- 非法输入有结构化拒绝块，满足 FR-002② 的「明确拒绝且不误推进」。

**负面 / 需承担**

- 若用户在 dsh Web 中输入 `/sddu ...`，平台可能先按自身命令解析器处理（如未识别则不作为消息发送）——这是**平台行为**，不由 SDDU 控制；文档必须给出降级用法（直接以 `sddu plan <feature>` 或自然语言表述），并把它作为 V2 场景的观测项。
- 「命令入口」在此形态下实质是「**指令约定的入口**」而非平台级命令；文档与验收表述必须避免暗示平台级命令体验（否则与 R-009 的缺口声明自相矛盾）。

**对下游（tasks）的约束**

- `router-command-map.json` 是入口清单唯一来源；`docs/dsh/README.md` 的表格必须由构建生成或由测试断言与之一致。
- 路由 Skill 中必须同时包含「识别规则」「非法拒绝块格式」「降级用法」三段，缺一不可。
