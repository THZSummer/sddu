# SDD Roadmap Agent 任务分解

## 任务清单

### TASK-001: 创建 sdd-roadmap.md Agent 定义文件
- **任务ID**: TASK-001
- **名称**: 创建核心 Agent 定义文件
- **负责人**: SDD Build Agent
- **依赖**: 无 (初始任务)
- **状态**: completed
- **描述**: 创建完整功能的 sdd-roadmap.md，包含以下部分:
  - Role Definition: 专业的 Roadmap 规划助手
  - Planning Process: 多版本规划、RICE 评分、依赖分析等流程
  - Input Requirements: 版本信息、功能列表等输入要求
  - Output Format: 格式化的 Roadmap、时间线、依赖图
  - Verification Steps: 计划完整性检查
- **验收标准**: 
  - 文件符合 Markdown Agent 格式规范
  - 包含完整的规划工作流指令
  - 与现有 Agent 风格保持一致

### TASK-002: 更新 dist/opencode.json 添加 Agent 配置
- **任务ID**: TASK-002
- **名称**: 配置 Agent 映射
- **负责人**: SDD Build Agent
- **依赖**: TASK-001
- **状态**: completed
- **描述**: 在 dist/opencode.json 配置文件中添加 sdd-roadmap Agent 的配置:
  - Agent 名称映射: "sdd-roadmap": {...}
  - 使用模型: bailian/qwen3.5-plus
  - 温度参数: 0.4
- **验收标准**:
  - JSON 格式正确
  - 配置与 Agent 功能匹配
  - 不影响现有配置

### TASK-003: 更新 README.md 添加新 Agent 说明
- **任务ID**: TASK-003
- **名称**: 文档更新
- **负责人**: SDD Build Agent
- **依赖**: TASK-001
- **状态**: completed
- **描述**: 更新项目说明文档，加入新的 Agent 介绍
- **验收标准**:
  - 包含新 Agent 功能说明
  - 添加使用示例
  - 与现有文档风格一致

### TASK-004: 验证 Agent 语法正确性
- **任务ID**: TASK-004
- **名称**: 语法验证
- **负责人**: SDD Review Agent
- **依赖**: TASK-001, TASK-002
- **状态**: completed
- **描述**: 验证创建的 Agent 文件是否符合语法规范且可正常运行
- **验收标准**:
  - Agent 文件语法正确
  - 可以正常解析和执行
  - 生成期望的 Roadmap 规划结果