# Directory: .sddu/specs-tree-root/specs-tree-framework-architecture/

## 目录简介
SDDU 框架源码架构重组 — 在不修改任何功能行为的前提下，重组源码架构使代码组织传达业务设计意图。核心工作是将 SDDU 方法论业务逻辑（工作流引擎、状态管理、Agent 行为定义）与 openCode 平台适配代码（Agent 注册、工具注册、生命周期钩子）清晰分离。

## 目录结构
```
specs-tree-framework-architecture/
├── TREE.md                                # 本文件 - 目录导航
├── discovery.md                           # 问题挖掘报告 — 识别核心/扩展源码无隔离、缺少显式扩展接口等 7 个问题
├── spec.md                                # 需求规范 — 定义 10 项功能需求、5 项非功能需求、4 项边界情况
├── plan.md                                # 技术计划 v1.7 — 架构分析扩展至项目根目录，根目录脚本收敛至 scripts/，含 6 份 ADR
├── tasks.md                               # 任务分解 — 12 个原子任务 / 5 个执行波次（Wave 1~5），基于 plan.md + 6 ADR 分解
├── tasks.json                             # 任务 JSON — 12 tasks 结构化定义（id / complexity / wave / dependencies / files / acceptance）
├── state.json                             # 状态文件 — Feature 生命周期状态
├── ADR-001-three-layer-architecture.md    # ADR-001 — 业务对象架构 + adapters/ 平台适配器容器
├── ADR-002-template-separation.md         # ADR-002 — 模板分离策略：方法论资产 vs 平台配置
├── ADR-003-build-configuration.md         # ADR-003 — 构建配置与模块解析策略
├── ADR-004-test-organization.md           # ADR-004 — 测试组织与分层执行模式
├── ADR-005-root-directory-architecture.md # ADR-005 — 项目根目录架构：脚本收敛与功能子目录分层
└── ADR-006-module-public-api-contract.md  # ADR-006 — 模块公共 API 契约：域级 index.ts 与跨域 import 规则
```

## 文件说明
| 文件 | 说明 | 状态 |
|------|------|------|
| discovery.md | 问题挖掘报告：SDDU 框架源码架构重组 — 识别核心/扩展隔离、扩展接口缺失、测试分层不一致等 7 个问题（4 核心 + 3 次要） | ✅ 存在 |
| spec.md | 需求规范：SDDU 框架源码架构重组 — 定义 10 项功能需求（FR-001~010）、5 项非功能需求（NFR-001~005）、4 项边界情况（EC-001~004） | ✅ 存在 |
| plan.md | 技术计划 v1.7：SDDU 框架源码架构重组 — 调研修正，测试策略统一为完全集中式 + 新增 API 边界规则与 ADR-006；含 6 份 ADR | ✅ 存在 |
| tasks.md | 任务分解：12 个原子任务（TASK-001~012）/ 5 个执行波次 — Wave 1 根目录脚本收敛 + shared/ 共享层，Wave 2~5 业务域渐进迁移 | ⏳ tasked |
| tasks.json | 任务 JSON：12 tasks 结构化 — id / complexity (S/M/L) / wave / dependencies / files (op) / acceptance / verify | ⏳ tasked |
| ADR-001 | 业务对象架构 + adapters/ 平台适配器容器 — 以业务域为顶层组织单元，平台适配以 adapters/ 容器统一管理 | ✅ 存在 |
| ADR-002 | 模板分离策略 — 方法论模板留在 src/templates/，平台模板归属适配层 | ✅ 存在 |
| ADR-003 | 构建配置与模块解析策略 — tsconfig paths + 目录保持构建 + subpath exports 三层策略 | ✅ 存在 |
| ADR-004 | 测试组织与分层执行模式 — src/ 内 colocated 测试 + jest projects 分层执行 | ✅ 存在 |
| ADR-005 | 项目根目录架构 — 脚本收敛与功能子目录分层：约定文件、用户入口、功能子目录各归其位 | ✅ 存在 |
| ADR-006 | 模块公共 API 契约 — 域级 index.ts 与跨域 import 规则：禁止跨域深层 import，强制通过 index.ts 导入 | ✅ 存在 |
| state.json | 状态文件 — Feature ID: FR-FRAMEWORK-ARCH-001 | tasked (tracked) |

## Feature 状态
| 字段 | 值 |
|------|-----|
| Feature ID | FR-FRAMEWORK-ARCH-001 |
| 名称 | SDDU 框架源码架构重组 |
| 目标版本 | v4.0.0 |
| Phase | tasked (阶段 3) |
| Status | tracked |
| 创建时间 | 2026-06-21 |

## Phase 进度
```
registered → discovered → specified → planned → tasked → builded → reviewed → validated
    ●           ●           ●           ●         ●         ○         ○          ○
                                                              ↑ 当前阶段
```

## 上级目录
- [返回上级](../TREE.md)
- [返回首页](../../../TREE.md)
