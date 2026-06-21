/**
 * Unit tests for StateMachine v3.0.0 (TASK-004)
 *
 * Tests the new two-field model:
 * - phase (8 stages) + status (5 flow states) directly drive the state machine
 * - FeatureStateEnum dual-universe mapping deleted
 * - createFeature() defaults: phase='registered', status='tracked'
 * - updateState() phase unidirectional validation (reject rollback/skip)
 * - getNextStep() returns next phase (only tracked + not validated)
 * - FR-006: auto-set status='completed' when phase reaches 'validated'
 */

import { StateMachine, PhaseReversalError, PhaseSkipError, FeatureWithFullHistory } from '../../../state/machine';
import { StateLoader } from '../../../state/state-loader';
import { StateV3_0_0, Phase, FeatureStatus } from '../../../state/schema-v3.0.0';

// Mock StateLoader
jest.mock('../../../state/state-loader');

// ============================================================================
// Helper: create a minimal v3.0.0 state object for mocking
// ============================================================================
function makeMockState(
  feature: string,
  overrides: Partial<StateV3_0_0> = {},
): StateV3_0_0 {
  return {
    feature,
    name: feature.replace('specs-tree-', ''),
    version: 'v3.0.0',
    phase: 'registered',
    status: 'tracked',
    depth: 0,
    phaseHistory: [{
      phase: 'registered',
      timestamp: '2026-01-01T00:00:00.000Z',
      triggeredBy: 'StateLoader.create',
    }],
    files: { spec: `${feature}/spec.md` },
    dependencies: { on: [], blocking: [] },
    ...overrides,
  };
}

