# ADR-001: dsh 侧模板随 skill 落位（templates/output/）

## 状态
ACCEPTED

## 背景
dsh 侧 install-dsh.sh 只装 11 个 SKILL.md，输出模板（src/templates/outputs/*.hbs）未落位，LLM 无模板可读。需选型模板落位方式：随 skill 目录 vs 集中目录 vs 复用 .sddu/templates。

## 决策
模板**随 skill 目录落位**：`dist/dsh/skills/<skill>/templates/output/<模板>.hbs`，install-dsh.sh 的 `cp -R` 天然携带。20 个 docs 模板放 `sddu-docs/templates/output/docs/`。

## 后果
- 优点：与用户决策一致；install 零改动；skill 目录自包含（模板与指令同目录，LLM 就近可读）。
- 代价：build 需做模板→skill 映射（10 阶段输出 + 20 docs 的归属）。
- 边界：不采用集中目录（路径与 SKILL.md 指令脱节）、不采用 .sddu/templates 复用（非自动）。
