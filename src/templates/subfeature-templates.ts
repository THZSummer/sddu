import * as path from 'path';

export interface SubFeatureTemplate {
  id: string;
  name: string;
  description?: string;
  assignee?: string;
  dependencies?: string[]; // 依赖的其他子 Feature ID
}

export interface FeatureTemplate {
  featureName: string;
  featureId: string;
  description?: string;
  subFeatures?: SubFeatureTemplate[];
}

/**
 * 生成主 spec.md 模板
 * 包含主 Feature 概述信息和子 Feature 索引表
 */
export function generateMainSpec(template: FeatureTemplate): string {
  const subFeaturesTable = template.subFeatures && template.subFeatures.length > 0 
    ? `## 子 Feature 索引

| 子 Feature ID | 子 Feature 名称 | 目录路径 | 状态 | 负责人 | 阻塞依赖 |
|---------------|-----------------|----------|------|--------|----------|
${template.subFeatures.map(sf => `| ${sf.id} | ${sf.name} | sub-features/${sf.id} | tasked | ${sf.assignee || '-'} | ${sf.dependencies?.join(', ') || '-'} |`).join('\n')}

---
`
    : '';

  return `# SDD 多子 Feature 规格文档

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | ${template.featureId} |
| **Feature 名称** | ${template.featureName} |
| **状态** | specified |
| **创建日期** | \${date} |
| **最后更新** | \${date} |
| **负责人** | \${assignee} |

---

## 概述

${template.description || '[在此填写 Feature 的概述和业务背景]'}

---

## 目标

- [ ] 目标 1
- [ ] 目标 2
- [ ] 目标 3

---

## 非目标

- [ ] 非目标 1
- [ ] 非目标 2

---

## 性能指标

- [ ] 指标 1
- [ ] 指标 2

---

## 约束条件

- [ ] 约束 1
- [ ] 约束 2

---

## 风险分析

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|----------|
| [风险 1] | 低/中/高 | 低/中/高 | [应对策略] |

---

## 验收标准

- [ ] 标准 1
- [ ] 标准 2
- [ ] 标准 3

---

${subFeaturesTable}
## 跨子 Feature 协同

### 接口约定

| 接口名 | 提供方 | 消费方 | 类型 | 格式 |
|--------|--------|--------|------|------|
| [接口1] | [提供方子 Feature] | [消费者子 Feature] | 输入/输出 | [格式说明] |

### 数据流

1. [数据流说明 1]
2. [数据流说明 2]

### 状态流转映射

子 Feature 的状态如何影响父 Feature 状态：
- 当所有子 Feature 都达到 'completed' -> 父 Feature 状态变为 'completed'
- 当任一子 Feature 处于 'validated' 或以上 -> 父 Feature 状态变为 'validated'
- 以此类推...

---

## 依赖图

\`\`\`
Feature: ${template.featureName}
├─ Dependencies:
│  ├─ sub-feature-1: planned
│  └─ sub-feature-2: specified
└─ Status: specified
\`\`\`
`;
}

/**
 * 生成子 Feature spec 模板
 */
export function generateSubFeatureSpec(template: SubFeatureTemplate): string {
  const dependenciesList = template.dependencies && template.dependencies.length > 0
    ? `- 依赖于: ${template.dependencies.join(', ')}`
    : '- 依赖于: 无';

  return `# SDD 子 Feature 规格文档

| 元数据 | 值 |
|--------|-----|
| **子 Feature ID** | ${template.id} |
| **子 Feature 名称** | ${template.name} |
| **状态** | specified |
| **创建日期** | \${date} |
| **最后更新** | \${date} |
| **负责人** | ${template.assignee || ''} |

---

## 概述

${template.description || `[在此填写 ${template.name} 的具体内容]`}

---

## 目标

- [ ] [子 Feature 特定的目标]

---

## 非目标

- [ ] [明确不属于当前子 Feature 的部分]

---

## 范围

- [x] 本子 Feature 覆盖的功能
- [ ] 本子 Feature 不涉及的部分

---

## 依赖关系
${dependenciesList}

---

## 与其他子 Feature 协同

### 协议和接口
- 数据格式: [格式说明]
- 调用接口: [接口说明]
- 交互方式: [交互说明]

---

## 技术方案

1. 方案描述
2. 主要组件
3. 实现路径

---

## 任务规划

见上级 Feature 的 \`tasks.md\`，其中包含本子 Feature 的任务拆解部分。

执行顺序: 
- [ ] [本子 Feature 专属任务 1]
- [ ] [本子 Feature 专属任务 2]
- [ ] 等待依赖的子 Feature: ${template.dependencies?.join(', ') || '无'}

---

## 验收标准

- [ ] 标准 1
- [ ] 标准 2

---

## 资源分配

- 负责人: ${template.assignee || '暂无'}
- 预估工时: ?
- 实际工时: ?

---

## 风险评估

- 风险点 1: [应对策略]
- 风险点 2: [应对策略]
`;
}

/**
 * 生成 Feature README 模板
 */
