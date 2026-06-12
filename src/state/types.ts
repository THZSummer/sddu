// State module type exports
//
// v3.0.0 (current — active schema):
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
  shouldRecommendContinue,
  getNextRecommendedPhase,
  isStatusReversible,
} from './schema-v3.0.0';

// v2.x (legacy — retained for reference and migration; not used in active flows)
/** @deprecated Use `StateV3_0_0` instead. This schema is retained for migration reference only. */
export {
  WorkflowStatus,
  PhaseHistory,
  StateV2_0_0,
  validateState,
} from './schema-v2.0.0';
