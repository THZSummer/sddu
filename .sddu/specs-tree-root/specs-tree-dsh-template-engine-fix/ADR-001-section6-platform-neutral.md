# ADR-001: §6 兜底路径平台中立化（header 承载平台落位差异）

## 状态
ACCEPTED

## 背景
sddu-roadmap SKILL.md 正文 §6「输出模板」仍写插件内置兜底路径 `.opencode/plugins/sddu/templates/output/`，与 header ④ 声明的 dsh 侧实际落位 `<skill>/templates/output/` 不一致（P-037）。单一来源原则（R-DSH-05）禁止在 dsh 侧改写正文语义，但正文残留 opencode 死路径会让按 §6 字面路径查找模板的工具 / Agent 落空。

## 决策
正文 §6 第 2 项「插件内置模板（兜底）」改为**平台中立表述**——不再硬编码单一平台路径，而是同时给出两平台落位并指明「平台差异以 skill-header ④ 为准」：
- opencode 侧：`.opencode/plugins/sddu/templates/output/`
- dsh 侧：`<skill>/templates/output/`

平台落位差异仍由 skill-header ④ 承载；§6 只保留「查找优先级」语义（用户自定义优先 > 插件内置兜底），不再内联具体平台路径。

## 后果
- 优点：正文与 header 口径统一，按 §6 字面路径即可定位到 dsh 侧模板，消除死路径；双平台同步受益。
- 代价：改动共享源 `src/templates/agents/sddu-roadmap.md.hbs`（影响 opencode 侧，兼容写法）。
- 边界：不改「查找优先级」语义；用户自定义路径 `.sddu/templates/agents/output/` 保持不变。