export function generateFeatureReadmeTemplate(template: FeatureTemplate): string {
  const subFeaturesNav = template.subFeatures && template.subFeatures.length > 0
    ? `## 子 Feature 快速导航

${template.subFeatures.map((sf, index) => `### ${index + 1}. [${sf.name}](sub-features/${sf.id}/README.md)`).join('\n\n')}
`
    : '## 子 Feature\n\n尚未定义任何子 Feature。';

  return `# Feature: ${template.featureName}

${template.description || 'Feature 详细说明...'}

## 目录结构

\`\`\`
specs-tree-root/
└─ specs-tree-${template.featureId}/
    ├─ spec.md           # 总体规格文档
    ├─ plan.md           # 技术实现方案
    ├─ tasks.md          # 总体任务分解
    └─ sub-features/     # 子 Feature 实现细节
        ├─ sub-feature-1/
        │   ├── spec.md
        │   ├── plan.md
        │   └── tasks.md
        └─ sub-feature-2/
            ├── spec.md
            ├── plan.md
            └── tasks.md
\`\`\`

${subFeaturesNav}
## 快速开始

1. 首先阅读 [spec.md](spec.md) 了解整体需求
2. 查看 [plan.md](plan.md) 了解技术实现路径
3. 查看 [tasks.md](tasks.md) 了解任务分解情况
4. 根据分工进入对应的 sub-features/* 目录开始开发

## 开发进度

| 状态说明 | 子 Feature | 负责人 | 说明 |
|----------|------------|--------|------|
| 🔴 待开始  | [子Feature名称] | [负责人] | 描述说明 |
| 🟡 进行中  | [子Feature名称] | [负责人] | 描述说明 |
| 🟢 已完成  | [子Feature名称] | [负责人] | 描述说明 |

---
${new Date().toISOString().split('T')[0]}
`;
}

/**
 * 生成子 Feature README 模板
 */
export function generateSubFeatureReadmeTemplate(template: SubFeatureTemplate): string {
  const dependencyDesc = template.dependencies && template.dependencies.length > 0
    ? `- **依赖**: ${template.dependencies.map(id => `\`sub-feature-${id}\``).join(', ')}`
    : '- **依赖**: 无依赖';

  return `# Sub Feature: ${template.name}

**ID**: \`${template.id}\`  
**归属**: [父 Feature]  
${dependencyDesc}

## 概述

${template.description || '子 Feature 详细说明...'}

## 范围

### 包含
- [ ] 范围项 1
- [ ] 范围项 2

### 不包含
- [ ] 非范围项 1
- [ ] 非范围项 2

## 接口协议

### 输入接口
- [接口 1]
- [接口 2]

### 输出接口
- [接口 1]
- [接口 2]

## 开发进度

- [ ] 设计阶段
- [ ] 实现阶段
- [ ] 测试阶段
- [ ] 验收阶段

## 负责人

- 主要负责人: ${template.assignee || '(未分配)'}
- 协作者: [协作者名单]

## 交叉协同

### 与其它子 Feature 交互

| 关联组件 | 数据类型 | 频率 | 特殊说明 |
|----------|----------|------|---------|
| [组件 1] | [类型] | [频率] | [说明] |

## 注意事项

- [注意事项 1]
- [注意事项 2]

---
${new Date().toISOString().split('T')[0]}
`;
}

/**
 * 生成完整的多子 Feature 项目结构示例
 */
export function generateExample(): string {
  const exampleFeature: FeatureTemplate = {
    featureName: "用户中心服务重构",
    featureId: "user-center-refactor",
    description: "重构用户中心的核心服务，提升性能和可维护性",
    subFeatures: [
      {
        id: "auth-system",
        name: "认证系统重构",
        description: "实现新的统一用户认证系统",
        assignee: "张三",
        dependencies: ["user-model"]
      },
      {
        id: "user-management",
        name: "用户管理重构",
        description: "重做用户管理和配置体系",
        assignee: "李四"
      },
      {
        id: "user-model",
        name: "用户模型设计",
        description: "设计新的用户模型和数据结构",
        assignee: "王五",
        dependencies: []
      }
    ]
  };

  const mainSpec = generateMainSpec(exampleFeature);
  const authSpec = generateSubFeatureSpec({
    id: "auth-system",
    name: "认证系统重构",
    description: "实现新的统一用户认证系统",
    assignee: "张三",
    dependencies: ["user-model"]
  });
  const readmeFeature = generateFeatureReadmeTemplate(exampleFeature);

  return `# 多子 Feature 模板示例

这是一个完整的项目示例，展示多子 Feature 目录结构。

## 1. 主 spec.md
${mainSpec}

## 2. 子 Feature spec 示例 (sub-features/auth-system/spec.md)
${authSpec}

## 3. Root README.md 模板
${readmeFeature}

## 4. 项目目录结构参考

\`\`\`
/specs/
└─ user-center-refactor/
    ├─ spec.md                    # 父 feature 整体设计
    ├─ plan.md                    # 技术实现规划
    ├─ tasks.md                   # 整体任务拆解
    ├─ README.md                  # 整体说明和导航
    └─ sub-features/              # 子 features 目录
        ├─ user-model/            # 数据模型子 feature
        │   ├── spec.md          # 数据模型规格
        │   ├── plan.md          # 数据模型实现方案
        │   ├── tasks.md         # 数据模型任务拆解
        │   └── README.md        # 数据模型说明
        ├─ auth-system/           # 认证系统子 feature
        │   ├── spec.md          # 认证规格
        │   ├── plan.md          # 认证实现方案
        │   ├── tasks.md         # 认证任务拆解
        │   └── README.md        # 认证说明
        └─ user-management/       # 用户管理子 feature
            ├── spec.md          # 用户管理规格
            ├── plan.md          # 用户管理实现方案
            ├── tasks.md         # 用户管理任务拆解
            └── README.md        # 用户管理说明
\`\`\`

**跨子 Feature 协同说明:**

1. 用户模型完成后才能设计认证系统(因为认证需依赖新用户模型)
2. 用户管理可能需要认证系统的能力
3. 依赖关系需要明确在每个子 Feature 规格中说明
`;
}