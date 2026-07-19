# 技术计划：@sddu-tree Agent 技能化

> **文档定位**: SDDU 技术方案 — 记录架构设计、方案对比和 ADR，作为 tasks 阶段的输入  
> **前置依赖**: spec.md（需求规范）  
> **创建人**: SDDU Plan Agent  
> **创建时间**: 2026-07-19  
> **版本**: v1.0  
> **更新人**: SDDU Plan Agent  
> **更新时间**: 2026-07-19  
> **更新说明**: 初始创建 — 基于 spec.md v1.0 产出完整技术方案 + ADR-001

## 1. 前置检查
> 启动技术规划前必须验证的前置条件

| 检查项 | 状态 |
|--------|:--:|
| spec.md 存在 | ✅ |
| 外部 API 文档缓存 | ⚠️ N/A — 本 Feature 无外部 API 依赖 |
| 前置依赖已满足 | ✅ — FR-SKILL-001 已于 2026-07-19 validated |

**验证详情**:
- `discovery.md` ✅ 139 行，覆盖 4 核心问题 + 3 次要 + 3 潜在
- `spec.md` ✅ 149 行，10 FR + 5 NFR + 8 EC
- `state.json` ✅ 当前 phase: specified
- 无外部 API 引用，不涉及缓存缺失
- FR-SKILL-001 强依赖已交付：`sddu-skill-discovery`、`sddu-skill-creator`、`sddu-skill-sync` 均为可用 Skill；8 个主流程 Agent 模板均已注入 `## Skill 发现` 章节

---

## 2. 架构分析
> 分析现有架构影响和需要的新组件

### 2.1 现有架构

```
当前状态（降级前）:
┌─────────────────────────────────────────────────────────┐
│  opencode.json  subagents (11)                          │
│  ┌──────────┬──────────┬──────────┬──────────────────┐ │
│  │discovery │ spec     │ plan     │ tasks            │ │
│  │build     │ review   │ validate │ roadmap          │ │
│  │docs      │ fast     │ tree  ←──┼ 独立 Agent       │ │
│  └──────────┴──────────┴──────────┴──────────────────┘ │
│                                                         │
│  Agent 模板层 (src/templates/agents/*.hbs)               │
│  ├─ sddu-tree.md.hbs (265行)  ←── Agent 定义本体        │
│  ├─ sddu-discovery.md.hbs L203: @sddu-tree 调用          │
│  ├─ sddu-spec.md.hbs      L153: @sddu-tree 调用          │
│  ├─ sddu-plan.md.hbs      L157: @sddu-tree 调用          │
│  ├─ sddu-tasks.md.hbs     L127: @sddu-tree 调用          │
│  ├─ sddu-build.md.hbs     L125: @sddu-tree 调用          │
│  ├─ sddu-review.md.hbs    L125: @sddu-tree 调用          │
│  ├─ sddu-validate.md.hbs  L190: @sddu-tree 调用          │
│  ├─ sddu-docs.md.hbs      L27/398/402/411/413/415/428/436: 多处引用 │
│  ├─ sddu-fast.md.hbs      L46: 文档引用                   │
│  └─ sddu.md.hbs           L48: Agent 清单表条目           │
│                                                         │
│  调用链: 主 Agent 完成 → @sddu-tree subagent 启动        │
│  → 独立 265 行 prompt 加载 → 执行扫描 → 生成 TREE        │
└─────────────────────────────────────────────────────────┘
```

**关键度量**:
- `@sddu-tree` 引用点：25 处（`src/templates/agents/*.hbs`）
- 分布在 8 个 Agent 模板 + coordinator + fast（文档引用）
- `opencode.json` 注册条目：L62-66（5 行）
- Agent 模板：265 行（`sddu-tree.md.hbs`）

### 2.2 目标架构

