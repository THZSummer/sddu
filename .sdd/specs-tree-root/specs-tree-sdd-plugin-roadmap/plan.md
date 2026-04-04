# SDD Roadmap Agent 实施计划

## 技术方案概述
采用 Markdown Agent 定义文件的形式实现 `@sdd-roadmap`，遵循与现有 Agent 统一的模板结构。

## 文件影响分析

### 新增文件
- `dist/templates/agents/sdd-roadmap.md`: Agent 核心定义文件
- `.opencode/agents/sdd-roadmap.md`: IDE 插件集成配置（部署时同步）

### 修改文件
- `dist/opencode.json`: 添加 Agent 配置映射
- `README.md`: 更新 Agent 列表说明（可选）

## Agent 详细设计

### Agent 定义要素
1. **Prompt 模板**: 包含完整的 Roadmap 规划工作流指引
2. **输入要求**: 版本计划信息、功能特性列表、优先级评估因素
3. **输出格式**: 结构化的 Roadmap 表格、版本时间线、依赖图
4. **评估模型**: RICE 评分算法实现（Reach, Impact, Confidence, Effort）
5. **验证机制**: 计划合理性检查、依赖完整性验证

### 核心功能模块
1. **版本规划引擎**: 基于资源和工期生成版本时间范围
2. **优先级排序**: 使用 RICE 评分系统进行功能优先级计算
3. **依赖分析**: 识别功能间依赖关系并提出优化建议
4. **风险检测**: 识别时间冲突、资源瓶颈等潜在规划风险

### 设计要点
- 与现有 SDD Agent 风格保持一致
- 使用清晰的标题层级和结构
- 包含详细的执行指令和验证标准
- 遵循项目的宪法和规范要求

## 部署策略
1. 将 sdd-roadmap.md 添加到 dist/templates/agents/
2. 更新 opencode.json 中的 Agent 映射配置
3. Agent 通过 @sdd-roadmap 调用执行
4. 集成项目现有 CI/CD 流程

## 验证方法
1. 语法验证：确保 Markdown 文件符合 Agent 定义规范
2. 功能验证：使用测试用例验证规划功能是否正常工作
3. 一致性验证：确认与现有 Agent 工作方式的一致性