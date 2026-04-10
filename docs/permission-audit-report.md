# 🔒 SDDU Agent 权限配置审计报告

**审计日期**: 2026-04-09  
**审计范围**: 12 个 SDDU Agent 模板权限配置  
**审计依据**: 最小权限原则、角色职责分离、安全最佳实践

---

## 📋 1. 当前权限配置清单

### 1.1 权限配置总览

| Agent | 文件位置 | edit | bash | webfetch | 角色类型 |
|-------|----------|------|------|----------|----------|
| `sddu` | `sddu.md` | ❌ deny | ❌ deny | ❌ deny | 协调器 |
| `sddu-help` | `sddu-help.md` | ❌ deny | ❌ deny | ❌ deny | 帮助助手 |
| `sddu-discovery` | `sddu-discovery.md` | ⚠️ ask | ⚠️ ask | ✅ allow | 需求挖掘 |
| `sddu-0-discovery` | `sddu-0-discovery.md` | ⚠️ ask | ⚠️ ask | ✅ allow | 需求挖掘（别名） |
| `sddu-spec` | `sddu-spec.md` | ⚠️ ask | ⚠️ ask | ✅ allow | 规范编写 |
| `sddu-plan` | `sddu-plan.md` | ⚠️ ask | ✅ allow | ✅ allow | 技术规划 |
| `sddu-tasks` | `sddu-tasks.md` | ⚠️ ask | ✅ allow | ❌ deny | 任务分解 |
| `sddu-build` | `sddu-build.md` | ⚠️ ask | ⚠️ ask | ✅ allow | 代码实现 |
| `sddu-review` | `sddu-review.md` | ⚠️ ask | ✅ allow | ❌ deny | 代码审查 |
| `sddu-validate` | `sddu-validate.md` | ❌ deny | ✅ allow | ❌ deny | 验证专家 |
| `sddu-roadmap` | `sddu-roadmap.md` | ⚠️ ask | ✅ allow | ✅ allow | 路线图规划 |
| `sddu-docs` | `sddu-docs.md` | ⚠️ ask | ✅ allow | ❌ deny | 文档生成 |

### 1.2 权限统计

| 权限值 | edit | bash | webfetch |
|--------|------|------|----------|
| `deny` | 3 (25%) | 4 (33%) | 6 (50%) |
| `ask` | 8 (67%) | 4 (33%) | 2 (17%) |
| `allow` | 0 (0%) | 4 (33%) | 4 (33%) |

---

## ⚠️ 2. 问题分析

### 2.1 权限一致性问题

#### ❌ 问题 1: `bash` 权限配置不一致

**现象**: 实现类 Agent 的 `bash` 权限配置不统一

| Agent | 职责 | bash 权限 | 问题 |
|-------|------|----------|------|
| `sddu-build` | 代码实现 | `ask` | 需要执行测试命令 |
| `sddu-review` | 代码审查 | `allow` | 需要运行测试 |
| `sddu-plan` | 技术规划 | `allow` | 需要扫描项目 |
| `sddu-tasks` | 任务分解 | `allow` | 需要分析代码结构 |

**分析**: 
- `sddu-build` 需要运行测试、构建命令，但配置为 `ask`
- `sddu-review` 需要运行测试验证，配置为 `allow`
- 同为执行类 Agent，权限级别不一致

**风险**: 用户可能对 `sddu-build` 的权限请求感到困惑，为什么审查可以自动执行命令但实现需要确认。

---

#### ❌ 问题 2: `webfetch` 权限缺少明确标准

**现象**: Web 访问权限配置随意

| Agent | webfetch | 是否需要 web |
|-------|----------|-------------|
| `sddu-discovery` | `allow` | ✅ 可能需要竞品研究 |
| `sddu-spec` | `allow` | ✅ 可能需要 API 文档 |
| `sddu-plan` | `allow` | ✅ 需要技术调研 |
| `sddu-build` | `allow` | ✅ 可能需要查找示例 |
| `sddu-roadmap` | `allow` | ✅ 需要行业研究 |
| `sddu-tasks` | `deny` | ❌ 纯内部分析 |
| `sddu-review` | `deny` | ❌ 纯内部审查 |
| `sddu-validate` | `deny` | ❌ 纯内部验证 |
| `sddu-docs` | `deny` | ❌ 纯目录扫描 |

**分析**: 配置基本合理，但缺少明确的设计文档说明判定标准。

---

#### ⚠️ 问题 3: `edit` 权限全部使用 `ask` 或 `deny`

**现象**: 没有 Agent 配置为 `allow` edit

**分析**: 
- ✅ **这是正确的做法** - 符合最小权限原则
- ✅ 所有写操作都需要用户确认
- ⚠️ 但 `sddu-build` 作为主要代码实现 Agent，频繁的 `ask` 可能影响效率

**建议**: 考虑是否需要为 `sddu-build` 添加受信任模式（如通过环境变量配置）。

---

### 2.2 角色与权限匹配问题

#### ✅ 正确配置

