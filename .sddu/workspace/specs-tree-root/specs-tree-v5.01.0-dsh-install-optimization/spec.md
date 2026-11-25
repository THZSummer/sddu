# Feature Specification：specs-tree-dsh-install-optimization

> **文档定位**: SDDU 需求规范 — 定义功能需求、非功能需求和边界情况，作为 plan 阶段的输入
> **前置依赖**: discovery.md（问题清单）
> **创建人**: SDDU Spec Agent
> **创建时间**: 2026-09-27
> **版本**: v1.0
> **更新人**: SDDU Spec Agent
> **更新时间**: 2026-09-27
> **更新说明**: 初始创建

## 1. 元数据
> Feature 基本信息

| 字段 | 值 |
|------|-----|
| Feature ID | FR-DSH-INSTALL-001 |
| 名称 | dsh 安装流程优化（对齐 OpenCode 一键安装） |
| 优先级 | P0 |
| 目标版本 | v5.1.0 |

## 2. 上下文
> 回顾问题背景和目标用户

本 Feature 承接 v5.0.0（`FR-DSH-ADAPT-001`）交付的 dsh 适配基础，聚焦其**安装链路**的体验优化。discovery 阶段识别 6 个问题：核心痛点 Q-001（缺一键引导层，四步分散）/ Q-002（install-dsh.sh 仅纯文件复制，不承担自动构建）；次要 Q-003（启动无引导）/ Q-004（升级无一键载体）；潜在 Q-005（dsh 无 CLI，最后一公里难脚本化）/ Q-006（dsh 快照漂移）。

目标用户：在一个没有 SDDU 的全新环境（opencode/dsh/xxx）安装 SDDU 的人（opencode 迁移用户与纯 dsh 新用户无差异）。

## 3. 目标与非目标
> 明确需求范围，防止范围蔓延

### 3.1 目标 (Goals)
> 明确本次要达成的业务目标

| # | 目标描述 |
|---|---------|
| G-001 | 提供 dsh 侧远程一键引导（bootstrap-dsh.sh，raw.githubusercontent curl 一行），对齐 opencode `bootstrap.sh` 体验 |
| G-002 | 让 install-dsh.sh 承担自动构建（复用 build:dsh），实现本地一条命令装完 |
| G-003 | 补全安装后启动引导（装完如何启动 dsh web + 下一步） |
| G-004 | 提供一键升级载体（与初始安装同源），收敛升级跟随痛点 |

### 3.2 非目标 (Non-Goals)
> 明确本次不涉及的范围，防止需求蔓延

| # | 明确不做 |
|---|---------|
| NG-001 | 不改 dsh skill 落位/rank 约定（`.dsh/skills` rank 100 / `<dshHome>/skills` rank 400） |
| NG-002 | 不实现 dsh 插件（Cordis bundle / guard 流水线，属 v5.1.0+ 演进点） |
| NG-003 | 不碰 dsh 本体（不改造 dsh 发行版） |
| NG-004 | 不改变 `dist/dsh/` 构建产物结构与 11 个 skill 集合（只改安装链路） |
| NG-005 | 不修改核心 `src/state/`（沿用 NG-004） |

## 4. 用户故事
> 以用户视角描述功能需求

| # | 作为… | 我想要… | 以便… |
|---|-------|---------|-------|
| US-001 | 全新环境的 Linux/macOS 用户 | curl 一行安装 SDDU 到 dsh | 像 opencode 一样快速上手，无需 clone/build 四步 |
| US-002 | 全新环境的 Windows 用户 | PowerShell 一行安装 | 在 Windows 环境同样一键 |
| US-003 | 已 clone 源码的用户 | 直接 `install-dsh.sh` 自动构建并安装 | 不用手动 `npm run build` |
| US-004 | 已装用户 | 一键升级 | 升级跟随不再手动跑核对清单 |

## 5. 功能需求 (FR)
> 每个需求必须有唯一标识符且可测试

