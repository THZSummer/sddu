# ADR-020: bootstrap 一键安装退役——新设计不区分平台（能力丢失排查 L7）

## 状态
PROPOSED（2026-11-24 用户拍板：L7 裁决 A——退役）

## 背景
能力丢失排查（capability-loss-audit.md L7）发现：`bootstrap.sh` / `bootstrap.ps1`（curl|bash / iex 一行安装入口）在 plan §5.1 树中**无任何标注**（非 ✖D 非 ✎M）——即 v6 默认保留。但其内容与 v6 范式全面冲突：

1. **`--platform opencode|dsh` 分支**——委派两平台各自的 install.sh（各自构建、各自落位、各自提示）；
2. **间接强依赖 npm/构建链**——两平台 install 均触发 npm install + tsc / build:dsh，零 npm（ADR-006 零依赖拍板）下即死代码；
3. **依赖检查含 node/npm**——新范式安装仅需 git 与文件复制。

## 决策
**bootstrap.sh / bootstrap.ps1 整体退役**。理由：

1. **新的设计不区分平台**——统一安装范式（ADR-004/007）下安装 = `cp -r sddu-project-template/. <project>/` 一条命令，全平台同一动作，无平台分支可委派；bootstrap 的存在前提（平台分派器）消失；
2. **一行安装的剩余价值由 README 承载**——安装说明进 `.sddu/.sddu/README.md`（ADR-013 已入本体）：「git clone → cp -r」两步即得，写清楚比 curl 管道执行远程脚本更透明（也消除 curl|bash 的供应链信任问题）；
3. **旧 bootstrap 承载的迁移/回滚已归复制器**——旧布局迁移（备份+回滚）已拍板保留进 `scripts/install/install.{sh,ps1}`（plan §5.2），bootstrap 无独有职责。

## 对既有设计的修订
- **plan §5.1 树**：`bootstrap.sh / bootstrap.ps1` 行补 ✖D 标注（零 npm + 平台分派前提消失）。
- **README 内容职责**（ADR-013 的「怎么么装」段）：写明两步安装（git clone + cp -r），不提供 curl 管道脚本。

## 后果
- 正面：根目录再减两文件；零平台分支与范式自洽；安装路径唯一且透明（README 两条命令 + scripts/install 复制器）。
- 负面：失去 curl 一行安装的「零步骤体验」——已判定可接受（两条命令的透明性收益更大；未来若需一行安装，可在仓库外做薄壳脚本，不属框架本体）。
- 不可逆性：低——bootstrap 是纯脚本，随时可按新范式重写。
