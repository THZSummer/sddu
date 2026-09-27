# ADR-003: 升级载体 — install-dsh.sh --upgrade 复用安装链路

## 状态
ACCEPTED

## 背景
Q-004：升级跟随无「一键」载体，`upgrade-following.md` 步骤 0~6 全靠手工。FR-005 要求提供一键升级。备选：独立 `upgrade-dsh.sh` vs `install-dsh.sh --upgrade`。

## 决策
**`install-dsh.sh --upgrade` 复用安装链路**：
- `--upgrade` = 强制 `--build`（取最新产物）+ 幂等覆盖安装 + 打印破坏点记录提示。
- 衔接 `docs/dsh/upgrade-following.md`：升级后输出「重复 V1~V3 + 填破坏点记录模板」的引导，不替代人工核对（dsh 无 CLI 无法自动断言）。
- 不新增独立 upgrade 脚本（避免第三份脚本维护，与 FR-006 双通道等价目标冲突）。

## 后果
- 优点：单脚本收敛初始安装与升级，维护面最小；升级与安装行为等价。
- 代价：`--upgrade` 只覆盖「重新安装」部分，契约刷新（步骤 0）/破坏点记录仍须人工——如实标注，不表述为一键全自动。
- 边界：不修改 `upgrade-following.md` 的步骤语义（只做入口衔接）。
