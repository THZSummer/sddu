# Directory: .sddu/specs-tree-root/architecture/

## 目录简介
SDDU 架构决策记录目录，存放系统架构相关的技术决策文档 (ADR - Architecture Decision Record)。

## 目录结构
```
architecture/
├── README.md                          # 本文件 - 目录导航
└── adr/                               # 架构决策记录子目录
    ├── README.md                      # ADR 目录导航
    ├── ADR-001.md ~ ADR-017.md        # 主 ADR 集合 (17 篇)
    └── ... (另见子 Feature 目录中的 ADR-018/019/020, ADR-V2-001~005)
```

## 子目录
| 目录 | 说明 |
|------|------|
| adr/ | 架构决策记录 (ADR) 文档集合，包含 ADR-001 至 ADR-017 |

## 文件说明
| 文件 | 说明 | 状态 |
|------|------|------|
| README.md | 本目录导航文件 | ✅ 存在 |

## 架构决策概览
当前主 adr/ 目录收录 17 个架构决策记录 (ADR-001 ~ ADR-017)，涵盖：
- 分布式状态存储架构
- 状态管理策略
- 目录结构规范
- 工具系统设计
- 其他关键技术决策

此外，以下子 Feature 目录中还有独立 ADR：
| 位置 | ADR | 说明 |
|------|-----|------|
| `specs-tree-agent-output-templating/decisions/` | ADR-018, ADR-019 | Agent 输出模板化相关决策 |
| `specs-tree-sddu-status-enhancement/` | ADR-020 | 两字段隔离模型 (Phase + Status) |
| `specs-tree-tree-structure-optimization-v2/decisions/` | ADR-V2-001 ~ V2-005 | 树形结构优化 v2 相关决策 |

详细内容请查看 [adr/](./adr/README.md) 子目录及各 Feature 目录。

## 上级目录
- [返回上级](../README.md)
- [返回首页](../../README.md)
