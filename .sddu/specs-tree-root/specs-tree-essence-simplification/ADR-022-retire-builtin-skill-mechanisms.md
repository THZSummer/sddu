# ADR-022: 内置 Skill 机制退役（creator/discovery/sync）——框架聚焦 sddu 核心，非核心一律不提供（能力丢失排查 B1/B2/B3）

## 状态
PROPOSED（2026-11-24 用户拍板：B1/B2/B3 裁决 A——退役，同一 ADR 记录）

## 背景
能力丢失排查（capability-loss-audit.md 🟡B）发现三项同属「sddu 内置的 skill 机制」的框架级技能，在新设计中无对应物：

- **B1 sddu-skill-creator**（`src/skills/framework/sddu-skill-creator/`）：用户自定义 Skill 创建入口——对话式引导（三问引导触发/输入/输出 → description 候选 ×3 + 冲突检查 → Progressive Disclosure body 编写 ≤500 行 → 命名检查 → 可选触发测试）；产物 `.sddu/skills/<name>/SKILL.md`
- **B2 sddu-skill-discovery**（`SKILL.md` + `discover.cjs`）：Skill 清单管理——list/summary/path 三操作（扫描用户级 + 框架级目录）+ 冷启动协议（首次安装后提议同步）
- **B3 sddu-skill-sync**（`SKILL.md` + `sync.cjs`）：全量同步管线——两源扫描 → 实际目录探测（.opencode/.claude/.codex）→ 全量拷贝 → init → manifest 管辖 → 残留清理 → 第三方 protected 硬保护 → 备份回滚 → JSON 报告（默认 dry-run）

## 决策
**三项整体退役，不迁移、不换载体**。理由：

1. **新的设计不提供**——新范式下用户的扩展方式已收敛为唯一一条：`.sddu-config/` 钩子 + 契约覆盖（FR-008⑩⑪、ADR-011/012 已固化）。内置 skill 机制是旧范式的配套（skills 落平台目录 → 需发现 → 需同步 → 需创建入口），配套对象消失，机制随之失去存在前提；
2. **聚焦 sddu 核心内容**——「用户创建可触发的新 Skill」是 skill 生态运营能力，不是 spec-driven 方法论内核（四维判据 D：非流程必需）。框架级/逻辑级的存在只提供 7 阶段流程 + 状态模型 + 安装范式；
3. **非 sddu 核心的未来也不会再提供**——本 ADR 沉淀为长期原则：后续任何「框架内置生态运营类机制」（创建器/发现器/同步器/市场类）均不再进入本体。用户要新 skill，直接手写 SKILL.md 放 `.agents/skills/`（平台原生发现），那是平台生态的事，不是 sddu 的事。

## 与相邻裁决的关系

本 ADR 与既有三原则连成完整裁决矩阵：

| 维度 | 原则 | ADR |
|------|------|-----|
| 场景 | 场景特定能力不入框架 | ADR-015 |
| 平台 | 平台限定业务不入框架 | ADR-018 |
| **生态** | **非核心机制不提供、未来也不提供** | **本 ADR** |

## 对既有设计的修订
- 无 §5.1/§5.2 结构变更（三者均在 src/ 整目录 DELETE 伞形范围内；plan §4/FR-008 的「原框架级 skills ×4 移出 .sddu 转 FR-004 裁撤评估」中，4 项里 tree 已裁（ADR-010）、本 ADR 裁 3 项——**框架级 skills ×4 全部出清**，FR-004 对 skill 体系的评估结论就此闭环）。
- carrier-inventory（FR-004）产出时：skill 体系（框架级 4 + 用户级）归类直接引用本 ADR，不再逐项评估。

## 后果
- 正面：框架边界彻底清晰（只做方法论内核）；用户扩展路径唯一（钩子+契约）；消灭 manifest/同步/发现三层运维机制；FR-004 评估面缩小。
- 负面：用户失去「对话式创建 skill」的开箱体验——已判定可接受：手写 SKILL.md 是平台原生技能，平台生态文档已覆盖；sddu 不代劳。
- 不可逆性：低——如未来出现核心需要（如 v11 生态开放），属版本级重估，本 ADR 记录为长期默认原则。
