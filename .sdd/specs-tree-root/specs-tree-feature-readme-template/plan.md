# Feature README 模板生成器 - 技术规划

## 🏗️ 架构设计
此功能主要是文档生成，不需要复杂的后端架构。主要涉及文件创建和内容填充。

## 📁 目录结构
```
.specs/
├── README.md                    # 主目录导航
├── .templates/                  # 模板文件夹
│   ├── feature-README.md       # Feature README 模板
│   └── subfeature-README.md    # Sub-Feature README 模板
└── feature-readme-template/     # 本次功能目录
    ├── spec.md
    ├── plan.md
    ├── tasks.md
    └── .state.json
```

## 🛠️ 实现策略
1. 创建主 README 文件
2. 创建模板目录
3. 生成两个 README 模板文件
4. 更新状态信息

## 📊 数据模型
简单的文件操作，无需复杂数据模型。

## 🧪 测试方案
通过人工检查确保所有文件正确创建，内容准确。