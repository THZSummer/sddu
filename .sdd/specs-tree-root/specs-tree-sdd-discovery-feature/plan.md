# SDD Discovery 功能增强 - 技术规划

## 元数据表

| 元数据 | 值 |
|--------|-----|
| Feature ID | FR-SDD-DISCOVERY-001 |
| Feature 名称 | SDD Discovery 需求挖掘能力增强 |
| 版本 | 1.0.0 |
| 优先级 | P0 |
| 创建日期 | 2026-04-03 |
| 作者 | SDD Team |
| 状态 | planned |

---

## 1. 架构设计

### 1.1 整体架构图（7 阶段工作流）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SDD 7 阶段工作流                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   阶段 0          阶段 1          阶段 2          阶段 3          阶段 4     │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐      │
│  │Discovery│ → │  Spec   │ → │  Plan   │ → │  Tasks  │ → │  Build  │      │
│  │  需求   │   │  规范   │   │  规划   │   │  分解   │   │  实现   │      │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘      │
│      ↓             ↓             ↓             ↓             ↓             │
│  discovered    specified      planned       tasked     implementing        │
│                                                                             │
│   阶段 5          阶段 6                                                     │
│  ┌─────────┐   ┌─────────┐                                                  │
│  │ Review  │ → │ Validate│                                                  │
│  │  评审   │   │  验证   │                                                  │
│  └─────────┘   └─────────┘                                                  │
│      ↓             ↓                                                        │
│   reviewed     validated                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 组件关系图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          组件交互关系                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                                                      │
│  │   @sdd-discovery │                                                      │
│  │     Agent        │                                                      │
│  │  (新增组件)      │                                                      │
│  └────────┬─────────┘                                                      │
│           │ 执行 7 步工作流                                                   │
│           ↓                                                                 │
│  ┌──────────────────┐     ┌──────────────────┐                             │
│  │   discovery.md   │────→│   @sdd-spec      │                             │
│  │  (需求挖掘报告)  │ 输入 │     Agent        │                             │
│  │                  │     │                  │                             │
│  └──────────────────┘     └────────┬─────────┘                             │
│                                    │                                       │
│                                    ↓                                       │
│                           ┌──────────────────┐                             │
│                           │     spec.md      │                             │
│                           │   (功能规范)     │                             │
│                           └──────────────────┘                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 数据流设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             数据流图                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  用户输入                                                                    │
│     │                                                                       │
│     │ "@sdd discovery [feature-name]"                                      │
│     ↓                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    @sdd-discovery Agent                              │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │  7 步工作流：                                                   │  │   │
│  │  │   1. 问题空间探索 → 2. 用户画像与场景 → 3. 需求分类与优先级    │  │   │
│  │  │   4. 竞品与方案调研 → 5. 风险与假设识别 → 6. 成功标准定义    │  │   │
│  │  │   7. 范围边界划定                                             │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│     │                                                                       │
│     │ 生成 discovery.md                                                    │
│     ↓                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  .sdd/specs-tree-root/[feature]/discovery.md                        │   │
│  │  - 问题定义                                                          │   │
│  │  - 用户画像                                                          │   │
│  │  - 需求清单 (MoSCoW)                                                │   │
│  │  - 推荐方案                                                          │   │
│  │  - 成功指标                                                          │   │
│  │  - 范围边界                                                          │   │
│  │  - 风险与假设                                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│     │                                                                       │
│     │ 作为输入                                                              │
│     ↓                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    @sdd-spec Agent                                   │   │
│  │  读取 discovery.md 作为上下文                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│     │                                                                       │
│     │ 生成 spec.md                                                          │
│     ↓                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  .sdd/specs-tree-root/[feature]/spec.md                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 文件结构设计

### 2.1 新增文件清单

| 文件路径 | 类型 | 描述 |
|----------|------|------|
| `dist/templates/agents/sdd-discovery.md` | NEW | Discovery Agent 定义文件 |
| `dist/templates/discovery-template.md` | NEW | 需求挖掘报告标准模板 |
| `.sdd/specs-tree-root/[feature]/discovery.md` | NEW | 每个 Feature 的需求挖掘报告（运行时生成） |
| `src/discovery/state-validator.ts` | NEW | Discovery 状态验证器 |
| `src/discovery/workflow-engine.ts` | NEW | 7 步工作流引擎 |
| `src/discovery/coaching-mode.ts` | NEW | 辅导模式实现 |

