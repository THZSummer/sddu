/**
 * Unit tests for schema-v3.0.0.ts
 *
 * Covers:
 *   - Type validation: valid/invalid phase and status values
 *   - Combined constraint validation
 *   - Derivative functions: shouldRecommendContinue, getNextRecommendedPhase, isStatusReversible
 *   - Constants: PHASE_ORDER, NEXT_PHASE, IRREVERSIBLE_STATUSES, VALID_PHASES, VALID_STATUSES
 */

import {
  Phase,
  FeatureStatus,
  StateV3_0_0,
  VALID_PHASES,
  VALID_STATUSES,
  PHASE_ORDER,
  NEXT_PHASE,
  IRREVERSIBLE_STATUSES,
  validateStateV3,
  shouldRecommendContinue,
  getNextRecommendedPhase,
  isStatusReversible,
  PhaseHistoryEntry,
  SuspendedInfo,
  MergedInfo,
  ChildFeatureInfoV3,
  phaseFlow,
} from '../../../state/schema-v3.0.0';

// ============================================================================
// Helper: create a minimal valid state that can be customized per test
// ============================================================================

function makeValidState(overrides: Partial<StateV3_0_0> = {}): StateV3_0_0 {
  const now = new Date().toISOString();
  return {
    feature: 'specs-tree-test-feature',
    version: 'v3.0.0',
    phase: 'registered' as Phase,
    status: 'tracked' as FeatureStatus,
    depth: 0,
    phaseHistory: [
      {
        phase: 'registered' as Phase,
        timestamp: now,
        triggeredBy: 'StateLoader.create',
      },
    ],
    files: {
      spec: '.sddu/specs-tree-root/specs-tree-test-feature/spec.md',
    },
    dependencies: {
      on: [],
      blocking: [],
    },
    ...overrides,
  } as StateV3_0_0;
}

// ============================================================================
// Test #1–#5: Valid state combinations
// ============================================================================

describe('validateStateV3 — valid states', () => {
  it('#1 — all valid phase + status combinations pass validation', () => {
    // Only test the combinations that meet combined constraints
    for (const phase of VALID_PHASES) {
      for (const status of VALID_STATUSES) {
        // Skip combinations that violate combined constraints
        if (status === 'completed' && phase !== 'validated') continue;
        // merged without mergedInto will be caught below — we test that separately
        if (status === 'merged') continue; // requires mergedInto field

        const state = makeValidState({ phase, status });
        expect(validateStateV3(state)).toBe(true);
      }
    }
  });

  it('#2 — terminal state phase=validated status=completed passes', () => {
    const state = makeValidState({ phase: 'validated', status: 'completed' });
    expect(validateStateV3(state)).toBe(true);
  });

  it('#3 — suspended with optional fields passes', () => {
    const state = makeValidState({
      phase: 'planned',
      status: 'suspended',
      suspended: {
        suspendedUntil: '2027-06-01',
        suspendedNote: 'Waiting for external API to stabilize',
      },
    });
    expect(validateStateV3(state)).toBe(true);
  });

  it('#4 — merged with required fields passes', () => {
    const state = makeValidState({
      phase: 'specified',
      status: 'merged',
      merged: {
        mergedInto: 'specs-tree-other-feature',
        mergedAt: '2026-06-12T00:00:00.000Z',
      },
    });
    expect(validateStateV3(state)).toBe(true);
  });

  it('#5 — suspended without optional fields passes', () => {
    // suspendedInfo is optional — the state should still be valid
    const state = makeValidState({ phase: 'discovered', status: 'suspended' });
    expect(validateStateV3(state)).toBe(true);
  });
});

// ============================================================================
// Test #6–#13: Invalid states
// ============================================================================

describe('validateStateV3 — invalid states', () => {
  it('#6 — invalid phase value "unknown" is rejected', () => {
    const state = makeValidState({ phase: 'unknown' as Phase });
    expect(validateStateV3(state)).toBe(false);
  });

  it('#7 — invalid status value "unknown" is rejected', () => {
    const state = makeValidState({ status: 'unknown' as FeatureStatus });
    expect(validateStateV3(state)).toBe(false);
  });

  it('#8 — completed status outside validated phase is rejected', () => {
    const state = makeValidState({ phase: 'specified', status: 'completed' });
    expect(validateStateV3(state)).toBe(false);
  });

  it('#9 — merged status without mergedInto is rejected', () => {
    const state = makeValidState({ phase: 'planned', status: 'merged' });
    expect(validateStateV3(state)).toBe(false);
  });

  it('#10 — missing phase field is rejected', () => {
    const state = makeValidState();
    delete (state as any).phase;
    expect(validateStateV3(state)).toBe(false);
  });

  it('#11 — missing status field is rejected', () => {
    const state = makeValidState();
    delete (state as any).status;
    expect(validateStateV3(state)).toBe(false);
  });

  it('#12 — version !== "v3.0.0" is rejected', () => {
    const state = makeValidState({ version: 'v2.1.0' as any });
    expect(validateStateV3(state)).toBe(false);
  });

  it('#13 — missing feature field is rejected', () => {
    const state = makeValidState();
    delete (state as any).feature;
    expect(validateStateV3(state)).toBe(false);
  });

  it('#19 — missing depth/phaseHistory/files required fields is rejected', () => {
    // Missing depth
    const stateMissingDepth = makeValidState();
    delete (stateMissingDepth as any).depth;
    expect(validateStateV3(stateMissingDepth)).toBe(false);

    // Missing phaseHistory
    const stateMissingPH = makeValidState();
    delete (stateMissingPH as any).phaseHistory;
    expect(validateStateV3(stateMissingPH)).toBe(false);

    // Missing files
    const stateMissingFiles = makeValidState();
    delete (stateMissingFiles as any).files;
    expect(validateStateV3(stateMissingFiles)).toBe(false);

    // Missing files.spec
    const stateMissingSpec = makeValidState();
    (stateMissingSpec.files as any).spec = undefined;
    expect(validateStateV3(stateMissingSpec)).toBe(false);
  });
});

