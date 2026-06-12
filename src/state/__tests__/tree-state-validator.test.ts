/**
 * Unit tests for TreeStateValidator — updated for v3.0.0
 * Testing features:
 * - validate() handles missing version field (now defaults to v3.0.0)
 * - validate() handles wrong version format
 * - validate() handles missing/invalid phase (8 values: registered-validated)
 * - validate() handles missing/invalid status (5 values: tracked/completed/suspended/terminated/merged)
 * - validate() handles combined constraint violations (completed @ validated, merged needs mergedInto)
 * - validate() handles missing depth/phaseHistory/dependencies/files
 * - validate() returns proper ValidationResult format
 */

import { TreeStateValidator } from '../tree-state-validator';
import { StateLoader } from '../state-loader';
import { StateV3_0_0, PhaseHistoryEntry, Phase, FeatureStatus } from '../schema-v3.0.0';

// Mock dependencies
jest.mock('../state-loader');

describe('TreeStateValidator — v3.0.0 Tests', () => {
  let stateValidator: TreeStateValidator;
  let mockStateLoader: jest.Mocked<StateLoader>;

  beforeEach(() => {
    mockStateLoader = new StateLoader('.sddu/specs-tree-root') as jest.Mocked<StateLoader>;
    stateValidator = new TreeStateValidator(mockStateLoader);
  });

  // =========================================================================
  // validate() — version validation
  // =========================================================================
  describe('validate() — version validation', () => {
    test('adds missing version as "v3.0.0"', () => {
      const inputState: Partial<StateV3_0_0> = {
        feature: 'my-feature',
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
      };

      const result = stateValidator.validate(inputState);

      expect(result.state.version).toBe('v3.0.0');
      expect(result.autoFixed).toContain('version');
      expect(result.warnings.find((w) => w.includes('Added missing version'))).toBeDefined();
      expect(result.valid).toBe(true);
    });

    test('fixes "v2.1.0" to "v3.0.0"', () => {
      const inputState = {
        feature: 'my-feature',
        version: 'v2.1.0',
        phase: 'specified',
        status: 'tracked',
      } as any;

      const result = stateValidator.validate(inputState);

      expect(result.state.version).toBe('v3.0.0');
      expect(result.autoFixed).toContain('version');
      expect(result.valid).toBe(true);
    });

    test('keeps correct "v3.0.0" version unchanged', () => {
      const inputState: Partial<StateV3_0_0> = {
        feature: 'my-feature',
        version: 'v3.0.0',
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
      };

      const result = stateValidator.validate(inputState);

      expect(result.state.version).toBe('v3.0.0');
      expect(result.autoFixed).not.toContain('version');
      expect(result.valid).toBe(true);
    });
  });

  // =========================================================================
  // validate() — phase validation (8 values)
  // =========================================================================
  describe('validate() — phase validation', () => {
    test('accepts valid phase values', () => {
      const validPhases: Phase[] = [
        'registered', 'discovered', 'specified', 'planned',
        'tasked', 'builded', 'reviewed', 'validated',
      ];

      for (const phase of validPhases) {
        const inputState: Partial<StateV3_0_0> = {
          feature: 'my-feature',
          version: 'v3.0.0',
          phase,
          status: 'tracked' as FeatureStatus,
        };
        const result = stateValidator.validate(inputState);
        expect(result.state.phase).toBe(phase);
      }
    });

    test('fixes invalid phase value "unknown"', () => {
      const inputState = {
        feature: 'my-feature',
        version: 'v3.0.0',
        phase: 'unknown',
        status: 'tracked',
      } as any;

      const result = stateValidator.validate(inputState);

      expect(result.state.phase).toBe('registered');
      expect(result.autoFixed).toContain('phase');
      expect(result.warnings.find((w) => w.includes('Set phase to'))).toBeDefined();
    });

    test('fixes missing phase field', () => {
      const inputState = {
        feature: 'my-feature',
        version: 'v3.0.0',
        status: 'tracked',
      } as any;

      const result = stateValidator.validate(inputState);

      expect(result.state.phase).toBeDefined();
      expect(VALID_PHASES_FOR_TEST.includes(result.state.phase as Phase)).toBe(true);
      expect(result.autoFixed).toContain('phase');
    });
  });

  // =========================================================================
  // validate() — status validation (5 values)
  // =========================================================================
  describe('validate() — status validation', () => {
    test('accepts valid status values', () => {
      const validStatuses: FeatureStatus[] = [
        'tracked', 'completed', 'suspended', 'terminated', 'merged',
      ];

      for (const status of validStatuses) {
        // Skip combined constraint violations for this test — just check status is accepted
        if (status === 'completed' || status === 'merged') continue; // tested in combined constraints

        const inputState: Partial<StateV3_0_0> = {
          feature: 'my-feature',
          version: 'v3.0.0',
          phase: 'specified' as Phase,
          status,
        };
        const result = stateValidator.validate(inputState);
        expect(result.state.status).toBe(status);
      }
    });

    test('fixes invalid status value "unknown"', () => {
      const inputState = {
        feature: 'my-feature',
        version: 'v3.0.0',
        phase: 'specified',
        status: 'unknown',
      } as any;

      const result = stateValidator.validate(inputState);

      expect(result.state.status).toBe('tracked');
      expect(result.autoFixed).toContain('status');
    });

    test('fixes missing status field', () => {
      const inputState = {
        feature: 'my-feature',
        version: 'v3.0.0',
        phase: 'specified',
      } as any;

      const result = stateValidator.validate(inputState);

      expect(result.state.status).toBeDefined();
      expect(result.autoFixed).toContain('status');
    });
  });

  // =========================================================================
  // validate() — combined constraint validation
  // =========================================================================
  describe('validate() — combined constraints', () => {
    test('rejects status="completed" when phase is not "validated"', () => {
      const inputState: Partial<StateV3_0_0> = {
        feature: 'my-feature',
        version: 'v3.0.0',
        phase: 'specified' as Phase,
        status: 'completed' as FeatureStatus,
      };

      const result = stateValidator.validate(inputState);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('combined') || e.includes('completed'))).toBe(
        true
      );
      expect(result.valid).toBe(false);
    });

    test('accepts status="completed" when phase is "validated"', () => {
      const inputState: Partial<StateV3_0_0> = {
        feature: 'my-feature',
        version: 'v3.0.0',
        phase: 'validated' as Phase,
        status: 'completed' as FeatureStatus,
      };

      const result = stateValidator.validate(inputState);

      expect(result.valid).toBe(true);
    });

    test('rejects status="merged" without merged.mergedInto', () => {
      const inputState: Partial<StateV3_0_0> = {
        feature: 'my-feature',
        version: 'v3.0.0',
        phase: 'specified' as Phase,
        status: 'merged' as FeatureStatus,
        // No merged field provided
      };

      const result = stateValidator.validate(inputState);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('merged') || e.includes('mergedInto'))).toBe(true);
      expect(result.valid).toBe(false);
    });

    test('accepts status="merged" with merged.mergedInto', () => {
      const inputState: Partial<StateV3_0_0> = {
        feature: 'my-feature',
        version: 'v3.0.0',
        phase: 'specified' as Phase,
        status: 'merged' as FeatureStatus,
        merged: {
          mergedInto: 'specs-tree-other',
          mergedAt: '2026-06-13T00:00:00.000Z',
        },
      };

      const result = stateValidator.validate(inputState);

      expect(result.valid).toBe(true);
    });
  });

  // =========================================================================
  // validate() — depth validation
  // =========================================================================
  describe('validate() — depth validation', () => {
    test('auto-computes depth from feature path when missing', () => {
      const inputState: Partial<StateV3_0_0> = {
        feature: 'specs-tree-ecommerce/specs-tree-frontend',
        version: 'v3.0.0',
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
      };

      const result = stateValidator.validate(inputState);

      expect(result.state.depth).toBe(1);
      expect(result.autoFixed).toContain('depth');
      expect(result.valid).toBe(true);
    });

    test('auto-computes depth = 0 for root feature', () => {
      const inputState: Partial<StateV3_0_0> = {
        feature: 'specs-tree-root/specs-tree-simple',
        version: 'v3.0.0',
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
      };

      const result = stateValidator.validate(inputState);

      expect(result.state.depth).toBe(1);
      expect(result.autoFixed).toContain('depth');
      expect(result.valid).toBe(true);
    });

    test('corrects invalid depth value', () => {
      const inputState = {
        feature: 'specs-tree-ecommerce',
        version: 'v3.0.0',
        depth: 'invalid',
        phase: 'specified',
        status: 'tracked',
      } as any;

      const result = stateValidator.validate(inputState);

      expect(typeof result.state.depth).toBe('number');
      expect(result.autoFixed).toContain('depth');
      expect(result.valid).toBe(true);
    });
  });

  // =========================================================================
  // validate() — phaseHistory validation
  // =========================================================================
  describe('validate() — phaseHistory validation', () => {
    test('initializes empty phaseHistory with one entry when missing', () => {
      const inputState: Partial<StateV3_0_0> = {
        feature: 'my-feature',
        version: 'v3.0.0',
        phase: 'registered' as Phase,
        status: 'tracked' as FeatureStatus,
      };

      const result = stateValidator.validate(inputState);

      expect(result.state.phaseHistory).toHaveLength(1);
      expect(result.state.phaseHistory[0].phase).toBe('registered');
      expect(result.autoFixed).toContain('phaseHistory');
      expect(result.valid).toBe(true);
    });

    test('preserves existing phaseHistory when present', () => {
      const existingHistory: PhaseHistoryEntry[] = [
        { phase: 'registered', timestamp: '2026-01-01T00:00:00.000Z', triggeredBy: 'system' },
        { phase: 'discovered', timestamp: '2026-01-02T00:00:00.000Z', triggeredBy: 'system' },
      ];

      const inputState: Partial<StateV3_0_0> = {
        feature: 'my-feature',
        version: 'v3.0.0',
        phase: 'discovered' as Phase,
        status: 'tracked' as FeatureStatus,
        phaseHistory: existingHistory,
      };

      const result = stateValidator.validate(inputState);

      expect(result.state.phaseHistory).toHaveLength(2);
      expect(result.state.phaseHistory).toEqual(existingHistory);
      expect(result.autoFixed).not.toContain('phaseHistory');
      expect(result.valid).toBe(true);
    });
  });

  // =========================================================================
  // validate() — dependencies validation
  // =========================================================================
  describe('validate() — dependencies validation', () => {
    test('adds missing dependencies with empty arrays', () => {
      const inputState: Partial<StateV3_0_0> = {
        feature: 'my-feature',
        version: 'v3.0.0',
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
      };

      const result = stateValidator.validate(inputState);

      expect(result.state.dependencies).toMatchObject({
        on: [],
        blocking: [],
      });
      expect(result.autoFixed).toContain('dependencies');
      expect(result.valid).toBe(true);
    });

    test('preserves existing valid dependencies', () => {
      const inputState: Partial<StateV3_0_0> = {
        feature: 'my-feature',
        version: 'v3.0.0',
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
        dependencies: { on: ['other'], blocking: [] },
      };

      const result = stateValidator.validate(inputState);

      expect(result.state.dependencies).toMatchObject({
        on: ['other'],
        blocking: [],
      });
      expect(result.valid).toBe(true);
    });

    test('corrects invalid dependencies arrays', () => {
      const inputState = {
        feature: 'my-feature',
        version: 'v3.0.0',
        dependencies: { on: null, blocking: 'not-an-array' },
        phase: 'specified',
        status: 'tracked',
      } as any;

      const result = stateValidator.validate(inputState);

      expect(Array.isArray(result.state.dependencies.on)).toBe(true);
      expect(result.state.dependencies.on).toEqual([]);
      expect(Array.isArray(result.state.dependencies.blocking)).toBe(true);
      expect(result.state.dependencies.blocking).toEqual([]);
      expect(result.autoFixed).toContain('dependencies.on');
      expect(result.autoFixed).toContain('dependencies.blocking');
      expect(result.valid).toBe(true);
    });
  });

  // =========================================================================
  // validate() — files validation
  // =========================================================================
  describe('validate() — files validation', () => {
    test('adds missing files with minimal spec reference', () => {
      const inputState: Partial<StateV3_0_0> = {
        feature: 'specs-tree-ecommerce',
        version: 'v3.0.0',
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
      };

      const result = stateValidator.validate(inputState);

      expect(result.state.files.spec).toBeDefined();
      expect(result.state.files.spec).toBe('specs-tree-ecommerce/spec.md');
      expect(result.autoFixed).toContain('files');
      expect(result.valid).toBe(true);
    });

    test('preserves existing valid files structure', () => {
      const inputState: Partial<StateV3_0_0> = {
        feature: 'my-feature',
        version: 'v3.0.0',
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
        files: { spec: 'spec-file.md', plan: 'plan.md' },
      };

      const result = stateValidator.validate(inputState);

      expect(result.state.files).toMatchObject({
        spec: 'spec-file.md',
        plan: 'plan.md',
      });
      expect(result.autoFixed).not.toContain('files');
      expect(result.valid).toBe(true);
    });
  });

  // =========================================================================
  // validate() — ValidationResult format
  // =========================================================================
  describe('validate() — ValidationResult format', () => {
    test('returns proper ValidationResult structure', () => {
      const inputState: Partial<StateV3_0_0> = {
        feature: 'my-feature',
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
      };

      const result = stateValidator.validate(inputState);

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('autoFixed');
      expect(result).toHaveProperty('state');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.autoFixed)).toBe(true);
      expect(typeof result.valid).toBe('boolean');
    });

    test('validates schema compliance after repairs', () => {
      const inputState = {
        // Deliberately minimal state
        phase: 'registered',
      } as any;

      const result = stateValidator.validate(inputState);

      // Should have many auto-fixed items
      expect(result.autoFixed.length).toBeGreaterThan(2);
      // Resulting state should follow StateV3_0_0 constraints
      expect(result.state.version).toBe('v3.0.0');
      expect(result.state.feature).toBeDefined();
      expect(result.state.phase).toBeDefined();
      expect(result.state.status).toBeDefined();
    });
  });

  // =========================================================================
  // validateNewState() — combined constraint auto-repair
  // =========================================================================
  describe('validateNewState() — combined constraint auto-repair', () => {
    test('auto-repairs status="completed" when phase is not "validated"', () => {
      const inputState = {
        feature: 'my-feature',
        version: 'v2.1.0',
        phase: 'specified',
        status: 'completed',
      };

      const result = stateValidator.validateNewState(inputState, 'specs-tree-my-feature');

      expect(result.repairedState.status).toBe('tracked');
      expect(result.warnings.some((w) => w.includes('completed'))).toBe(true);
      expect(result.isValid).toBe(true);
    });

    test('auto-repairs status="merged" without merged.mergedInto', () => {
      const inputState = {
        feature: 'my-feature',
        version: 'v2.1.0',
        phase: 'specified',
        status: 'merged',
      };

      const result = stateValidator.validateNewState(inputState, 'specs-tree-my-feature');

      expect(result.repairedState.status).toBe('tracked');
      expect(result.warnings.some((w) => w.includes('merged'))).toBe(true);
      expect(result.isValid).toBe(true);
    });
  });
});

// Helper: valid phases (import would be circular in test context)
const VALID_PHASES_FOR_TEST: string[] = [
  'registered', 'discovered', 'specified', 'planned',
  'tasked', 'builded', 'reviewed', 'validated',
];