### 2.2 修改文件清单

| 文件路径 | 修改类型 | 修改描述 |
|----------|----------|----------|
| `src/state-machine.ts` | MODIFY | 添加 `discovered` 状态定义和流转规则 |
| `src/smart-entry.ts` | MODIFY | 添加 `@sdd discovery` 命令支持 |
| `src/smart-entry.ts` | MODIFY | 更新阶段跳转验证表 |
| `src/state-machine.ts` | MODIFY | 更新状态流转图 |
| `dist/install.sh` | MODIFY | 添加新 Agent 和模板的复制逻辑 |
| `README.md` | MODIFY | 更新 7 阶段工作流说明 |

### 2.3 目录结构变更

```
opencode-sdd-plugin/
├── dist/
│   ├── templates/
│   │   ├── agents/
│   │   │   ├── sdd-spec.md         (已有)
│   │   │   ├── sdd-plan.md         (已有)
│   │   │   ├── sdd-tasks.md        (已有)
│   │   │   ├── sdd-build.md        (已有)
│   │   │   ├── sdd-review.md       (已有)
│   │   │   ├── sdd-validate.md     (已有)
│   │   │   └── sdd-discovery.md    [NEW] ← 新增
│   │   ├── discovery-template.md   [NEW] ← 新增
│   │   └── ...
│   └── ...
├── src/
│   ├── discovery/                  [NEW] ← 新增目录
│   │   ├── state-validator.ts
│   │   ├── workflow-engine.ts
│   │   └── coaching-mode.ts
│   ├── state-machine.ts            [MODIFY]
│   ├── smart-entry.ts              [MODIFY]
│   └── ...
└── .sdd/
    └── specs-tree-root/
        └── [feature]/
            ├── discovery.md        [NEW] ← 运行时生成
            ├── spec.md             (已有)
            ├── plan.md             (已有)
            └── ...
```

---

## 3. 技术方案详细设计

### 3.1 Discovery Agent 设计

#### 3.1.1 Agent 定义结构（YAML frontmatter）

```yaml
---
name: sdd-discovery
description: SDD 需求挖掘 Agent - 执行 7 步需求挖掘工作流
version: 1.0.0
type: workflow
input:
  - type: feature_name
    required: true
    description: Feature 名称
  - type: user_input
    required: false
    description: 用户初始需求描述
output:
  - type: file
    path: .sdd/specs-tree-root/[feature]/discovery.md
    format: markdown
workflow:
  - step: 1
    name: 问题空间探索
    actions:
      - 背景理解
      - 痛点挖掘
      - 业务价值澄清
  - step: 2
    name: 用户画像与场景
    actions:
      - 目标用户定义
      - 用户场景还原
      - 用户旅程地图
  - step: 3
    name: 需求分类与优先级
    actions:
      - MoSCoW 分类
      - 需求归类
      - 优先级排序
  - step: 4
    name: 竞品与方案调研
    actions:
      - 竞品对标
      - 替代方案评估
  - step: 5
    name: 风险与假设识别
    actions:
      - 关键假设
      - 潜在风险
  - step: 6
    name: 成功标准定义
    actions:
      - 定性指标
      - 定量指标
      - 验收标准
  - step: 7
    name: 范围边界划定
    actions:
      - MVP 规划
      - V1 规划
      - 未来版本规划
coaching:
  enabled: true
  levels:
    - 想法阶段
    - 痛点阶段
    - 方案阶段
    - 执行阶段
---
```

#### 3.1.2 核心工作流（7 步法）详细实现

