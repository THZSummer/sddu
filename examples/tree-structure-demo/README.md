# SDDU 树结构演示项目

这是一个用于说明 SDDU 树结构功能的完整演示项目，展示了层级嵌套、父子特征和其他关键概念。

## 项目架构

```
examples/tree-structure-demo/
├── specs-tree-ecommerce-platform/        # 父特征（depth 0, 轻量化）
│   ├── discovery.md
│   ├── spec.md  
│   ├── README.md
│   └── state.json
│   ├── specs-tree-frontend/             # 子特征（depth 1, 完整叶子）
│   │   ├── discovery.md
│   │   ├── spec.md
│   │   ├── plan.md
│   │   ├── tasks.md
│   │   ├── build.md  
│   │   ├── review.md
│   │   ├── validate.md
│   │   └── state.json
│   └── specs-tree-backend/              # 父特征（depth 1, 也作为父级）
│       ├── discovery.md
│       ├── spec.md
│       ├── README.md
│       └── state.json
│       ├── specs-tree-api/              # 孙特征（depth 2, 叶子）
│       │   ├── discovery.md
│       │   ├── spec.md
│       │   ├── plan.md
│       │   ├── tasks.md
│       │   ├── build.md
│       │   ├── review.md
│       │   ├── validate.md
│       │   └── state.json
│       └── specs-tree-database/         # 孙特征（depth 2, 叶子） 
│           ├── discovery.md
│           ├── spec.md
│           ├── plan.md
│           ├── tasks.md
│           ├── build.md
│           ├── review.md
│           ├── validate.md
│           └── state.json
└── README.md
```

## 说明

该项目展示了 SDDU 功能的三个层次嵌套，其中：

- `ecommerce-platform` 作为根父特征(轻量级)
- `frontend` 作为完整实现的叶子特征  
- `backend` 本身是父特征但同时也是另一个层级的根
- `api` 和 `database` 作为叶子特征服务于 `backend`

这种结构演示了在大型软件项目中，如何使用 SDDU 的树形结构来管理复杂的多模块架构。