```
目标状态（降级后）:
┌─────────────────────────────────────────────────────────┐
│  opencode.json  subagents (10)                          │
│  ┌──────────┬──────────┬──────────┬──────────────────┐ │
│  │discovery │ spec     │ plan     │ tasks            │ │
│  │build     │ review   │ validate │ roadmap          │ │
│  │docs      │ fast     │          │                  │ │
│  └──────────┴──────────┴──────────┴──────────────────┘ │
│                                                         │
│  Skill 源码层 (src/skills/sddu-tree/SKILL.md)            │
│         ↓ npm run build + package                       │
│  用户项目 .opencode/plugins/sddu/skills/                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ sddu-tree Skill (Progress Disclosure 三层)       │   │
│  │ → frontmatter: description + 触发语义             │   │
│  │ → Stage 2: 概述（角色/职责/触发/依赖）            │   │
│  │ → Stage 3: 6步工作流 + 状态规则 + 异常处理        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Agent 模板层 (src/templates/agents/*.hbs)               │
│  ├─ sddu-tree.md.hbs  ←── ❌ 已删除                     │
│  ├─ 8 个主流程 Agent: "完成后通过 Skill 发现加载        │
│  │   sddu-tree Skill" ←── ✅ 已替换                     │
│  └─ sddu.md.hbs: Agent 清单 10 个 ←── ✅ 已更新         │
│                                                         │
│  调用链: 主 Agent 完成 → 读取 Skill 发现章节             │
│  → 按需加载 sddu-tree Skill body → 自主执行扫描          │
│  → 生成 TREE（宿主 Agent 上下文内，不启动 subagent）     │
└─────────────────────────────────────────────────────────┘
```

### 2.3 新组件

| 组件 | 路径 | 说明 |
|------|------|------|
| sddu-tree SKILL.md | `src/skills/sddu-tree/SKILL.md` | 框架级 Skill 源码。Progressive Disclosure 三层结构。Body 包含原 Agent 265 行的全部逻辑（6 步工作流 + 状态标记规则 + 异常处理）。弃用 Agent 专属骨架章节。经 `npm run build` + `npm run package` 后随插件分发到用户项目的 `.opencode/plugins/sddu/skills/sddu-tree/SKILL.md`。 |

### 2.4 数据流变更

```
变更前:
  Agent 完成 → opencode.json subagent 调度
  → 启动 sddu-tree subagent (独立对话)
  → 加载 265 行 prompt + 上下文
  → 执行 find/head/grep 命令
  → 读写 TREE.md 文件
  → 输出报告
  Token: Agent prompt + subagent prompt + subagent 上下文

变更后:
  Agent 完成 → Skill 发现章节激活
  → skill("sddu-tree") 加载 body
  → Agent 直接执行 find/head/grep 命令
  → 读写 TREE.md 文件
  → 输出报告
  Token: Agent prompt + Skill body（无额外 subagent 上下文）
```

### 2.5 依赖关系图

```
FR-SKILL-001 (validated)
    │
    ├─ sddu-skill-discovery ──→ Agent 如何发现 Skill（基础设施）
    ├─ sddu-skill-sync ─────→ Skill 从源目录同步到实际域
    └─ Skill 发现章节注入 ──→ 8 个 Agent 模板已具备发现能力
            │
            ▼
    FR-TREE-SKILL (本 Feature)
            │
            ├─ FR-001: SKILL.md 创建 ────────────────┐
            ├─ FR-002: 注销 opencode.json 注册        │
            ├─ FR-003: 删除 Agent 模板 .hbs 文件       ├─ 原子迁移 (FR-008)
            ├─ FR-004: 替换 8 模板 @sddu-tree 引用     │
            ├─ FR-005: sddu-skill-sync 同步 ──────────┘
            ├─ FR-006: 自举验证（扫描 .sddu/skills/）
            ├─ FR-007: 等价性验证（diff 对比）
            ├─ FR-009: Skill 发现声明验证
            └─ FR-010: 更新 coordinator 模板
```

---

