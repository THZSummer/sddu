# ADR-002: 模板单一来源分发（build:dsh 从 src/templates/outputs 复制）

## 状态
ACCEPTED

## 背景
模板源头在 `src/templates/outputs/*.hbs`（与 opencode 同源）。dsh 侧若手工复制第二份，会与 opencode 漂移（违反 R-DSH-05 单一来源）。

## 决策
`build-dsh-skills.cjs` 在生成 SKILL.md 的同时，把 `src/templates/outputs/*.hbs` 按映射复制到 `dist/dsh/skills/<skill>/templates/output/`。模板源头唯一，分发只读复制，零手工维护。

## 后果
- 优点：单一来源（R-DSH-05）；build 幂等；与 opencode 模板自动同步。
- 代价：build 脚本需维护模板→skill 映射表；需校验 30 个模板全部落位。
- 边界：`src/templates/outputs/`（源头）与 `src/templates/agents/`（指令正文）零写，仅只读引用。
