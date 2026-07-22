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

## 10. SKILL 文件技术实现设计
> 对 §5 文件影响分析中 `src/skills/sddu-tree/SKILL.md`（NEW）的技术实现细节补充。本节的职责是定义"怎么做"——结构设计、映射关系和验收方法。tasks 阶段仅从本节提取可测试验收点，不在此越界填充实现细节。

### 10.1 sddu-skill-creator 借助策略

#### 10.1.1 借助范围界定

`sddu-skill-creator`（`src/skills/sddu-skill-creator/SKILL.md`）提供了一套完整的 Skill 创建方法论，但有一条关键边界：其 §4.1/§7 明确声明只创建**用户级 Skill**（输出到 `.sddu/skills/`），框架级 Skill（`src/skills/`）不由它创建。

本 Feature 的策略是：**借助 creator 的方法论和检查流程，手动写入框架级路径 `src/skills/sddu-tree/`**。

| 借助内容 | 来源 | 在本 Feature 中的使用方式 |
|---------|------|--------------------------|
| **description 冲突检查方法** | creator §2.3（🟢🟡🔴 三级风险标注） | **手动执行**——将 sddu-tree description 候选与 sddu-docs 等已有 Skill 做交叉比对。详见 §10.1.2。 |
| **Progressive Disclosure 三层结构** | creator §3.1（frontmatter → Stage 2 → Stage 3） | **作为结构模板**——sddu-tree SKILL.md 按此三层组织。详见 §10.2.1。 |
| **产出检查清单（7 项）** | creator §4.2（name 正则 / description 长度 / body 行数 / 敏感信息 / 路径有效 / YAML 格式） | **作为验收基准**——build 完成后逐项对照自检。详见 §10.3.1。 |
| **触发测试方法** | creator §5（3-5 个场景覆盖直接命令 / 疑问句 / 模糊表达 / 混合上下文 / 相近无关负样本） | **在 validate 阶段执行**——验证 sddu-tree description 不与 sddu-docs 误触发。详见 §10.3.2。 |
| **篇幅约束建议** | creator §3.2 建议 ≤500 行 | **作为上限参考**——结合 NFR-004 自包含要求，设定本 Skill 的合理硬上限。详见 §10.2.3。 |

**不借助的内容及原因**：

| 不借助的内容 | 原因 |
|-------------|------|
| creator 的文件输出能力 | creator 输出到 `.sddu/skills/`，本 Skill 需手动写入 `src/skills/` |
| creator 的交互式引导流程（§1-§6） | 本 Skill 的用途、触发条件、接口契约已在 spec/plan 中充分定义，无需对话式引导 |
| creator §2.2 候选 description 生成 | 由 build agent 根据本节设计直接产出，不走 creator 的对话引导 |

#### 10.1.2 关键冲突检查：sddu-tree vs sddu-docs

**冲突背景**：sddu-tree 和 sddu-docs 同属"目录/导航/扫描"语义域，两者的 `description` 需要足够区分度以避免 Agent 误触发。这是 creator §2.3 冲突检查的核心场景——🟡 中等风险：场景相近但触发关键词需有足够区分度。

**sddu-docs 当前 description**（来自 `src/templates/agents/sddu-docs.md.hbs` frontmatter）：
> SDDU 项目全景专家 — 主扫描 specs-tree-root 下 Feature 过程产物，聚合为项目全景；也支持用户指令下扫描项目代码和配置生成代码级全景

**sddu-tree description 须强调的区分点**：

| 维度 | sddu-tree 定位 | sddu-docs 定位（避免撞车） |
|------|:--|:--|
| **核心产出** | 目录导航 TREE.md（层级化的目录结构索引） | 项目全景报告（多 Feature 产物聚合） |
| **触发词** | 目录导航 / 扫描 .sddu 结构 / 更新 TREE / 目录树 | 项目全景 / 聚合 Feature / 代码级全景 |
| **操作粒度** | 逐目录扫描 → 生成各层级 TREE.md | 聚合多个 Feature 的过程产物 → 生成全景视图 |
| **排除语义** | 不涉及多 Feature 产物聚合、不生成项目全景 | 不生成逐目录的 TREE.md 导航文件 |

**description 草稿方向**（由 build agent 细化）：
> "当 Agent 完成主流程后需要扫描 .sddu/ 目录结构、为每个层级生成或更新 TREE.md 目录导航文件时使用。负责目录扫描、文件简介提取、状态标记和增量更新，不聚合多 Feature 过程产物。"

### 10.2 SKILL 文件内部结构设计

#### 10.2.1 Progressive Disclosure 三层映射

原 Agent 模板（`src/templates/agents/sddu-tree.md.hbs`，265 行）按 Agent 骨架组织。迁移到 SKILL.md 后按 Progressive Disclosure 三层重新编排：

```
Layer 1: frontmatter (∼8 行)
├─ name: sddu-tree
├─ description: [自然语言触发描述，≤1024 字符]
└─ 作用：Agent 在第一眼（Skill 发现阶段）判定是否加载本 Skill

Layer 2: Stage 2 概述 (∼40 行)
├─ 角色定位：SDDU 目录导航 Skill——扫描 .sddu/ 目录结构，为每个层级生成 TREE.md
├─ 职责边界：负责目录扫描→文件简介提取→状态标记→TREE 生成/更新；不聚合多 Feature 产物
├─ 触发条件：Agent 完成主流程后自动触发 / 用户显式请求扫描目录
├─ 依赖：sddu-skill-discovery（Skill 发现基础设施，无硬依赖）
├─ 接口：无参数（自动扫描当前工作区 .sddu/），可接受指定目录路径
└─ 作用：Agent 加载 Skill 后快速了解能力范围和调用方式

Layer 3: Stage 3 body (∼215-260 行)
├─ §1 前置验证（.sddu/ 目录存在性检查）
├─ §2 6 步工作流
│   ├─ §2.1 扫描目录树（find 命令获取目录/文件列表）
│   ├─ §2.2 检测缺失 TREE（逐目录对比，标记需生成/需更新/需跳过）
│   ├─ §2.3 读取文件生成简介（head 取 md 头、解析 state.json phase+status）
│   ├─ §2.4 生成/更新 TREE.md（固定格式模板：目录树 + 文件说明表 + 子目录表）
│   ├─ §2.5 验证已有 TREE（对比实际目录 vs TREE 内容，更新变化部分）
│   └─ §2.6 输出报告（已创建/已更新/已跳过分类统计）
├─ §3 状态标记规则（v3.0.0 phase + status 双字段 → 5 种 terminal status 标记）
├─ §4 7 条行为规则（移除 feature 字眼 / 读取内容 / 读取子 TREE / 验证已有 / 按需更新 / 双字段模型 / 搁置迁出详情）
├─ §5 异常处理（5 场景：目录不存在 / 为空 / TREE 已存在 / 权限问题 / state.json 异常）
├─ §6 Skill 发现章节（末尾，引用 sddu-skill-discovery）
└─ 作用：Agent 执行时的完整操作指令——所有规则在 body 内自引用，满足 NFR-004 自包含要求
```