## 3. 方案对比
> 2-3 个可行方案的对比分析

| 维度 | 方案 A：一步到位全量迁移 | 方案 B：渐进式双轨过渡 | 方案 C：SKILL.md 包装 Agent |
|------|:--|:--|:--|
| 描述 | 单次提交完成全部迁移：创建 SKILL.md → 移除 Agent 注册 → 替换所有 @sddu-tree 引用 → sync → 验证。Agent→Skill 切换为原子操作。 | 分两阶段：Stage 1 创建 SKILL.md 并 sync，Agent 和 Skill 并行存在；Stage 2（验证稳定后）移除 Agent 注册和引用。 | 创建 SKILL.md 但保留 opencode.json 注册，将 Agent prompt 指向 Skill body 内容（复用 Skill 文件）。@sddu-tree 命令仍可用，但底层执行 Skill 逻辑。 |
| 优点 | ① 架构干净——无过渡态，一次性消除 Agent 注册和所有硬编码引用<br>② 符合 FR-008 原子迁移要求<br>③ 最简实现——单次批量替换，无额外协调逻辑<br>④ 无重复执行风险 | ① 风险最低——Agent 作为回退方案始终在线<br>② 灰度验证——实际使用中对比两者行为差异<br>③ 用户逐步过渡——@sddu-tree 命令暂时可用 | ① 保持 @sddu-tree 命令兼容<br>② Agent 定义和 Skill body 统一（单一来源）<br>③ 用户习惯无需改变 |
| 缺点 | ① 回滚需 git revert 整个提交<br>② 需精确审计所有引用（25 处）<br>③ 原子性要求高——任何遗漏导致不一致 | ① Stage 1 到 Stage 2 拆为两次提交，增加流程复杂度<br>② 过渡期出现双写 TREE 风险（Agent 和 Skill 均触发）<br>③ 用户感知到两次变更 | ① 保留 Agent 注册违反架构目标<br>② 未消除 subagent 启动开销<br>③ 未能达成「Agent 清单收缩为 10 个」目标（US-005）<br>④ 未解决架构一致性问题 |
| 风险 | 🟡 中 — 引用替换遗漏风险（已通过 grep 审计缓解） | 🟡 中 — 双写 TREE 风险 + 过渡期不一致 | 🔴 高 — 未解决核心问题，仅形式化包装 |
| 工作量 | S (1.5d) | M (2.5d) — 需要两阶段协调 | S (1d) — 但不解决根本问题 |

---

## 4. 推荐方案
> 推荐方案及选择理由

**推荐**: 方案 A — 一步到位全量迁移

**理由**:
1. **完全匹配需求规格**：spec FR-008 明确要求原子迁移、无重复执行窗口。方案 A 是唯一天然满足此约束的方案。
2. **架构目标对齐**：US-005 要求「Agent 清单收缩为 10 个，移除辅助 Agent 类别」，只有方案 A 能达成此目标。
3. **实现复杂度最低**：25 处引用位置已通过 `grep` 精确审计（spec 阶段前置完成），批量替换是确定性操作。相比之下，方案 B 需两阶段协调逻辑，方案 C 完全不解决核心问题。
4. **回滚成本可控**：git 历史保留原 Agent 模板和注册条目，`git revert` 即可恢复。本 Feature 不涉及数据库、外部服务、用户数据迁移——纯文件级操作，回滚无数据丢失风险。
5. **竞品验证**：Anthropic skill-creator 本身就是 Skill 而非 Agent（discovery §4 竞品参考），证明此类流程化能力完全适合 Skill 形态。

---

## 5. 文件影响分析
> 所有需要创建/修改/删除的文件

