// 定义统一的状态Schema v1.2.11 - 不包含 mode 和 subFeatures 字段
import { FeatureStatus } from './types';

export interface StateV1_2_11 {
  feature: string;
  name?: string;
  version: '1.2.11';
  status: FeatureStatus;
  phase?: number;
  files?: {
    spec?: string;
    plan?: string;
    tasks?: string;
    readme?: string;
    discovery?: string;
  };
  dependencies?: {
    on?: string[];
    blocking?: string[];
  };
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 验证 State 对象是否符合 v1.2.11 Schema
 */
export function validateState(state: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 必需字段验证
  if (!state || typeof state !== 'object') {
    return { valid: false, errors: ['State must be an object'] };
  }
  
  if (typeof state.feature !== 'string') {
    errors.push('feature must be a string');
  }
  
  if (state.version !== '1.2.11') {
    errors.push('version must be "1.2.11"');
  }
  
  const allowedStatuses: FeatureStatus[] = [
    'drafting', 'discovered', 'specified', 'planned', 'tasked', 
    'implementing', 'reviewed', 'validated', 'completed'
  ];
  
  if (!allowedStatuses.includes(state.status)) {
    errors.push(`status must be one of: ${allowedStatuses.join(', ')}`);
  }
  
  // 验证 phase 如果提供的话
  if (state.phase !== undefined && 
      (typeof state.phase !== 'number' || state.phase < 1 || state.phase > 6)) {
    errors.push('phase must be a number between 1 and 6 if provided');
  }
  
  // 验证 files 对象如果提供的话
  if (state.files !== undefined) {
    if (typeof state.files !== 'object') {
      errors.push('files must be an object if provided');
    } else {
      if (state.files.spec !== undefined && typeof state.files.spec !== 'string') {
        errors.push('files.spec must be a string if provided');
      }
      if (state.files.plan !== undefined && typeof state.files.plan !== 'string') {
        errors.push('files.plan must be a string if provided');
      }
      if (state.files.tasks !== undefined && typeof state.files.tasks !== 'string') {
        errors.push('files.tasks must be a string if provided');
      }
      if (state.files.readme !== undefined && typeof state.files.readme !== 'string') {
        errors.push('files.readme must be a string if provided');
      }
      if (state.files.discovery !== undefined && typeof state.files.discovery !== 'string') {
        errors.push('files.discovery must be a string if provided');
      }
    }
  }
  
  // 验证 dependencies 对象如果提供的话
  if (state.dependencies !== undefined) {
    if (typeof state.dependencies !== 'object') {
      errors.push('dependencies must be an object if provided');
    } else {
      if (state.dependencies.on !== undefined && !Array.isArray(state.dependencies.on)) {
        errors.push('dependencies.on must be an array if provided');
      } else if (Array.isArray(state.dependencies.on)) {
        for (let i = 0; i < state.dependencies.on.length; i++) {
          if (typeof state.dependencies.on[i] !== 'string') {
            errors.push(`dependencies.on[${i}] must be a string`);
          }
        }
      }
      
      if (state.dependencies.blocking !== undefined && !Array.isArray(state.dependencies.blocking)) {
        errors.push('dependencies.blocking must be an array if provided');
      } else if (Array.isArray(state.dependencies.blocking)) {
        for (let i = 0; i < state.dependencies.blocking.length; i++) {
          if (typeof state.dependencies.blocking[i] !== 'string') {
            errors.push(`dependencies.blocking[${i}] must be a string`);
          }
        }
      }
    }
  }
  
  // 验证 assignee 如果提供的话
  if (state.assignee !== undefined && typeof state.assignee !== 'string') {
    errors.push('assignee must be a string if provided');
  }
  
  // 验证 createdAt 和 updatedAt 如果提供的话
  if (state.createdAt !== undefined && typeof state.createdAt !== 'string') {
    errors.push('createdAt must be a string if provided');
  }
  if (state.updatedAt !== undefined && typeof state.updatedAt !== 'string') {
    errors.push('updatedAt must be a string if provided');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * 创建初始状态对象
 */
export function createInitialState(feature: string, name?: string): StateV1_2_11 {
  const now = new Date().toISOString();
  
  return {
    feature,
    name: name || undefined,
    version: '1.2.11',
    status: 'drafting' as FeatureStatus,
    files: {
      spec: `.sdd/specs-tree-root/${feature}/spec.md`,
      plan: `.sdd/specs-tree-root/${feature}/plan.md`,
      tasks: `.sdd/specs-tree-root/${feature}/tasks.md`,
      readme: `.sdd/specs-tree-root/${feature}/README.md`,
      discovery: `.sdd/specs-tree-root/${feature}/discovery.md`
    },
    dependencies: {
      on: [],
      blocking: []
    },
    createdAt: now,
    updatedAt: now
  };
}