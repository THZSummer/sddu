# ADR-008: 状态载体归 md——state.json 退役，文档即状态（front-matter 承载机器字段）

## 状态
PROPOSED（2026-11-24 用户拍板）

## 背景
「文档即状态」三原则之一要求状态是普通文件、git 可 diff、无数据库。但既有状态载体是 `state.json`（JSON）——机器友好、人类不友好：非技术成员（内容/产品团队）无法读改 JSON，AI 中途失败或换人接手时，状态成了唯一「代码味道」；企业侧则反向要求它能被强制校验（防 phase 字段漂移）。同一份状态，两类用户诉求相反。

## 决策
1. **`state.json` 整体退役**：状态载体统一为 `state.md`（Markdown），文档即状态彻底兑现。
2. **front-matter（YAML）承载机器字段**：`feature` / `featureId` / `name` / `version` / `phase` / `status` / `depth` / `childrens` / `phaseHistory` / `description` 等字段收进 md 头部 YAML，机器可解析、可校验（e2e 结构回归以 sddu.md 状态模型章节为权威断言枚举）。
3. **正文承载人类可读摘要**：当前阶段 / 下一步 / 负责人 / 更新时间 / 定稿标记等以普通 md 段落呈现，非技术成员可读可改。
4. **机器与人类同源**：一份 `state.md` 同时是机器字段源与人类可读源——不再是「json 权威 + md 副本」双份维护，而是单一文件。
5. **不考虑迁移成本**：产品尚未推广，存量 `state.json`（含 19 个数字 phase）直接转换或随 Feature 归档，不保留 json→md 的兼容迁移链（FR-007 相应改写）。

## 对既有设计的修订
- **ADR-005**：状态模型语义蒸馏进 sddu.md 不变；状态**数据**载体由 json 改为 md，字段契约改由 sddu.md 状态模型章节以 front-matter 形式定义。
- **spec FR-007**：从「数字 phase → 字符串 phase 迁移」改为「state.json → state.md 载体转换」（不计迁移成本）。
- **e2e 结构回归**：state 结构断言从「解析 json」改为「解析 md front-matter」，断言 phase/status 枚举与 sddu.md 一致。

## 后果
- 正面：文档即状态彻底兑现；非技术成员可读（消除唯一代码味道）；企业可校验（YAML front-matter 机器可解析）；单一文件无 json/md 双份漂移。
- 负面：失去 JSON 的结构化天然约束（缓解：front-matter YAML + e2e 结构断言；格式漂移即报错）；存量 json 需一次性转换。
- 不可逆性：低——front-matter 与 json 字段一一对应，如未来需要可无损回迁。
