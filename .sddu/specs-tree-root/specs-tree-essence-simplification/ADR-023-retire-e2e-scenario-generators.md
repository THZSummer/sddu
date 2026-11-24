# ADR-023: e2e 场景生成器与 FULLSTACK 指南退役——新设计无需复杂自动化验证（能力丢失排查 B6）

## 状态
PROPOSED（2026-11-24 用户拍板：B6 裁决 A——退役）

## 背景
能力丢失排查（capability-loss-audit.md B6）发现 plan 的 e2e MODIFY 行只点名「jest TS 测试 ×2 → 裸 node 结构回归」，以下载体未被点名：

- `e2e/scripts/basic/sddu-e2e.sh`——轻量 e2e 环境生成器（独立测试目录 + install.sh 安装 + 按项目名生成含业务描述/技术约束/「全程自动推进」指令的 sddu-test-prompt.md，人工在 opencode 中执行观察）
- `e2e/scripts/fullstack/sddu-e2e-fullstack.sh`——前后端分离全栈场景生成器（SpringBoot+H2+Maven / React18+TS+Vite / Docker Compose，--auto/--report 标志）
- `docs/FULLSTACK-E2E-GUIDE.md`——全栈 e2e 使用手册（技术栈版本表、生成结构树、分阶段命令示例——注意其中命令命名已与现行 11 Agent 存在代差）

另有 e2e/README ×3 属场景脚本的配套说明。

## 决策
**场景生成器 + FULLSTACK 指南整体退役**。理由：

1. **新的设计无需这么多复杂的自动化验证**——v6 的 e2e 已坍缩为**裸 node 结构回归**（安装范式断言：`.sddu` 计数与哈希、1 入口、workspace 逐字节不变、旧布局迁移与回滚、state.md 枚举）。结构断言对象是**静态文件树**，不需要「生成业务项目 → 驱动 Agent 走全流程」的场景装备；
2. **场景生成器属运行时行为验证工具链**——它验证的是「TS 运行时 + 插件 + 命令」旧行为面，该行为面已随 src/ 退役消失（ADR-005/018）；为不存在的运行时保留场景装备是死资产；
3. **全栈场景本身的验证价值随范式转移**——「Agent 能否走通 7 阶段」在新范式下是**自然语言流程**（读 sddu.md → 执行模块指令），其正确性由蒸馏稿用户逐节确认（ADR-021）+ 结构回归兜底；且现有生成器/指南中的旧命名代差（@sddu-1-spec 等）证明这类资产维护成本高、漂移快。

## 对既有设计的修订
- **plan §5.1 树 e2e/ 行**：范围明确为「jest TS 测试 ×2 + jest.config.ts → 裸 node 结构回归脚本」；`e2e/scripts/` 整目录（basic/fullstack 生成器）与 `docs/FULLSTACK-E2E-GUIDE.md` 补 ✖D 标注（随批次归档删除，记录入 carrier-inventory）。
- 若未来需要「真实 Agent 会话 e2e」（v7 质量闭环候选），属版本级新增，非迁移保留项。

## 后果
- 正面：e2e 职责唯一且极简（结构回归）；删除 ~4 个漂移资产（含旧命名代差文档）；验证哲学与零 build 范式一致——验证结构，不验证运行时行为。
- 负面：失去「一键生成业务场景驱动 Agent 实测」的装备——已判定可接受：实测 = 用户在自己的项目里真实使用（dogfooding 本仓库即是），无需预置场景。
- 不可逆性：低——生成器是独立 shell 脚本，历史版本可随时找回；v7 如需按新范式重写。
