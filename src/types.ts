// SDDU 工具系统类型定义统一出口
// 整合所有分散的类型定义，提供统一导入接口
// 实现 FR-001~005: 统一工具函数管理

// Import from state machine
import { 
  WorkflowStatus,
  PhaseHistory,
  StateV2_0_0,
  validateState,
  FeatureStateEnum,
  FeatureState,
  TransitionResult,
  AgentTransitionHook,
  AutoUpdaterIntegration,
  FeatureWithFullHistory,
} from './state/machine';

import { StateV2_1_0 } from './state/schema-v2.0.0';

// Import tree scanner types
import {
  FeatureTreeNode,
  ScanResult,
} from './state/tree-scanner';

// Import the ChildFeatureInfo from the correct module
import { ChildFeatureInfo } from './state/schema-v2.0.0';

export type {
  WorkflowStatus,
  PhaseHistory,
  StateV2_0_0,
  StateV2_1_0,            // New for tree structure
  ChildFeatureInfo,       // New for tree structure (moved from correct import)
  FeatureTreeNode,        // New for tree structure
  ScanResult,             // New for tree structure
  FeatureStateEnum,
  FeatureState,
  TransitionResult,
  AgentTransitionHook,
  AutoUpdaterIntegration,
  FeatureWithFullHistory,
};

export {
  validateState  
} from './state/machine';

// 从 discovery 模块重新导出类型
export type {
  DiscoveryStep,
  DiscoveryContext,
  DiscoveryProgress,
  DiscoveryResult,
  CoachingConfig,  // 添加缺失的CoachongConfig
  StepExecutionResult,
} from './discovery/types';

export {
  CoachingLevel
} from './discovery/types';

// 从 agents 模块重新导出类型
export type {
  AgentIntegrationResult,
} from './agents/sddu-agents';

// 从 utils/tasks-parser 模块重新导出类型  
export type {
  ParsedTask,
  ParallelGroup,
  ExecutionWave,
} from './utils/tasks-parser';

export {
  parseTasksMarkdown,
  parseParallelGroups,
  computeExecutionOrder,
  detectTaskCircularDependency,
  getReadyTasks,
  getIncompleteTasks,
  areDependenciesSatisfied,
  parseTask,
} from './utils/tasks-parser';

// 从 utils/subfeature-manager 模块重新导出类型
export type {
  SubFeatureMeta,
} from './utils/subfeature-manager';

export {
  detectFeatureMode,
  createSubFeature,
  generateSubFeatureIndex,
  scanSubFeatures,
  validateSubFeatureCompleteness,
} from './utils/subfeature-manager';

/**
 * Agent 元数据接口，用于动态 Agent 注册
 * 解决 T-002 Agent 注册静态化问题
 */
export interface AgentMetadata {
  name: string;
  description: string;
  mode: string;
  promptFile: string;
}

/**
 * SDDU 配置选项接口
 * 统一配置接口，便于扩展
 */
export interface SdduConfig {
  autoUpdateState?: boolean;  // 是否自动更新状态
  enableDiscovery?: boolean;  // 是否启用自动发现
  logLevel?: 'debug' | 'info' | 'warn' | 'error';  // 日志级别
  defaultTimeout?: number;    // 默认超时时间
  maxRetries?: number;        // 最大重试次数
  
  // Tree structure configurations
  enableTreeStructure?: boolean;  // Whether to enable tree structure optimization
  maxTreeDepth?: number;          // Maximum allowed tree depth (default: 5)
}

// There may be two HistoryEntry types from different modules, I'll make sure only one is exported
// 重新导出 HistoryEntry (only once)
export type { HistoryEntry } from './state/machine';

export default {};