import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * 检测是否为旧格式 state.json（v1.1.1 或更早）
 * 旧格式通常没有 version 字段或 version 小于当前版本
 */
export function isLegacyState(state: any): boolean {
  // 如果没有 version 字段，视为旧格式
  if (!state.version) {
    return true;
  }
  
  // 如果版本低于 1.2.11，视为旧格式需要兼容
  try {
    const currentVersion = '1.2.11';
    return compareVersions(state.version, currentVersion) < 0;
  } catch (e) {
    console.warn('状态版本比较失败，视为旧格式:', e);
    return true;
  }
}

/**
 * 比较版本号大小
 * @returns -1: v1 < v2, 0: v1 == v2, 1: v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  
  return 0;
}

/**
 * 检测旧 .specs/ 结构
 * 逻辑：检查工作目录是否存在 .specs/ 目录但不存在 .sdd/ 目录
 */
export function hasLegacySpecsStructure(): boolean {
  const hasLegacySpecs = existsSync('.specs') && statSync('.specs').isDirectory();
  const hasNewContainer = existsSync('.sdd') && statSync('.sdd').isDirectory();
  
  // 存在 .specs/ 但不存在 .sdd/ 时，认为是旧结构
  return hasLegacySpecs && !hasNewContainer;
}

/**
 * 检测是否存在混合结构（既有 .specs，又有 .sdd）
 * 这种情况需要特别处理
 */
export function hasMixedStructure(): boolean {
  return existsSync('.specs') && existsSync('.sdd');
}

/**
 * 检测是否存在新的容器化结构
 */
export function hasContainerizedStructure(): boolean {
  return existsSync('.sdd') && existsSync('.sdd/.specs');
}

/**
 * 获取迁移建议信息
 * 根据检测到的项目结构给出相应的建议
 */
export function getMigrationSuggestion(): string {
  if (hasLegacySpecsStructure()) {
    return '检测到旧版 .specs/ 结构，建议迁移到 .sdd/.specs/ 容器化结构';
  }
  
  if (hasMixedStructure()) {
    return '检测到混合结构（.specs/ 和 .sdd/ 同时存在），建议统一使用 .sdd/.specs/ 结构';
  }
  
  if (hasContainerizedStructure() && !hasLegacySpecsStructure()) {
    return '项目使用现代化的 .sdd/ 容器化结构，推荐使用方式 ✅';
  }
  
  return '未能识别现有 SDD 项目结构';
}

/**
 * 实现行功能
 * 将旧格式状态迁移到新格式，并保持向后兼容
 */
export function migrateLegacyState(legacyState: any): any {
  // 记录原来的状态信息
  const { mode, subFeatures, ...rest } = legacyState;
  
  // 创建新格式状态
  const migratedState = {
    ...rest,
    version: '1.2.11',  // 更新版本号
    updatedAt: new Date().toISOString(),  // 更新时间戳
  };
  
  // 如果旧格式中有 created 时间但没有 updated 时间，将 created 设置为 updated
  if (rest.createdAt && !rest.updatedAt) {
    migratedState.updatedAt = rest.createdAt;
  }
  
  // 移除旧格式特有的字段（这些将通过目录结构和其他地方获取）
  delete (migratedState as any).mode;
  delete (migratedState as any).subFeatures;
  
  return migratedState;
}

/**
 * 尝试读取 state.json 并智能处理新旧格式
 * @param filePath state.json 文件路径
 * @returns 处理后的状态对象
 */
export function readStateWithCompatibility(filePath: string): any {
  if (!existsSync(filePath)) {
    return null;
  }
  
  try {
    const rawContent = readFileSync(filePath, 'utf-8');
    let state: any;
    
    try {
      state = JSON.parse(rawContent);
    } catch (parseError) {
      throw new Error(`无效的 JSON 格式: ${filePath}, 错误: ${parseError.message}`);
    }
    
    // 检查是否为旧格式
    if (isLegacyState(state)) {
      console.warn(`检测到旧版本 state.json 格式: ${filePath}, 已应用兼容处理`);
      
      // 进行向后兼容处理
      return migrateLegacyState(state);
    }
    
    // 新格式直接返回
    return state;
  } catch (error: any) {
    throw new Error(`读取状态文件失败 (${filePath}): ${error.message}`);
  }
}

/**
 * 检查目录是否包含 SDD 项目结构
 * 搜索可能存在的旧或新格式
 */
export function detectSDDStructure(rootDir: string): {
  hasLegacyStructure: boolean;
  hasContainerizedStructure: boolean;
  hasMixedStructure: boolean;
  specsPath: string;
  suggestion: string;
} {
  const results = {
    hasLegacyStructure: hasLegacySpecsStructure(),
    hasContainerizedStructure: hasContainerizedStructure(),
    hasMixedStructure: hasMixedStructure(),
    specsPath: '',
    suggestion: ''
  };
  
  if (results.hasContainerizedStructure && !results.hasLegacyStructure) {
    results.specsPath = join(rootDir, '.sdd', '.specs');
    results.suggestion = getMigrationSuggestion();
  } else if (results.hasLegacyStructure && !results.hasContainerizedStructure) {
    results.specsPath = join(rootDir, '.specs');
    results.suggestion = getMigrationSuggestion();
  } else if (results.hasMixedStructure) {
    // 当出现混合结构时，优先使用容器化结构
    if (existsSync(join(rootDir, '.sdd', '.specs'))) {
      results.specsPath = join(rootDir, '.sdd', '.specs');
    } else {
      results.specsPath = join(rootDir, '.specs');
    }
    results.suggestion = getMigrationSuggestion();
  } else {
    results.specsPath = '';
  }
  
  return results;
}

/**
 * 兼容性工具配置，可以在运行时启用不同的选项
 */
export class CompatibilityConfig {
  // 是否启用详细兼容性日志
  enableDetailedLogging: boolean = true;
  
  // 是否阻止旧格式使用（强烈建议升级时）
  forceModernFormat: boolean = false;
  
  // 旧格式迁移路径
  migrationBackupPath: string = '.sdd/.backups/';
  
  constructor(config: Partial<CompatibilityConfig> = {}) {
    Object.assign(this, config);
  }
}

// 导出常用的兼容功能
export default {
  isLegacyState,
  hasLegacySpecsStructure,
  hasContainerizedStructure,
  hasMixedStructure,
  getMigrationSuggestion,
  migrateLegacyState,
  readStateWithCompatibility,
  detectSDDStructure,
  CompatibilityConfig
};