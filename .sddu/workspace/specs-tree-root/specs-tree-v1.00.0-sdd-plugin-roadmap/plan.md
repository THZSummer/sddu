# SDD Roadmap 规划专家 - 技术规划

## 🎯 技术方案概述

采用 Markdown Agent 定义文件的形式实现 `@sdd-roadmap`，遵循与现有 Agent 统一的模板结构。

**Agent 文件**: `src/templates/agents/sdd-roadmap.md.hbs`

## 🏗️ 架构设计

### Agent 配置
```yaml
description: SDD Roadmap 规划专家 - 多版本路线图规划、Feature 优先级排序、时间表制定
mode: subagent
temperature: 0.4
permission:
  edit: ask
  bash: allow
  webfetch: allow
```

### 核心模块设计

#### 1. 信息提取与补全模块
- Feature 线索识别
- 项目上下文扫描
- 推荐扩展 Feature
- 询问缺失信息
- 确认 Feature 列表

#### 2. RICE 评分引擎
- Reach 评估逻辑
- Impact 评估逻辑
- Confidence 评估逻辑
- Effort 评估逻辑
- 分数计算和排序

#### 3. 依赖分析引擎
- 前置依赖检测
- 技术共享识别
- 业务协同分析
- 依赖图谱构建

#### 4. 时间规划引擎
- 版本划分逻辑
- 工作量估算
- 时间预测
- 缓冲时间计算

#### 5. 输出生成引擎
- 执行摘要生成
- 版本总览表生成
- 优先级排序展示
- 详细规划文档生成

## 📁 文件影响分析

### 新增文件
- `src/templates/agents/sdd-roadmap.md.hbs` - Agent 核心定义文件

### 输出文件
- `.sdd/ROADMAP.md` - 唯一输出文件，完整的多版本规划文档

## 📋 执行流程

### 第零步：信息提取与补全（关键）
当用户输入模糊/零散时，执行：
1. 提取 Feature 线索
2. 扫描项目状态
3. 推荐扩展 Feature
4. 询问缺失信息
5. 确认 Feature 列表

### 第一步：信息收集
分析用户提供的信息，识别缺失的关键数据。

### 第二步：功能分析
对每个功能特性进行 RICE 分析。

### 第三步：优先级计算
使用 RICE 公式计算并排序。

### 第四步：依赖图谱构建
分析功能间的依赖关系。

### 第五步：时间规划
基于团队资源和功能优先级制定多版本路线图。

### 第六步：输出生成
生成详细的 Roadmap 报告到 `.sdd/ROADMAP.md`。

## 🔑 关键技术决策

### ADR-001: 单一输出文件原则
**决策**: 只生成 `.sdd/ROADMAP.md` 一个文件

**理由**:
- 避免文件碎片化
- 执行摘要放在文档顶部即可
- 不需要额外的 summary 文件

### ADR-002: 灵活输入设计
**决策**: 支持多种输入方式，由 Agent 负责整理和补全

**理由**:
- 降低用户使用门槛
- AI 擅长信息整理和补全
- 提供主动询问机制

### ADR-003: 温度参数设置
**决策**: temperature: 0.4

**理由**:
- 需要一定的创造性（规划建议）
- 但需要保持逻辑严谨性
- 介于创造性 (0.7) 和严谨性 (0.2) 之间

## ✅ 验证标准

- [ ] Agent 文件符合 Markdown Agent 格式规范
- [ ] 包含完整的规划工作流指令
- [ ] 与现有 Agent 风格保持一致
- [ ] RICE 评分逻辑正确
- [ ] 输出边界清晰（只生成 ROADMAP.md）
- [ ] 支持多种输入方式