| Agent | 职责 | 权限配置 | 评价 |
|-------|------|----------|------|
| `sddu` | 协调器 | deny all | ✅ 正确，只读路由 |
| `sddu-help` | 帮助 | deny all | ✅ 正确，只读查询 |
| `sddu-validate` | 验证 | deny edit + allow bash | ✅ 正确，验证不应修改代码 |

#### ⚠️ 需要讨论的配置

| Agent | 职责 | 权限配置 | 问题 |
|-------|------|----------|------|
| `sddu-build` | 代码实现 | ask/ask/allow | bash 为 ask 可能影响自动化 |
| `sddu-plan` | 技术规划 | ask/allow/allow | bash 为 allow 是否需要确认？ |

---

### 2.3 潜在安全风险

#### 🔴 高风险：`bash: allow` 的 Agent

以下 Agent 可**无需用户确认**执行任意 shell 命令：

1. `sddu-plan` - 技术规划
2. `sddu-tasks` - 任务分解
3. `sddu-review` - 代码审查
4. `sddu-validate` - 验证专家
5. `sddu-roadmap` - 路线图规划
6. `sddu-docs` - 文档生成

**风险场景**:
- 如果 Agent 被注入恶意 prompt，可能执行危险命令
- `sddu-plan` 和 `sddu-roadmap` 有 `webfetch: allow` + `bash: allow` 组合，可能下载并执行恶意内容

**建议**: 
- 重新评估 `bash: allow` 的必要性
- 考虑改为 `bash: ask` 对于非验证类 Agent
- 或添加命令白名单限制

---

#### 🟡 中风险：`webfetch: allow` 的 Agent

以下 Agent 可访问外部网络：

1. `sddu-discovery` / `sddu-0-discovery`
2. `sddu-spec`
3. `sddu-plan`
4. `sddu-build`
5. `sddu-roadmap`

**风险场景**:
- 可能泄露项目信息到外部 API
- 可能依赖不可靠的外部内容

**建议**: 目前是合理的（需要研究能力），但应记录在案。

---

## 📐 3. 权限设计原则建议

### 3.1 推荐权限模型

基于 Agent 角色类型，建议采用以下统一标准：

```yaml
# =====================
# 类型 A: 只读角色
# =====================
# 用于：协调器、帮助助手
# 特点：不修改任何内容，不执行命令
sddu:
  edit: deny
  bash: deny
  webfetch: deny

sddu-help:
  edit: deny
  bash: deny
  webfetch: deny

# =====================
# 类型 B: 研究/文档角色
# =====================
# 用于：需求挖掘、规范编写、路线图
# 特点：需要 web 研究，但谨慎执行命令
sddu-discovery:
  edit: ask      # 写需求文档需确认
  bash: ask      # 扫描项目需确认
  webfetch: allow # 需要竞品研究

sddu-spec:
  edit: ask      # 写规范需确认
  bash: ask      # 分析项目需确认
  webfetch: allow # 需要 API 文档

sddu-roadmap:
  edit: ask      # 写路线图需确认
  bash: ask      # 分析项目需确认
  webfetch: allow # 需要行业研究

# =====================
# 类型 C: 规划/分析角色
# =====================
# 用于：技术规划、任务分解
# 特点：需要深度分析项目结构
sddu-plan:
  edit: ask      # 写计划需确认
  bash: ask      # ⚠️ 建议改为 ask
  webfetch: allow # 需要技术调研

sddu-tasks:
  edit: ask      # 写任务需确认
  bash: ask      # ⚠️ 建议改为 ask
  webfetch: deny  # 纯内部分析

# =====================
# 类型 D: 实现角色
# =====================
# 用于：代码实现
# 特点：需要写代码和执行命令
sddu-build:
  edit: ask      # 写代码需确认（安全）
  bash: ask      # ⚠️ 建议改为 ask（一致）
  webfetch: allow # 可能需要查找示例

# =====================
# 类型 E: 审查/验证角色
# =====================
# 用于：代码审查、验证
# 特点：只读代码，但需要运行测试
sddu-review:
  edit: ask      # 写审查报告需确认
  bash: allow    # ✅ 需要运行测试（可接受）
  webfetch: deny  # 纯内部审查

sddu-validate:
  edit: deny     # ✅ 验证不应修改任何内容
  bash: allow    # ✅ 需要运行验证命令
  webfetch: deny  # 纯内部验证

# =====================
# 类型 F: 文档生成角色
# =====================
# 用于：目录导航生成
# 特点：扫描目录，生成文档
sddu-docs:
  edit: ask      # 写 README 需确认
  bash: allow    # ✅ 需要扫描目录
  webfetch: deny  # 纯内部操作
```

### 3.2 权限决策矩阵

| 角色类型 | edit | bash | webfetch | 理由 |
|----------|------|------|----------|------|
| 只读角色 | deny | deny | deny | 不涉及任何写操作或外部交互 |
| 研究角色 | ask | ask | allow | 需要 web 研究，命令执行需确认 |
| 规划角色 | ask | ask | allow/deny | 深度分析项目，命令需确认 |
| 实现角色 | ask | ask | allow | 写代码和构建都需确认 |
| 审查角色 | ask | allow | deny | 运行测试可自动，修改需确认 |
| 验证角色 | deny | allow | deny | 验证不应修改，但需运行命令 |
| 文档角色 | ask | allow | deny | 扫描目录可自动，写文档需确认 |