```typescript
// src/discovery/workflow-engine.ts

interface DiscoveryStep {
  id: number;
  name: string;
  description: string;
  prompts: string[];
  outputSection: string;
}

const DISCOVERY_WORKFLOW: DiscoveryStep[] = [
  {
    id: 1,
    name: '问题空间探索',
    description: '深入理解问题背景、痛点和业务价值',
    prompts: [
      '这个功能要解决的核心问题是什么？',
      '为什么这个问题值得解决？（5 Whys 挖掘）',
      '解决这个问题能带来什么业务价值？',
      '当前的替代方案是什么？为什么不够好？'
    ],
    outputSection: '问题定义'
  },
  {
    id: 2,
    name: '用户画像与场景',
    description: '定义目标用户和使用场景',
    prompts: [
      '谁是这个功能的目标用户？',
      '用户在什么场景下会使用这个功能？',
      '描述一个典型的用户使用旅程',
      '用户当前的痛点和期望是什么？'
    ],
    outputSection: '用户画像'
  },
  {
    id: 3,
    name: '需求分类与优先级',
    description: '使用 MoSCoW 方法对需求进行分类',
    prompts: [
      '哪些是 Must have（必须有）的需求？',
      '哪些是 Should have（应该有）的需求？',
      '哪些是 Could have（可以有）的需求？',
      '哪些是 Won\'t have（本次不做）的需求？'
    ],
    outputSection: '需求清单'
  },
  {
    id: 4,
    name: '竞品与方案调研',
    description: '分析竞品和替代方案',
    prompts: [
      '市场上有哪些类似的解决方案？',
      '竞品的优缺点是什么？',
      '我们可以借鉴哪些最佳实践？',
      '我们的差异化优势是什么？'
    ],
    outputSection: '推荐方案'
  },
  {
    id: 5,
    name: '风险与假设识别',
    description: '识别关键假设和潜在风险',
    prompts: [
      '我们做了哪些关键假设？',
      '哪些假设可能被证明是错误的？',
      '技术实现上有哪些风险？',
      '业务层面有哪些风险？'
    ],
    outputSection: '风险与假设'
  },
  {
    id: 6,
    name: '成功标准定义',
    description: '定义定性和定量的成功指标',
    prompts: [
      '如何定性判断这个功能成功了？',
      '有哪些可量化的指标？',
      '验收标准是什么？',
      '何时可以认为这个功能完成？'
    ],
    outputSection: '成功指标'
  },
  {
    id: 7,
    name: '范围边界划定',
    description: '明确 MVP、V1 和未来版本的范围',
    prompts: [
      'MVP 的最小范围是什么？',
      'V1 版本包含哪些功能？',
      '哪些功能留给未来版本？',
      '明确不做的是什么？'
    ],
    outputSection: '范围边界'
  }
];

class DiscoveryWorkflowEngine {
  async execute(featureName: string, userInput: string): Promise<void> {
    // 逐步执行 7 步工作流
    for (const step of DISCOVERY_WORKFLOW) {
      await this.executeStep(step, featureName, userInput);
    }
    // 生成 discovery.md
    await this.generateReport(featureName);
  }
}
```

#### 3.1.3 辅导模式实现逻辑

```typescript
// src/discovery/coaching-mode.ts

type CoachingLevel = '想法阶段' | '痛点阶段' | '方案阶段' | '执行阶段';

interface CoachingConfig {
  level: CoachingLevel;
  intervention: 'high' | 'medium' | 'low' | 'minimal';
  guidanceStyle: string;
}

const COACHING_CONFIGS: Record<CoachingLevel, CoachingConfig> = {
  '想法阶段': {
    level: '想法阶段',
    intervention: 'high',
    guidanceStyle: '引导式提问，帮助用户从模糊想法到清晰问题定义'
  },
  '痛点阶段': {
    level: '痛点阶段',
    intervention: 'medium',
    guidanceStyle: '深度挖掘痛点，使用 5 Whys 方法'
  },
  '方案阶段': {
    level: '方案阶段',
    intervention: 'low',
    guidanceStyle: '验证方案可行性，识别潜在风险'
  },
  '执行阶段': {
    level: '执行阶段',
    intervention: 'minimal',
    guidanceStyle: '确认范围边界和成功标准'
  }
};

class CoachingModeEngine {
  detectLevel(userInput: string): CoachingLevel {
    // 基于用户输入的关键词和详细程度判断用户所处阶段
    if (userInput.length < 20) {
      return '想法阶段';
    }
    if (userInput.includes('痛点') || userInput.includes('问题')) {
      return '痛点阶段';
    }
    if (userInput.includes('方案') || userInput.includes('实现')) {
      return '方案阶段';
    }
    return '执行阶段';
  }

  getGuidance(level: CoachingLevel): string {
    return COACHING_CONFIGS[level].guidanceStyle;
  }
}
```

### 3.2 状态机设计

#### 3.2.1 新增状态定义