#### 10.2.2 原 Agent 265 行逻辑到三层结构的逐章节映射

| 原 Agent 章节 | 行数 | 迁移到 | 说明 |
|:--|:--:|:--:|------|
| frontmatter（description / mode / permission） | 8 | frontmatter（简化） | 废弃 `mode: subagent` / `temperature` / `permission` 字段——Skill 无这些概念。仅保留 `name` + `description`。 |
| §1 角色定位与职责边界 | 15 | Stage 2 概述 + Stage 3 §1 开头 | 角色定位放入 Stage 2；职责边界简化为一句话声明 |
| §2 执行顺序 | 5 | ❌ **弃用** | Agent 专属骨架——Skill 不需要声明自己在 7 阶段工作流中的位置 |
| §3 依赖关系 | 5 | ❌ **弃用** | Agent 专属骨架——Skill 的依赖由加载 Agent 的 Skill 发现机制管理 |
| §4 前置验证 | 10 | Stage 3 §1（前置验证） | 完全保留——`.sddu/` 目录存在性检查 |
| §5 触发时机 | 15 | 合并入 Stage 2（触发条件） | 自动/手动触发说明提炼为 Stage 2 的一句话触发条件 |
| §6 工作流程（6 步） | 150 | Stage 3 §2（6 步工作流） | 核心逻辑，**逐步骤完整保留**。内嵌的 find/head/grep 命令、TREE 格式模板、状态标记规则图全部迁移 |
| §7 输出模板 | 5 | ❌ **弃用** | Agent 专属骨架——Skill 不声明外部模板文件路径 |
| §8 行为规则（7 条） | 10 | Stage 3 §3（行为规则） | 完全保留——7 条规则全部迁移 |
| §9 异常处理（5 场景） | 10 | Stage 3 §4（异常处理） | 完全保留——5 场景 + 处理方式表全部迁移 |
| §10 示例对话 | 10 | ❌ **弃用** | Agent 专属骨架——Skill 不需要模拟用户对话 |
| 修订记录 | 7 | 保留在末尾 | 格式切换为 SKILL.md 的修订记录（重新开始版本号） |
| `## Skill 发现` | 2 | 保留在末尾 | 确保 sddu-tree 作为 Skill 自身也能加载其他 Skill |

**迁移统计**：原 Agent 265 行中，约 **195 行核心逻辑保留**、约 **30 行 Agent 骨架弃用**（§2/§3/§7/§10）、约 **40 行改写提炼**（frontmatter 简化 / §1+§5 合并入 Stage 2）。预估 SKILL.md 总行数 **235-265 行**。

#### 10.2.3 篇幅约束设计

| 约束来源 | 约束 | 本 Skill 适用性 |
|---------|:--:|------|
| creator §3.2 建议 | body ≤ 500 行 | 远超本 Skill 预估 235-265 行——无需拆分 |
| NFR-004 自包含 | body 内定义所有执行指令，不依赖外部上下文 | 所有规则在 body 内自引用，完全满足 |
| 本 Skill 实际规模 | 约 235-265 行（含 frontmatter + Stage 2/3 + 修订记录） | 略低于原 Agent 265 行——弃用 Agent 骨架节省的行数抵消了 Progressive Disclosure 结构新增的分层标记 |

**决策**：设定 **body（不含 frontmatter）≤ 300 行为硬约束**，≤ 260 行为推荐目标。理由：
1. 远低于 creator 500 行建议，极充裕
2. 与已知 Skill 规模可比——sddu-skill-creator 380 行、sddu-skill-discovery 约 250 行
3. NFR-004 完全满足——所有指令在 body 内自包含

### 10.3 质量保证策略

#### 10.3.1 借助 creator §4.2 产出检查清单

build 阶段完成 SKILL.md 创建后，按以下 7 项逐条自检：

| # | 检查项 | 来源 | 验证命令/方法 |
|:--:|------|:--:|------|
| 1 | `name` 符合 `^[a-z0-9]+(-[a-z0-9]+)*$` | creator §4.2 | `grep "^name:" src/skills/sddu-tree/SKILL.md` → 预期 `sddu-tree`（10 字符，全小写字母+连字符） |
| 2 | `name` 1-64 字符 | creator §4.2 | 人工确认（`sddu-tree` = 10 字符 ✅） |
| 3 | `description` ≤ 1024 字符，自然语言 | creator §4.2 + spec FR-001 验收标准(4) | `sed -n '/^description:/,/^---/p'` 提取后 `wc -c` |
| 4 | body ≤ 300 行 | §10.2.3 硬约束 + creator 建议 | `awk '/^---/{n++;next} n>=1' src/skills/sddu-tree/SKILL.md | wc -l` |
| 5 | body 不含敏感信息（密钥/URL/个人信息） | creator §4.2 | 人工审查——本 Skill 为纯操作指引，无敏感内容 |
| 6 | 引用路径有效（如有 scripts/references/assets） | creator §4.2 | 本 Skill 无子资源引用（纯自包含指令型），跳过 |
| 7 | YAML frontmatter 格式正确 | creator §4.2 | 人工检查缩进一致性、特殊字符转义 |

