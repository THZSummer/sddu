# 快速迁移到 SDDU

## 什么是 SDDU？

SDDU (Specification-Driven Development Ultimate) 是 SDD (Specification-Driven Development) 的升级版本：
- ✅ 保持完全向后兼容
- ✅ 新增 discovery 阶段 (阶段 0) 
- ✅ 支持 `@sddu-*` 新命令 (推荐新项目使用)
- ✅ 持续支持 `@sdd-*` 旧命令 (现有项目无影响)

## 是否需要迁移我的项目？

### 如果您是现有 SDD 用户
- **无需操作**：您的现有项目将继续正常工作
- **无中断**：所有 `@sdd-*` 命令保持 100% 兼容
- **可选升级**：随时可以开始使用新功能

### 如果您是新用户
- **推荐使用 SDDU**：使用 `@sddu-*` 命令和新功能
- **立即受益**：利用新发现阶段和改进的工作流

## 如何使用新的 SDDU 功能？

### 新命令对照
| 旧命令 (SDD) | 新命令 (SDDU) | 说明 |
|--------------|---------------|------|
| `@sdd 开始 [项目]` | `@sddu 开始 [项目]` | 推荐新项目使用 |
| `@sdd-discovery` | `@sddu-discovery` | 需求挖掘，SDDU 新增 |
| `@sdd-spec` | `@sddu-spec` | 推荐 |
| `@sdd-plan` | `@sddu-plan` | 推荐 |
| ..., | ... | 所有命令均提供 sddu- 对应版本 |

## 立即试用 SDDU

在您的项目中尝试新的 discovery 阶段：
```bash
@sddu-discovery "我想要构建一个登录注册功能"
```

## 需要更多详情?

阅读完整文档:
- 《迁移指南》(migration-guide.md) - 详细了解迁移过程
- 《SDDU 功能说明》- 探索所有新功能
- 《常见问题》(faq.md) - 疑难解答