| 操作 | 文件路径 | 说明 | 对应 FR |
|:--:|------|------|:--:|
| **NEW** | `src/skills/sddu-tree/SKILL.md` | 框架级 Skill 源码。Progressive Disclosure 三层结构（frontmatter → Stage 2 概述 → Stage 3 详细 body）。Body 完整迁移原 Agent 265 行的 6 步工作流、v3.0.0 状态标记规则（phase + status 双字段）、7 条行为规则、5 场景异常处理策略。经 `npm run package`（`scripts/package.cjs` 已有 `src/skills/ → dist/sddu/skills/` 复制逻辑）打包后随插件分发到用户 `.opencode/plugins/sddu/skills/`。 | FR-001 |
| **DELETE** | `src/templates/agents/sddu-tree.md.hbs` | 原 Agent 模板源文件。删除后 `npm run build:agents`（glob `sddu-*.md.hbs`）自动不再渲染该 Agent；`npm run package` 自动不再将其复制到 `dist/sddu/agents/`。 | FR-003 |
| **MODIFY** | `src/adapters/opencode/templates/opencode.json.hbs` | 移除 L62-66 的 sddu-tree subagent 注册条目。`npm run package` 将此模板逐字复制为 `dist/sddu/opencode.json`，安装后即生效。**注意**: 项目根目录的 `opencode.json` 是手动副本，需同步更新或待下次 npm run package 后覆盖。 | FR-002 |
| **MODIFY** | `src/templates/agents/sddu-discovery.md.hbs` | L203「完成后自动触发 `@sddu-tree`」→ Skill 发现引用声明。同时更新 L205-209 的注释块（将 `@sddu-tree` 引用改为 sddu-tree Skill 引用）。保留修订记录中的历史引用不变。 | FR-004 |
| **MODIFY** | `src/templates/agents/sddu-spec.md.hbs` | L153「完成后自动触发 `@sddu-tree`」→ Skill 发现引用声明。 | FR-004 |
| **MODIFY** | `src/templates/agents/sddu-plan.md.hbs` | L157「完成后自动触发 `@sddu-tree`」→ Skill 发现引用声明。 | FR-004 |
| **MODIFY** | `src/templates/agents/sddu-tasks.md.hbs` | L127「完成后自动触发 `@sddu-tree`」→ Skill 发现引用声明。 | FR-004 |
| **MODIFY** | `src/templates/agents/sddu-build.md.hbs` | L125「完成后自动触发 `@sddu-tree`」→ Skill 发现引用声明。 | FR-004 |
| **MODIFY** | `src/templates/agents/sddu-review.md.hbs` | L125「完成后自动触发 `@sddu-tree`」→ Skill 发现引用声明。 | FR-004 |
| **MODIFY** | `src/templates/agents/sddu-validate.md.hbs` | L190「完成后自动触发 `@sddu-tree`」→ Skill 发现引用声明。 | FR-004 |
| **MODIFY** | `src/templates/agents/sddu-docs.md.hbs` | **多处替换**：①L27 边界声明表移除 `@sddu-tree` 引用；②L398/402 完成协议中 `@sddu-tree .sddu/docs-tree-root/` → Skill 发现引用；③L411-415 不触碰声明更新；④L428-436 三 Agent 边界表更新（移除 @sddu-tree 列或改为 Skill 引用）。保留修订记录中的历史引用。 | FR-004 |
| **MODIFY** | `src/templates/agents/sddu-fast.md.hbs` | L46 文档性引用：「由 @sddu-tree 生成」→「由 sddu-tree Skill 生成」。 | FR-004 |
| **MODIFY** | `src/templates/agents/sddu.md.hbs` | ①L48 移除 Agent 清单表中的 @sddu-tree 行；②更新 Agent 数量统计说明（如存在「11 个 Agent」字样 →「10 个 Agent」）；③如有辅助分类列则移除。保留修订记录中的历史引用。 | FR-010 |

**影响统计**: 共 **1 新建** + **1 删除** + **12 修改** = **14 项文件变更**（全部在设计态源码 `src/` 范围内，`.opencode/` 产物通过 build 自动生成）

---

