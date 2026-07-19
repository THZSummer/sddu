---
name: sddu-skill-creator
description: "当用户需要创建新的 SDDU Skill（用户级或框架级）时加载。对话式引导工作流：确定 Skill 用途 → 撰写 description（触发语义优化，避免重叠）→ 编写 body（Progressive Disclosure 指导）→ 输出 SKILL.md 到正确路径 → 可选触发测试。产出符合 OpenCode/Anthropic 规范的 SKILL.md，支持用户级和框架级两种产出路径。"
---

# sddu-skill-creator

对话式引导用户创建符合规范的 SDDU Skill。本 Skill 既可用于创建**用户级 Skill**（直接产出 `.sddu/skills/<name>/SKILL.md`），也可用于创建**框架级 Skill 初稿**（产出后需走 SDDU 完整流程审查方可正式发布）。

---

## 1. 确定 Skill 用途

引导用户回答两个核心问题：

1. **这个 Skill 做什么**：描述 Skill 的职责和核心能力。用 3-5 句话说明——当 Agent 加载这个 Skill 后，它能帮用户完成什么任务。

2. **什么时候触发**：描述用户会说什么话、问什么问题、执行什么任务时，Agent 应该自动加载这个 Skill。这是 description 字段的核心输入。

**引导话术示例**：
> "先说这个 Skill 做什么——比如'帮我在项目中快速接入第三方支付 SDK'。再说什么时候触发——比如'用户说：我想接入支付宝'、'帮我加一个微信支付'这类需求。"

如果用户无法清晰回答，引导其先通过一个具体的使用场景反推 Skill 的用途。

---

## 2. 撰写 description

`description` 是 Skill 的**触发钥匙**——LLM Agent 根据它来判定是否加载你的 Skill。一个好的 description 能显著提高触发准确率。

### 2.1 撰写规则

| 规则 | 说明 |
|------|------|
| **用自然语言** | 写完整的 1-2 句自然语言，不要堆砌关键词。Agent 理解语义而非关键词匹配。 |
| **覆盖关键触发场景** | 列举用户可能的表达方式——命令式（"帮我接入支付"）、疑问式（"怎么接入支付宝？"）、任务式（"我要做支付集成"）。 |
| **避免与已有 Skill 重叠** | 检查已有的框架级 Skill（`sddu-skill-*`）和用户级 Skill 的 description，确保措辞有足够的区分度。重叠会导致 Agent 误触发错误的 Skill。 |
| **长度 ≤ 1024 字符** | OpenCode/Anthropic 规范要求 description 不超过 1024 字符。 |
| **YAML frontmatter 安全** | 若 description 含特殊字符（`:`、`{`、`}`、`[`、`]`、`"`），用双引号包裹整个内容。 |

### 2.2 生成候选方案

根据用户在第 1 步描述的「做什么 + 触发场景」，提供 **2-3 个候选 description**，每个从不同角度切入：

- **候选 A（动作导向）**：强调用户的行为意图——"当用户需要接入支付渠道、配置支付 SDK 或集成第三方支付时…"
- **候选 B（场景导向）**：强调问题的特征——"当用户提到支付宝、微信支付、银联等支付渠道的接入、配置或集成时…"
- **候选 C（混合导向）**：结合动作和场景——"当用户需要集成支付能力（支付宝/微信支付/银联等），包括 SDK 配置、回调处理和测试验证时…"

请用户选择最贴合使用场景的一个，或基于候选做调整。**建议用户用真实场景做口头测试**——说出几个典型触发语句，看 description 是否能正确匹配。

### 2.3 冲突检查

在用户选定 description 后，**列出可能产生冲突的已有 Skill**（框架级 + 用户级）。列出其 `name` 和 `description`，标注重叠风险等级（🟢 低 / 🟡 中 / 🔴 高）。若存在高风险重叠，建议用户调整措辞。

---

## 3. 编写 body

Skill body 是 Agent 加载 Skill 后获取的完整指令。遵循 **Progressive Disclosure** 原则组织内容。

### 3.1 结构原则：三层信息模型

