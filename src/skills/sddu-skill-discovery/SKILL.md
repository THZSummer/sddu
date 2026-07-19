---
name: sddu-skill-discovery
description: "当 SDDU Agent 需要发现可用的 SDDU Skill 时加载此 Skill。描述如何扫描源目录、识别有效 SKILL.md、区分框架级（sddu-前缀）和用户级（无前缀）Skill。仅覆盖 SDDU 源目录扫描流程（流程①），不涉及 LLM Agent 原生发现机制。"
---

# sddu-skill-discovery

> **Skill 类型**：框架级（`sddu-` 前缀）
> **定位**：用 Skill 发现 Skill — SDDU Agent 发现 SDDU Skill 的统一入口
> **覆盖范围**：SDDU 源目录扫描流程（流程①），不涉及 LLM Agent 原生发现机制（流程②）

## 核心概念

### 两套发现流程（互不干扰）

| 流程 | 扫描路径 | 用途 | 本 Skill 覆盖？ |
|------|---------|------|:--:|
| **流程① — SDDU Agent 发现** | 扫描**源目录** | SDDU Agent 自己管理 Skill 清单，与 LLM Agent 类型解耦 | ✅ 覆盖 |
| **流程② — LLM Agent 原生发现** | 按 LLM Agent 工具原生逻辑（如 OpenCode 扫描 `.opencode/skills/`） | 用户手动 `@skill` 调用，LLM Agent 按语义匹配自动触发 | ❌ 不覆盖 |

### 源目录（SDDU 管辖，本 Skill 的扫描范围）

| 层级 | 路径 | 维护者 |
|------|------|--------|
| 用户级 Skills | `.sddu/skills/` | 用户手写、编辑、删除 |
| 框架级 Skills | `.opencode/plugins/sddu/skills/` | SDDU 框架，随插件分发 |

### 命名空间规则

- **`sddu-` 前缀**：框架级 Skill（如 `sddu-skill-creator`、`sddu-skill-sync`）
- **无前缀**：用户级 Skill（如 `payment-integration`、`db-migration`）
- 用户级 Skill **不应**使用 `sddu-` 前缀——该前缀为框架保留

## 三阶段渐进披露模型

本 Skill 采用三阶段渐进披露模型，确保 Agent 在 Skill 发现过程中最小化 context 消耗：

### Stage 1 — 目录扫描（默认执行，零成本）

**触发条件**：始终执行（Agent 会话启动时自动执行）

**动作**：使用文件系统工具（如 `ls`、`readdir`）扫描以下两个源目录，仅获取**目录名**列表，不读取任何文件内容：

- **用户级源目录**：`.sddu/skills/`
- **框架级源目录**：`.opencode/plugins/sddu/skills/`

**输出格式**：纯目录名列表，示例：

```
sddu-skill-discovery/
sddu-skill-creator/
sddu-skill-sync/
payment-integration/
db-migration/
```

**识别规则**：
- 只列出符合命名规范（`^[a-z0-9]+(-[a-z0-9]+)*$`）的子目录
- 不在此阶段判断目录是否包含有效的 `SKILL.md`（留给 Stage 2）
- 不读取任何文件内容

**成本**：~0 tokens（仅目录名，不读文件内容）

### Stage 2 — frontmatter 读取（按兴趣触发）

**触发条件**：Agent 根据当前任务语义，对 Stage 1 获得的目录名清单中的某个 Skill 产生兴趣时触发

**动作**：
1. 进入感兴趣的 Skill 目录
2. 验证该目录存在 `SKILL.md` 文件（不存在则标记为无效 Skill，从清单中移除）
3. 读取 `SKILL.md` 的 YAML frontmatter，解析以下两个必填字段：
   - `name`：Skill 名称（1-64 字符，`^[a-z0-9]+(-[a-z0-9]+)*$`）
   - `description`：Skill 描述（1-1024 字符，描述何时触发、做什么）

**输出**：每个感兴趣 Skill 的 name + description

**有效性判断**：
- 目录包含 `SKILL.md` 且 frontmatter 含 `name` 和 `description` → 有效 Skill
- 目录存在但无 `SKILL.md` → 忽略（不完整 Skill，不纳入可用清单）
- `SKILL.md` 存在但 frontmatter 缺失必填字段 → 标记为格式错误，不纳入可用清单

**命名空间判断**（基于 `name` 字段）：
- `name` 以 `sddu-` 开头 → 框架级 Skill
- `name` 不以 `sddu-` 开头 → 用户级 Skill

