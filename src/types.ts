// SDDU 工具系统类型定义统一出口
// 整合所有分散的类型定义，提供统一导入接口
// 实现 FR-001~005: 统一工具函数管理

// ============================================================================
// v3.0.0 Schema (active — current)
// ============================================================================
export type {
  Phase,
  FeatureStatus,
  StateV3_0_0,
  PhaseHistoryEntry,
  SuspendedInfo,
  MergedInfo,
  ChildFeatureInfoV3,
} from './state/schema-v3.0.0';

export {
  VALID_PHASES,
  VALID_STATUSES,
  PHASE_ORDER,
  NEXT_PHASE,
  IRREVERSIBLE_STATUSES,
  phaseFlow,
  validateStateV3,
  validateStateV3Detailed,
  shouldRecommendContinue,
  getNextRecommendedPhase,
  isStatusReversible,
} from './state/schema-v3.0.0';

// ============================================================================
// v2.x Schema (legacy — retained for migration reference only)
// ============================================================================

// Import from state machine (v3.0.0 compatible — old names are @deprecated aliases)
import { 
  FeatureStateEnum,
  FeatureState,
  TransitionResult,
  AgentTransitionHook,
  AutoUpdaterIntegration,
  FeatureWithFullHistory,
  HistoryEntry,
} from './state/machine';

import { StateV2_0_0, StateV2_1_0 } from './state/schema-v2.0.0';

// Import tree scanner types (type-only to avoid circular module loading in jest)
import type {
  FeatureTreeNode,
  ScanResult,
} from './state/tree-scanner';

// Import the ChildFeatureInfo and tree validator types 
import { ChildFeatureInfo } from './state/schema-v2.0.0';

// Import tree state validator types
import {
  TreeValidationResult, 
  TreeValidationError, 
  TreeValidationWarning
} from './state/tree-state-validator';
export type {
  TreeValidationResult, 
  TreeValidationError, 
  TreeValidationWarning 
} from './state/tree-state-validator';

// Additional import for the actual class
import { TreeStateValidator } from './state/tree-state-validator';
export { TreeStateValidator } from './state/tree-state-validator';

/** @deprecated Use `Phase` from v3.0.0 instead. `WorkflowStatus` was the old 6-state schema. */
export type WorkflowStatus = 'specified' | 'planned' | 'tasked' | 'implementing' | 'reviewed' | 'validated';

/** @deprecated Use `PhaseHistoryEntry` from v3.0.0 instead. */
export type PhaseHistory = Array<{
  phase: string;
  timestamp: string;
  triggeredBy: string;
  comment?: string;
}>;

/** @deprecated Use `validateStateV3` from v3.0.0 instead. */
export function validateState(state: unknown): boolean {
  // Legacy shim — delegates to v3.0.0 validator
  const { validateStateV3 } = require('./state/schema-v3.0.0');
  return validateStateV3(state);
}

export type {
  StateV2_0_0,
  StateV2_1_0,
  ChildFeatureInfo,
  FeatureTreeNode,
  ScanResult,
  FeatureStateEnum,
  FeatureState,
  TransitionResult,
  AgentTransitionHook,
  AutoUpdaterIntegration,
  FeatureWithFullHistory,
  // v3.0.0 types (re-exported for convenience)
};

// 从 discovery 模块重新导出类型
export type {
  DiscoveryStep,
  DiscoveryContext,
  DiscoveryProgress,
  DiscoveryResult,
  CoachingConfig,  // 添加缺失的CoachingConfig
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

/** @deprecated Use `PhaseHistoryEntry` from v3.0.0 instead */
export type { HistoryEntry } from './state/machine';

export default {};