```
┌─ Metadata（~100 words）──────────────────────────┐
│  name + description（frontmatter）                │
│  ▶ Agent 首先看到的摘要信息                        │
├─ Body（核心指令，on trigger 加载）─────────────────┤
│  详细的执行流程、规则、检查清单、示例               │
│  ▶ Agent 加载 Skill 后获得完整上下文               │
├─ References（按需引用）─────────────────────────────┤
│  scripts/、references/、assets/ 中的辅助资源        │
│  ▶ Agent 按需进入子目录读取                        │
└──────────────────────────────────────────────────┘
```

### 3.2 编写要点

| 要点 | 说明 |
|------|------|
| **开门见山** | 第一段直接说明本 Skill 的用途和适用场景，不用长篇背景介绍。 |
| **分步清晰** | 将执行流程拆解为编号步骤——Agent 更容易按顺序执行。 |
| **提供检查清单** | 用 `- [ ]` 格式列出关键验收点，Agent 可以自检。 |
| **举例说明** | 对复杂步骤给出输入/输出示例——Agent 理解示例比理解抽象描述更准确。 |
| **标注边界** | 明确说明「本 Skill 不做什么」——避免 Agent 越界执行。 |
| **引用子资源** | 若需要脚本或参考文档，用相对路径引用（`references/api-doc.md`、`scripts/verify.sh`）。 |
| **≤ 500 行** | body 总行数控制在 500 行以内（NFR-006）。超过时建议拆分为多个协作 Skill。 |

### 3.3 常见模式

| Skill 类型 | Body 典型结构 |
|-----------|-------------|
| **流程指引**（如 bug-fix-workflow） | 概述 → 步骤 1-N（每步含输入/操作/输出/检查清单）→ 完成验证 |
| **检查清单**（如 deploy-checklist） | 概述 → 分类检查项（安全/性能/兼容性）→ 通过标准 |
| **知识注入**（如 coding-standards） | 概述 → 规则列表（Do/Don't 对照）→ 示例 |
| **工具集成**（如 payment-integration） | 概述 → 前置条件 → SDK 安装 → 配置 → 回调处理 → 测试 |

---

## 4. 输出 SKILL.md

### 4.1 路径规则

| 层级 | 目标路径 | 适用场景 |
|------|---------|---------|
| **用户级 Skill** | `.sddu/skills/<skill-name>/SKILL.md` | 项目特有业务流程、团队规范、个人工具 |
| **框架级 Skill 初稿** | `src/skills/<skill-name>/SKILL.md`（SDDU 仓库内） | 拟作为 SDDU 框架内置能力的 Skill |

### 4.2 产出检查清单

在输出 SKILL.md 之前，逐项确认：

- [ ] `name` 字段符合 `^[a-z0-9]+(-[a-z0-9]+)*$`（小写字母/数字/连字符）
- [ ] `name` 字段 1-64 字符
- [ ] `description` 字段 ≤ 1024 字符，使用自然语言
- [ ] body 不超过 500 行
- [ ] body 不含敏感信息（密钥、内部 URL、个人信息）
- [ ] 引用的 `scripts/`、`references/`、`assets/` 文件路径有效
- [ ] YAML frontmatter 格式正确（无缩进错误、特殊字符已转义）

### 4.3 输出后的用户指引

- **用户级 Skill**：告知用户可立即使用——通过 `sddu-skill-sync` 同步到实际目录（`@sddu 同步 SDDU Skills`），或直接触发 Skill 测试（说出触发场景描述语句）。
- **框架级 Skill 初稿**：告知用户——初稿完成后需走 SDDU 完整流程（discovery → spec → plan → build → review → validate）才能正式发布。初稿阶段仅作为参考草案。

---

## 5. 触发测试（可选，推荐）

对用户级 Skill，建议进行快速触发测试，验证 description 的触发准确率。

### 5.1 测试方法

提供 **3-5 个测试场景描述**——模拟用户可能说的不同措辞，覆盖：

| 场景类型 | 示例 |
|---------|------|
| **直接命令** | 用最直接的措辞表达任务意图 |
| **疑问句式** | 用"怎么…""如何…"开头的提问 |
| **模糊表达** | 用不精确但语义相近的措辞 |
| **混合上下文** | 含其他无关内容的长文本，但核心语义指向 Skill |
| **相近但无关** | 语义相近但不应触发 Skill 的场景（负样本） |

