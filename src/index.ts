// SDDU Plugin — 公共 API 薄桶导出
// 不包含任何平台注册逻辑（已迁至 src/adapters/opencode/plugin.ts）
// 仅从各业务域和 shared/ 的 index.ts 做 re-export

// ============================================================================
// 共享层 — 零平台依赖，可被所有域安全引用
// ============================================================================
export {
  AgentMetadata,
  SdduConfig,
  WorkflowStatus,
  PhaseHistory,
} from './shared/types';

export {
  ErrorCode,
  ErrorContext,
  SdduError,
  StateError,
  DiscoveryError,
  ToolError,
  AgentError,
  ConfigError,
  TreeStructureError,
  ErrorHandler,
  formatErrorMessage,
} from './shared/errors';

export {
  ToolDefinition,
  AgentDefinition,
  EventHandler,
  PlatformContext,
  PlatformAdapter,
} from './shared/platform-adapter';

// ============================================================================
// 业务域 — SDDU 方法论核心
// ============================================================================

// Pipeline — 管线定义与工作流阶段流转
export {
  PipelineStageConfig,
  PipelineWorkflowStatus,
  PipelineContext,
  PipelineExecutionRecord,
  PipelineValidationResult,
  PipelineWorkflowEngine,
  CoachingLevel,
  CoachingConfig,
  COACHING_CONFIGS,
  CoachingModeEngine,
  PipelineStateValidator,
} from './pipeline';

// State — 状态追踪与 Schema 管理
export {
  Phase,
  FeatureStatus,
  StateV3_0_0,
  PhaseHistoryEntry,
  SuspendedInfo,
  MergedInfo,
  ChildFeatureInfoV3,
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
} from './state';

export {
  StateMachine,
  DependencyChecker,
  StateLoader,
  AutoUpdater,
  ParentStateManager,
  TreeStateValidator,
  ConsistencyChecker,
} from './state';

export type {
  ConsistencyAnomaly,
  ConsistencyReport,
  ConsistencyState,
  AnomalyType,
} from './state';

export {
  FeatureStateEnum,
  FeatureState,
  TransitionResult,
  HistoryEntry,
  FeatureWithFullHistory,
} from './state';

// Schema legacy
export { StateV2_0_0, StateV2_1_0 } from './state';

// Migration
export { migrateState, MigrationResult } from './state';

// Discovery — 需求挖掘阶段逻辑
export {
  DiscoveryWorkflowEngine,
  DISCOVERY_WORKFLOW,
  DiscoveryConfig,
  DiscoveryStateValidator,
  DiscoveryWorkflowStatus,
  StatusChangeCallback,
} from './discovery';

export type {
  DiscoveryStep,
  DiscoveryContext,
  DiscoveryProgress,
  DiscoveryResult,
  StepExecutionResult,
} from './discovery';

// Agents — 智能体注册（从适配层导出）
export {
  IAgentRegistry,
  agentRegistry,
} from './adapters/opencode';

export type {
  AgentIntegrationResult,
} from './adapters/opencode';

// Templates — 模板引擎
export {
  SubFeatureTemplate,
} from './templates';

export type {
  SubFeatureMeta,
  SubFeatureInfo,
} from './templates';

// Task parsing (from pipeline domain)
export {
  parseTasksMarkdown,
  parseParallelGroups,
  computeExecutionOrder,
  detectTaskCircularDependency,
  getReadyTasks,
  getIncompleteTasks,
  areDependenciesSatisfied,
  parseTask,
} from './pipeline';

export type {
  ParsedTask,
  ParallelGroup,
  ExecutionWave,
} from './pipeline';

// ============================================================================
// OpenCode 平台适配层
// ============================================================================
export { SDDUPlugin, SdduMigrateSchemaCommand } from './adapters/opencode';

// 默认导出（向后兼容）
import { SDDUPlugin as _SDDUPlugin } from './adapters/opencode';
export default _SDDUPlugin;
