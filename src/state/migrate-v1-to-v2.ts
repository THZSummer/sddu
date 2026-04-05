// Migration utility from v1.2.11 to v2.0.0
// Provides backward compatibility for state schema evolution

import { StateV2_0_0, validateState } from './schema-v2.0.0';

/**
 * Represents legacy state schema v1.2.11 format
 */
interface LegacyStateV1_2_11 {
  featureId: string;
  name?: string;
  status: string;  // General status, needs mapping to new phases
  phase: number;
  progress: number; // Percentage completion
  specPath?: string;
  planPath?: string;
  lastUpdated: string;
  dependencies?: string[];
}

/**
 * Maps legacy status values to new workflow status values
 */
const mapLegacyStatus = (legacyStatus: string): string => {
  // Simple mapping logic - extendable for complex status mappings
  switch (legacyStatus.toLowerCase()) {
    case 'initiated':
    case 'draft':
    case 'created':
      return 'specified';
    case 'planning':
    case 'designed':
      return 'planned';
    case 'inprogress':
    case 'active':
      return 'building';
    case 'completed':
    case 'finished':
      return 'validated';
    default:
      return legacyStatus; // Pass through unknown status values
  }
};

/**
 * Migrates legacy state schema (v1.2.11) to new schema (v2.0.0)
 * @param legacyState State object in v1.2.11 format
 * @returns State object in v2.0.0 format
 */
export function migrateFromV1_2_11(legacyState: LegacyStateV1_2_11): StateV2_0_0 {
  // Convert legacy state to new format
  const newState: StateV2_0_0 = {
    feature: legacyState.featureId, // Changed from featureId to feature
    name: legacyState.name,
    version: 'v2.0.0',
    status: mapLegacyStatus(legacyState.status) as any, // Cast since we're mapping legacy
    phase: legacyState.phase,
    phaseHistory: [
      {
        phase: legacyState.phase,
        status: mapLegacyStatus(legacyState.status) as any, // Same cast
        timestamp: legacyState.lastUpdated,
        triggeredBy: 'migration-tool',
        comment: `Migrated from legacy status: ${legacyState.status}`
      }
    ],
    files: {
      spec: legacyState.specPath || `.sdd/${legacyState.featureId}/spec.md`,
      plan: legacyState.planPath
    },
    dependencies: {
      on: legacyState.dependencies || [],
      blocking: []
    },
    metadata: {
      featureId: legacyState.featureId,
      createdAt: legacyState.lastUpdated,
      updatedAt: new Date().toISOString(),
      priority: 'P1' // Default priority during migration
    },
    history: [
      {
        timestamp: legacyState.lastUpdated,
        from: undefined,
        to: mapLegacyStatus(legacyState.status),
        triggeredBy: 'migration-tool',
        comment: 'Initial migration from v1.2.11 to v2.0.0',
        version: 'v1.2.11-to-v2.0.0'
      }
    ]
  };

  // Validate the migrated state before returning
  if (!validateState(newState)) {
    throw new Error('Migrated state validation failed');
  }

  return newState;
}

/**
 * Checks if an object might be a legacy state (v1.2.11)
 * @param obj Unknown object to check
 * @returns True if object appears to be legacy state
 */
export function isLegacyState(obj: any): boolean {
  return (
    obj &&
    typeof obj === 'object' &&
    'featureId' in obj && // Legacy property (not 'feature')
    'status' in obj &&
    'lastUpdated' in obj &&
    !('phaseHistory' in obj) // New property not in legacy version
  );
}

// Export as part of the schema migration utilities
export {
  LegacyStateV1_2_11
};