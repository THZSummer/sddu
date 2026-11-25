---
feature: v3.03.0-early-skill-system
name: SDDU Skill 系统（双重定位：用户级 + 框架级）
version: v3.03.0-early
phase: validated
status: completed
depth: 0
childrens: []
phaseHistory:
dependencies: []
description: "双重定位：(1) 用户级 Skills — 利用 OpenCode 原生 skill 机制，为 SDDU 用户提供项目级业务知识沉淀能力；(2) 框架级 Skills — SDDU 框架自身的轻量化扩展机制，替代部分「新增 Agent」需求。引入三元自举闭环（sddu-skill-discovery + sddu-skill-creator + sddu-skill-sync）。Spec v2.3.1 落地同步机制重构——sync 从 install.sh 全量拷贝改为 sddu-skill-sync Skill 按需同步（用户最终设计决策）。28 FR / 8 NFR / 10 EC / 15 OP。Plan v2.0 重写 ADR-002（sync 机制），更新 3 个 ADR，方案对比 4 维，文件影响 NEW 7 / MODIFY 17 / DELETE 0。"
---

# SDDU Skill 系统（双重定位：用户级 + 框架级）

当前阶段：**validated** · 状态：**completed**

双重定位：(1) 用户级 Skills — 利用 OpenCode 原生 skill 机制，为 SDDU 用户提供项目级业务知识沉淀能力；(2) 框架级 Skills — SDDU 框架自身的轻量化扩展机制，替代部分「新增 Agent」需求。引入三元自举闭环（sddu-skill-discovery + sddu-skill-creator + sddu-skill-sync）。Spec v2.3.1 落地同步机制重构——sync 从 install.sh 全量拷贝改为 sddu-skill-sync Skill 按需同步（用户最终设计决策）。28 FR / 8 NFR / 10 EC / 15 OP。Plan v2.0 重写 ADR-002（sync 机制），更新 3 个 ADR，方案对比 4 维，文件影响 NEW 7 / MODIFY 17 / DELETE 0。