#### 10.3.2 借助 creator §5 触发测试

在 validate 阶段执行，验证 sddu-tree description 的触发准确率——核心关注点是与 sddu-docs 的语义区分。

| # | 类型 | 输入语句 | 预期行为 | 验证方法 |
|:--:|------|---------|---------|---------|
| TT-01 | 直接命令 | `扫描 .sddu/ 目录结构` | ✅ 触发 sddu-tree | 在 opencode 会话中执行该语句，检查 skill 工具调用是否含 `sddu-tree` |
| TT-02 | 直接命令 | `更新所有 TREE.md 导航文件` | ✅ 触发 sddu-tree | 同上 |
| TT-03 | 模糊表达 | `帮我看看 .sddu 下面有哪些文件` | ✅ 触发 sddu-tree | 同上——模糊语义仍应命中 tddu-tree |
| TT-04 | **区分测试（负样本）** | `生成项目全景报告` | ❌ 不触发 sddu-tree（触发 sddu-docs） | 验证 skill 工具调用中**不含** `sddu-tree` |
| TT-05 | **区分测试（负样本）** | `聚合所有 Feature 的过程产物` | ❌ 不触发 sddu-tree（触发 sddu-docs） | 同上 |

**通过标准**：
- TT-01~TT-03：全部正确触发 sddu-tree（≥ 2/3 即视为 description 覆盖充分，但 3/3 为推荐目标）
- TT-04~TT-05：全部**不**触发 sddu-tree（必须 2/2——误触发为阻塞级缺陷）
- 如 TT-04/05 出现误触发 → description 需增加区分度措辞，重新执行全部 5 个 TT

#### 10.3.3 6 步工作流覆盖率验证

在原 Agent 模板（`src/templates/agents/sddu-tree.md.hbs` §6）与新的 SKILL.md Stage 3 §2 之间逐步骤对比。

| 步骤 | Agent 模板 §6 行号范围 | SKILL.md 对应位置 | 覆盖项 |
|:--:|:--|:--|------|
| 步骤 1：扫描目录树 | L68-73 | Stage 3 §2.1 | `find .sddu -type d` / `find .sddu -type f -name "*.md"` / `find .sddu -type f -name "*.json"` 三条命令全部保留 |
| 步骤 2：检测缺失 TREE | L75-86 | Stage 3 §2.2 | 逐目录检查 4 个层级 TREE 是否存在 +「需要生成」vs「需要验证」分支逻辑 |
| 步骤 3：读取文件生成简介 | L87-111 | Stage 3 §2.3 | `head -20 [file].md` + state.json 解析（phase / status / suspended / merged / metadata 五个字段取数逻辑） |
| 步骤 4：生成/更新 TREE.md | L112-148 | Stage 3 §2.4 | 固定格式模板：目录简介 → 目录结构（tree 图）→ 文件说明表 → 子目录表 → 上级目录链接。5 个子模块全部保留 |
| 步骤 5：验证已有 TREE | L169-184 | Stage 3 §2.5 | 4 类差异检测：文件不匹配 / 子目录变化 / 内容过时 / 状态更新。4 类更新策略全部保留 |
| 步骤 6：输出报告 | L186-208 | Stage 3 §2.6 | 报告格式：已创建 / 已更新（含变化详情）/ 跳过 / 统计汇总。4 个报告段全部保留 |

**验证命令**（build 后执行）：
```bash
# 逐步骤 grep 确认关键标记存在
grep -c "步骤 1.*扫描目录树\|步骤 2.*检测缺失\|步骤 3.*读取文件\|步骤 4.*生成.*TREE\|步骤 5.*验证已有\|步骤 6.*输出报告" \
  src/skills/sddu-tree/SKILL.md
# 预期：6
```

**通过标准**：6/6 步骤完全对应，逐步骤的关键命令（find / head / grep）、分支逻辑和格式模板无遗漏。

#### 10.3.4 5 异常场景覆盖验证

对照原 Agent 模板 §9 异常处理表逐一确认。

| # | 异常场景 | Agent 模板 §9 | SKILL.md 对应位置 | 处理策略一致性 |
|:--:|------|:--|:--|:--:|
| 1 | `.sddu/` 目录不存在 | 第 1 行 | Stage 3 §5.1 | 提示 Agent 报告「❌ .sddu/ 目录不存在，请先初始化 SDDU 工作空间」，不抛异常。**一致** |
| 2 | 目录为空（无子目录） | 第 2 行 | Stage 3 §5.2 | 跳过该目录。**一致** |
| 3 | TREE.md 已存在且内容与实际一致 | 第 3 行 | Stage 3 §5.3 | 检测无变化→标记为「跳过」。**一致** |
| 4 | 文件权限问题（无法读取/写入） | 第 4 行 | Stage 3 §5.4 | 报告错误，跳过该文件。**一致** |
| 5 | `state.json` 缺少 `phase`/`status` 字段 | 第 5 行 | Stage 3 §5.5 | 标记为「⚠️ 状态异常」，提示使用 R5 一致性检测修复。**一致** |

**验证命令**（build 后执行）：
```bash
# 逐场景 grep 确认关键短语存在
grep -c "目录不存在\|目录为空\|跳过\|权限问题\|状态异常" \
  src/skills/sddu-tree/SKILL.md
# 预期：≥ 5（每条异常场景至少一个关键短语）
```

**通过标准**：5/5 异常场景全部覆盖，处理策略与原 Agent 模板一致。

### 10.4 plan→tasks 职责边界声明