```typescript
// src/state-machine.ts

enum FeatureState {
  // 原有状态
  DRAFTING = 'drafting',
  SPECIFIED = 'specified',
  PLANNED = 'planned',
  TASKED = 'tasked',
  IMPLEMENTING = 'implementing',
  REVIEWED = 'reviewed',
  VALIDATED = 'validated',
  
  // 新增状态
  DISCOVERED = 'discovered'  // ← 新增
}

const STATE_TRANSITIONS: Record<FeatureState, FeatureState[]> = {
  [FeatureState.DRAFTING]: [FeatureState.DISCOVERED, FeatureState.SPECIFIED],
  [FeatureState.DISCOVERED]: [FeatureState.SPECIFIED],  // ← 新增流转
  [FeatureState.SPECIFIED]: [FeatureState.PLANNED],
  [FeatureState.PLANNED]: [FeatureState.TASKED],
  [FeatureState.TASKED]: [FeatureState.IMPLEMENTING],
  [FeatureState.IMPLEMENTING]: [FeatureState.REVIEWED],
  [FeatureState.REVIEWED]: [FeatureState.VALIDATED],
  [FeatureState.VALIDATED]: []
};
```

#### 3.2.2 状态流转规则

```
状态流转图（更新后）:

drafting ──────────────────────────────────────→ specified
   │                                              ↑
   │ (可选跳过)                                   │
   ↓                                              │
discovered ───────────────────────────────────────┘
   │
   │ (推荐路径)
   ↓
specified → planned → tasked → implementing → reviewed → validated
```

#### 3.2.3 前置检查逻辑

```typescript
// src/discovery/state-validator.ts

class DiscoveryStateValidator {
  /**
   * 检查是否可以进入 spec 阶段
   * 推荐有 discovery.md，但不强制
   */
  canTransitionToSpec(featureName: string): {
    allowed: boolean;
    warning?: string;
  } {
    const discoveryPath = `.sdd/specs-tree-root/${featureName}/discovery.md`;
    
    if (fs.existsSync(discoveryPath)) {
      return { allowed: true };
    }
    
    return {
      allowed: true,
      warning: '⚠️ 未找到 discovery.md，建议先运行 @sdd-discovery 进行需求挖掘'
    };
  }

  /**
   * 验证状态流转是否合法
   */
  validateTransition(from: FeatureState, to: FeatureState): boolean {
    const allowedTransitions = STATE_TRANSITIONS[from];
    return allowedTransitions?.includes(to) ?? false;
  }
}
```

### 3.3 智能入口更新

#### 3.3.1 命令扩展

```typescript
// src/smart-entry.ts

const SDD_COMMANDS = [
  {
    name: 'discovery',
    description: '启动需求挖掘阶段（阶段 0）',
    usage: '@sdd discovery [feature-name]',
    agent: 'sdd-discovery',
    output: 'discovery.md',
    nextState: 'discovered'
  },
  {
    name: 'spec',
    description: '启动规范编写阶段（阶段 1）',
    usage: '@sdd spec [feature-name]',
    agent: 'sdd-spec',
    output: 'spec.md',
    nextState: 'specified',
    prerequisites: ['discovery'] // 推荐但不强制
  },
  // ... 其他命令
];
```

#### 3.3.2 状态流转图更新

```markdown
<!-- README.md 中的状态流转图更新 -->

## SDD 7 阶段工作流

```
┌────────────┐
│  0.        │
│  Discovery │
│  需求挖掘  │
└─────┬──────┘
      │
      ↓ (discovered)
┌────────────┐
│  1.        │
│  Spec      │
│  规范编写  │
└─────┬──────┘
      │
      ↓ (specified)
┌────────────┐
│  2.        │
│  Plan      │
│  技术规划  │
└─────┬──────┘
      │
      ↓ (planned)
┌────────────┐
│  3.        │
│  Tasks     │
│  任务分解  │
└─────┬──────┘
      │
      ↓ (tasked)
┌────────────┐
│  4.        │
│  Build     │
│  构建实现  │
└─────┬──────┘
      │
      ↓ (implementing)
┌────────────┐
│  5.        │
│  Review    │
│  代码评审  │
└─────┬──────┘
      │
      ↓ (reviewed)
┌────────────┐
│  6.        │
│  Validate  │
│  验证验收  │
└─────┬──────┘
      │
      ↓ (validated)
    [完成]
```
```

#### 3.3.3 跳转保护规则

