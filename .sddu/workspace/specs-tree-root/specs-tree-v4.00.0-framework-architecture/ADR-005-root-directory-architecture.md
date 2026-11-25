# ADR-005：项目根目录架构 — 脚本收敛与功能子目录分层

## 状态
PROPOSED

## 背景
当前项目根目录混杂了 27 个顶层条目（含目录），包括：约定文件（`package.json`、`tsconfig.json`、`LICENSE` 等）、入口脚本（`bootstrap.sh`、`install.sh`）、构建脚本（`build-agents.cjs`）、验证脚本（`test-sddu-functionality.js`）和功能子目录（`src/`、`scripts/`、`tests/`、`docs/`、`examples/`、`dist/`）。问题表现为：

| 问题 | 描述 |
|------|------|
| R-001 | `build-agents.cjs` 和 `test-sddu-functionality.js` 两个构建/验证脚本散落在根目录，与 `package.json`、`tsconfig.json` 等配置文件混杂。`scripts/` 子目录已存在且已有 5 个脚本，但收敛不完整 |
| R-002 | 测试文件散落在两个文件树：根 `tests/`（集成/E2E/fixtures/unit）和 `src/` 内（colocated `*.test.ts`、`__tests__/` 子目录），两个不相干的层级增加了认知负担。ADR-004 将其重整为 `src/__tests__/`（unit + integration）和 `e2e/`（独立 E2E） |
| R-004 | 新贡献者进入项目后需逐个辨别根目录下 27 个条目的用途和归属，认知负担高 |
| R-005 | `build-agents.cjs` 内含硬编码路径引用 `src/templates/agents/`，是构建流程的关键组件，但自身位于根目录——当 `src/` 重构时需跨目录追踪影响 |
| R-006 | `package.json` 中 `"build:agents": "node build-agents.cjs"` 引用根目录脚本，而 `"package": "node scripts/package.cjs"` 引用 `scripts/` 下脚本——相同性质的构建操作路径约定不一致 |

此次根目录架构设计是 ADR-001（业务对象架构）的自然延伸——当 `src/` 内部按业务域重组后，根目录也应体现对应的分层原则：约定文件、用户入口、功能子目录各归其位。

## 决策
我们决定采用 **「功能子目录分层 + 用户入口保留根目录 + 构建工具收敛 scripts/ + E2E 独立顶层」** 方案：

### 1. 根目录分层模型

```
项目根目录
│
├── 约定文件层         ← package.json, tsconfig.json, jest.config.ts, LICENSE,
│   (MUST be root)       README.md, CHANGELOG.md, .gitignore, .git/
│
├── 运行时配置层       ← .opencode/, opencode.json, .sddu/
│   (OUT OF SCOPE)       不在本次修改范围，保留根目录
│
├── 用户入口层         ← bootstrap.sh, bootstrap.ps1, install.sh, install.ps1
│   (KEEP at root)       保留根目录——面向终端用户的公开入口，URL/调用方式不变
│
├── 功能子目录层       ← src/, e2e/, scripts/, docs/, examples/
│   (subdirectories)     各功能域（源码、E2E、脚本、文档、示例）统一在独立子目录。单元/集成测试统一在 src/__tests__/ 内，E2E 独立为 e2e/（Jest 测试 + Shell 编排脚本合并为单一顶层 `e2e/`：`e2e/scripts/` 承载从 `scripts/e2e/` 迁入的编排脚本，见 ADR-004 和 ADR-005）
│
├── 构建产出层         ← dist/
│   (gitignored)
│
└── 依赖层             ← node_modules/
    (gitignored)
```

### 2. 脚本收敛决策

