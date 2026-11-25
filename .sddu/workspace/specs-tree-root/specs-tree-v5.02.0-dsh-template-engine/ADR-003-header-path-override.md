# ADR-003: SKILL.md 模板路径覆盖（skill-header 补充 dsh 侧落位说明）

## 状态
ACCEPTED

## 背景
SKILL.md §6 输出模板查找优先级来自源指令正文（src/templates/agents/sddu-*.md.hbs），其中「插件内置模板 `.opencode/plugins/sddu/templates/output/`」在 dsh 侧不存在（dsh 无 opencode 插件）。源指令正文与 opencode 同源（单一来源），dsh 侧不得改写。

## 决策
在 `skill-header.md.hbs`（dsh 包装层，允许承载平台差异）增加「dsh 侧模板落位」说明段：明确模板随 skill 落位于 `<skill>/templates/output/`，覆盖源指令正文中失效的 `.opencode` 路径；并强化「必须读取并严格遵循模板文件结构」指令。

## 后果
- 优点：不破坏单一来源（指令正文零改动）；平台差异收敛在包装层（R-DSH-05 允许的三处之一）。
- 代价：skill-header 增加一段模板说明，所有 11 个 SKILL.md 都会带上（build 后统一生效）。
- 边界：只补充落位路径说明，不改动模板内容、不改动源指令正文的模板查找优先级语义。
