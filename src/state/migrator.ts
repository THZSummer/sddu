import fs from 'fs/promises';
import path from 'path';

/**
 * 迁移结果接口定义
 */
export interface MigrationResult {
  success: boolean;
  backupPath?: string;
  error?: string;
}

/**
 * 检测状态版本，判断是否需要迁移
 * @param state 旧状态对象
 * @returns true 如果需要迁移，false 如果已经是最新版本
 */
function needsMigration(state: any): boolean {
  const version = state.version;
  if (!version) return true; // 没有版本号，默认需要迁移到最新的
  
  // 比较版本号：检查是否小于 1.2.5
  const [major1, minor1, patch1] = version.split('.').map(Number);
  const [major2, minor2, patch2] = '1.2.5'.split('.').map(Number);
  
  if (major1 < major2) return true;
  if (major1 === major2 && minor1 < minor2) return true;
  if (major1 === major2 && minor1 === minor2 && patch1 < patch2) return true;
  
  return false;
}

/**
 * 从 v1.1.1 版本迁移状态到 v1.2.5 版本
 * 将单模块格式升级为 multi 模式，创建单个子 Feature
 * @param oldState 原来的状态对象
 * @returns 迁移后的新状态对象
 */
export function migrateFrom111(oldState: any): any {
  // 推断子 Feature ID，如果原来没有 ID，则使用 feature 字段的值
  const subFeatureId = oldState.feature || 'main';
  const now = new Date().toISOString();

  return {
    ...oldState,
    version: '1.2.5',
    mode: 'multi',
    subFeatures: [{
      id: subFeatureId,
      dir: `sub-features/${subFeatureId}`,
      status: oldState.status || 'specified',
      stateFile: `specs-tree-root/${oldState.feature || 'main'}/.state.json`
    }],
    dependencies: {},
    updatedAt: now,
    migrationTimestamp: now
  };
}

/**
 * 创建状态迁移备份
 * 迁移前自动备份原始状态
 * @param state 要备份的状态
 * @param featureId 主 feature ID
 * @param specsDir specs 目录路径
 * @returns 备份文件的路径
 */
export async function backupState(
  state: any,
  featureId: string,
  specsDir: string
): Promise<string> {
  // 确保备份目录存在
  const backupDir = path.join(specsDir, '.state.backup');
  await fs.mkdir(backupDir, { recursive: true });
  
  // 生成备份文件名，格式为 state-YYYYMMDD-HHMMSS.json
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')           // 移除破折号和冒号
    .replace(/\.\d{3}/, '')         // 移除毫秒
    .substring(0, 15);               // 截取到 HHMMSS 格式
  const backupFilename = `state-${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFilename);
  
  // 写入备份
  await fs.writeFile(backupPath, JSON.stringify(state, null, 2));
  
  console.log(`📊 状态备份已创建: ${backupPath}`);
  return backupPath;
}

/**
 * 将状态回滚到备份文件
 * @param featureId 主 feature ID
 * @param specsDir specs 目录路径
 * @param backupPath 备份文件路径（如果不提供，则尝试找回最新的备份）
 * @returns 回滚后的状态
 */
export async function rollbackState(
  featureId: string,
  specsDir: string,
  backupPath?: string
): Promise<any> {
  let backupToUse = backupPath;
  
  // 如果没有明确提供备份路径，尝试搜索最近的备份
  if (!backupToUse) {
    const backupDir = path.join(specsDir, '.state.backup');
    try {
      const files = await fs.readdir(backupDir);
      const jsonFiles = files
        .filter(f => f.startsWith('state-') && f.endsWith('.json'))
        .sort()  // 按时间排序（因为我们按时间戳命名备份文件）
        .reverse();  // 最新的在前面
      
      if (jsonFiles.length > 0) {
        backupToUse = path.join(backupDir, jsonFiles[0]);
        console.log(`🔄 使用最新备份进行回滚: ${backupToUse}`);
      } else {
        throw new Error('未找到任何备份文件');
      }
    } catch (error) {
      throw new Error(`无法回滚: 未找到备份目录 ${backupDir}`);
    }
  } else {
    console.log(`🔄 使用指定备份进行回滚: ${backupToUse}`);
  }

  // 检查备份文件是否存在
  try {
    await fs.access(backupToUse);
  } catch (error) {
    throw new Error(`备份文件不存在: ${backupToUse}`);
  }

  // 读取备份内容并返回
  const backupContent = await fs.readFile(backupToUse, 'utf-8');
  const restoredState = JSON.parse(backupContent);

  console.log('✅ 状态已成功回滚至备份');
  return restoredState;
}

/**
 * 执行状态迁移
 * 自动检测旧格式状态，执行必要的迁移，并在必要时创建备份和提供回滚能力
 * @param oldState 原有的状态对象
 * @param featureId 主 feature ID
 * @param specsDir specs 目录路径
 * @returns 迁移结果
 */
export async function migrateState(
  oldState: any,
  featureId: string,
  specsDir: string
): Promise<MigrationResult> {
  console.log(`🔄 开始迁移状态: ${featureId}`);

  try {
    // 检测是否需要迁移
    if (!needsMigration(oldState)) {
      console.log('✅ 状态已是最新版本，无需迁移');
      return {
        success: true
      };
    }

    console.log(`🔧 检测到需要迁移的状态 - 当前版本: ${oldState.version || '未指定'}`);

    // 迁移前创建备份
    const backupPath = await backupState(oldState, featureId, specsDir);

    // 根据当前版本执行相应的迁移逻辑
    let newState: any;
    if (!oldState.version || oldState.version === '1.1.1') {
      console.log('📈 执行 v1.1.1 → v1.2.5 迁移逻辑');
      newState = migrateFrom111(oldState);
    } else {
      // 如果是中间版本，可以添加更多迁移分支
      console.log(`⚠️ 发现未知版本 ${oldState.version}，尝试使用最通用的迁移逻辑`);
      newState = migrateFrom111(oldState);  // 默认使用 v1.1.1 迁移逻辑
    }

    // 验证迁移结果的基本结构
    if (!newState.version || newState.version !== '1.2.5') {
      throw new Error('迁移失败：结果状态版本号错误');
    }

    if (newState.mode !== 'multi') {
      throw new Error('迁移失败：结果状态模式不是 multi');
    }

    console.log('✅ 状态迁移成功');
    
    return {
      success: true,
      backupPath: backupPath
    };
    
  } catch (error) {
    console.error('❌ 状态迁移失败:', error instanceof Error ? error.message : String(error));
    
    // 迁移失败，但记录错误信息
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 检查是否存在备份文件
 * @param specsDir specs 目录路径
 * @returns 是否存在备份
 */
export async function hasBackup(specsDir: string): Promise<boolean> {
  const backupDir = path.join(specsDir, '.state.backup');
  try {
    await fs.access(backupDir);
    const files = await fs.readdir(backupDir);
    return files.some(f => f.startsWith('state-') && f.endsWith('.json'));
  } catch (error) {
    return false;
  }
}