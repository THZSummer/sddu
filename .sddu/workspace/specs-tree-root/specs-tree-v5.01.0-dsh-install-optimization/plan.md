# 技术计划：specs-tree-dsh-install-optimization

> **文档定位**: SDDU 技术方案 — 记录架构设计、方案对比和 ADR，作为 tasks 阶段的输入
> **前置依赖**: spec.md（需求规范）
> **创建人**: SDDU Plan Agent
> **创建时间**: 2026-09-27
> **版本**: v1.0
> **更新人**: SDDU Plan Agent
> **更新时间**: 2026-09-27
> **更新说明**: 初始创建

## 1. 前置检查
> 启动技术规划前必须验证的前置条件
| 检查项 | 状态 |
|--------|:--:|
| spec.md 存在 | ✅ |
| 外部 API 文档缓存 | ⚠️ 不适用（本 Feature 无外部 API） |
| 前置依赖已满足 | ✅（discovery.md + spec.md 齐备） |

## 2. 架构分析
> 分析现有架构影响和需要的新组件

**现状**：v5.0.0 已交付 dsh 适配（`src/adapters/dsh/` + `scripts/build-dsh-skills.cjs` + `scripts/install-dsh.sh`/`uninstall-dsh.sh` + `docs/dsh/*`）。其中 `install-dsh.sh`（281 行）是**纯文件复制**：从 `dist/dsh/skills/` 复制 11 个 skill 到目标，来源缺失时报错并提示「先 npm run build」，不承担构建。

**新增组件**（安装链路引导层，与 OpenCode 同构）：
- `scripts/bootstrap-dsh.sh`：远程一键引导（检查依赖 → clone → 调 install-dsh.sh 自动构建+安装）
- `scripts/bootstrap-dsh.ps1`：Windows PowerShell 等价

**改造**：`install-dsh.sh` 在来源缺失时自动构建（复用 `npm run build:dsh`）+ 安装后打印启动引导 + `--upgrade` 升级模式。

**数据流变更**：安装链路从「手动 clone → build → install → 启动」四步收敛为「curl 一行 → 自动 build+install → 打印启动引导」或「本地 install-dsh.sh → 自动 build+install」。

**依赖关系**：沿用 `scripts/build-dsh-skills.cjs`（构建产物），不新增运行时依赖；复用 opencode `bootstrap.sh`/`install.sh` 的依赖检查与镜像模式。

## 3. 方案对比
> 2-3 个可行方案的对比分析

| 维度 | 方案 A：bootstrap 引导层 + install-dsh.sh 自动构建 | 方案 B：npm 包分发（npx） | 方案 C：最小改动（仅 bootstrap） |
|------|:--|:--|:--|
| 描述 | 新增 bootstrap-dsh.sh/ps1 + install-dsh.sh 自动构建，对齐 opencode 双通道 | 发布 npm 包，用户 `npx` 安装 | 只加 bootstrap 引导，install-dsh.sh 不动 |
| 优点 | 对齐 opencode 形态、双通道等价、无发布成本、复用既有构建 | 分发标准化 | 改动最小 |
| 缺点 | 双脚本维护成本 | 需发布 npm 包；dsh 契约快照未覆盖 npm 分发 seam；维护成本高 | FR-003（自动构建）不满足 |
| 风险 | 双脚本漂移（低） | 分发载体与 dsh 快照脱节（高） | 核心需求缺口 |
| 工作量 | 中（2 NEW + 4 MODIFY） | 高 | 低 |

## 4. 推荐方案
> 推荐方案及选择理由

**推荐**: 方案 A（bootstrap 引导层 + install-dsh.sh 自动构建）
**理由**: 与用户决策一致（「和 opencode 一键安装逻辑类似」+「双通道」+「raw curl 载体」）；复用既有 `build-dsh-skills.cjs` 与 opencode `bootstrap.sh` 模式，零发布成本、零新依赖；完整覆盖 FR-001~006。

## 5. 文件影响分析
> 所有需要创建/修改/删除的文件

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| NEW | `scripts/bootstrap-dsh.sh` | 远程一键引导：检查 git/node/npm → clone 仓库 → 调 install-dsh.sh 自动构建+安装 → 打印启动引导 |
| NEW | `scripts/bootstrap-dsh.ps1` | Windows PowerShell 等价 |
| MODIFY | `scripts/install-dsh.sh` | ① 来源缺失时自动 `npm run build:dsh`（FR-003）② 安装后打印启动引导（FR-004）③ 新增 `--upgrade` 升级模式（FR-005）④ `--build` 显式构建参数 |
| MODIFY | `docs/dsh/README.md` | 安装章节增加 bootstrap 一键入口（§2 前置），补充启动引导与升级说明 |
| MODIFY | `docs/dsh/verification.md` | V1/V2 场景补充 bootstrap 通路的观测判据 |
| MODIFY | `README.md` | 顶层 dsh 适配章节增加一键安装入口一行 |

> 工程边界（README §211）：修改目标只限设计态源码（`scripts/`、`docs/`、`README.md` 等）；`.opencode/`、`.sddu/` 为产物，不得列为修改目标。本 Feature 严格符合。

## 6. 风险评估
> 识别技术、依赖和时间风险及缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:--:|:--:|----------|
| dsh 无 CLI，启动引导无法脚本化（FR-004 最后一公里） | 高 | 低 | 打印启动引导、不自动启动（EC-004 语义，如实声明） |
| bootstrap clone 依赖 GitHub 可达 | 中 | 中 | `--proxy` 镜像 fallback（对齐 opencode gh-proxy） |
| install-dsh.sh 自动构建增加安装时长 | 中 | 低 | 仅来源缺失或 `--build` 时构建；幂等 |
| bash/ps1 双脚本行为漂移 | 中 | 中 | 逻辑对齐、双通道落位结果一致（FR-006 验收）；validate 双通道实测 |

## 7. 生成的 ADR
> 本次规划产出的架构决策记录

| ADR | 标题 | 状态 |
|-----|------|:--:|
| ADR-001 | bootstrap 分发载体：raw.githubusercontent curl 一行 | ACCEPTED |
| ADR-002 | install-dsh.sh 自动构建策略：复用 build:dsh 按需构建 | ACCEPTED |
| ADR-003 | 升级载体：install-dsh.sh --upgrade 复用安装链路 | ACCEPTED |

## 8. 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 方案 A（bootstrap 引导层 + install-dsh.sh 自动构建）；3 ADR；文件影响 2 NEW + 4 MODIFY | 2026-09-27 | SDDU Plan Agent |
