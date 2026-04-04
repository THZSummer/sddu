import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { getSpecsDir } from '../utils/workspace';

/**
 * 获取 tasks.md 文件路径
 */
function getTasksPath(feature: string): string {
  const specsDir = getSpecsDir();
  return join(specsDir, feature, 'tasks.md');
}

/**
 * 获取 plan.md 文件路径（检查是否存在）
 */
function getPlanPath(feature: string): string {
  const specsDir = getSpecsDir();
  return join(specsDir, feature, 'plan.md');
}

/**
 * @sdd-tasks 命令 - 分解功能实现任务
 */
export async function sddTasks(featureId: string, options: { show?: boolean } = {}): Promise<void> {
  const { show = false } = options;
  const planPath = getPlanPath(featureId);
  const tasksPath = getTasksPath(featureId);
  
  if (!existsSync(planPath)) {
    console.error(`❌ 错误: plan.md 不存在于 ${planPath}`);
    console.log(`💡 提示: 运行 '@sdd-plan ${featureId}' 创建技术计划`);
    return;
  }
  
  if (show && existsSync(tasksPath)) {
    console.log(readFileSync(tasksPath, 'utf-8'));
    return;
  }
  
  if (existsSync(tasksPath)) {
    console.log(`tasks.md 已存在: ${tasksPath}`);
  } else {
    // 检查父目录是否存在，不存在则创建
    const tasksDir = require('path').dirname(tasksPath);
    if (!existsSync(tasksDir)) {
      require('fs').mkdirSync(tasksDir, { recursive: true });
    }
    
    // 读取 plan.md 内容作为上下文
    let planContent = '未找到 plan.md 文件';
    try {
      planContent = readFileSync(planPath, 'utf-8');
      // 提取技术架构部分
      const architectureMatch = planContent.match(/## 技术架构\s*\n(.+?)(?=\n## |\n$)/s);
      planContent = architectureMatch ? architectureMatch[1].substring(0, 200) + '...' : '技术架构待完善';
    } catch (e) {
      console.log('无法读取 plan.md 内容');
    }
    
    // 写入默认 tasks.md 模板
    const tasksContent = `# 任务分解：${featureId}

## 概述
基于技术计划将功能拆分为可实施的任务列表。
功能简述：${planContent.replace(/\n/g, ' ')}

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | ${featureId} |
| **Feature 名称** | ${featureId.replace(/-/g, ' ')} |
| **规范版本** | 1.0.0 |
| **创建日期** | ${new Date().toISOString().split('T')[0]} |
| **状态** | tasked |
| **总任务数** | 5 个 |
| **预计工时** | 15 小时 |

---
  
## 任务清单（按执行顺序）

- [ ] TASK-001: 创建基础接口和类型定义 (2h)
- [ ] TASK-002: 实现核心功能逻辑 (5h)  
- [ ] TASK-003: 实现辅助功能 (4h)
- [ ] TASK-004: 编写单元测试 (3h)
- [ ] TASK-005: 完善文档和示例 (1h)

---

## 任务详情

### TASK-001: 创建基础接口和类型定义

| 属性 | 值 |
|------|-----|
| **优先级** | P0 |
| **预估工时** | 2 小时 |
| **依赖任务** | 无 |
| **负责人** | TBD |

#### 工作内容
- [ ] 定义接口和类型
- [ ] 创建基础类结构

#### 交付物  
- \`src/${featureId}/${featureId}.interface.ts\` - 接口定义 (约 50 行)
- \`src/${featureId}/${featureId}.types.ts\` - 类型定义 (约 30 行)

#### 验收标准
- [ ] 接口定义完整
- [ ] 类型安全

### TASK-002: 实现核心功能逻辑

| 属性 | 值 |
|------|-----|
| **优先级** | P0 |
| **预估工时** | 5 小时 |
| **依赖任务** | TASK-001 |
| **负责人** | TBD |

#### 工作内容
- [ ] 实现主要业务逻辑
- [ ] 错误处理实现

#### 交付物
- \`src/${featureId}/${featureId}.service.ts\` - 服务实现 (约 100 行)

#### 验收标准  
- [ ] 功能完整性
- [ ] 错误处理完善
- [ ] 性能达标

### TASK-003: 实现辅助功能

| 属性 | 值 |
|------|-----|
| **优先级** | P1 |
| **预估工时** | 4 小时 |  
| **依赖任务** | TASK-002 |
| **负责人** | TBD |

#### 工作内容
- [ ] 实现辅助函数
- [ ] 配置和工具方法

#### 交付物
- \`src/${featureId}/utils.ts\` - 工具函数 (约 80 行)

#### 验收标准
- [ ] 工具函数有效
- [ ] 配置易用性

### TASK-004: 编写单元测试

| 属性 | 值 |
|------|-----|
| **优先级** | P0 |
| **预估工时** | 3 小时 |
| **依赖任务** | TASK-001, TASK-002, TASK-003 |
| **负责人** | TBD |

#### 工作内容  
- [ ] 编写单元测试
- [ ] 实现测试用例

#### 交付物
- \`src/${featureId}/${featureId}.service.spec.ts\` - 服务测试 (约 60 行)
- \`src/${featureId}/${featureId}.utils.spec.ts\` - 工具函数测试 (约 40 行)

#### 验收标准
- [ ] 单元测试覆盖 > 80%
- [ ] 所有测试通过

### TASK-005: 完善文档和示例

| 属性 | 值 |
|------|-----|
| **优先级** | P2 |
| **预估工时** | 1 小时 |
| **依赖任务** | TASK-001 ~ TASK-004 |
| **负责人** | TBD |

#### 工作内容
- [ ] 更新 README
- [ ] 添加使用示例

#### 交付物
- \`README.md\` - 使用说明和示例 (约 100 行)

#### 验收标准
- [ ] 文档清晰完整
- [ ] 示例可运行

---

## 集成测试
- [ ] 功能集成测试
- [ ] 性能回归测试

## 验证标准
完成后，请运行验证命令：
\`\`\`bash
npm run test:${featureId}
\`\`\`

---

## 下一步
- [ ] 执行 \`@sdd-build TASK-001\` 开始任务实现
`;

    writeFileSync(tasksPath, tasksContent);
    console.log(`✅ tasks.md 创建成功: ${tasksPath}`);
  }
}

// 如果作为命令行执行
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('用法: node sdd-tasks.js <feature-id> [--show]');
    process.exit(1);
  }
  
  const featureId = args[0];
  const show = args.includes('--show');
  
  sddTasks(featureId, { show }).catch(console.error);
}