## 6. 风险评估
> 识别技术、依赖和时间风险及缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:--:|:--:|----------|
| **引用替换遗漏**：sddu-docs.md.hbs 中 @sddu-tree 引用分散（边界声明表、完成协议、不触碰声明、三 Agent 边界表），替换时可能遗漏某处 | 🟡 中 | 🟡 中 | (1) 审计基线已有——spec 阶段完成 25 处引用全量 grep；(2) build 阶段完成后再次 grep 验证零残留；(3) sddu-docs 引用最多，单独逐处替换并验证 |
| **TREE 生成一致性下降**：不同 Agent（不同 LLM 模型/上下文）加载同一 Skill 后生成的 TREE 格式可能存在轻微偏差 | 🟡 中 | 🟡 中 | (1) SKILL.md body 内嵌严格 TREE 格式模板（含示例 TREE 截图级规范）；(2) FR-007 等价性验证——diff 对比降级前后输出；(3) sddu-validate 可在后续 Feature 新增 TREE 一致性检查 |
| **Skill 加载失败导致 TREE 未更新**：Agent 的 Skill 发现机制未能找到 sddu-tree SKILL.md | 🟢 低 | 🟢 低 | (1) EC-004 优雅处理——Skill 未找到时不中断主流程，仅输出 ⚠️ 提示；(2) FR-005 sddu-skill-sync 确保 Skill 已被同步到实际域；(3) FR-009 确认所有 Agent 模板已含 Skill 发现章节 |
| **sddu-tree.md.hbs 的被引用方未察觉删除**：如 CI/CD 脚本或 install.sh/install.ps1 中引用了 sddu-tree Agent | 🟢 低 | 🟢 低 | (1) install.sh L445 和 install.ps1 L426 中的文档性提及（help 信息）改为 Skill 描述；(2) 全局 grep `sddu-tree` 确认无遗漏的脚本引用 |
| **Coordinator 模板 Agent 数量统计不一致**：sddu.md.hbs 中多个位置引用了 Agent 数量（如「SDDU 拥有 11 个核心 Agent」），需全部更新 | 🟢 低 | 🟢 低 | (1) grep `"11"` 或 `11 个` 在 sddu.md.hbs 中搜索所有数量引用；(2) FR-010 已覆盖此需求 |

---

## 7. 生成的 ADR
> 本次规划产出的架构决策记录

| ADR | 标题 | 状态 |
|-----|------|:--:|
| ADR-001 | sddu-tree Agent→Skill 降级：一步到位全量迁移方案 | PROPOSED |

详见 `.sddu/specs-tree-root/specs-tree-tree-skill/ADR-001.md`

---

## 8. 产物审查策略
> 供 review 阶段使用的产物清单和审查基准

| 审查产物 | 审查基准 |
|---------|---------|
| plan.md（本文件） + ADR-001 | spec.md（规范基准） |
| `src/skills/sddu-tree/SKILL.md` | spec.md FR-001 验收标准 + 原 Agent 模板 265 行 6 步工作流覆盖率 100% |
| `src/templates/agents/*.hbs`（修改后的 11 个模板） | spec.md FR-004/FR-010 验收标准 + grep 零残留验证 |
| `src/adapters/opencode/templates/opencode.json.hbs` | spec.md FR-002 验收标准（移除 L62-66 sddu-tree subagent 条目） |
| `install.sh` / `install.ps1`（如有修改） | 文档引用一致性 |

---

## 9. 产物验证策略
> 供 validate 阶段使用的产物清单和验证基准

### 9.1 核心原则

1. **不在当前项目验证** — 全部验证在现有 e2e 脚本生成的隔离测试项目中执行
2. **复用现有 e2e 基础设施** — 使用 `bash e2e/scripts/basic/sddu-e2e.sh` 创建测试项目（该脚本自动完成 `npm run build` + `install.sh`，安装最新 SDDU 插件到测试项目）
3. **实际调用 opencode** — 在测试项目中通过 opencode 交互执行验证命令
4. **不新增 e2e 脚本** — 只使用现有 `e2e/` 目录中的脚本

