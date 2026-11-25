# ADR-024: dev-guide 降级为项目自有 skill——非 sddu 产品的一部分（能力丢失排查 B4）

## 状态
PROPOSED（2026-11-24 用户拍板：B4 裁决——降级迁移）

## 背景
能力丢失排查（capability-loss-audit.md B4）发现 dev-guide 的悬置：plan §5.2 有 MODIFY 行（`.sddu/skills/dev-guide/SKILL.md` 改引用 sddu.md）但 §5.1 模板树**无落位**——随 dogfooding 迁 `.sddu/workspace/skills/` 后将成为分发面模糊的孤儿；且其内容（src/dist 产物链、npm 构建命令、四层产物链心智模型）在新架构下全部失真。

dev-guide 的定位本是「SDDU 插件自身（本仓库）的二次开发指南」——「用 SDDU 开发 SDDU」，面向给本仓库加功能/修 bug/发版的开发者，明确不用于业务开发。

## 决策
**dev-guide 降级迁移至 `.agents/skills/dev-guide/`，作为本项目自己的 skill，不作为 sddu 产品的一部分**：

1. **落位 `.agents/skills/dev-guide/`**——`.agents/skills/` 是平台原生 skill 目录（本仓库自身即 dsh 宿主，dogfooding）。sddu 产品的索引落位也在 `.agents/skills/sddu/`，dev-guide 与之并列，但**性质不同**：`sddu/` 是产品分发物（随 sddu-project-template 复制分发），`dev-guide/` 是**项目自有 skill**（只存在于本仓库，不进模板、不随安装分发）；
2. **退出产品面**——`sddu-project-template/` 不含 dev-guide；plan §5.2 原 MODIFY 行（改引用 sddu.md）作废，改为降级迁移；「二次开发指南」不是 spec-driven 方法论的组成部分（四维判据 D：非流程必需），属本项目的私有运维知识；
3. **与 ADR-022 原则自洽**——「非 sddu 核心不提供」对产品成立；但本仓库作为项目可以自有私有 skill（正如任何用户项目都可以在 `.agents/skills/` 放自己的 skill）——产品边界与项目自由并存；
4. **内容重写延后**——现有内容（npm 构建、src/dist 链路）在新架构下失真，降级迁移时内容不强行重写（避免阻塞迁移）；后续按新范式（改 sddu-project-template + 模块 md）重写为 build 阶段的收尾任务，可按需进行。

## 对既有设计的修订
- **plan §5.2**：`MODIFY .sddu/skills/dev-guide/SKILL.md` 行 → **MOVE** `.sddu/skills/dev-guide/` → `.agents/skills/dev-guide/`（项目自有 skill，非模板内容）。
- **§5.1 树**：`.agents/skills/` 下除 `sddu/`（产品索引）外，本仓库另有 `dev-guide/`（项目自有，dogfooding 特例，不进 sddu-project-template/）。
- **FR-002 对齐范围**：dev-guide 退出产品载体清单（其方法论口径对齐不再是 FR-002 验收对象——产品面无此载体）。

## 后果
- 正面：产品/项目边界清晰（模板不含 dev-guide，仓库自有）；§5.2 的孤儿行修正；与「非核心不提供」原则自洽。
- 负面：dev-guide 内容短期内与新架构失真（引用 npm/src/dist 的段落过期）——已判定可接受：私有 skill 读者是本仓库开发者，按需重写。
- 不可逆性：低——纯落位变更。