```typescript
// src/smart-entry.ts

const JUMP_PROTECTION_RULES = [
  {
    from: 'drafting',
    to: 'specified',
    check: () => {
      const hasDiscovery = checkDiscoveryExists();
      if (!hasDiscovery) {
        return {
          allowed: true,
          warning: '⚠️ 建议先执行 discovery 阶段进行需求挖掘，是否继续？'
        };
      }
      return { allowed: true };
    }
  },
  {
    from: 'discovered',
    to: 'planned',
    check: () => {
      return {
        allowed: false,
        error: '❌ 必须先完成 spec 阶段才能进入 plan 阶段'
      };
    }
  }
];
```

### 3.4 输出模板设计

#### 3.4.1 discovery.md 标准结构

```markdown
# [Feature 名称] - 需求挖掘报告

## 元数据

| 元数据 | 值 |
|--------|-----|
| Feature ID | [自动生成] |
| 创建日期 | [日期] |
| 最后更新 | [日期] |
| 状态 | discovered |

---

## 1. 问题定义

### 1.1 背景

[问题背景描述]

### 1.2 核心问题

[要解决的核心问题]

### 1.3 业务价值

[解决此问题带来的业务价值]

---

## 2. 用户画像

### 2.1 目标用户

[目标用户群体描述]

### 2.2 用户场景

[典型使用场景]

### 2.3 用户旅程

[用户使用旅程地图]

---

## 3. 需求清单

### 3.1 Must Have（必须有）

| ID | 需求描述 | 优先级 |
|----|----------|--------|
| M-001 | ... | P0 |

### 3.2 Should Have（应该有）

| ID | 需求描述 | 优先级 |
|----|----------|--------|
| S-001 | ... | P1 |

### 3.3 Could Have（可以有）

| ID | 需求描述 | 优先级 |
|----|----------|--------|
| C-001 | ... | P2 |

### 3.4 Won't Have（本次不做）

| ID | 需求描述 | 原因 |
|----|----------|------|
| W-001 | ... | ... |

---

## 4. 推荐方案

### 4.1 方案概述

[推荐方案的概述]

### 4.2 方案对比

| 方案 | 优点 | 缺点 | 评估 |
|------|------|------|------|
| 方案 A | ... | ... | 推荐 |
| 方案 B | ... | ... | 备选 |

---

## 5. 成功指标

### 5.1 定性指标

- [ ] 指标 1
- [ ] 指标 2

### 5.2 定量指标

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| ... | ... | ... |

### 5.3 验收标准

- [ ] 验收标准 1
- [ ] 验收标准 2

---

## 6. 范围边界

### 6.1 MVP 范围

[MVP 包含的功能]

### 6.2 V1 范围

[V1 版本包含的功能]

### 6.3 未来版本

[留给未来版本的功能]

### 6.4 明确不做

[明确排除在范围外的内容]

---

## 7. 风险与假设

### 7.1 关键假设

| ID | 假设描述 | 验证方法 | 风险等级 |
|----|----------|----------|----------|
| A-001 | ... | ... | 高/中/低 |

### 7.2 潜在风险

| ID | 风险描述 | 影响 | 概率 | 缓解措施 |
|----|----------|------|------|----------|
| R-001 | ... | ... | ... | ... |

---

## 8. 附录

### 8.1 参考资料

[相关参考文档]

### 8.2 待决策项

[需要在 spec 阶段进一步确认的事项]

---

**文档状态**: discovered  
**创建日期**: [日期]  
**下一步**: 运行 `@sdd-spec [feature-name]` 开始规范编写
```

#### 3.4.2 各章节内容规范

| 章节 | 内容要求 | 最小行数 |
|------|----------|----------|
| 问题定义 | 必须包含背景、核心问题、业务价值 | 10 |
| 用户画像 | 必须定义目标用户和至少 1 个场景 | 10 |
| 需求清单 | 必须完成 MoSCoW 分类 | 15 |
| 推荐方案 | 至少对比 2 个方案 | 10 |
| 成功指标 | 至少包含 1 个定性 +1 个定量指标 | 8 |
| 范围边界 | 必须明确 MVP/V1/未来版本 | 10 |
| 风险与假设 | 至少识别 3 个假设或风险 | 10 |

---

## 4. 实施策略

### 4.1 实施阶段划分

