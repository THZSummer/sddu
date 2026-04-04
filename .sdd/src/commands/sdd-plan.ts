import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { getSpecsDir } from '../utils/workspace';

/**
 * 获取 plan.md 文件路径
 */
function getPlanPath(feature: string): string {
  const specsDir = getSpecsDir();
  return join(specsDir, feature, 'plan.md');
}

/**
 * 获取 spec.md 文件路径（检查是否存在）
 */
function getSpecPath(feature: string): string {
  const specsDir = getSpecsDir();
  return join(specsDir, feature, 'spec.md');
}

/**
 * @sdd-plan 命令 - 创建或显示技术实现计划
 */
export async function sddPlan(featureId: string, options: { show?: boolean } = {}): Promise<void> {
  const { show = false } = options;
  const specPath = getSpecPath(featureId);
  const planPath = getPlanPath(featureId);
  
  if (!existsSync(specPath)) {
    console.error(`❌ 错误: spec.md 不存在于 ${specPath}`);
    console.log(`💡 提示: 运行 '@sdd-spec ${featureId}' 创建规格文档`);
    return;
  }
  
  if (show && existsSync(planPath)) {
    console.log(readFileSync(planPath, 'utf-8'));
    return;
  }
  
  if (existsSync(planPath)) {
    console.log(`plan.md 已存在: ${planPath}`);
  } else {
    // 检查父目录是否存在，不存在则创建
    const planDir = require('path').dirname(planPath);
    if (!existsSync(planDir)) {
      require('fs').mkdirSync(planDir, { recursive: true });
    }
    
    // 读取 spec.md 内容作为上下文
    let specContent = '未找到 spec.md 文件';
    try {
      specContent = readFileSync(specPath, 'utf-8');
      // 提取概览部分
      const overviewMatch = specContent.match(/## 概述\s*\n(.+?)(?=\n## |\n$)/s);
      const titleMatch = specContent.match(/^# FEATURE SPECIFICATION:.*?\n/);
      const title = titleMatch ? titleMatch[0].replace('# FEATURE SPECIFICATION:', '').trim() : featureId;
      
      specContent = overviewMatch ? overviewMatch[1].trim() : '功能概述待完善';
    } catch (e) {
      console.log('无法读取 spec.md 内容');
    }
    
    // 写入默认 plan.md 模板
    const planContent = `# TECHNICAL IMPLEMENTATION PLAN: ${featureId}

## 功能概述
${specContent}

## 技术架构
### 组件设计
- [ ] 组件 1
- [ ] 组件 2

### 数据流
- [ ] 数据流向描述

### 接口定义
- [ ] API 接口

## 实现阶段
### Phase 1: 基础架构
- [ ] 基础类/函数实现
- [ ] 核心逻辑实现

### Phase 2: 功能扩展
- [ ] 扩展特性实现
- [ ] 错误处理

### Phase 3: 测试与优化
- [ ] 单元测试
- [ ] 性能优化

## 文件结构
### 预期文件
- \`${featureId}/feature-name.interface.ts\` - 接口定义
- \`${featureId}/feature-name.class.ts\` - 类实现
- \`${featureId}/feature-name.test.ts\` - 测试文件

## 技术栈考量
- 使用的技术
- 关键决策点

## 实现风险
- [ ] 风险 1
- [ ] 风险 2

## 要点澄清
- [ ] 点 1
- [ ] 点 2

## 假设与约束
### 假设
- 假设 1
- 假设 2

### 约束
- 约束 1
- 约束 2

## 下一步
- [ ] 执行 \`@sdd-tasks ${featureId}\` 生成开发任务
`;

    writeFileSync(planPath, planContent);
    console.log(`✅ plan.md 创建成功: ${planPath}`);
  }
}

// 如果作为命令行执行
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('用法: node sdd-plan.js <feature-id> [--show]');
    process.exit(1);
  }
  
  const featureId = args[0];
  const show = args.includes('--show');
  
  sddPlan(featureId, { show }).catch(console.error);
}