| ID | 需求描述 | 验收标准 | 优先级 |
|----|---------|---------|--------|
| FR-001 | 提供 `bootstrap-dsh.sh`：curl 一行 → 检查依赖（git/node/npm）→ clone 仓库 → 调 install-dsh.sh 自动构建+安装 → 打印启动引导 | 无 SDDU 环境的项目 curl 一行后，`.dsh/skills/` 落位 11 个 `sddu*` skill | P0 |
| FR-002 | 提供 `bootstrap-dsh.ps1`：Windows PowerShell 一行，与 bash 版等价 | PowerShell 一行后同样落位 11 个 skill | P1 |
| FR-003 | install-dsh.sh 承担自动构建：当 `dist/dsh/skills` 缺失或显式 `--build` 时，自动执行构建（复用 build:dsh）后落位 | 从源码目录直接 `install-dsh.sh` 无需手动 build，落位 11 个 skill | P0 |
| FR-004 | 安装完成打印启动引导：`npx @deepseek-ai/dsh web` + 下一步（skill 发现缓存刷新提示，EC-004） | 安装输出含启动命令与下一步提示 | P1 |
| FR-005 | 提供一键升级载体（复用安装链路 + 破坏点记录模板衔接 upgrade-following） | 升级命令可触发安装 + 定位破坏点 | P1 |
| FR-006 | 双通道等价：远程 bootstrap 与本地 install-dsh.sh 的落位结果一致 | 两通道落位 11 个 skill，来源标识一致 | P0 |

## 6. 非功能需求 (NFR)
> 性能、安全、可用性等跨切面需求

| ID | 类别 | 需求描述 | 验收标准 |
|----|------|---------|---------|
| NFR-001 | 幂等性 | 重复安装/升级无副作用，落位自检清单一致 | 连续两次安装，落位条目数与残留一致 |
| NFR-002 | 兼容性 | bash（Linux/macOS）+ PowerShell（Windows）双通道 | 两通道均能完成安装 |
| NFR-003 | 网络可达性 | 支持 `--proxy` 镜像（对齐 opencode gh-proxy） | 指定 `--proxy` 时走镜像下载 |
| NFR-004 | 时效声明 | 安装脚本/文档标注 dsh 契约快照，未刷新即不可信 | 脚本/文档含 `2026-08-14` 快照标注 |
| NFR-005 | 时间预算 | 单次初始安装 ≤ 30min；单次升级跟随 ≤ 2h | 安装/升级耗时在预算内 |

## 7. 边界情况 (EC)
> 异常场景和边界条件的处理方式

| ID | 场景 | 处理方式 |
|----|------|---------|
| EC-001 | GitHub 不可达 | 报错并提示 `--proxy` 镜像 fallback |
| EC-002 | 依赖缺失（git/node/npm 任一） | 明确报错 + 非零退出码 |
| EC-003 | 已有旧版本落位 | 幂等覆盖 + 打印落位自检 + EC-002 冲突提示 |
| EC-004 | dsh web 无法脚本拉起（无 CLI） | 打印启动引导，不自动启动 |
| EC-005 | 构建失败（dist/dsh 缺失且 build 失败） | 报错且不落位、不推进（EC-008 语义） |

## 8. 开放问题
> 待决策事项和需要进一步调研的内容

| # | 问题 | 状态 |
|---|------|:--:|
| 1 | 一键升级载体具体形态：独立 upgrade 脚本 vs install-dsh.sh `--upgrade` 参数 | 待决策（plan 阶段定） |
| 2 | npx/supabase 等 CLI 的一键安装形态调研，作为 bootstrap 设计参考 | 待调研 |

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 discovery.md（6 问题）与访谈决策（双通道/全链路/raw curl 载体/含 PowerShell），定义 6 FR / 5 NFR / 5 EC / 2 开放问题 | 2026-09-27 | SDDU Spec Agent |