本节（§10）定义的 SKILL.md 内部结构、映射关系和质量检查策略，为 tasks 阶段的 TASK-001 提供明确的技术实现基准。**tasks agent 的职责**仅限于：
1. 按本节的章节结构创建 `src/skills/sddu-tree/SKILL.md`
2. 在 acceptance criteria 中引用本节的检查项（10.3.1 七项清单中的可自动化项 + 10.3.3 六步覆盖 + 10.3.4 五场景覆盖）
3. 在 verify 字段中将本节的验证命令转化为一行可执行脚本

**tasks agent 不需要**自行设计 frontmatter 格式、决定三层结构映射、或推测篇幅上限——这些决策均在本节中已完成。

---

## 11. 优化设计：脚本化 + 定向扫描

> 补充优化设计 — 针对当前 SKILL.md v1.0 实现中存在的两个效率问题提出脚本化 + 定向扫描的设计方案。
> **定位**：本节的优化设计不影响已完成验证的 Agent→Skill 降级逻辑（§1-§10），而是在已有基础上对 Skill 内部实现和调用路径做效率提升。优化后的 SKILL.md 等产物将在后续 build 阶段实施。

### 11.1 问题分析

当前 sddu-tree Skill（`src/skills/sddu-tree/SKILL.md`，223 行）已通过 Agent→Skill 降级完成架构改变，但 Skill body 的实现方式存在两个效率问题：

#### 11.1.1 问题 1：LLM 做确定性工作

**现象**：sddu-tree 的 TREE 生成全流程是纯文件操作——`find`/`ls` 扫描目录、`head` 提取文件简介、`grep`/`read` 解析 `state.json`、按固定模板写 `TREE.md`、`diff` 检测变化。这些操作是**确定性的**：相同输入一定产生相同输出，不依赖 LLM 的推理、判断或权衡能力。

但当前 Skill body（223 行）将 6 步工作流全部写成 Markdown 指令，由 LLM 逐条理解并转化为 bash 命令执行：

| 步骤 | 当前实现 | 是否需 LLM 推理 |
|------|---------|:--:|
| 步骤 1：扫描目录树 | LLM 理解 `find .sddu -type d` 指令后执行 | ❌ 纯命令执行 |
| 步骤 2：检测缺失 TREE | LLM 理解分支逻辑后逐目录判断 | ❌ 条件判断 |
| 步骤 3：读取文件生成简介 | LLM 逐文件 `head -20` 后提取标题 | ❌ 纯文本提取 |
| 步骤 4：生成/更新 TREE.md | LLM 按格式模板逐行拼接输出 | ❌ 模板渲染 |
| 步骤 5：验证已有 TREE | LLM 对比实际目录 vs TREE 内容 | ❌ diff 比较 |
| 步骤 6：输出报告 | LLM 统计分类后格式化输出 | ❌ 统计汇总 |

**6/6 步骤均属「输出格式有严格约束、纯文件操作、确定性步骤」**——这正是 sddu-skill-creator §3.3 明确定义为"该移入 `scripts/`"的信号。

**后果**：
1. **Token 浪费**：每次扫描加载 223 行 Skill body → LLM 逐行理解 → 决定调用什么 bash 命令。而实际执行的 bash 命令总共不超过 20 行。
2. **格式不一致风险**：不同 LLM 模型/上下文可能对同一格式模板产生微妙偏差（如缩进差异、空白行差异），已有 TC-07 暴露此风险（NFR-002）。
3. **违背自身设计原则**：sddu-skill-creator §3.3 明确规定——「输出格式有严格约束、纯文件操作、确定性步骤→该移入 scripts/」，sddu-tree 完全符合但未遵循。

#### 11.1.2 问题 2：全量扫描 .sddu/ 目录

**现象**：当前完成协议触发 sddu-tree Skill 后，默认扫描**整个 `.sddu/` 目录**（步骤 1：`find .sddu -type d`）。但实际调用场景是：一个主流程 Agent（如 spec）完成一个 Feature 后，只有**该 Feature 自己的目录**发生了变化。需要更新的 TREE.md 仅 3 个：

1. 当前 Feature 目录的 TREE.md（`specs-tree-root/specs-tree-<feature>/TREE.md`）
2. 父目录 specs-tree-root/ 的 TREE.md（该 Feature 的条目状态变化）
3. 顶层 `.sddu/TREE.md`（如涉及 Feature 统计变化）

**以当前项目规模估算**：

| 扫描策略 | 扫描目录数 | 需要更新的 TREE | 无效扫描率 |
|---------|:--:|:--:|:--:|
| 全量（当前） | 25+ | 3 | >88% |
| 定向（优化后） | 3 | 3 | 0% |

**后果**：
1. 每次 Agent 完成都执行 22+ 个无需扫描的目录，纯浪费 I/O
2. 无效扫描中仍需读取各目录的 `state.json` 和 `.md` 文件以生成 TREE——这些 TREE.md 随后被「内容一致→跳过」逻辑滤掉，浪费了读取步骤的全部 CPU/IO 成本

#### 11.1.3 量化对比

| 指标 | 当前 Skill（v1.0） | 优化后（脚本化 + 定向扫描） | 改善 |
|------|:--|:--|:--:|
| 每次触发 Skill body 加载量 | 223 行（LLM 逐行理解） | ~50 行（LLM 加载概述 + 调用脚本） | **↓ 78%** |
| 需 LLM 推理的步骤 | 6/6 | 0/6（脚本确定性执行） | **↓ 100%** |
| 扫描目录数（平均） | 25+ | 3 | **↓ 88%** |
| TREE 格式一致性 | LLM 渲染（有方差） | 脚本模板（100% 一致） | **确定性保证** |
| 每次触发 token 消耗 | Skill body 加载 + LLM 推理 bash 命令 | Skill body 加载 + 脚本 stdout 解析 | **↓ ~70%** |

### 11.2 脚本化设计

**核心决策**：将 6 步工作流的确定性操作从 Markdown body 移入独立脚本，Skill body 缩减为脚本调用者。

#### 11.2.1 脚本位置与命名