function makeMockFeatureWithFullHistory(
  feature: string,
  overrides: Partial<StateV3_0_0> = {},
): FeatureWithFullHistory {
  const state = makeMockState(feature, overrides);
  return {
    ...state,
    id: state.feature,
    name: state.name || state.feature,
    tasks: [],
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('StateMachine v3.0.0 (TASK-004)', () => {
  let stateMachine: StateMachine;
  let mockStateLoader: jest.Mocked<StateLoader>;

  beforeEach(() => {
    mockStateLoader = new StateLoader('.sddu/specs-tree-root') as any;
    mockStateLoader.create = jest.fn().mockResolvedValue(true);
    mockStateLoader.get = jest.fn().mockResolvedValue(null);
    mockStateLoader.set = jest.fn().mockResolvedValue(true);
    mockStateLoader.loadAll = jest.fn().mockResolvedValue(new Map());
    mockStateLoader.clearCache = jest.fn();
    mockStateLoader.getTreeStructure = jest.fn().mockResolvedValue({
      roots: [],
      flatMap: new Map(),
    });

    stateMachine = new StateMachine();
    (stateMachine as any).stateLoader = mockStateLoader;
  });

  // ==========================================================================
  // createFeature()
  // ==========================================================================

  describe('createFeature()', () => {
    test('creates feature with v3.0.0 defaults: phase="registered", status="tracked"', async () => {
      const featurePath = 'specs-tree-ecommerce';
      const mockGetResult = makeMockState(featurePath, {
        phase: 'registered',
        status: 'tracked',
      });

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(mockGetResult);

      const result = await stateMachine.createFeature('Ecommerce Platform', featurePath);

      // Verify stateLoader.create was called with v3.0.0 defaults
      expect(mockStateLoader.create).toHaveBeenCalledWith(
        featurePath,
        expect.objectContaining({
          version: 'v3.0.0',
          phase: 'registered',
          status: 'tracked',
          name: 'Ecommerce Platform',
        }),
      );

      // Verify returned feature has correct values
      expect(result.version).toBe('v3.0.0');
      expect(result.phase).toBe('registered');
      expect(result.status).toBe('tracked');
    });

    test('createFeature() initializes phaseHistory with registered entry', async () => {
      const featurePath = 'specs-tree-startup';
      const mockGetResult = makeMockState(featurePath, {
        phase: 'registered',
        status: 'tracked',
        phaseHistory: [{
          phase: 'registered',
          timestamp: expect.any(String) as any,
          triggeredBy: 'StateMachine.createFeature',
        }],
      });

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(mockGetResult);

      const result = await stateMachine.createFeature('Startup', featurePath);

      expect(result.phaseHistory).toBeDefined();
      expect(result.phaseHistory.length).toBeGreaterThan(0);
      expect(result.phaseHistory[0].phase).toBe('registered');
    });

    test('createFeature() fails when StateLoader.create returns false', async () => {
      (mockStateLoader.create as jest.MockedFunction<any>).mockResolvedValue(false);

      await expect(
        stateMachine.createFeature('Fail Feature', 'specs-tree-fail'),
      ).rejects.toThrow('Failed to create distributed state for feature:');
    });

    test('createFeature() fails when state cannot be loaded after creation', async () => {
      (mockStateLoader.create as jest.MockedFunction<any>).mockResolvedValue(true);
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(null);

      await expect(
        stateMachine.createFeature('Ghost Feature', 'specs-tree-ghost'),
      ).rejects.toThrow('Created feature state could not be loaded immediately after creation:');
    });
  });

  // ==========================================================================
  // getState()
  // ==========================================================================

  describe('getState()', () => {
    test('returns feature with v3.0.0 fields', async () => {
      const mockState = makeMockState('specs-tree-foo', {
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
      });
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(mockState);

      const result = await stateMachine.getState('specs-tree-foo');

      expect(result).toBeDefined();
      expect(result!.phase).toBe('specified');
      expect(result!.status).toBe('tracked');
      expect(result!.version).toBe('v3.0.0');
    });

    test('returns undefined for non-existent feature', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(null);

      const result = await stateMachine.getState('specs-tree-nonexist');

      expect(result).toBeUndefined();
    });
  });

  // ==========================================================================
  // getAllFeatures()
  // ==========================================================================

  describe('getAllFeatures()', () => {
    test('returns all features with v3.0.0 format', async () => {
      const mockMap = new Map<string, StateV3_0_0>();
      mockMap.set('specs-tree-a', makeMockState('specs-tree-a', { phase: 'registered' as Phase }));
      mockMap.set('specs-tree-b', makeMockState('specs-tree-b', { phase: 'specified' as Phase }));
      (mockStateLoader.loadAll as jest.MockedFunction<any>).mockResolvedValue(mockMap);

      const results = await stateMachine.getAllFeatures();

      expect(results).toHaveLength(2);
      expect(results[0].version).toBe('v3.0.0');
      expect(results[1].version).toBe('v3.0.0');
    });
  });

  // ==========================================================================
  // validatePhaseTransition()
  // ==========================================================================

  describe('validatePhaseTransition()', () => {
    test('same phase → valid', () => {
      const result = stateMachine.validatePhaseTransition('specified', 'specified');
      expect(result.valid).toBe(true);
    });

    test('single step forward → valid (registered → discovered)', () => {
      const result = stateMachine.validatePhaseTransition('registered', 'discovered');
      expect(result.valid).toBe(true);
    });

    test('single step forward → valid (reviewed → validated)', () => {
      const result = stateMachine.validatePhaseTransition('reviewed', 'validated');
      expect(result.valid).toBe(true);
    });

    test('full flow: registered → discovered → specified → planned → tasked → builded → reviewed → validated all valid', () => {
      const flow: [Phase, Phase][] = [
        ['registered', 'discovered'],
        ['discovered', 'specified'],
        ['specified', 'planned'],
        ['planned', 'tasked'],
        ['tasked', 'builded'],
        ['builded', 'reviewed'],
        ['reviewed', 'validated'],
      ];

      for (const [from, to] of flow) {
        const result = stateMachine.validatePhaseTransition(from, to);
        expect(result.valid).toBe(true);
      }
    });

    test('rollback → invalid (specified → discovered)', () => {
      const result = stateMachine.validatePhaseTransition('specified', 'discovered');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('回退');
    });

    test('rollback → invalid (validated → reviewed)', () => {
      const result = stateMachine.validatePhaseTransition('validated', 'reviewed');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('回退');
    });

    test('skip → invalid (registered → planned)', () => {
      const result = stateMachine.validatePhaseTransition('registered', 'planned');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('按序推进');
      expect(result.missingPhases).toContain('discovered');
      expect(result.missingPhases).toContain('specified');
    });

    test('skip → invalid with correct missing phases (registered → specified)', () => {
      const result = stateMachine.validatePhaseTransition('registered', 'specified');
      expect(result.valid).toBe(false);
      expect(result.missingPhases).toEqual(['discovered']);
    });

    test('invalid target phase → rejected', () => {
      const result = stateMachine.validatePhaseTransition('registered', 'nonexistent' as Phase);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('无效的目标 phase');
    });
  });

  // ==========================================================================
  // validateStageTransition()
  // ==========================================================================

  describe('validateStageTransition()', () => {
    test('full flow registered → validated all pass (mocked)', async () => {
      const featurePath = 'specs-tree-fullflow';

      // Simulate each phase in order
      const flow: Phase[] = [
        'registered', 'discovered', 'specified', 'planned',
        'tasked', 'builded', 'reviewed', 'validated',
      ];

      for (let i = 1; i < flow.length; i++) {
        const currentPhase = flow[i - 1];
        const targetPhase = flow[i];

        const mockFeature = makeMockFeatureWithFullHistory(featurePath, {
          phase: currentPhase,
          status: 'tracked' as FeatureStatus,
        });

        (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(
          makeMockState(featurePath, { phase: currentPhase, status: 'tracked' }),
        );
        (stateMachine as any).stateLoader = mockStateLoader;

        // Mock files to exist
        jest.spyOn(require('fs/promises'), 'access').mockResolvedValue(undefined);

        const result = await stateMachine.validateStageTransition(featurePath, targetPhase);
        expect(result.allowed).toBe(true);
      }
    });

    test('rollback rejected (specified → discovered)', async () => {
      const featurePath = 'specs-tree-rollback';

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(
        makeMockState(featurePath, { phase: 'specified' as Phase, status: 'tracked' as FeatureStatus }),
      );

      const result = await stateMachine.validateStageTransition(featurePath, 'discovered');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('回退');
    });

    test('skip rejected (registered → planned) with missing stages', async () => {
      const featurePath = 'specs-tree-skip';

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(
        makeMockState(featurePath, { phase: 'registered' as Phase, status: 'tracked' as FeatureStatus }),
      );

      const result = await stateMachine.validateStageTransition(featurePath, 'planned');
      expect(result.allowed).toBe(false);
      expect(result.missingStages).toBeDefined();
      expect(result.missingStages!.length).toBeGreaterThan(0);
    });

    test('non-existent feature → rejected', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(null);

      const result = await stateMachine.validateStageTransition('specs-tree-ghost', 'specified');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('不存在');
    });
  });

  // ==========================================================================
  // updateState()
  // ==========================================================================

  describe('updateState()', () => {
    test('advances phase from registered to discovered', async () => {
      const featurePath = 'specs-tree-advance';
      const currentState = makeMockState(featurePath, {
        phase: 'registered' as Phase,
        status: 'tracked' as FeatureStatus,
      });

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(currentState);
      (mockStateLoader.set as jest.MockedFunction<any>).mockResolvedValue(true);

      // Mock file access to exist
      jest.spyOn(require('fs/promises'), 'access').mockResolvedValue(undefined);

      const result = await stateMachine.updateState(featurePath, 'discovered');

      expect(result.phase).toBe('discovered');
      expect(result.status).toBe('tracked'); // status unchanged when phase < validated
    });

    test('FR-006: phase=validated + status=tracked → status auto-set to completed', async () => {
      const featurePath = 'specs-tree-autocomplete';
      const currentState = makeMockState(featurePath, {
        phase: 'reviewed' as Phase,
        status: 'tracked' as FeatureStatus,
      });

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(currentState);
      (mockStateLoader.set as jest.MockedFunction<any>).mockResolvedValue(true);
      jest.spyOn(require('fs/promises'), 'access').mockResolvedValue(undefined);

      const result = await stateMachine.updateState(featurePath, 'validated');

      expect(result.phase).toBe('validated');
      expect(result.status).toBe('completed'); // FR-006: auto-set
    });

    test('FR-006: phase=validated + status=suspended → status stays suspended (not overridden)', async () => {
      const featurePath = 'specs-tree-suspended';
      const currentState = makeMockState(featurePath, {
        phase: 'reviewed' as Phase,
        status: 'suspended' as FeatureStatus,
        suspended: { suspendedNote: 'waiting for dependency' },
      });

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(currentState);
      (mockStateLoader.set as jest.MockedFunction<any>).mockResolvedValue(true);
      jest.spyOn(require('fs/promises'), 'access').mockResolvedValue(undefined);

      const result = await stateMachine.updateState(featurePath, 'validated');

      expect(result.phase).toBe('validated');
      expect(result.status).toBe('suspended'); // FR-006: not overridden
    });

    test('FR-006: phase=validated + status=terminated → status stays terminated', async () => {
      const featurePath = 'specs-tree-terminated';
      const currentState = makeMockState(featurePath, {
        phase: 'reviewed' as Phase,
        status: 'terminated' as FeatureStatus,
      });

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(currentState);
      (mockStateLoader.set as jest.MockedFunction<any>).mockResolvedValue(true);
      jest.spyOn(require('fs/promises'), 'access').mockResolvedValue(undefined);

      const result = await stateMachine.updateState(featurePath, 'validated');

      expect(result.phase).toBe('validated');
      expect(result.status).toBe('terminated'); // FR-006: not overridden
    });

    test('FR-006: phase=validated + status=merged → status stays merged', async () => {
      const featurePath = 'specs-tree-merged';
      const currentState = makeMockState(featurePath, {
        phase: 'reviewed' as Phase,
        status: 'merged' as FeatureStatus,
        merged: { mergedInto: 'specs-tree-other', mergedAt: '2026-01-01T00:00:00.000Z' },
      });

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(currentState);
      (mockStateLoader.set as jest.MockedFunction<any>).mockResolvedValue(true);
      jest.spyOn(require('fs/promises'), 'access').mockResolvedValue(undefined);

      const result = await stateMachine.updateState(featurePath, 'validated');

      expect(result.phase).toBe('validated');
      expect(result.status).toBe('merged'); // FR-006: not overridden
    });

    test('phase rollback throws PhaseReversalError', async () => {
      const featurePath = 'specs-tree-reversal';
      const currentState = makeMockState(featurePath, {
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
      });

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(currentState);
      jest.spyOn(require('fs/promises'), 'access').mockResolvedValue(undefined);

      await expect(
        stateMachine.updateState(featurePath, 'discovered'),
      ).rejects.toThrow(PhaseReversalError);
    });

    test('phase skip throws PhaseSkipError', async () => {
      const featurePath = 'specs-tree-skip-error';
      const currentState = makeMockState(featurePath, {
        phase: 'registered' as Phase,
        status: 'tracked' as FeatureStatus,
      });

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(currentState);
      jest.spyOn(require('fs/promises'), 'access').mockResolvedValue(undefined);

      await expect(
        stateMachine.updateState(featurePath, 'planned'),
      ).rejects.toThrow(PhaseSkipError);
    });

    test('PhaseSkipError contains missing phases', async () => {
      const featurePath = 'specs-tree-skip-detail';
      const currentState = makeMockState(featurePath, {
        phase: 'registered' as Phase,
        status: 'tracked' as FeatureStatus,
      });

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(currentState);
      jest.spyOn(require('fs/promises'), 'access').mockResolvedValue(undefined);

      try {
        await stateMachine.updateState(featurePath, 'tasked');
        fail('Expected PhaseSkipError');
      } catch (e: any) {
        expect(e).toBeInstanceOf(PhaseSkipError);
        expect(e.missingPhases).toContain('discovered');
        expect(e.missingPhases).toContain('specified');
        expect(e.missingPhases).toContain('planned');
      }
    });

    test('skipValidation=true bypasses phase validation', async () => {
      const featurePath = 'specs-tree-skip-val';
      const currentState = makeMockState(featurePath, {
        phase: 'registered' as Phase,
        status: 'tracked' as FeatureStatus,
      });

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(currentState);
      (mockStateLoader.set as jest.MockedFunction<any>).mockResolvedValue(true);

      // Should NOT throw even though we're skipping
      const result = await stateMachine.updateState(featurePath, 'builded', {}, 'test', '', true, false);

      expect(result.phase).toBe('builded');
    });

    test('updateState adds phaseHistory entry', async () => {
      const featurePath = 'specs-tree-history';
      const currentState = makeMockState(featurePath, {
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
        phaseHistory: [{
          phase: 'specified' as Phase,
          timestamp: '2026-01-01T00:00:00.000Z',
          triggeredBy: 'test',
        }],
        history: [],
      });

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(currentState);
      (mockStateLoader.set as jest.MockedFunction<any>).mockResolvedValue(true);
      jest.spyOn(require('fs/promises'), 'access').mockResolvedValue(undefined);

      const result = await stateMachine.updateState(featurePath, 'planned', {}, 'sddu-plan');

      expect(result.phaseHistory.length).toBe(2);
      expect(result.phaseHistory[1].phase).toBe('planned');
      expect(result.phaseHistory[1].triggeredBy).toBe('sddu-plan');
    });

    test('updateState adds history entry', async () => {
      const featurePath = 'specs-tree-hist';
      const currentState = makeMockState(featurePath, {
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
        history: [],
      });

      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(currentState);
      (mockStateLoader.set as jest.MockedFunction<any>).mockResolvedValue(true);
      jest.spyOn(require('fs/promises'), 'access').mockResolvedValue(undefined);

      const result = await stateMachine.updateState(featurePath, 'planned', {}, 'sddu-plan', 'moving to plan');

      expect(result.history!.length).toBe(1);
      expect(result.history![0].from).toBe('specified');
      expect(result.history![0].to).toBe('planned');
      expect(result.history![0].triggeredBy).toBe('sddu-plan');
    });

    test('throws error if feature does not exist', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(null);

      await expect(
        stateMachine.updateState('specs-tree-ghost', 'discovered'),
      ).rejects.toThrow('State does not exist at');
    });
  });

  // ==========================================================================
  // getNextStep()
  // ==========================================================================

  describe('getNextStep()', () => {
    test('tracked + specified → returns { phase: "planned", action: "@sddu plan [feature]" }', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(
        makeMockState('specs-tree-next', { phase: 'specified' as Phase, status: 'tracked' as FeatureStatus }),
      );

      const result = await stateMachine.getNextStep('specs-tree-next');

      expect(result).not.toBeNull();
      expect(result!.phase).toBe('planned');
      expect(result!.action).toContain('@sddu plan');
    });

    test('tracked + validated → returns null (completed)', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(
        makeMockState('specs-tree-done', { phase: 'validated' as Phase, status: 'completed' as FeatureStatus }),
      );

      const result = await stateMachine.getNextStep('specs-tree-done');

      expect(result).toBeNull();
    });

    test('suspended + specified → returns null (not tracked)', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(
        makeMockState('specs-tree-susp', { phase: 'specified' as Phase, status: 'suspended' as FeatureStatus }),
      );

      const result = await stateMachine.getNextStep('specs-tree-susp');

      expect(result).toBeNull();
    });

    test('terminated + builded → returns null', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(
        makeMockState('specs-tree-term', { phase: 'builded' as Phase, status: 'terminated' as FeatureStatus }),
      );

      const result = await stateMachine.getNextStep('specs-tree-term');

      expect(result).toBeNull();
    });

    test('merged + planned → returns null', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(
        makeMockState('specs-tree-merg', {
          phase: 'planned' as Phase,
          status: 'merged' as FeatureStatus,
          merged: { mergedInto: 'specs-tree-other', mergedAt: '2026-01-01T00:00:00.000Z' },
        }),
      );

      const result = await stateMachine.getNextStep('specs-tree-merg');

      expect(result).toBeNull();
    });

    test('tracked + registered → returns { phase: "discovered", action: "@sddu discovery [feature]" }', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(
        makeMockState('specs-tree-new', { phase: 'registered' as Phase, status: 'tracked' as FeatureStatus }),
      );

      const result = await stateMachine.getNextStep('specs-tree-new');

      expect(result).not.toBeNull();
      expect(result!.phase).toBe('discovered');
      expect(result!.action).toContain('@sddu discovery');
    });

    test('tracked + reviewed → returns { phase: "validated", action: "@sddu validate [feature]" }', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(
        makeMockState('specs-tree-rev', { phase: 'reviewed' as Phase, status: 'tracked' as FeatureStatus }),
      );

      const result = await stateMachine.getNextStep('specs-tree-rev');

      expect(result).not.toBeNull();
      expect(result!.phase).toBe('validated');
      expect(result!.action).toContain('@sddu validate');
    });

    test('feature not found → returns null', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(null);

      const result = await stateMachine.getNextStep('specs-tree-ghost');

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // getCurrentPhase()
  // ==========================================================================

  describe('getCurrentPhase()', () => {
    test('returns current phase', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(
        makeMockState('specs-tree-ph', { phase: 'tasked' as Phase, status: 'tracked' as FeatureStatus }),
      );

      const phase = await stateMachine.getCurrentPhase('specs-tree-ph');

      expect(phase).toBe('tasked');
    });

    test('returns null for non-existent feature', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(null);

      const phase = await stateMachine.getCurrentPhase('specs-tree-ghost');

      expect(phase).toBeNull();
    });
  });

  // ==========================================================================
  // isParentFeature()
  // ==========================================================================

  describe('isParentFeature()', () => {
    test('returns true if feature has childrens', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(
        makeMockState('specs-tree-parent', {
          childrens: [{
            path: 'specs-tree-parent/specs-tree-child',
            featureName: 'child',
            phase: 'registered' as Phase,
            status: 'tracked' as FeatureStatus,
            lastModified: '2026-01-01T00:00:00.000Z',
          }],
        }),
      );

      const isParent = await stateMachine.isParentFeature('specs-tree-parent');

      expect(isParent).toBe(true);
    });

    test('returns false for leaf feature', async () => {
      (mockStateLoader.get as jest.MockedFunction<any>).mockResolvedValue(
        makeMockState('specs-tree-leaf', { childrens: [] }),
      );

      const isParent = await stateMachine.isParentFeature('specs-tree-leaf');

      expect(isParent).toBe(false);
    });
  });

  // ==========================================================================
  // getMissingPhases()
  // ==========================================================================

  describe('getMissingPhases()', () => {
    test('returns empty array for same phase', () => {
      const result = stateMachine.getMissingPhases('registered', 'registered');
      expect(result).toEqual([]);
    });

    test('returns empty array for single step forward', () => {
      const result = stateMachine.getMissingPhases('registered', 'discovered');
      expect(result).toEqual([]);
    });

    test('returns missing phases for skip', () => {
      const result = stateMachine.getMissingPhases('registered', 'planned');
      expect(result).toContain('discovered');
      expect(result).toContain('specified');
      expect(result.length).toBe(2);
    });

    test('returns empty array for rollback', () => {
      const result = stateMachine.getMissingPhases('specified', 'registered');
      expect(result).toEqual([]);
    });
  });
});
