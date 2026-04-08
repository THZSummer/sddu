# SDDU 测试工具集

本目录包含了用于测试 SDDU (Specification-Driven Development Ultimate) 系统的各种脚本，用于验证 SDDU 的 6 阶段工作流。

## 脚本概览

### 1. sddu-e2e.sh - SDDU 专用端到端测试脚本

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

### 2. scripts/sddu-check.sh - SDDU 快速功能验证脚本

用于快速验证 SDDU 系统是否正确安装和配置：

```bash
bash scripts/sddu-check.sh
```

**功能特点：**
- 快速检查 opencode CLI
- 验证 SDDU 命令是否存在
- 显示可用的 SDDU 命令列表

### 3. scripts/sddu-validation-report.sh - SDDU 验证报告生成器

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

## 向后兼容性说明

**用户侧命令**：
- `@sdd-*` 系列命令继续 100% 工作（向后兼容）
- `@sddu-*` 系列命令是新的推荐用法
- 两个命令系列可以同时使用

**插件内部代码**：
- 统一使用 `sddu-` 前缀（品牌一致性）
- 不再使用 `sdd-` 前缀

## 命令风格说明

### 用户侧向后兼容命令：
```markdown
@sdd-1-spec feature-name   # 旧版（仍可用）
@sdd-2-plan feature-name   # 旧版（仍可用）
@sdd-3-tasks feature-name  # 旧版（仍可用）
@sdd-4-build feature-name  # 旧版（仍可用）
@sdd-5-review feature-name # 旧版（仍可用）
@sdd-6-validate feature-name # 旧版（仍可用）
```

### 新版推荐命令：
```markdown
@sddu-1-spec feature-name  # 新版（推荐）
@sddu-2-plan feature-name  # 新版（推荐）
@sddu-3-tasks feature-name # 新版（推荐）
@sddu-4-build feature-name # 新版（推荐）
@sddu-5-review feature-name # 新版（推荐）
@sddu-6-validate feature-name # 新版（推荐）
```

## 使用场景

**新项目推荐使用**：SDDU 方案提供更好的阶段分离和控制。

**现有项目维护**：`@sdd-*` 命令继续工作，享受无缝向后兼容。