```
src/skills/sddu-tree/scripts/generate-tree.cjs
```

**选择 `.cjs`（CommonJS Node.js）的理由**：
- Node.js 在开发环境中零依赖可用
- CommonJS 无编译需求，与项目 `scripts/package.cjs` 等已有脚本一致
- `find`/`head`/`grep` 等操作通过 `child_process.execSync` 调用系统命令，脚本本身负责编排和模板渲染
- 如未来需要跨平台支持，可在脚本内用 `fs.readdirSync` 等纯 Node API 替代 shell 命令

#### 11.2.2 脚本输入/输出契约

```
generate-tree.cjs
  用途：扫描指定 Feature 目录及父目录链，生成/更新各层级 TREE.md 的目录导航文件。
  入参：
    --target <目录路径>    必填。当前 Feature 的完整路径，如 specs-tree-root/specs-tree-tree-skill/
  出参（stdout）：
    JSON 变更报告：
    {
      "created": ["path/to/new/TREE.md", ...],
      "updated": [
        {"path": "path/to/updated/TREE.md", "changes": ["新增文件: tasks.md", "状态变更: planned→tasked"]}
      ],
      "skipped": ["path/to/unchanged/TREE.md", ...],
      "errors": [],
      "stats": {"scanned": 3, "created": 1, "updated": 1, "skipped": 1}
    }
  退出码：
    0 — 成功（含部分跳过/警告）
    1 — 致命错误（.sddu/ 目录不存在、--target 路径无效）
```

#### 11.2.3 脚本核心逻辑

```
function main(targetPath):
  1. 验证前置
     - 检查 .sddu/ 目录存在
     - 检查 --target 路径有效（存在且为目录）
     - 失败 → stderr 输出错误信息 + exit(1)

  2. 确定扫描范围
     - 从 --target 向上追溯父目录链
     - 扫描路径 = [targetPath, parentPath, 顶层 .sddu/]
     - 例：--target specs-tree-root/specs-tree-tree-skill/
       → 扫描 3 个目录：
         ① specs-tree-root/specs-tree-tree-skill/
         ② specs-tree-root/
         ③ .sddu/

  3. 逐目录扫描与生成
     For each 目录 in 扫描范围:
       a. 收集文件列表：find <dir> -type f \( -name "*.md" -o -name "*.json" \) | sort
       b. 读取文件简介：head -20 <file>.md → 提取：# 标题 + 第一段概述（≤80 字符）
       c. 解析状态：read state.json → 提取 phase、status、suspended、merged、metadata
       d. 读取子目录：find <dir> -mindepth 1 -maxdepth 1 -type d → 读取子 TREE 提取简介
       e. 按固定模板生成 TREE.md 内容（见 §11.2.4）
       f. 对比已有 TREE.md：diff 新生成内容 vs 现有 TREE.md
          - 无差异 → 加入 skipped
          - 有差异 → 写入新内容 → 加入 updated（记录 changes）
          - 无现有 → 写入 → 加入 created

  4. 输出 JSON 报告到 stdout
```

#### 11.2.4 固定模板（脚本内硬编码）

```markdown
# Directory: [相对路径]

## 目录简介
[从子文件 TREE 提取概述]

## 目录结构
```
[dir-name]/
├── TREE.md
├── [file1.md]    # [标题/简介]
├── [file2.md]    # [标题/简介]
└── [sub-dir]/
```

## 文件说明
| 文件 | 说明 | 状态 |
|------|------|------|
| [file] | [标题] - [概述≤80字] | [状态标记] |
...

## 子目录
| 目录 | 说明 |
|------|------|
| [sub-dir]/ | [简介] |
...

## 上级目录
- [返回上级](../TREE.md)
- [返回首页](../../TREE.md)
```

**模板硬编码在脚本中**——由 `fs.writeFileSync` 直接写入，不经 LLM 渲染，100% 格式一致。

#### 11.2.5 状态标记规则（脚本内实现）

```javascript
function getStatusMark(stateJson) {
  const { phase, status } = stateJson;
  switch (status) {
    case 'completed': return '✅ 已完成';
    case 'suspended': return `🟡 搁置${stateJson.suspended?.suspendedNote ? ' - ' + stateJson.suspended.suspendedNote : ''}`;
    case 'terminated': return '🚫 已终止';
    case 'merged': return `🔵 已迁出 → ${stateJson.merged?.mergedInto || 'N/A'}`;
    case 'tracked': return phase === 'validated' ? '✅ 已完成' : `[${phase}]`;
    default: return '⚠️ 状态异常';
  }
}
```

**决策**：状态标记逻辑从 Markdown body 的说明表格移入脚本的 `getStatusMark()` 函数——LLM 不再需要理解 phase/status 映射规则，脚本保证 100% 一致性。

### 11.3 定向扫描设计

#### 11.3.1 核心原则

**只扫描当前 Feature 路径 + 父目录链，不扫整个 `.sddu/`。**

扫描范围推导规则：
- 输入：`--target specs-tree-root/specs-tree-tree-skill/`
- 扫描目录 = [targetPath, parentPath, rootPath]
  - targetPath: `specs-tree-root/specs-tree-tree-skill/` → 生成/更新该 Feature 的 TREE.md
  - parentPath: `specs-tree-root/` → 更新该 Feature 的条目行（状态变更）
  - rootPath: `.sddu/` → 如涉及顶层统计变化则更新

#### 11.3.2 与全量扫描的对比

| 维度 | 全量扫描（当前） | 定向扫描（优化后） |
|------|:--|:--|
| 扫描目录数 | 遍历 `.sddu/` 下所有目录（当前 25+） | 仅当前 Feature + 父目录链（固定 3） |
| TREE.md 生成/更新 | 全部目录的 TREE 都做 diff | 仅 3 个目标 TREE 做 diff |
| 无效 I/O | 88%+ 的 `find`/`head`/`read` 命中无变化目录 | 0% — 所有扫描目录均为变化相关 |
| 触发方式 | 无参数全量扫描 | `--target <path>` 定向触发 |
| 耗时（估算） | `O(n)` n=全目录数 | `O(1)` 固定 3 目录 |