### 9.2 验证流程

```
┌─ Step 1 ─────────────────────────────────────────────┐
│ SDDU_TEST_DIR=/tmp bash e2e/scripts/basic/sddu-e2e.sh tree-skill-validate │
│ → 构建 SDDU → 创建测试项目 → 安装插件                     │
│ → 测试项目路径: /tmp/sddu-test-tree-skill-validate │
└──────────────────────────────────────────────────────┘
                          ↓
┌─ Step 2 ─────────────────────────────────────────────┐
│ cd /tmp/sddu-test-tree-skill-validate │
│ opencode                                               │
│ → 在 opencode 会话中逐项执行以下验证命令                   │
└──────────────────────────────────────────────────────┘
                          ↓
┌─ Step 3 ─────────────────────────────────────────────┐
│ 验证输出：检查文件存在性、grep 断言、diff 对比               │
│ → 全部通过 → ✅ validate 阶段完成                         │
└──────────────────────────────────────────────────────┘
```

### 9.3 测试用例（在测试项目的 opencode 会话中执行）

| TC | 验证目标 | 对应 FR/NFR | opencode 命令 / 验证步骤 |
|:--:|---------|:--:|------|
| **TC-01** | **@sddu-tree Agent 已注销** | FR-002 | 在 opencode 中输入 `@sddu-tree`，预期返回 subagent not found 错误（如 `No subagent found` / `未知命令` 等）。辅助验证：退出 opencode 后在测试项目执行 `grep -c "sddu-tree" .opencode/plugins/sddu/opencode.json`（排除 coordinator 文档引用后预期 0）。 |
| **TC-02** | **sddu-tree Skill 已部署** | FR-001 / FR-009 | 退出 opencode，在测试项目执行：① `ls .opencode/plugins/sddu/skills/sddu-tree/SKILL.md` 存在；② `head -30 .opencode/plugins/sddu/skills/sddu-tree/SKILL.md` 检查 frontmatter 含 name、description；③ 验证 8 个 Agent 模板含 `## Skill 发现` 章节（任一 Agent 模板 `grep "Skill 发现"` 非空）。 |
| **TC-03** | **TREE 端到端生成** | FR-001 / FR-004 | 在 opencode 中执行：`@sddu-spec test-tree-feature`（功能描述："一个简单的计数器模块"），流程走完后验证：① `ls .sddu/specs-tree-root/TREE.md` 存在；② `head -50 .sddu/specs-tree-root/TREE.md` 包含 `specs-tree-test-tree-feature` 目录树条目和状态标记。 |
| **TC-04** | **自举验证** | FR-006 | 在测试项目的 `.sddu/skills/` 下手动放置 2 个测试 Skill 文件（模拟用户级 Skill），然后在 opencode 中触发 sddu-tree Skill 扫描：`@sddu "扫描 .sddu/skills/ 目录并生成导航"`。验证：`.sddu/skills/TREE.md` 生成成功，且列出全部 Skill 文件。 |
| **TC-05** | **等价性验证** | FR-007 / NFR-003 | 选取当前 sddu 项目中一个已有 Feature 目录（如 `specs-tree-skill-system`），将其目录结构复制到测试项目的 `.sddu/specs-tree-root/` 下（仅目录结构和 state.json，不含过程文档）。在 opencode 中触发 sddu-tree Skill 扫描该目录。将生成的 TREE.md 与原 Agent 在 sddu 项目中生成的 TREE.md 做 `diff`（排除时间戳行）——目录结构一致即通过。 |
| **TC-06** | **存量 TREE 兼容** | NFR-003 | 从当前 sddu 项目复制一份旧版 @sddu-tree Agent 生成的 TREE.md 到测试项目，在 opencode 中触发 sddu-tree Skill 扫描同一目录，验证：(a) opencode 输出含「内容一致→跳过」或等价语义；(b) 存量 TREE 未被覆写（`git diff` 或 `stat` 确认 mtime 不变）。 |
| **TC-07** | **跨 Agent 一致性** | NFR-002 | 在相同测试目录下，分别用 3 个 opencode 会话（或同一会话中分别调用 3 个 Agent）：`@sddu-spec test-x`、`@sddu-build TASK-001`、`@sddu-review test-x`，每个完成后触发 sddu-tree Skill 扫描同一目录。对比 3 次生成的 TREE.md 的目录树结构——一致即通过。 |
| **TC-08** | **@sddu-tree 引用零残留** | EC-002 | 退出 opencode，在测试项目的 `.opencode/plugins/sddu/agents/` 目录下执行 `grep -rn "@sddu-tree" *.md`，排除修订记录中的历史引用后确认零匹配。同时在当前 sddu 项目的 `dist/` 构建产物中执行相同检查。 |

