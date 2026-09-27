# 任务分解：specs-tree-dsh-install-optimization

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入
> **前置依赖**: plan.md（技术方案）、spec.md（需求规范）
> **创建人**: SDDU Tasks Agent
> **创建时间**: 2026-09-27
> **版本**: v1.0
> **更新人**: SDDU Tasks Agent
> **更新时间**: 2026-09-27
> **更新说明**: 初始创建

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1 ─── (无依赖，全部并行)
  TASK-001 [M]  install-dsh.sh 自动构建（--build + 来源缺失自动 build:dsh）
  TASK-002 [S]  bootstrap-dsh.sh 新建（clone + 调 install-dsh.sh）
  TASK-003 [S]  bootstrap-dsh.ps1 新建（PowerShell 等价）

Wave 2 ─── (依赖 TASK-001)
  TASK-004 [M]  install-dsh.sh 启动引导 + --upgrade 模式

Wave 3 ─── (依赖 Wave 1+2，文档并行)
  TASK-005 [S]  docs/dsh/README.md 安装章节更新
  TASK-006 [S]  docs/dsh/verification.md V1/V2 场景更新
  TASK-007 [S]  README.md 顶层 dsh 安装入口

Wave 4 ─── (依赖全部)
  TASK-008 [S]  构建验证 + bash -n + 双通道落位一致性
