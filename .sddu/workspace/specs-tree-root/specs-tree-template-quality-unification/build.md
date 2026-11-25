## ✅ TASK-008: 统一指令模板 — sddu / roadmap / tree / docs 实现完成

### 修改的文件
- `src/templates/agents/sddu.md.hbs` — 入口 Agent 指令模板：更新标题为"SDDU 工作流 — 入口"，注入四字段职责边界，骨架对齐 FR-013（补全执行顺序/依赖关系/前置验证/输出模板/异常处理/示例对话/修订记录），依赖关系分离为两字段格式
- `src/templates/agents/sddu-roadmap.md.hbs` — Roadmap 辅助 Agent 指令模板：完整 FR-013 骨架注入（补全执行顺序/依赖关系/前置验证/规则/异常处理/修订记录），注入四字段职责边界，标题统一为"独立"后缀，输出节声明内置固定格式
- `src/templates/agents/sddu-tree.md.hbs` — 目录导航 Agent 指令模板：注入四字段职责边界（tree 职责），骨架对齐 FR-013，补全执行顺序/依赖关系节，新增修订记录，标题统一为"触发"后缀
- `src/templates/agents/sddu-docs.md.hbs` — 项目全景 Agent 指令模板：输出模板节增强内置固定格式声明（EC-004），确认 TASK-003 骨架符合 FR-013~019 标准

### 实现的功能
- [x] sddu.md.hbs：标题 `# 🎯 SDDU 工作流 — 入口`，四字段职责边界，FR-013 10 节完整骨架，修订记录
- [x] sddu-roadmap.md.hbs：标题 `# 🎯 SDDU Roadmap 规划专家 — 独立`，四字段职责边界，10 节完整骨架（原缺失 6 节全部补全），内置固定格式声明
- [x] sddu-tree.md.hbs：标题 `# 🎯 SDDU 目录导航专家 — 触发`，四字段职责边界（tree），10 节骨架对齐，修订记录
- [x] sddu-docs.md.hbs：四字段边界/骨架完整性确认，输出节声明内置固定格式
- [x] 所有 `<<变量名>>` 占位符保持不变
- [x] 工作流程内容未丢失

### 验证结果
- ✅ 四字段边界：4/4 文件通过
- ✅ 修订记录：4/4 文件通过
- ✅ Roadmap 骨架完整性：10/10 章节通过
- ✅ Roadmap 内置固定格式声明：通过
- ✅ 标题格式：全部正确（sddu→入口, roadmap→独立, tree/docs→触发）
- ✅ EC-003：无禁止/唯一/不允许措辞
- ✅ 4 反引号：0 个文件存在
- ✅ 依赖关系节：前置条件+下游两字段格式

### 下一步
- 运行 `@sddu-build TASK-009` 更新 build-agents.cjs 并验证构建
- 或运行 `@sddu-review` 审查当前实现