### 9.4 验证通过标准

| 条件 | 阈值 |
|------|:--:|
| TC-01~TC-08 全部通过 | **8/8** |
| TC-05 diff 差异仅限时间戳/生成者标记 | 结构差异 **0 行** |
| TC-08 `@sddu-tree` 残留引用（排除修订记录） | **0 处** |
| opencode 会话中无因 Skill 加载失败导致的主流程中断 | **0 次** |

### 9.5 验证执行清单（validate 阶段操作步骤）

```bash
# === 1. 创建测试项目 ===
SDDU_TEST_DIR=/tmp bash e2e/scripts/basic/sddu-e2e.sh tree-skill-validate
cd /tmp/sddu-test-tree-skill-validate

# === 2. 启动 opencode 并逐项验证 ===
opencode
# 在 opencode 会话中：
#   - TC-01: @sddu-tree → 预期失败
#   - TC-03: @sddu-spec test-tree-feature → 走完流程 → 验证 TREE.md
#   - TC-04: @sddu "扫描 .sddu/skills/ 目录并生成导航" → 验证 TREE.md
#   - (TC-02/05/06/07/08 部分需退出 opencode 后执行静态检查)

# === 3. 退出 opencode，静态验证 ===
# TC-02: ls .opencode/plugins/sddu/skills/sddu-tree/SKILL.md
# TC-08: grep -rn "@sddu-tree" .opencode/plugins/sddu/agents/*.md
# TC-05: diff <基线TREE> <生成的TREE> | grep -v "updatedAt\|timestamp"

# === 4. 清理 ===
rm -rf /tmp/sddu-test-tree-skill-validate
```

---

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 spec.md v1.0（10 FR + 5 NFR + 8 EC）+ @sddu-tree Agent 模板全量审计（265 行）+ grep 审计 25 处引用 + opencode.json 注册条目确认。产出方案对比（3 方案）、推荐方案 A、15 项文件影响、5 项风险评估、ADR-001。 | 2026-07-19 | SDDU Plan Agent |
| v1.1 | README 项目约束审查修正：(1) SKILL.md 路径 `.sddu/skills/` → `src/skills/`（框架级 Skill 源码，经 build/package 分发）；(2) 移除 DELETE `.opencode/agents/sddu-tree.md`（编译产物，删源文件后 build 自动消失）；(3) MODIFY `opencode.json` → `src/adapters/opencode/templates/opencode.json.hbs`（注册源码）；(4) 移除 §5 中的 ADR-001.md（过程文档，非源码）；统计 15→14 项 | 2026-07-19 | SDDU Coordinator |
| v1.2 | §9 验证策略重写：复用现有 `e2e/scripts/basic/sddu-e2e.sh` 创建隔离测试项目，在测试项目中实际调用 opencode 执行 8 个 TC（TC-01~TC-08），不新增 e2e 脚本 | 2026-07-19 | SDDU Coordinator |