```

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: install-dsh.sh 自动构建
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-003 |

**描述**: 改造 `scripts/install-dsh.sh`：来源校验失败（`dist/dsh/skills` 缺失）时自动执行 `npm run build:dsh` 再重校验；新增 `--build` 显式参数强制重建。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | scripts/install-dsh.sh |

**验收标准**:
- [ ] 来源目录缺失时自动 `npm run build:dsh` 且不报「请先 build」错误
- [ ] `--build` 参数可解析并强制重建
- [ ] `bash -n scripts/install-dsh.sh` 无语法错误

**验证命令**:
```bash
bash -n scripts/install-dsh.sh && grep -n "build:dsh\|--build" scripts/install-dsh.sh
```

### TASK-002: bootstrap-dsh.sh 新建
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-001 |

**描述**: 新建 `scripts/bootstrap-dsh.sh`：检查 git/node/npm → `git clone --depth 1`（支持 `--proxy` 镜像）→ 调 `install-dsh.sh --project-root <目标>`（自动构建+安装）→ 打印启动引导。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | scripts/bootstrap-dsh.sh |

**验收标准**:
- [ ] `bash -n scripts/bootstrap-dsh.sh` 无语法错误
- [ ] 含依赖检查（git/node/npm）与 `--proxy` 参数
- [ ] 调 install-dsh.sh 并打印启动引导

**验证命令**:
```bash
bash -n scripts/bootstrap-dsh.sh && grep -n "git clone\|--proxy\|install-dsh.sh" scripts/bootstrap-dsh.sh
```

### TASK-003: bootstrap-dsh.ps1 新建
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-002 |

**描述**: 新建 `scripts/bootstrap-dsh.ps1`：Windows PowerShell 等价（git clone → install-dsh.sh → 启动引导），支持 `-ProxyUrl` 镜像。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | scripts/bootstrap-dsh.ps1 |

**验收标准**:
- [ ] 含 git clone + install-dsh.sh 调用 + 启动引导
- [ ] 含 `-ProxyUrl` 镜像参数
- [ ] 结构对齐 bootstrap.ps1（opencode 参考）

**验证命令**:
```bash
grep -n "git clone\|install-dsh.sh\|ProxyUrl" scripts/bootstrap-dsh.ps1
```

### TASK-004: install-dsh.sh 启动引导 + --upgrade
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-001 |
| **执行波次** | 2 |
| **对应 FR** | FR-004 / FR-005 |

**描述**: 在 `scripts/install-dsh.sh` 补：① 安装完成打印启动引导（`npx @deepseek-ai/dsh web` + EC-004 缓存刷新提示 + V1 自检）；② 新增 `--upgrade` 模式（= `--build` 强制重建 + 幂等覆盖 + 破坏点记录提示）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | scripts/install-dsh.sh |

**验收标准**:
- [ ] 安装输出含 `npx @deepseek-ai/dsh web` 启动命令
- [ ] `--upgrade` 参数可解析且等价 `--build` + 幂等覆盖 + 破坏点提示
- [ ] `bash -n scripts/install-dsh.sh` 无语法错误

**验证命令**:
```bash
bash -n scripts/install-dsh.sh && grep -n "dsh web\|--upgrade" scripts/install-dsh.sh
```

### TASK-005: docs/dsh/README.md 安装章节更新
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-002 / TASK-003 / TASK-004 |
| **执行波次** | 3 |
| **对应 FR** | FR-001 / FR-004 / FR-005 |

**描述**: `docs/dsh/README.md` §2 安装章节增加 bootstrap 一键入口（curl 一行 + PowerShell 一行），补启动引导与 `--upgrade` 升级说明。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | docs/dsh/README.md |

**验收标准**:
- [ ] 含 curl bootstrap-dsh.sh 一行安装命令
- [ ] 含 PowerShell 一行安装命令
- [ ] 含 --upgrade 升级说明与启动引导

**验证命令**:
```bash
grep -n "bootstrap-dsh\|curl -fsSL\|--upgrade\|dsh web" docs/dsh/README.md
```

### TASK-006: docs/dsh/verification.md V1/V2 场景更新
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-002 / TASK-004 |
| **执行波次** | 3 |
| **对应 FR** | FR-006 |

**描述**: `docs/dsh/verification.md` 的 V1/V2 场景补充 bootstrap 通路的观测判据（bootstrap 安装后落位 11 个 skill、双通道等价）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | docs/dsh/verification.md |

**验收标准**:
- [ ] V1/V2 含 bootstrap 通路判据
- [ ] 含双通道等价（bootstrap vs install-dsh.sh）判定

**验证命令**:
```bash
grep -n "bootstrap\|双通道" docs/dsh/verification.md
```

### TASK-007: README.md 顶层 dsh 安装入口
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-002 / TASK-004 |
| **执行波次** | 3 |
| **对应 FR** | FR-001 |

**描述**: 顶层 `README.md` §dsh 适配章节增加一键安装入口一行（curl bootstrap-dsh.sh）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | README.md |

**验收标准**:
- [ ] dsh 适配章节含 bootstrap 一键安装入口
- [ ] 不改变 `.opencode/`/`.sddu/` 产物（工程边界）

**验证命令**:
```bash
grep -n "bootstrap-dsh" README.md
```

### TASK-008: 构建验证 + 双通道落位一致性
> 单个任务的详细定义

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001~007 |
| **执行波次** | 4 |
| **对应 FR** | FR-006 / NFR-001 / NFR-002 |

**描述**: 收尾验证：`npm run build:dsh` 成功；全部脚本 `bash -n` 无错；临时目录安装验证落位 11 个 skill；双通道（bootstrap 调 install-dsh.sh vs 直接 install-dsh.sh）落位一致。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NONE | 仅验证，无新增产物 |

**验收标准**:
- [ ] `npm run build:dsh` 退出码 0，落位 11 个 skill
- [ ] 全部脚本 `bash -n` 无语法错误
- [ ] 双通道落位条目数与来源标识一致

**验证命令**:
```bash
npm run build:dsh && bash -n scripts/bootstrap-dsh.sh scripts/install-dsh.sh scripts/uninstall-dsh.sh && bash scripts/install-dsh.sh --yes --project-root /tmp/dsh-verify-$$ && ls /tmp/dsh-verify-$$/.dsh/skills | wc -l
```

## 3. 任务汇总
> 任务数量、复杂度和波次的统计总览

| 统计项 | 数值 |
|--------|:--:|
| 总任务数 | 8 |
| S 级 (简单) | 6 |
| M 级 (中等) | 2 |
| L 级 (复杂) | 0 |
| 执行波次 | 4 |

## 4. 执行策略
> 各波次的执行说明

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-001, TASK-002, TASK-003 | 并行执行 |
| 2 | TASK-004 | 依赖 TASK-001（同文件顺序） |
| 3 | TASK-005, TASK-006, TASK-007 | 并行执行（依赖 Wave 1+2） |
| 4 | TASK-008 | 依赖全部，收尾验证 |

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 8 个任务 / 4 波次（S×6 / M×2），覆盖 FR-001~006 | 2026-09-27 | SDDU Tasks Agent |