### 5.2 结果分析

对每个测试场景，观察 Agent 是否加载了该 Skill。若未触发，分析 description 的不足之处：

- **description 太宽泛** → 缩小场景范围，增加具体关键词
- **description 太狭窄** → 扩展触发场景覆盖
- **与已有 Skill 重叠** → 增加区分度措辞

根据测试结果调整 description 后，**建议保留测试报告**（作为 Skill 目录下的 `references/trigger-test-report.md`），方便后续维护。

---

## 6. 命名检查规则

在产出 SKILL.md 前，**必须执行命名检查**：

1. **检查 `sddu-` 前缀**：若用户输入的 name 以 `sddu-` 开头，**立即警告**——`sddu-` 是 SDK 框架的保留前缀，用户级 Skill 不得使用。建议改用其他前缀或无前缀命名。

2. **检查命名规范**：name 必须符合 `^[a-z0-9]+(-[a-z0-9]+)*$`：
   - 全部小写字母、数字、连字符
   - 不以连字符开头或结尾
   - 不含连续连字符（`--`）
   - 不含空格、下划线、大写字母、特殊字符

3. **检查与已有 Skill 重名**：扫描 `.sddu/skills/`（用户级源目录）和 `.opencode/plugins/sddu/skills/`（框架级源目录），确认 name 不与已有 Skill 冲突。

---

## 7. 自举闭环说明

`sddu-skill-creator` 本身是框架级 Skill，属于 SDDU 三元自举闭环的一环：

```
┌─────────────────────────────────────────────────┐
│           SDDU Skill 三元自举闭环                  │
│                                                   │
│  sddu-skill-discovery  → 告诉 Agent 如何发现 Skill │
│  sddu-skill-creator    → 告诉 Agent 如何创建 Skill │
│  sddu-skill-sync       → 告诉 Agent 如何同步 Skill │
│                                                   │
│  「用 Skill 发现 + 用 Skill 创建 + 用 Skill 同步」   │
└─────────────────────────────────────────────────┘
```

**两种产出路径**：

| 路径 | 产出目标 | 质量把关 | 发布方式 |
|------|---------|---------|---------|
| **用户级 Skill** | `.sddu/skills/<name>/SKILL.md` | 用户自行负责 | 通过 `sddu-skill-sync` 同步到实际目录 |
| **框架级 Skill 初稿** | `src/skills/<name>/SKILL.md` | 需走 SDDU 完整流程 | discovery → spec → plan → build → review → validate → 随插件分发 |

> **注意**：framework-level skills 正式发布后，其 `description` 会更新以避免与新框架级 Skill 冲突。用户可放心创建用户级 Skill，不受框架发布节奏影响。

---

## 8. 快速参考卡

### 合法 SKILL.md 最小示例

```markdown
---
name: my-payment-integration
description: "当用户需要接入第三方支付渠道（支付宝、微信支付等），包括 SDK 安装、配置、回调处理和沙箱测试时加载。"
---

# my-payment-integration

## 用途
帮助用户在项目中快速接入第三方支付 SDK。

## 执行流程
1. 确认支付渠道（支付宝 / 微信支付 / 银联）
2. 安装对应 SDK
3. 配置商户信息和回调 URL
4. 实现支付回调处理
5. 执行沙箱测试

## 检查清单
- [ ] SDK 安装成功
- [ ] 商户配置有效
- [ ] 回调 URL 可访问
- [ ] 沙箱测试全部通过
```

### Frontmatter 字段速查

| 字段 | 必填 | 约束 |
|------|:--:|------|
| `name` | ✅ | 1-64 字符，`^[a-z0-9]+(-[a-z0-9]+)*$` |
| `description` | ✅ | 1-1024 字符，自然语言 |
| `license` | ❌ | 可选 |
| `compatibility` | ❌ | 可选，OpenCode 扩展字段 |
| `metadata` | ❌ | 可选，OpenCode 扩展字段 |

### Body 规模速查

| 约束 | 值 |
|------|:--:|
| 推荐最大行数 | ≤ 500 |
| 超过 500 行 | 建议拆分为多个协作 Skill |
| Metadata 区 | ~100 words |
| 引用子目录 | `scripts/`、`references/`、`assets/` |
