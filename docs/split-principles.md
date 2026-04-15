# SDDU Feature 拆分原则

本文档指导 SDDU 用户何时拆分、如何拆分以及拆分到什么粒度。

## 1. 拆分时机判断

决定是否应当拆分一个较大的 Feature：

### 业务层面
- **需求包含多个独立模块**：当一个 Feature 需要涵盖多个可以独立开发、独立使用的功能模块时
- **前后端分离架构**：若系统包含明显的前端界面部分和后端逻辑部分
- **多端架构模式**：如需同时支持 iOS、Android、Web 等多个平台
- **多用户角色管理**：如管理后台 + 普通用户端的组合

### 技术层面
- 职责单一原则被违反（单个 Feature 实现过于复杂的业务逻辑）
- 明显可以按照领域进行隔离的业务组件
- 依赖关系复杂的大型功能模块

## 2. 拆分粒度建议

### 过细拆分的反面例子
- `user-login-page-button`, `user-login-form-field`（单个 UI 组件）
- `api-get-user-by-id-async-wrapper`（单个抽象函数）

### 合适的拆分粒度
- **单一职责**：一个 Feature 对应一个完整的用户故事或用户功能
- **自治性**：单个 Feature 应该可以独立开发、测试和部署
- **聚合性**：Related functionality grouped together, but not too big

## 3. 父子关系定义规则

### 父级 Feature（Parent）
- **职责**：扮演协调和统筹角色，不包含具体的实现代码
- **特点**：
  - 通常只包含需求文档（discovery.md, spec.md）和项目管理文档（README.md）
  - `state.json` 中包含 `childrens` 数组，引用子 Feature
  - 不走完整的 6 阶段实现流程
  - 深度(depth)较低

### 叶子 Feature（Leaf）
- **职责**：承担具体的开发实现工作
- **特点**：  
  - 走完整的 6 阶段工作流（discovery ~ validate）
  - 包含完整的 6 个阶段文档
  - 实现具体业务逻辑
  - 在父级的 `childrens` 数组中被引用

## 4. 常见拆分模式

### 4.1 前后端分离
```
parent-ecommerce/
├── discovery.md
├── spec.md  
├── state.json (depth=0)
└── specs-tree-frontend/        # 叶子 Feature
    ├── ...完整的 6 阶段...
    └── state.json (depth=1) 
└── specs-tree-backend/         # 叶子 Feature  
    ├── ...完整的 6 阶段...
    └── state.json (depth=1)
```

### 4.2 多端架构
```
parent-mobile-app/
├── spec.md
├── state.json (depth=0)
└── specs-tree-ios/            # 叶子 Feature
    ├── ...完整的 6 阶段...
    └── state.json (depth=1)
└── specs-tree-android/        # 叶子 Feature
    ├── ...完整的 6 阶段...
    └── state.json (depth=1)
└── specs-tree-web/            # 叶子 Feature
    ├── ...完整的 6 阶段...
    └── state.json (depth=1)
```

### 4.3 微服务架构
```
parent-ecommerce-platform/
├── state.json
└── specs-tree-auth/           # 叶子 Feature
    ├── ...完整的 6 阶段...
└── specs-tree-order/          # 叶子 Feature  
    ├── ...完整的 6 阶段...
└── specs-tree-payment/        # 叶子 Feature
    ├── ...完整的 6 阶段...
```

### 4.4 管理后台+用户端
```
parent-content-system/
├── state.json
└── specs-tree-admin/          # 管理端 Feature
    ├── ...完整的 6 阶段...  
└── specs-tree-user-app/       # 用户端 Feature
    ├── ...完整的 6 阶段...
```

## 5. 拆分示例

### 示例1: 电商平台拆分实例

用户需求：创建一个完整的电商平台，包含前端界面、后端 API、管理后台等。

#### 拆分方案：
- **specs-tree-ecommerce-platform** (父级)
- **└── specs-tree-user-frontend** (叶子) - 用户端前端界面
- **└── specs-tree-admin-portal** (叶子) - 管理后台界面  
- **└── specs-tree-server-backend** (叶子) - 服务器后端 API
- **└── specs-tree-database-management** (叶子) - 数据库管理

#### 说明：
父级不包含具体实现，仅用于协调子项目进度；各个子项目各自独立完成从需求到实现的完整工作流。

### 示例2: 博客系统拆分实例

用户需求：创建一个功能完整的博客系统。

#### 拆分方案：
- **specs-tree-blog-system** (父级)
- **└── specs-tree-fe-reader** (叶子) - 读者端前端
- **└── specs-tree-fe-writer** (叶子) - 作者端前端  
- **└── specs-tree-apis** (叶子) - 内容管理接口
- **└── specs-tree-analytics** (叶子) - 数据统计功能

#### 说明：
按功能使用者拆分，让每组团队专注特定用户群体的需求。

## 6. 注意事项

1. **依赖管理**：拆分后需要明确定义各 Feature 间的依赖关系
2. **边界清晰**：各 Feature 职责边界要清晰，避免功能重叠
3. **团队协作**：不同团队可以并行开发不同的叶子 Feature
4. **版本一致性**：确保相关联 Feature 间的版本兼容性

---

*文档版本: v0.1*  
*更新日期: 2026-04-15*