---

## 🔧 4. 改进建议

### 4.1 建议修改的 Agent

| Agent | 当前配置 | 建议配置 | 修改理由 |
|-------|----------|----------|----------|
| `sddu-plan` | ask/**allow**/allow | ask/**ask**/allow | bash 改为 ask，与其他规划类一致 |
| `sddu-tasks` | ask/**allow**/deny | ask/**ask**/deny | bash 改为 ask，与其他规划类一致 |
| `sddu-build` | ask/**ask**/allow | ask/**ask**/allow | ✅ 保持不变（已符合建议） |
| `sddu-review` | ask/**allow**/deny | ask/**allow**/deny | ✅ 保持不变（审查需运行测试） |
| `sddu-docs` | ask/**allow**/deny | ask/**allow**/deny | ✅ 保持不变（扫描需自动） |

### 4.2 修改优先级

| 优先级 | Agent | 修改内容 | 影响 |
|--------|-------|----------|------|
| 🔴 高 | `sddu-plan` | bash: allow → ask | 安全性提升，用户体验略降 |
| 🟡 中 | `sddu-tasks` | bash: allow → ask | 安全性提升，用户体验略降 |
| 🟢 低 | 所有 | 添加权限说明注释 | 提高可维护性 |

---

## 📝 5. 统一权限方案

### 5.1 最终推荐配置

```yaml
# 只读角色（协调、帮助）
- sddu:        { edit: deny, bash: deny, webfetch: deny }
- sddu-help:   { edit: deny, bash: deny, webfetch: deny }

# 研究角色（需要 web 研究）
- sddu-discovery: { edit: ask, bash: ask, webfetch: allow }
- sddu-spec:      { edit: ask, bash: ask, webfetch: allow }
- sddu-roadmap:   { edit: ask, bash: ask, webfetch: allow }

# 规划角色（分析项目结构）
- sddu-plan:  { edit: ask, bash: ask, webfetch: allow }  # ⚠️ 需修改
- sddu-tasks: { edit: ask, bash: ask, webfetch: deny }   # ⚠️ 需修改

# 实现角色（代码实现）
- sddu-build: { edit: ask, bash: ask, webfetch: allow }

# 审查角色（运行测试）
- sddu-review: { edit: ask, bash: allow, webfetch: deny }

# 验证角色（最终验证）
- sddu-validate: { edit: deny, bash: allow, webfetch: deny }

# 文档角色（目录扫描）
- sddu-docs: { edit: ask, bash: allow, webfetch: deny }
```

### 5.2 权限配置模板

建议在每个 Agent 模板的 frontmatter 中添加权限说明注释：

```yaml
---
description: ...
permission:
  edit: ask      # 需要用户确认：写文件到项目
  bash: ask      # 需要用户确认：执行 shell 命令
  webfetch: allow # 自动允许：访问外部 API 进行研究
  # 权限设计理由：
  # - edit: ask - 写规范文档需用户确认内容
  # - bash: ask - 扫描项目结构需用户确认
  # - webfetch: allow - 需要研究竞品和 API 文档
---
```

---

## 📊 6. 审计结论

### 6.1 整体评价

| 维度 | 评分 | 说明 |
|------|------|------|
| 最小权限原则 | ⭐⭐⭐⭐☆ | 大部分 Agent 遵循，但部分 bash 权限可收紧 |
| 角色分离 | ⭐⭐⭐⭐⭐ | 只读/实现/验证角色清晰分离 |
| 一致性 | ⭐⭐⭐☆☆ | 规划类 Agent 权限不统一 |
| 安全性 | ⭐⭐⭐⭐☆ | 无 allow edit，但 bash allow 较多 |
| 可维护性 | ⭐⭐⭐☆☆ | 缺少权限设计文档 |

### 6.2 必须修改项

1. **`sddu-plan`**: `bash: allow` → `bash: ask`
2. **`sddu-tasks`**: `bash: allow` → `bash: ask`

### 6.3 建议添加项

1. 在每个 Agent 模板中添加权限设计理由注释
2. 创建权限设计文档（本文件）
3. 定期（每季度）审查权限配置

---

## 📌 附录：Agent 角色分类

| 类型 | Agent | 核心职责 | 权限特征 |
|------|-------|----------|----------|
| 只读 | sddu, sddu-help | 路由、帮助 | deny all |
| 研究 | discovery, spec, roadmap | 需求、规范、规划 | ask/ask/allow |
| 规划 | plan, tasks | 技术计划、任务分解 | ask/ask/deny-or-allow |
| 实现 | build | 代码实现 | ask/ask/allow |
| 审查 | review | 代码审查 | ask/allow/deny |
| 验证 | validate | 最终验证 | deny/allow/deny |
| 文档 | docs | 导航生成 | ask/allow/deny |

---

**审计完成日期**: 2026-04-09  
**下次审查日期**: 2026-07-09  
**审计负责人**: SDDU Security Team