#### 11.3.3 实现要点

1. **`--target` 参数为必填**：脚本不支持无参数全量扫描（如需全量，由 Agent 显式传入 `.sddu/` 作为 target）。
2. **父目录链追溯**：脚本内通过 `path.dirname()` 向上追溯两级：
   - `specs-tree-root/specs-tree-feature/` → 父 = `specs-tree-root/` → 祖父 = `.sddu/`
3. **去重**：如两个 Feature 在同一父目录下（`specs-tree-root/`），父目录只扫描一次。
4. **增量更新**：对已有 TREE.md 的目录，仅对比 diff 后更新变化条目——不重写整个 TREE。

### 11.4 SKILL.md 重写设计

#### 11.4.1 Body 结构变化

| 部分 | v1.0（当前） | v2.0（脚本化后） | 变化说明 |
|------|:--:|:--:|------|
| frontmatter | 4 行 | 4 行 | **不变** — name/description 无需修改 |
| 概述（Stage 2） | 18 行 | 10 行 | **缩减** — 移除"6 步工作流"详细列表，改为引用脚本 |
| 前置验证 | 5 行 | 5 行 | **不变** — `.sddu/` 存在性检查逻辑保留 |
| 工作流（6 步） | ~125 行 | 0 行 | **❌ 移除** — 全量移入脚本 |
| 状态标记规则 | ~18 行 | 0 行 | **❌ 移除** — `getStatusMark()` 逻辑在脚本中 |
| 行为规则（7 条） | ~10 行 | 0 行 | **❌ 移除** — 规则由脚本强制执行 |
| 异常处理（5 场景） | ~10 行 | 5 行（简化） | **缩减** — 保留概述级策略，具体处理移入脚本 |
| **调用脚本** | — | ~15 行 | **✅ 新增** — 三步调用：传参→执行→解析 JSON 报告 |
| Skill 发现 | 2 行 | 2 行 | **不变** |
| 修订记录 | 1 行 | 1 行 | **不变** |
| **合计** | ~195 行 body | ~50 行 body | **↓ 74%** |

#### 11.4.2 SKILL.md v2.0 body 核心结构（草案）

```markdown
# sddu-tree

## 概述
你是 SDDU 目录导航 Skill。你的核心能力是调用 `scripts/generate-tree.cjs` 脚本，
为指定 Feature 目录及父目录链生成/更新 TREE.md 导航文件。

**职责边界**：
- 负责：加载 Skill → 接收 --target 路径 → 调用脚本 → 解析 JSON 报告 → 输出摘要
- 不负责：不直接执行 find/head/grep（由脚本处理），不聚合多 Feature 产物（sddu-docs 职责）

**触发条件**：
- 自动触发：8 个主流程 Agent 完成后，通过 `## Skill 发现` 章节加载，传入当前 Feature 路径
- 手动触发：用户显式请求「更新 .sddu 目录导航」等

## 前置条件
- `.sddu/` 目录必须存在
- 需提供 `--target <Feature路径>` 参数（自动触发由 Agent 模板传入，手动触发由用户指定）

## 工作流

### 步骤 1：验证前置条件
检查 `.sddu/` 目录存在 → 不存在则输出「❌ .sddu/ 目录不存在，请先初始化 SDDU 工作空间」

### 步骤 2：调用 generate-tree 脚本
调用 `scripts/generate-tree.cjs`：
- **用途**：扫描指定 Feature 目录及父目录链，生成/更新各层级 TREE.md
- **入参**：`--target <当前 Feature 路径>`（必填，如 specs-tree-root/specs-tree-tree-skill/）
- **出参**：stdout JSON 变更报告（字段：created / updated / skipped / errors / stats）
- **Agent 行为**：执行 `node scripts/generate-tree.cjs --target <path>` → 捕获 stdout

### 步骤 3：解析报告并输出摘要
根据 JSON 报告的 created/updated/skipped 字段，输出人类可读摘要（如：已创建 1 个、已更新 1 个、跳过 1 个）

## 异常处理
| 场景 | 处理方式 |
|------|----------|
| `.sddu/` 目录不存在 | 输出 ❌ 提示，不抛异常 / 不中断主流程 |
| 脚本返回非零退出码 | 读取 stderr → 输出 ⚠️ 警告 + 错误信息 |
| 脚本 stdout 非合法 JSON | 输出 ⚠️ 提示：脚本异常，目录导航未更新 |
| --target 路径无效 | 由脚本 exit(1) 返回 → Agent 输出错误信息 |

## Skill 发现
需要发现或使用 SDDU Skill 时，读取 `.opencode/plugins/sddu/skills/sddu-skill-discovery/SKILL.md` 获取完整指引。

