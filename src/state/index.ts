// state/ 公共 API 出口 — 状态追踪
// 域间 import 只能通过此文件，不得直接引用内部文件
// 规则：零 @opencode-ai/plugin 依赖，不反向引用 adapters/

// v3.0.0 schema (active — current) — takes priority for shared names
export * from './schema-v3.0.0';

// v2.x schema (legacy) — selective to avoid collision with v3.0.0 exports
export {
  WorkflowStatus,
  PhaseHistory,
  StateV2_0_0,
  StateV2_1_0,
} from './schema-v2.0.0';

// v1.x schema (legacy) — selective to avoid collision with v2.x/v3.0.0 exports
export {
  StateV1_2_5,
} from './schema-v1.2.5';

// State machine core
export * from './machine';

// Tree scanner
export * from './tree-scanner';

// State loader (distributed state)
export * from './state-loader';

// Consistency checker
export { ConsistencyChecker } from './consistency-checker';
export type {
  ConsistencyAnomaly,
  ConsistencyReport,
  ConsistencyState,
  AnomalyType,
} from './consistency-checker';

// Auto updater
export * from './auto-updater';

// Parent state manager
export * from './parent-state-manager';

// Tree state validator — selective export to avoid ValidationResult collision with schema-v3.0.0
export { TreeStateValidator } from './tree-state-validator';
export type {
  TreeValidationResult,
  TreeValidationError,
  TreeValidationWarning,
} from './tree-state-validator';

// Migration utilities
export * from './migrate-v1-to-v2';
export * from './migrator';

// Dependency checker
export * from './dependency-checker';

// Multi-feature manager
export * from './multi-feature-manager';
