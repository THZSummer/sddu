# Directory: specs-tree-tree-structure-optimization-v2/decisions/

## 目录简介
树形结构优化 v2 架构决策记录 (ADR) 集合，记录 v2 问题修复过程中的关键技术决策。

## 目录结构
```
decisions/
├── README.md              # 本文件 - 目录导航
├── ADR-V2-001.md          # State Schema 验证策略（运行时验证 vs 创建时验证）
├── ADR-V2-002.md          # 缺失字段处理策略（自动填充 vs 报错拒绝）
├── ADR-V2-003.md          # 拆分建议触发规则（基于规则 vs 基于 AI 判断）
├── ADR-V2-004.md          # 树形测试场景实现方式（脚本生成 vs 手动创建）
└── ADR-V2-005.md          # 历史 state.json 兼容性处理（保持兼容 vs 强制迁移）
```

## 文件说明
| 文件 | 说明 | 状态 |
|------|------|------|
| ADR-V2-001.md | State Schema 验证策略 - 运行时验证 vs 创建时验证 | ✅ PROPOSED |
| ADR-V2-002.md | 缺失字段处理策略 - 自动填充 vs 报错拒绝 | ✅ PROPOSED |
| ADR-V2-003.md | 拆分建议触发规则 - 基于规则 vs 基于 AI 判断 | ✅ PROPOSED |
| ADR-V2-004.md | 树形测试场景实现方式 - 脚本生成 vs 手动创建 | ✅ PROPOSED |
| ADR-V2-005.md | 历史 state.json 兼容性处理 - 保持兼容 vs 强制迁移 | ✅ PROPOSED |

## ADR 概览
当前收录 5 个架构决策记录 (ADR-V2-001 ~ ADR-V2-005)，涵盖：
- State Schema 验证策略
- 缺失字段处理策略
- 拆分建议触发规则
- 树形测试场景实现方式
- 历史 state.json 兼容性处理

## 上级目录
- [返回上级](../README.md)
- [返回规范目录](../../README.md)
- [返回首页](../../../README.md)