## 脚本
| 脚本 | 路径 | 用途 |
|------|------|------|
| generate-tree.cjs | scripts/generate-tree.cjs | 扫描指定 Feature 目录及父目录链，生成/更新各层级 TREE.md。入参 `--target <path>`，出参 stdout JSON。 |
```

#### 11.4.3 符合 sddu-skill-creator §3.3 脚本驱动模式

对照 creator §3.3 判断标准：

| §3.3 脚本化信号 | sddu-tree 是否满足 |
|------|:--:|
| 输出格式有严格约束 | ✅ TREE.md 有固定模板（目录树 + 文件说明表 + 子目录表） |
| 涉及精确计算、数据变换 | ✅ state.json 解析 + phase/status 映射 + diff 对比 |
| 纯文件操作 | ✅ find / head / grep / read / write——全部确定性操作 |
| 多轮迭代后被反复纠正 | ✅ TC-07 已暴露不同 Agent 间格式偏差风险（NFR-002） |

**结论**：sddu-tree 是 sddu-skill-creator §3.3 脚本化模式的**教科书级案例**。

Body 结构对照 creator §3.4「脚本驱动」模式：

| 模板要求 | v2.0 实现 |
|------|------|
| 概述 | ✅ §11.4.2 概述（角色/职责/触发/依赖） |
| 前置条件 | ✅ §11.4.2 步骤 1（.sddu/ 存在性 + --target 参数） |
| 调用 scripts/xxx 的步骤（入参/出参） | ✅ §11.4.2 步骤 2（用途/入参/出参三要素） |
| 结果处理 | ✅ §11.4.2 步骤 3（JSON 报告解析 + 摘要输出） |

### 11.5 Agent 模板完成协议修改

#### 11.5.1 变更内容

**当前文本**（7 个主流程 Agent + sddu-docs）：
```
完成后通过 `## Skill 发现` 章节加载 `sddu-tree` Skill，扫描并更新 `.sddu/` 目录导航。
```

**优化后文本**：
```
完成后通过 `## Skill 发现` 章节加载 `sddu-tree` Skill，传入当前 Feature 路径，定向更新该 Feature 的目录导航。
```

#### 11.5.2 涉及的 Agent 模板

| # | 模板文件 | 行号 | 当前文本关键差异 |
|:--:|------|:--:|------|
| 1 | `src/templates/agents/sddu-discovery.md.hbs` | L203 | 标准模式 |
| 2 | `src/templates/agents/sddu-spec.md.hbs` | L153 | 标准模式 |
| 3 | `src/templates/agents/sddu-plan.md.hbs` | L157 | 标准模式 |
| 4 | `src/templates/agents/sddu-tasks.md.hbs` | L127 | 标准模式 |
| 5 | `src/templates/agents/sddu-build.md.hbs` | L125 | 标准模式 |
| 6 | `src/templates/agents/sddu-review.md.hbs` | L125 | 标准模式 |
| 7 | `src/templates/agents/sddu-validate.md.hbs` | L190 | 标准模式 |
| 8 | `src/templates/agents/sddu-docs.md.hbs` | L398/402 | 两处引用：L398 为触发描述，L402 为具体调用，均需更新为定向扫描语义 |

#### 11.5.3 不变的部分

- `## Skill 发现` 章节本身**不变**（字段/结构/引用路径均不修改）
- `sddu-fast.md.hbs` L46 的文档性引用（「由 sddu-tree Skill 生成」）**不变**——仅为说明性文本
- `sddu.md.hbs` coordinator 模板**不变**——不涉及完成协议
- 修订记录中的历史引用**不变**

### 11.6 影响分析

#### 11.6.1 文件变更清单

| 操作 | 文件路径 | 说明 |
|:--:|------|------|
| **NEW** | `src/skills/sddu-tree/scripts/generate-tree.cjs` | 确定性脚本。核心逻辑：find 扫描 → head 提取简介 → 解析 state.json → 按固定模板生成 TREE.md → diff 检测变化 → 增量更新 → stdout JSON 报告。预估 150-200 行。 |
| **MODIFY** | `src/skills/sddu-tree/SKILL.md` | Body 从 223 行缩减到 ~50 行。移除 6 步工作流/状态标记规则/行为规则/异常处理细节（移入脚本），新增脚本调用三步（传参→执行→解析报告）。frontmatter 和概述保持。 |
| **MODIFY** | `src/templates/agents/sddu-discovery.md.hbs` | L203 完成协议：`扫描并更新 .sddu/ 目录导航` → `传入当前 Feature 路径，定向更新该 Feature 的目录导航` |
| **MODIFY** | `src/templates/agents/sddu-spec.md.hbs` | L153 完成协议：同上 |
| **MODIFY** | `src/templates/agents/sddu-plan.md.hbs` | L157 完成协议：同上 |
| **MODIFY** | `src/templates/agents/sddu-tasks.md.hbs` | L127 完成协议：同上 |
| **MODIFY** | `src/templates/agents/sddu-build.md.hbs` | L125 完成协议：同上 |
| **MODIFY** | `src/templates/agents/sddu-review.md.hbs` | L125 完成协议：同上 |
| **MODIFY** | `src/templates/agents/sddu-validate.md.hbs` | L190 完成协议：同上 |
| **MODIFY** | `src/templates/agents/sddu-docs.md.hbs` | L398/402 两处：同上语义调整 |

**影响统计**：共 **1 新建** + **10 修改** = **11 项文件变更**。

#### 11.6.2 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:--:|:--:|----------|
| **脚本执行失败导致 TREE 未更新**：`node scripts/generate-tree.cjs` 因 Node.js 不可用/脚本 bug/权限问题失败 | 🟡 中 | 🟡 中 | (1) SKILL.md v2.0 保留异常处理：脚本失败时 Agent 输出 ⚠️ 警告，不中断主流程；(2) 脚本内充分使用 try-catch + stderr 输出错误详情；(3) 脚本用纯 Node.js `fs`/`path`/`child_process` 模块，零 npm 依赖 |
| **存量 TREE.md 兼容性**：脚本生成的 TREE.md 格式与原 LLM 渲染的格式不兼容 | 🟢 低 | 🟡 中 | (1) 脚本首次运行时用 diff 检测现有 TREE.md，如格式差异仅限空白/缩进则标记为 skipped；(2) 如格式完全不兼容（极低概率），标记为 updated 并写入新格式；(3) 存量 TREE 的语义信息（目录结构/文件列表）不会丢失 |
| **7 个 Agent 模板完成协议遗漏修改**：sddu-docs.md.hbs 有两处引用，可能遗漏 L402 | 🟢 低 | 🟢 低 | (1) 在 build 阶段用 grep 全局校验所有「扫描并更新」→「定向更新」的替换完成度；(2) 8 个模板的变更项已在 §11.5.2 明确列出 |
| **sddu-fast / sddu-roadmap 等非主流程 Agent 误触发**：它们也有 `## Skill 发现` 章节但不需要目录导航 | 🟢 低 | 🟢 低 | (1) 当前 fast/roadmap 模板的完成协议不含「扫描并更新」触发语句；(2) 本次修改不影响它们 |

