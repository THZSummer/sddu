# ADR-025: opencode-operator 降级为项目自有 skill——非 sddu 产品的一部分（能力丢失排查 L1）

## 状态
PROPOSED（2026-11-24 用户拍板：L1 裁决——降级迁移，与 dev-guide 同构）

## 背景
能力丢失排查（capability-loss-audit.md L1）的头号黑盒嫌疑：`src/skills/builtin/opencode-operator/`——程序化驱动 opencode 的完整工具链：

- `SKILL.md`（697 行）：运行时操作 opencode 的完整知识——4 条操作路径（run/serve/acp/github）、长流程编排（<5min run / 5-30min `-c` 续接 / >30min serve 非阻塞）、8 种模式、v1/v2 双代端点对照
- `scripts/serve-api.cjs`（1470 行，21 个子命令）：阻塞（run/send）、非阻塞（start/submit/status/result/wait/abort/stop）、运维（restart/attach）、巡检（ps/sessions/rm/detect/skills/stats）、v2 治理（revert/fork/compact/diff）
- v1/v2 双代兼容：`/doc` OpenAPI 运行时自探测
- `scripts/init.cjs`（幂等 npm install）+ `scripts/package.json`（依赖 commander ^15）

它在 v6 全部决策中零提及，原判将被「src/ 整目录 DELETE」伞形覆盖而黑盒消失。

## 决策
**降级迁移至 `.agents/skills/opencode-operator/`，与 dev-guide 同构——作为本项目自己的 skill，不作为 sddu 产品的一部分**：

1. **产品面出清**——`sddu-project-template/` 不含 opencode-operator；「程序化驱动 opencode」是 opencode 平台专属工具（三维裁决矩阵的「平台」维度即否决其入产品），且非 spec-driven 方法论内核（「生态/非核心」维度亦否决）；
2. **项目私有保留**——但该工具链对本仓库自身的开发运维有真实价值（无人值守长任务、会话治理、检查点回滚），降级为项目自有 skill 而非删除：`.agents/skills/` 下与 `sddu/`（产品索引）、`dev-guide/`（项目私有）并列，第三个成员 `opencode-operator/`（项目私有）；
3. **依赖说明**——零 npm 约束的对象是 **sddu 产品**（仓库根 package.json/package-lock 删除已拍板，ADR-006 范围）；opencode-operator 自带 `scripts/package.json`（commander 单依赖）属 skill 私有依赖，随目录迁移自包含、不进产品分发面、不违反产品零 npm。若未来要求零依赖化（去 commander 重写），属私有资产按需处理，非本版本范围。

## 对既有设计的修订
- **§5.1 树**：`.agents/skills/` 下本仓库三成员——`sddu/`（产品索引）、`dev-guide/`（项目自有）、`opencode-operator/`（项目自有，src/skills/builtin/ 迁来）。
- **src/ DELETE 伞形范围修正**：`src/skills/builtin/opencode-operator/` 从「随整目录删除」改为 MOVE 出（唯一例外）；其余 src/ 全部照删。
- 不进 FR-002 对齐范围（退出产品载体清单）。

## 后果
- 正面：黑盒丢失消除（能力显式保留在项目层）；产品/项目边界维持三维矩阵一致；本仓库继续保有 opencode 运维工具链。
- 负面：`.agents/skills/` 仓库内混居产品物与私有物（需 e2e 断言区分：模板复制断言只含 sddu/）——已在 e2e 结构回归覆盖范围（模板树断言天然区分 sddu-project-template/ 与 .agents/skills/ 实际内容）。
- 不可逆性：低——纯落位变更。
