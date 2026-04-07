# SDDU 测试工具集

本目录包含了用于测试 SDDU (Smart Development Directive Universal) 系统的各种脚本，用于验证 SDDU 的 6 阶段工作流以及向后兼容的旧版 SDD 功能。

## 脚本概览

### 1. sdd-e2e.sh - 增强版端到端测试脚本

这是一个增强版的端到端测试脚本，支持 SDD 和 SDDU 模式的测试：

```bash
# 使用默认模式（SDDU）
bash sdd-e2e.sh "项目名称"

# 指定模式
bash sdd-e2e.sh "项目名称" --mode=sdd      # 使用旧 SDD 命令
bash sdd-e2e.sh "项目名称" --mode=sddu     # 使用新 SDDU 命令（默认）
bash sdd-e2e.sh "项目名称" --mode=compare  # 比较模式（生成新旧两套提示词）

# 自动模式  
bash sdd-e2e.sh "项目名称" --auto          # 无需等待用户输入

# 简单使用（使用默认项目名称 user-login）
bash sdd-e2e.sh
```

**功能特点：**
- 自动创建测试目录
- 执行 SDDU 构建和安装
- 生成对应模式的提示词文件
- 根据模式生成不同的提示词（SDD vs SDDU 语法）

### 2. sddu-e2e.sh - SDDU 专用端到端测试脚本

这是专门为 SDDU 设计的端到端测试脚本：

```bash  
# 基础测试
bash sddu-e2e.sh "项目名称"

# 自动模式
bash sddu-e2e.sh "项目名称" --auto

# 生成详细报告
bash sddu-e2e.sh "项目名称" --report
```

**功能特点：**
- 专为 SDDU 6 阶段流设计
- SDDU 命令的完整集成测试
- 支持自动定时和报告生成
- 验证所有 6 个阶段的存在性和完整性

### 3. scripts/sddu-check.sh - SDDU 快速功能验证脚本

用于快速验证 SDDU 系统是否正确安装和配置：

```bash
bash scripts/sddu-check.sh
```

**功能特点：**
- 快速检查 opencode CLI
- 验证 SDDU 命令是否存在
- 显示可用的 SDDU 命令列表

### 4. scripts/sddu-validation-report.sh - SDDU 验证报告生成器

用于生成项目完整性验证报告：

```bash
bash scripts/sddu-validation-report.sh <project_dir> <project_name>

# 示例：
bash scripts/sddu-validation-report.sh "/workspace/my-project" "my-feature"
```

**功能特点：**
- 6 个阶段的文件完整性检查
- 状态和系统文件验证
- 生成详细验证报告

## SDDU 6 阶段工作流

SDDU 实现了一个全新的 6 阶段开发流程：

1. **0. Discovery** (@sddu-discovery) - 需求发掘和分析
2. **1. Spec** (@sddu-1-spec) - 技术规格制定  
3. **2. Plan** (@sddu-2-plan) - 技术规划和设计
4. **3. Tasks** (@sddu-3-tasks) - 任务分解
5. **4. Build** (@sddu-4-build) - 代码实现
6. **5. Review** (@sddu-5-review) - 代码审查
7. **6. Validate** (@sddu-6-validate) - 验证确认

## 向后兼容性

为了保持与原有 SDD 系统的兼容性：

- SDDU 命令同时提供传统命令别名（如 @sdd-*）
- 所有原有 SDD 功能继续工作
- 可以混合使用 SDD 和 SDDU 命令
- 迁移过程无缝进行

## 提示词模板差异

### 旧版 SDD 命令风格：
```markdown
@sdd-1-spec feature-name  
@sdd-2-plan feature-name
@sdd-3-tasks feature-name
@sdd-4-build feature-name
@sdd-5-review feature-name
@sdd-6-validate feature-name
```

### 新版 SDDU 命令风格：
```markdown
@sddu-1-spec feature-name
@sddu-2-plan feature-name  
@sddu-3-tasks feature-name
@sddu-4-build feature-name
@sddu-5-review feature-name
@sddu-6-validate feature-name
```

## 使用场景

**新项目推荐使用**：SDDU 方案提供更好的阶段分离和控制。

**现有项目维护**：可继续使用 SDD 方案，享受无缝向后兼容。

**渐进式迁移**：可通过比较模式验证新旧方案差异。