**成本**：~100 tokens/skill（仅 frontmatter 的 name + description）

### Stage 3 — 目录路径返回（按需加载）

**触发条件**：Agent 确定使用某个 Skill 时触发

**动作**：
1. 返回该 Skill 的**目录路径**（如 `.opencode/plugins/sddu/skills/sddu-skill-creator/`）
2. Agent 自行进入该目录，按需读取以下资源：
   - `SKILL.md` — 完整 Skill body
   - `references/` — 参考文档（如存在）
   - `scripts/` — 可执行脚本（如存在）
   - `assets/` — 静态资源（如存在）

**输出**：Skill 目录路径

**成本**：0（路径引用，不占 context）— Agent 后续按需读取的内容由 Agent 自行控制 context 消耗

## 可用 Skill 清单组织

完成三阶段扫描后，Agent 应维护如下结构的可用 Skill 清单（内部变量，不输出给用户）：

```yaml
framework_skills:                    # 框架级 Skill（sddu- 前缀）
  - name: sddu-skill-discovery
    description: "..."
    source: ".opencode/plugins/sddu/skills/sddu-skill-discovery/"
  - name: sddu-skill-creator
    description: "..."
    source: ".opencode/plugins/sddu/skills/sddu-skill-creator/"
  - name: sddu-skill-sync
    description: "..."
    source: ".opencode/plugins/sddu/skills/sddu-skill-sync/"

user_skills:                         # 用户级 Skill（无前缀）
  - name: payment-integration
    description: "..."
    source: ".sddu/skills/payment-integration/"

invalid_skills:                      # 无效 Skill（供诊断参考）
  - directory: "broken-skill"
    reason: "missing SKILL.md"
    source: ".sddu/skills/broken-skill/"
```

## 边界情况处理

| 场景 | 处理方式 |
|------|---------|
| 源目录不存在（如用户未创建 `.sddu/skills/`） | 跳过该源目录，不报错——继续扫描其他源目录 |
| Stage 2 发现 `SKILL.md` 格式错误（frontmatter 缺失必填字段） | 标记为无效 Skill，从可用清单中移除 |
| Stage 1 目录名不符合命名规范（如包含大写字母或特殊字符） | 排除该目录，不进入 Stage 2 |
| 用户级 Skill 使用了 `sddu-` 前缀命名 | 标记警告——该类 Skill 视为命名不规范的用户级 Skill，同步时可能被框架级版本覆盖 |
| 框架级 Skill 和用户级 Skill 非前缀部分重名 | 两个 Skill 均纳入可用清单——框架级优先规则由 `sddu-skill-sync` 在同步时执行，本 Skill 仅负责发现和报告 |
| 某个源目录下存在非 Skill 的子目录或文件 | 忽略非目录项。对子目录按 Stage 2 流程判断有效性 |

## 与 sddu-skill-sync 的关系

本 Skill（`sddu-skill-discovery`）只负责**扫描源目录发现 Skill**，不执行任何同步操作。

同步操作由框架级 Skill `sddu-skill-sync` 负责——将源目录的 Skill 同步到 LLM Agent 实际目录（如 `.opencode/skills/`），使 LLM Agent 原生机制可以加载这些 Skill。

当本 Skill 发现源目录中存在 `sddu-skill-sync` 而实际目录中缺少 SDDU Skill 时，Agent 应加载 `sddu-skill-sync` Skill 执行同步。

## 与 sddu-skill-creator 的关系

本 Skill（`sddu-skill-discovery`）负责**发现**已有 Skill，`sddu-skill-creator` 负责**创建**新 Skill。

当用户请求创建新 Skill 时，Agent 应：
1. 使用本 Skill 完成 Stage 1→2 扫描，获取已有 Skill 清单
2. 将清单传递给 `sddu-skill-creator`，供其做 description 交叉冲突检查
3. 新 Skill 创建后，重新执行 Stage 1→2 更新可用清单

## 自举闭环中的地位

本 Skill 是 SDDU Skill 自举闭环的三元之一：

```
sddu-skill-discovery ──→ 告诉 Agent 如何发现 Skill（本 Skill）
sddu-skill-creator   ──→ 告诉 Agent 如何创建 Skill
sddu-skill-sync      ──→ 告诉 Agent 如何同步 Skill

三者共同实现：「用 Skill 发现 Skill + 用 Skill 创建 Skill + 用 Skill 同步 Skill」
```

## 修订记录

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 spec FR-025 和 plan ADR-004 创建三阶段渐进披露模型 | 2026-07-19 | SDDU Build Agent |
