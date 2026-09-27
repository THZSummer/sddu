# ADR-001: bootstrap 分发载体 — raw.githubusercontent curl 一行

## 状态
ACCEPTED

## 背景
dsh 侧安装流程缺一键引导层（Q-001）。opencode 侧已用 `bootstrap.sh`（raw.githubusercontent curl 一行 → clone → install.sh）解决。dsh 侧需选型 bootstrap 分发载体。备选：raw.githubusercontent curl、npm/npx 包分发。

## 决策
采用 **raw.githubusercontent curl 一行**，与 opencode `bootstrap.sh` 完全同构：
- `curl -fsSL https://raw.githubusercontent.com/<repo>/main/scripts/bootstrap-dsh.sh | bash -s -- <project-root>`
- 支持 `--proxy` 镜像（对齐 opencode gh-proxy）。
- 同时提供 `scripts/bootstrap-dsh.ps1`（PowerShell，Windows）。

## 后果
- 优点：零发布成本、与 opencode 体验一致、无需 npm 注册/版本发布流程。
- 代价：依赖 GitHub 可达（由 `--proxy` 缓解）；`bootstrap-dsh.sh`/`.ps1` 与仓库随版本演进，需随 tag/分支更新 raw URL。
- 边界：不采用 npm 分发（dsh 契约快照未覆盖该 seam，属后续演进点）。