| 阶段 | 任务 | 预计工时 | 依赖 |
|------|------|----------|------|
| **阶段 1** | 创建 Discovery Agent 定义文件 | 2h | 无 |
| **阶段 2** | 实现 7 步工作流引擎 | 4h | 阶段 1 |
| **阶段 3** | 实现辅导模式 | 2h | 阶段 2 |
| **阶段 4** | 更新状态机支持 discovered 状态 | 2h | 无 |
| **阶段 5** | 更新智能入口添加 discovery 命令 | 2h | 阶段 4 |
| **阶段 6** | 创建输出模板 | 1h | 无 |
| **阶段 7** | 更新安装脚本 | 1h | 阶段 1-6 |
| **阶段 8** | 更新文档和 README | 1h | 阶段 1-7 |
| **阶段 9** | 测试和验证 | 3h | 阶段 1-8 |

**总预计工时**: 18 小时

### 4.2 测试策略

#### 4.2.1 单元测试

```typescript
// __tests__/discovery/workflow-engine.test.ts

describe('DiscoveryWorkflowEngine', () => {
  test('should execute all 7 steps', async () => {
    const engine = new DiscoveryWorkflowEngine();
    await engine.execute('test-feature', 'test input');
    // 验证生成了 discovery.md
  });

  test('should generate valid discovery.md structure', async () => {
    // 验证输出包含所有必需章节
  });
});

// __tests__/discovery/coaching-mode.test.ts

describe('CoachingModeEngine', () => {
  test('should detect correct coaching level', () => {
    expect(engine.detectLevel('我想做一个功能')).toBe('想法阶段');
    expect(engine.detectLevel('用户痛点是...')).toBe('痛点阶段');
  });
});

// __tests__/discovery/state-validator.test.ts

describe('DiscoveryStateValidator', () => {
  test('should allow transition from discovered to specified', () => {
    expect(validator.validateTransition('discovered', 'specified')).toBe(true);
  });

  test('should warn when skipping discovery', () => {
    const result = validator.canTransitionToSpec('test-feature');
    expect(result.warning).toBeDefined();
  });
});
```

#### 4.2.2 集成测试

| 测试场景 | 输入 | 预期输出 |
|----------|------|----------|
| 完整 discovery 流程 | `@sdd discovery test-feature` | 生成 discovery.md |
| 跳过 discovery 直接 spec | `@sdd spec test-feature` | 生成 spec.md + 警告 |
| 状态流转验证 | drafting → discovered → specified | 成功流转 |
| 非法状态流转 | discovered → planned | 拒绝 + 错误提示 |

#### 4.2.3 端到端测试

1. 创建测试 Feature
2. 运行 `@sdd discovery test-feature`
3. 验证 discovery.md 生成和内容
4. 运行 `@sdd spec test-feature`
5. 验证 spec.md 引用了 discovery.md 内容
6. 验证状态正确更新为 `specified`

### 4.3 迁移策略（向后兼容）

#### 4.3.1 现有 Feature 处理

```typescript
// 迁移脚本：migrate-existing-features.ts

async function migrateExistingFeatures(): Promise<void> {
  const features = await getAllFeatures();
  
  for (const feature of features) {
    // 已有 spec.md 但没有 discovery.md 的 Feature
    if (feature.hasSpec && !feature.hasDiscovery) {
      // 不强制创建 discovery.md
      // 在智能入口中提示用户可以补充
      feature.state = feature.state; // 保持原状态
      log(`Feature ${feature.name}: 保持原有状态，可选补充 discovery`);
    }
  }
}
```

#### 4.3.2 兼容性保证

| 场景 | 兼容性处理 |
|------|------------|
| 已有 Feature | 保持原状态不变，可选补充 discovery |
| 跳过 discovery | 允许，但显示推荐提示 |
| 旧版工作流 | 完全兼容，7 阶段是扩展而非替换 |
| 状态检查 | discovered 状态是新增，不影响现有状态 |

#### 4.3.3 版本标记

```json
// package.json
{
  "version": "2.0.0",
  "sddWorkflowVersion": "7-stage",
  "changelog": {
    "2.0.0": "添加 Discovery 阶段，支持 7 阶段工作流"
  }
}
```

---

## 5. 技术约束和依赖

### 5.1 技术约束

