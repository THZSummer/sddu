// State module index - exports all state management functionality

// v3.0.0 schema (active — current)
export * from './schema-v3.0.0';

// Type exports (includes both v3.0.0 and legacy v2.x types)
export * from './types';

// v2.x schema (legacy — retained for migration reference)
export * from './schema-v2.0.0';

// Migration utilities
export * from './migrate-v1-to-v2';

// Consistency checker (TASK-007 — R5 built-in upgrade mechanism)
export { ConsistencyChecker } from './consistency-checker';
export type {
  ConsistencyAnomaly,
  ConsistencyReport,
  ConsistencyState,
  AnomalyType,
} from './consistency-checker';