// ============================================================================
// Test #14–#16: Derivation functions
// ============================================================================

describe('shouldRecommendContinue', () => {
  it('#14 — all 8×5 combinations return correct result', () => {
    // Tracked + non-validated → should continue
    for (const phase of VALID_PHASES) {
      for (const status of VALID_STATUSES) {
        const expected = status === 'tracked' && phase !== 'validated';
        expect(shouldRecommendContinue(phase, status)).toBe(expected);
      }
    }
  });

  it('specified + tracked → true', () => {
    expect(shouldRecommendContinue('specified', 'tracked')).toBe(true);
  });

  it('specified + suspended → false', () => {
    expect(shouldRecommendContinue('specified', 'suspended')).toBe(false);
  });

  it('validated + completed → false', () => {
    expect(shouldRecommendContinue('validated', 'completed')).toBe(false);
  });

  it('validated + tracked → false (no further phase)', () => {
    expect(shouldRecommendContinue('validated', 'tracked')).toBe(false);
  });
});

describe('getNextRecommendedPhase', () => {
  it('#15 — all 8×5 combinations return correct next phase or null', () => {
    for (const phase of VALID_PHASES) {
      for (const status of VALID_STATUSES) {
        const result = getNextRecommendedPhase(phase, status);
        if (status === 'tracked' && phase !== 'validated') {
          // Should return the next phase
          expect(result).toBe(NEXT_PHASE[phase]);
        } else {
          // Should return null
          expect(result).toBeNull();
        }
      }
    }
  });

  it('specified + tracked → planned', () => {
    expect(getNextRecommendedPhase('specified', 'tracked')).toBe('planned');
  });

  it('specified + suspended → null', () => {
    expect(getNextRecommendedPhase('specified', 'suspended')).toBeNull();
  });

  it('validated + completed → null', () => {
    expect(getNextRecommendedPhase('validated', 'completed')).toBeNull();
  });

  it('registered + tracked → discovered', () => {
    expect(getNextRecommendedPhase('registered', 'tracked')).toBe('discovered');
  });

  it('reviewed + tracked → validated', () => {
    expect(getNextRecommendedPhase('reviewed', 'tracked')).toBe('validated');
  });
});

describe('isStatusReversible', () => {
  it('#16 — all 5×5 combinations return correct result', () => {
    const allStatuses: FeatureStatus[] = [...VALID_STATUSES];

    for (const current of allStatuses) {
      for (const target of allStatuses) {
        const result = isStatusReversible(current, target);

        if (current === 'suspended' && target === 'tracked') {
          expect(result).toBe(true);
        } else {
          expect(result).toBe(false);
        }
      }
    }
  });

  it('suspended → tracked is reversible', () => {
    expect(isStatusReversible('suspended', 'tracked')).toBe(true);
  });

  it('tracked → suspended is NOT reversible (by this function — handled at higher level)', () => {
    // This function checks if going from current → target is a "reversal".
    // tracked → suspended is a forward mark, not a reversal.
    // tracked → tracked is a no-op
    expect(isStatusReversible('tracked', 'suspended')).toBe(false);
  });

  it('completed → tracked is NOT reversible', () => {
    expect(isStatusReversible('completed', 'tracked')).toBe(false);
  });

  it('terminated → anything is NOT reversible', () => {
    expect(isStatusReversible('terminated', 'tracked')).toBe(false);
    expect(isStatusReversible('terminated', 'suspended')).toBe(false);
  });

  it('merged → anything is NOT reversible', () => {
    expect(isStatusReversible('merged', 'tracked')).toBe(false);
  });
});

// ============================================================================
// Test #17–#18: Constants
// ============================================================================