| ID | 约束 | 影响 |
|----|------|------|
| C-001 | 必须使用 Markdown 格式 | discovery.md 必须是 Markdown |
| C-002 | 必须与现有 SDD 工具链集成 | 需要使用现有 Agent API |
| C-003 | Agent 定义必须在 `dist/templates/agents/` | 文件位置固定 |
| C-004 | 必须兼容 OpenCode Plugin API | 遵循 Plugin API 规范 |

### 5.2 依赖关系

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             依赖关系图                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  @sdd-discovery (新增)                                                      │
│       │                                                                     │
│       ├─→ Node.js ≥ 18.0.0 (运行时)                                        │
│       │                                                                     │
│       ├─→ OpenCode Platform (运行时)                                       │
│       │                                                                     │
│       ├─→ specs-tree-sdd-plugin-baseline (强依赖)                          │
│       │    └─→ 基础 SDD 插件功能                                             │
│       │                                                                     │
│       └─→ 现有状态机 (内部依赖)                                            │
│            └─→ 需要扩展支持 discovered 状态                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 外部依赖

| 依赖 | 类型 | 版本要求 | 说明 |
|------|------|----------|------|
| OpenCode Platform | 运行时 | 最新版 | 支持 Agent 和状态机 |
| Node.js | 运行时 | ≥ 18.0.0 | 插件运行环境 |

---

## 6. 风险评估

### 6.1 技术风险

| ID | 风险描述 | 概率 | 影响 | 缓解措施 |
|----|----------|------|------|----------|
| TR-001 | 7 步工作流执行时间过长 | 中 | 中 | 设置每步超时限制，支持中断续执行 |
| TR-002 | 辅导模式判断不准确 | 中 | 低 | 允许用户手动指定辅导级别 |
| TR-003 | 状态机扩展引入 Bug | 低 | 高 | 充分测试状态流转，添加回归测试 |
| TR-004 | 与现有 Agent 冲突 | 低 | 中 | 确保 Agent 命名唯一，测试共存 |

### 6.2 依赖风险

| ID | 风险描述 | 概率 | 影响 | 缓解措施 |
|----|----------|------|------|----------|
| DR-001 | OpenCode API 变更 | 低 | 高 | 关注 API 更新，保持兼容层 |
| DR-002 | Node.js 版本不兼容 | 低 | 中 | 明确最低版本要求，添加版本检查 |

### 6.3 时间风险

| ID | 风险描述 | 概率 | 影响 | 缓解措施 |
|----|----------|------|------|----------|
| SR-001 | 实施时间超出预期 | 中 | 中 | 分阶段实施，优先完成核心功能 |
| SR-002 | 测试发现重大问题 | 中 | 中 | 预留缓冲时间，早期开始测试 |

### 6.4 流程风险

| ID | 风险描述 | 概率 | 影响 | 缓解措施 |
|----|----------|------|------|----------|
| PR-001 | 用户不愿使用 discovery 阶段 | 高 | 中 | 强调价值，提供跳过选项但显示收益对比 |
| PR-002 | 需求挖掘质量参差不齐 | 中 | 中 | 提供模板和示例，添加质量检查 |

### 6.5 风险矩阵

```
影响
  高 │              TR-003         DR-001
     │
  中 │    TR-001  TR-002  SR-001  SR-002  PR-001  PR-002
     │              DR-002  TR-004
  低 │
     └──────────────────────────────────────────────
        低        中        高        概率
```

---

## 7. 架构决策记录 (ADR)

已生成以下 ADR 文件：

| ADR 编号 | 标题 | 状态 |
|----------|------|------|
| ADR-003 | Discovery 阶段可选而非强制 | PROPOSED |
| ADR-004 | 辅导模式采用 4 级分类 | PROPOSED |
| ADR-005 | 7 步工作流固定顺序执行 | PROPOSED |

详细决策内容请参阅各 ADR 文件。

---

## 8. 下一步

👉 运行 `@sdd-tasks specs-tree-sdd-discovery-feature` 开始任务分解

---

**文档状态**: planned  
**创建日期**: 2026-04-03  
**生成的 ADR**:
- [ADR-003.md](../../architecture/adr/ADR-003.md) - Discovery 阶段可选而非强制
- [ADR-004.md](../../architecture/adr/ADR-004.md) - 辅导模式采用 4 级分类
- [ADR-005.md](../../architecture/adr/ADR-005.md) - 7 步工作流固定顺序执行
