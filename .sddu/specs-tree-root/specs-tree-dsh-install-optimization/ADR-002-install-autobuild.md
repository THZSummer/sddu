# ADR-002: install-dsh.sh 自动构建策略 — 复用 build:dsh 按需构建

## 状态
ACCEPTED

## 背景
Q-002：`install-dsh.sh` 仅纯文件复制，来源缺失时报错并要求用户手动 `npm run build`。FR-003 要求 install-dsh.sh 承担自动构建。需选型构建范围：完整 `npm run build`（build:agents → build:ts → build:dsh）vs 仅 `npm run build:dsh`。

## 决策
**按需构建 + 复用 `build:dsh`**：
- 当 `dist/dsh/skills` 缺失时，自动执行 `npm run build:dsh`（`node scripts/build-dsh-skills.cjs`）。
- 新增 `--build` 显式参数强制重建（覆盖「dist 存在但可能过期」场景）。
- 不默认跑完整 `npm run build`（避免不必要的 TS 重编译，安装链路只关心 dsh 生成物）。
- `--upgrade` 模式固定带 `--build`（升级须取最新产物）。

## 后果
- 优点：满足 FR-003，复用既有构建脚本，安装时长可控（仅缺失/显式时构建）。
- 代价：若 `dist/dsh` 存在但源模板已改，`--build` 未显式时可能装旧产物——由 `--upgrade`/`--build` 兜底，并在输出中提示「如需最新请 --build」。
- 边界：不改 `build-dsh-skills.cjs` 本身（NG-004）。
