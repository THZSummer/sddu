import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { getSpecsDir } from '../utils/workspace';

/**
 * 获取任务状态文件路径
 */
function getStatePath(feature: string): string {
  const specsDir = getSpecsDir();
  return join(specsDir, feature, 'state.json');
}

/**
 * 获取 tasks.md 文件路径
 */
function getTasksPath(feature: string): string {
  const specsDir = getSpecsDir();
  return join(specsDir, feature, 'tasks.md');
}

/**
 * 检查任务是否存在
 */
function taskExists(taskId: string, featureId: string): boolean {
  const tasksPath = getTasksPath(featureId);
  if (!existsSync(tasksPath)) {
    return false;
  }
  
  const content = readFileSync(tasksPath, 'utf-8');
  return content.includes(taskId);
}

/**
 * @sdd-build 命令 - 执行指定任务
 * 注意: 这是简化版的模拟实现，仅演示如何支持新的目录结构
 */
export async function sddBuild(taskId: string, featureId: string, options: { dryRun?: boolean } = {}): Promise<void> {
  const { dryRun = false } = options;

  console.log(`🚀 开始处理: ${taskId} -> Feature: ${featureId}`);
  
  if (!existsSync(getTasksPath(featureId))) {
    console.error(`❌ 错误: tasks.md 不存在于 ${getTasksPath(featureId)}`);
    console.log(`💡 提示: 运行 '@sdd-tasks ${featureId}' 创建任务分解`);
    return;
  }
  
  if (!taskExists(taskId, featureId)) {
    console.error(`❌ 错误: 任务 ${taskId} 不存在于 ${featureId} 的任务列表中`);
    console.log(`💡 提示: 检查 ${getTasksPath(featureId)} 文件中的任务定义`);
    return;
  }
  
  if (dryRun) {
    console.log(`🧪 预演模式: 将会执行 ${taskId} 任务`);
    // 在真实实现中，这里会进行实际的任务实现
    console.log(`📁 将操作的目录路径: ${getSpecsDir()}/${featureId}`);
    return;
  }
  
  console.log(`🔄 正在实现任务: ${taskId}`);
  
  // 1. 创建必要的目录结构
  const featureDir = join(getSpecsDir(), featureId);
  if (!existsSync(featureDir)) {
    require('fs').mkdirSync(featureDir, { recursive: true });
    console.log(`📁 已创建目录: ${featureDir}`);
  }
  
  // 2. 检查任务完成状态，在真实情况下可能需要更新state.json
  const statePath = getStatePath(featureId);
  let currentState = {};
  if (existsSync(statePath)) {
    try {
      currentState = JSON.parse(readFileSync(statePath, 'utf-8'));
    } catch (e) {
      console.log('⚠️  无法读取 state.json，将创建新的状态');
    }
  }
  
  // 3. 在真实实现中，这会有特定的逻辑来处理每个任务
  // 这里只是模拟标记任务为完成的过程
  const updatedState = {
    ...currentState,
    feature: featureId,
    lastTaskProcessed: taskId,
    lastTaskProcessedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // 保存更新后的状态
  writeFileSync(statePath, JSON.stringify(updatedState, null, 2));
  console.log(`✅ 任务状态已更新: ${statePath}`);
  
  // 4. 显示模拟实现的结果
  const filesModified = [
    `${featureId}/implementation-notes-${taskId.toLowerCase().replace('-', '_')}.md`,
    `${featureId}/sample-code.${taskId.toLowerCase().replace('-', '_')}.ts`
  ];
  
  console.log(`📝 模拟创建以下文件（仅为演示目的）:`);
  for (const file of filesModified) {
    const fullPath = join(featureDir, file);
    console.log(`  - 临时文件: ${fullPath}`);
  }
  
  // 输出完成反馈
  console.log(`\n✨ ${taskId} 任务已标记为已完成`);
  console.log(`📈 请参考 ${getTasksPath(featureId)} 进行人工实现`); 
  console.log(`📋 建议后续执行: 
  - 查看任务详细信息：@sdd-tasks ${featureId} --show
  - 完成其他相关任务：@sdd-build NEXT_TASK_ID ${featureId}`);
}

// 如果作为命令行执行
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('用法: node sdd-build.js <task-id> <feature-id> [--dry-run]');
    process.exit(1);
  }
  
  const taskId = args[0];
  const featureId = args[args.length > 1 ? 1 : 0]; // 如果提供两个参数，则第二个是featureId
  const isDryRunArg = args[2] || args[1]; // 获取第三个参数或者第二个(如果只提供了task-id和--dry-run)
  const dryRun = isDryRunArg === '--dry-run';
  
  sddBuild(taskId, featureId, { dryRun }).catch(console.error);
}