#### 11.6.3 向后兼容性

| 兼容维度 | 策略 |
|------|------|
| **存量 TREE.md** | 脚本对比实际目录 vs TREE.md 内容——与当前 LLM 模式相同的 diff 逻辑。格式变化仅限生成者（模板硬编码），目录结构和文件列表语义不变。存量 TREE.md 无需手动迁移。 |
| **存量 state.json** | `parseStateJson()` 读取 phase/status/suspended/merged/metadata 字段——与当前相同。兼容 v3.0.0 两字段模型及后续扩展字段（未知字段被忽略，不抛错）。 |
| **现有 TREE 格式** | 脚本内硬编码的 TREE 模板与 §11.2.4 一致，与当前 Skill body §4 模板对齐（目录简介 → 目录结构 → 文件说明表 → 子目录 → 上级目录五个模块）。 |
| **脚本失败降级** | 如脚本不可用（Node.js 缺失、文件未找到），Agent 输出 ⚠️ 警告并跳过 TREE 更新——不抛异常、不中断主流程。与当前 EC-004「Skill 未找到」的优雅降级策略一致。如需应急，Agent 可退化为手动执行 find/head/grep 命令（Skill body v2.0 保留核心操作概述，LLM 可自行重建）。 |

#### 11.6.4 设计决策记录

| 决策 | 选择 | 理由 |
|------|:--|------|
| 脚本语言 | Node.js `.cjs` | 零 npm 依赖，与项目 `scripts/package.cjs` 一致，`fs`/`path`/`child_process` 均为内置模块 |
| 脚本入参机制 | `--target <path>` CLI 参数 | 最简接口——Agent 只需一条 `node` 命令，无需 JSON 文件或环境变量 |
| 脚本出参格式 | stdout JSON | 最简解析——Agent 用 JSON.parse 即得结构化报告，无需临时文件 |
| 扫描范围推导 | 脚本内 `path.dirname()` 追溯父目录链 | 纯确定性计算——不依赖 Agent 额外传参，降低 Agent 端出错可能 |
| 是否保留全量扫描能力 | 否（`--target` 必填） | 全量扫描可由 Agent 传入 `.sddu/` 作为 target 实现，无需脚本内建两种模式 |
| SKILL.md body 规模 | ~50 行 | 概述(10) + 前置验证(5) + 脚本调用(15) + 异常处理(5) + Skill发现(2) + 脚本清单(5) + 修订(1) ≈ 43-50 行 |

---

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 spec.md v1.0（10 FR + 5 NFR + 8 EC）+ @sddu-tree Agent 模板全量审计（265 行）+ grep 审计 25 处引用 + opencode.json 注册条目确认。产出方案对比（3 方案）、推荐方案 A、15 项文件影响、5 项风险评估、ADR-001。 | 2026-07-19 | SDDU Plan Agent |
| v1.1 | README 项目约束审查修正：(1) SKILL.md 路径 `.sddu/skills/` → `src/skills/`（框架级 Skill 源码，经 build/package 分发）；(2) 移除 DELETE `.opencode/agents/sddu-tree.md`（编译产物，删源文件后 build 自动消失）；(3) MODIFY `opencode.json` → `src/adapters/opencode/templates/opencode.json.hbs`（注册源码）；(4) 移除 §5 中的 ADR-001.md（过程文档，非源码）；统计 15→14 项 | 2026-07-19 | SDDU Coordinator |
| v1.2 | §9 验证策略重写：复用现有 `e2e/scripts/basic/sddu-e2e.sh` 创建隔离测试项目，在测试项目中实际调用 opencode 执行 8 个 TC（TC-01~TC-08），不新增 e2e 脚本 | 2026-07-19 | SDDU Coordinator |
| v1.3 | **增量补充 §10「SKILL.md 技术实现设计」**：(1) sddu-skill-creator 借助策略——借助方法论和检查流程，手动写入框架级路径，核心关注 sddu-tree vs sddu-docs description 冲突检查；(2) SKILL.md 内部结构设计——Progressive Disclosure 三层映射 + 原 Agent 265 行到三层的逐章节映射表 + 篇幅硬约束 ≤300 行；(3) 质量保证策略——creator §4.2 七项检查清单 / creator §5 触发测试（含 sddu-docs 负样本）/ 六步覆盖率验证 / 五场景异常覆盖验证；(4) plan→tasks 职责边界声明。未新增/更新 ADR——本节为实现设计细节，不涉及架构决策变更。 | 2026-07-22 | SDDU Plan Agent |
| v1.4 | **增量补充 §11「优化设计：脚本化 + 定向扫描」**：(1) §11.1 问题分析——LLM 做确定性工作（6/6 步骤无需推理，token 浪费 + 格式不一致风险）+ 全量扫描 25+ 目录（无效扫描率 >88%）；(2) §11.2 脚本化设计——新建 `scripts/generate-tree.cjs`，`--target <path>` 入参 → stdout JSON 出参，6 步工作流全部移入脚本，TREE 模板硬编码，状态标记 `getStatusMark()` 函数化，100% 确定性执行；(3) §11.3 定向扫描设计——仅扫描当前 Feature + 父目录链（固定 3 目录），扫描量 ↓88%；(4) §11.4 SKILL.md 重写——body 从 223 行缩减到 ~50 行（↓74%），移除工作流/规则/异常细节，新增三步脚本调用（传参→执行→解析报告），符合 creator §3.3 脚本驱动模式；(5) §11.5 Agent 模板完成协议修改——8 个模板的「扫描并更新 .sddu/」→「传入当前 Feature 路径，定向更新」；(6) §11.6 影响分析——11 项文件变更，4 项风险评估 + 缓解，存量 TREE/state.json 向后兼容，脚本失败降级策略。未新增 ADR——本节为效率优化设计，不涉及架构决策变更。 | 2026-07-22 | SDDU Plan Agent |