describe('constants', () => {
  it('#17 — PHASE_ORDER has all 8 phases with correct ordering (0-7)', () => {
    expect(Object.keys(PHASE_ORDER).length).toBe(8);
    expect(PHASE_ORDER['registered']).toBe(0);
    expect(PHASE_ORDER['discovered']).toBe(1);
    expect(PHASE_ORDER['specified']).toBe(2);
    expect(PHASE_ORDER['planned']).toBe(3);
    expect(PHASE_ORDER['tasked']).toBe(4);
    expect(PHASE_ORDER['builded']).toBe(5);
    expect(PHASE_ORDER['reviewed']).toBe(6);
    expect(PHASE_ORDER['validated']).toBe(7);

    // All values should be in range 0-7
    const orders = Object.values(PHASE_ORDER);
    expect(Math.min(...orders)).toBe(0);
    expect(Math.max(...orders)).toBe(7);

    // Each phase has a unique order
    const uniqueOrders = new Set(orders);
    expect(uniqueOrders.size).toBe(8);
  });

  it('#18 — NEXT_PHASE has exactly 7 entries (registered→validated, 7 steps)', () => {
    expect(Object.keys(NEXT_PHASE).length).toBe(7);

    expect(NEXT_PHASE['registered']).toBe('discovered');
    expect(NEXT_PHASE['discovered']).toBe('specified');
    expect(NEXT_PHASE['specified']).toBe('planned');
    expect(NEXT_PHASE['planned']).toBe('tasked');
    expect(NEXT_PHASE['tasked']).toBe('builded');
    expect(NEXT_PHASE['builded']).toBe('reviewed');
    expect(NEXT_PHASE['reviewed']).toBe('validated');

    // validated has no next
    expect(NEXT_PHASE['validated']).toBeUndefined();
  });

  it('VALID_PHASES contains exactly 8 values', () => {
    expect(VALID_PHASES.length).toBe(8);
    expect(VALID_PHASES).toEqual([
      'registered', 'discovered', 'specified', 'planned',
      'tasked', 'builded', 'reviewed', 'validated',
    ]);
  });

  it('VALID_STATUSES contains exactly 5 values', () => {
    expect(VALID_STATUSES.length).toBe(5);
    expect(VALID_STATUSES).toEqual([
      'tracked', 'completed', 'suspended', 'terminated', 'merged',
    ]);
  });

  it('IRREVERSIBLE_STATUSES contains completed, terminated, merged', () => {
    expect(IRREVERSIBLE_STATUSES).toEqual(['completed', 'terminated', 'merged']);
  });

  it('phaseFlow has exactly 7 entries', () => {
    expect(phaseFlow.length).toBe(7);
    expect(phaseFlow[0]).toEqual({ from: 'registered', to: 'discovered' });
    expect(phaseFlow[6]).toEqual({ from: 'reviewed', to: 'validated' });
  });
});

// ============================================================================
// Edge case tests
// ============================================================================

describe('validateStateV3 — edge cases', () => {
  it('null input is rejected', () => {
    expect(validateStateV3(null)).toBe(false);
  });

  it('undefined input is rejected', () => {
    expect(validateStateV3(undefined)).toBe(false);
  });

  it('non-object input (string) is rejected', () => {
    expect(validateStateV3('not an object')).toBe(false);
  });

  it('non-object input (number) is rejected', () => {
    expect(validateStateV3(42)).toBe(false);
  });

  it('empty object is rejected', () => {
    expect(validateStateV3({})).toBe(false);
  });

  it('merged with mergedInto but empty string is rejected', () => {
    const state = makeValidState({
      phase: 'planned',
      status: 'merged',
      merged: {
        mergedInto: '',
        mergedAt: '2026-06-12T00:00:00.000Z',
      },
    });
    expect(validateStateV3(state)).toBe(false);
  });

  it('merged with mergedInto set correctly passes', () => {
    const state = makeValidState({
      phase: 'planned',
      status: 'merged',
      merged: {
        mergedInto: 'specs-tree-target',
        mergedAt: '2026-06-12T00:00:00.000Z',
      },
    });
    expect(validateStateV3(state)).toBe(true);
  });

  it('all 8 phases are individually valid with tracked status', () => {
    for (const phase of VALID_PHASES) {
      const state = makeValidState({ phase, status: 'tracked' });
      expect(validateStateV3(state)).toBe(true);
    }
  });

  it('all 5 statuses are individually valid with a matching phase', () => {
    // tracked/completed/suspended/terminated — valid with any phase except completed constraint
    for (const status of VALID_STATUSES) {
      let phase: Phase = 'specified';
      if (status === 'completed') phase = 'validated';
      if (status === 'merged') {
        // merged needs mergedInto — test with a proper merged state
        const state = makeValidState({
          phase,
          status,
          merged: { mergedInto: 'specs-tree-target', mergedAt: '2026-06-12T00:00:00.000Z' },
        });
        expect(validateStateV3(state)).toBe(true);
      } else {
        const state = makeValidState({ phase, status });
        expect(validateStateV3(state)).toBe(true);
      }
    }
  });
});
