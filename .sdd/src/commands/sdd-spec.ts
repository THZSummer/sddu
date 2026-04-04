import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { getSpecsDir } from '../utils/workspace';

/**
 * 获取 spec.md 文件路径
 */
function getSpecPath(feature: string): string {
  const specsDir = getSpecsDir();
  return join(specsDir, feature, 'spec.md');
}

/**
 * @sdd-spec 命令 - 创建或显示规格文档
 */
export async function sddSpec(featureId: string, options: { show?: boolean } = {}): Promise<void> {
  const { show = false } = options;
  const specPath = getSpecPath(featureId);
  
  if (show && existsSync(specPath)) {
    console.log(readFileSync(specPath, 'utf-8'));
    return;
  }
  
  if (existsSync(specPath)) {
    console.log(`spec.md 已存在: ${specPath}`);
  } else {
    // 检查父目录是否存在，不存在则创建
    const specDir = require('path').dirname(specPath);
    if (!existsSync(specDir)) {
      require('fs').mkdirSync(specDir, { recursive: true });
    }
    
    // 写入默认 spec.md 模板
    const specContent = `# FEATURE SPECIFICATION: ${featureId}

## 概述
TODO: 描述功能的核心概念和用途

## 目标
- [ ] 目标 1
- [ ] 目标 2

## 非目标
- 非目标 1
- 非目标 2

## 功能需求
- [ ] 需求 1
- [ ] 需求 2

## 非功能性需求
- [ ] 性能要求
- [ ] 安全要求

## 架构概览
TODO: 描述高层架构

## 依赖项
- 依赖 1
- 依赖 2

## 约束条件
- 约束 1
- 约束 2

## 假设条件
- 假设 1
- 假设 2

## 设计原则
- 原则 1
- 原则 2

## 下一步
- [ ] 执行 \`@sdd-plan ${featureId}\` 生成技术计划
`;
    
    writeFileSync(specPath, specContent);
    console.log(`✅ spec.md 创建成功: ${specPath}`);
  }
}

// 如果作为命令行执行
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('用法: node sdd-spec.js <feature-id> [--show]');
    process.exit(1);
  }
  
  const featureId = args[0];
  const show = args.includes('--show');
  
  sddSpec(featureId, { show }).catch(console.error);
}