| 决策项 | 决策 | 理由 |
|--------|------|------|
| `build-agents.cjs` | 迁入 `scripts/` | 构建工具，面向开发者而非用户。`package.json` 引用路径更新为 `"node scripts/build-agents.cjs"`，与 `package.cjs` 引用约定统一 |
| `test-sddu-functionality.js` | 迁入 `scripts/` | 验证工具，面向开发者。无 `package.json` 引用，直接移动即可 |
| `bootstrap.sh` | **保留根目录** | 面向终端用户的公开入口——curl URL `https://raw.githubusercontent.com/.../main/bootstrap.sh` 是外部文档和教程中的固定引用，移动会破坏公开链接。README 中安装指令依赖此路径 |
| `bootstrap.ps1` | **保留根目录** | 同上，PowerShell 版本的公开入口 |
| `install.sh` | **保留根目录** | 面向终端用户的安装入口——用户在 clone 仓库后执行 `./install.sh` 是习惯操作。移动至 `scripts/` 需改为 `./scripts/install.sh`，破坏用户习惯和现有文档 |
| `install.ps1` | **保留根目录** | 同上，PowerShell 版本 |
| `scripts/e2e/` (含 `basic/`、`fullstack/`) | 迁入 `e2e/scripts/` | Shell 编排脚本（`basic/sddu-e2e.sh`、`fullstack/sddu-e2e-fullstack.sh`）从 `scripts/e2e/` 迁入顶层 `e2e/scripts/`，与 Jest E2E 测试统一入口。消除双 `e2e` 目录（`scripts/e2e/` 与 `e2e/`）并存造成的职责重叠和命名混淆——调整后 `e2e/` 为唯一的 E2E 目录，包含 Jest 配置、测试用例和 Shell 编排脚本 |

### 3. package.json 脚本路径统一

**当前**（不一致）:
```json
{
  "scripts": {
    "build:agents": "node build-agents.cjs",     // 根目录引用
    "package": "node scripts/package.cjs"         // scripts/ 引用
  }
}
```

**目标**（统一）:
```json
{
  "scripts": {
    "build:agents": "node scripts/build-agents.cjs",   // 统一 scripts/ 引用
    "package": "node scripts/package.cjs"               // 不变
  }
}
```

## 后果

### 正面影响
1. **根目录清晰度提升**：条目从 27 个减少至约 20 个（移除 2 个脚本 + `tests/` 功能子目录拆分为 `src/__tests__/` 单元/集成层 + `e2e/` 独立顶层）。新贡献者进入项目后，根目录只看到约定文件 + 4 个入口脚本 + 5 个功能子目录，一眼理解项目骨架
2. **脚本约定统一**：所有构建、验证、迁移、检查脚本统一在 `scripts/` 下，`package.json` 中的 `scripts` 字段引用路径保持一致
3. **入口脚本公开 URL 不受影响**：`bootstrap.sh` 的 GitHub raw URL 和 `install.sh` 的本地调用方式不变，零用户摩擦
4. **构建工具与源码就近**：`build-agents.cjs` 与 `package.cjs` 同在 `scripts/` 下，构建相关脚本集中管理
5. **分层模型可复用**：后续若新增其他顶层功能（如 `benchmarks/`、`config/`），根目录的分层模型提供了清晰的扩展模式
6. **测试分层就近 + E2E 独立**：单元/集成/回归测试统一在 `src/__tests__/` 内——维护者在 `src/` 目录内即可完成编码→单测→集成测试的完整 TDD 环路。E2E 独立为 `e2e/` 顶层目录（Jest 测试 + Shell 编排脚本统一入口：`e2e/jest.config.ts` + `e2e/*.test.ts` + `e2e/scripts/`），与单元/集成测试物理隔离，CI 编排更清晰

### 负面影响
1. **`build-agents.cjs` 内部路径需确认**：该脚本内含 `__dirname` 引用，移动后 `path.join(__dirname, 'src', '...')` 中的 `__dirname` 解析结果变化——需检查并确认路径是否正确（`scripts/build-agents.cjs` 的 `__dirname` = `<root>/scripts/`，需要 `path.join(__dirname, '..', 'src', ...)` 来访问 src/）
2. **更新 `package.json` 引用**：1 行变更（`build:agents` 脚本路径）
3. **CI/CD 如有硬编码路径**：若 CI 配置中直接引用了 `./build-agents.cjs`，需同步更新为 `./scripts/build-agents.cjs`

### 与其他 ADR 的关系
- **ADR-001**（业务对象架构）：src/ 内部架构重组是本 ADR 的前提——构建脚本路径引用受 src/ 重组影响
- **ADR-003**（构建配置）：`tsconfig.json`、`package.json` 的修改与根目录重构同步进行
- **ADR-004**（测试组织）：`tests/` 拆分为 `src/__tests__/`（unit + integration，按业务域分型）和 `e2e/`（独立顶层、不收集覆盖率），是本 ADR「根目录功能子目录从 5 个改为 5 个（src/、e2e/、scripts/、docs/、examples/）」的直接依赖
