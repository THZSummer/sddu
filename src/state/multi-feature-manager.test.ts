import {
  aggregateFeatureState,
  buildDependencyGraph,
  detectCircularDependency,
  isDependencyReady,
  getReadySubFeatures,
  SubFeatureState,
  DependencyGraph,
} from './multi-feature-manager';
import { Phase, FeatureStatus } from './schema-v3.0.0';

// Helper: create a SubFeatureState with defaults
function makeSF(
  id: string,
  phase: Phase,
  status: FeatureStatus = 'tracked',
): SubFeatureState {
  return { id, phase, status };
}

describe('MultiFeatureManager Tests (v3.0.0)', () => {
  describe('aggregateFeatureState', () => {
    test('should return registered when no sub-features', () => {
      expect(aggregateFeatureState([])).toBe('registered');
    });

    test('should return slowest phase among sub-features', () => {
      const subFeatures: SubFeatureState[] = [
        makeSF('sf1', 'validated', 'completed'),  // order 7 — fastest
        makeSF('sf2', 'tasked'),                    // order 4 — slowest
        makeSF('sf3', 'builded'),                   // order 5
      ];
      expect(aggregateFeatureState(subFeatures)).toBe('tasked');
    });

    test('should work correctly when all same phase', () => {
      const subFeatures: SubFeatureState[] = [
        makeSF('sf1', 'planned'),
        makeSF('sf2', 'planned'),
        makeSF('sf3', 'planned'),
      ];
      expect(aggregateFeatureState(subFeatures)).toBe('planned');
    });

    test('should correctly find slowest (lowest PHASE_ORDER) in mixed set', () => {
      // PHASE_ORDER: registered=0 … validated=7 — lower = slower
      const phases: Phase[] = [
        'registered', 'discovered', 'specified', 'planned',
        'tasked', 'builded', 'reviewed', 'validated',
      ];

      for (let i = 0; i < phases.length; i++) {
        const slowest = phases[i];
        const fasterPhases = phases.slice(i + 1).map((p, idx) => makeSF(`sf${idx}`, p));

        const mixed: SubFeatureState[] = [makeSF('slow', slowest), ...fasterPhases];
        expect(aggregateFeatureState(mixed)).toBe(slowest);
      }
    });
  });

  describe('buildDependencyGraph', () => {
    test('should build dependency and blockedBy relations', () => {
      const subFeatures: SubFeatureState[] = [
        makeSF('a', 'specified'),
        makeSF('b', 'specified'),
        makeSF('c', 'specified'),
      ];

      const dependencies = {
        'b': ['a'], // b depends on a
        'c': ['b'], // c depends on b
      };

      const graph = buildDependencyGraph(subFeatures, dependencies);

      // Verify dependencies
      expect(graph.dependencies['a']).toEqual([]);
      expect(graph.dependencies['b']).toEqual(['a']);
      expect(graph.dependencies['c']).toEqual(['b']);

      // Verify blockedBy
      expect(graph.blockedBy['a']).toEqual(['b']); // a blocks b
      expect(graph.blockedBy['b']).toEqual(['c']); // b blocks c
      expect(graph.blockedBy['c']).toEqual([]); // c doesn't block anyone
    });

    test('should handle empty dependencies', () => {
      const subFeatures: SubFeatureState[] = [
        makeSF('a', 'specified'),
        makeSF('b', 'specified'),
      ];

      const dependencies = {};

      const graph = buildDependencyGraph(subFeatures, dependencies);

      expect(graph.dependencies).toEqual({
        'a': [],
        'b': [],
      });

      expect(graph.blockedBy).toEqual({
        'a': [],
        'b': [],
      });
    });

    test('should handle multiple dependencies', () => {
      const subFeatures: SubFeatureState[] = [
        makeSF('a', 'specified'),
        makeSF('b', 'specified'),
        makeSF('c', 'specified'),
        makeSF('d', 'specified'),
      ];

      const dependencies = {
        'c': ['a', 'b'], // c depends on both a and b
        'd': ['b'],      // d depends only on b
      };

      const graph = buildDependencyGraph(subFeatures, dependencies);

      expect(graph.dependencies).toEqual({
        'a': [],
        'b': [],
        'c': ['a', 'b'],
        'd': ['b'],
      });

      expect(graph.blockedBy).toEqual({
        'a': ['c'],       // a blocks c
        'b': ['c', 'd'],  // b blocks both c and d
        'c': [],
        'd': [],
      });
    });
  });

  describe('detectCircularDependency', () => {
    test('should return null for acyclic dependencies', () => {
      const dependencies = {
        'b': ['a'],
        'c': ['b'],
        'd': ['c'],
      };

      expect(detectCircularDependency('a', dependencies)).toBeNull();
      expect(detectCircularDependency('b', dependencies)).toBeNull();
      expect(detectCircularDependency('all', dependencies)).toBeNull();
    });

    test('should detect simple circular dependency', () => {
      const dependencies = {
        'a': ['b'],
        'b': ['a'],
      };

      const cycle = detectCircularDependency('a', dependencies);
      expect(cycle).toEqual(['a', 'b', 'a']); // Cycle: a -> b -> a
    });

    test('should detect complex circular dependency', () => {
      const dependencies = {
        'a': ['b'],
        'b': ['c'],
        'c': ['a'],  // Forms a -> b -> c -> a loop
      };

      const cycle = detectCircularDependency('a', dependencies);
      expect(cycle).toEqual(['a', 'b', 'c', 'a']);
    });

    test('should return when circular dependency exists through different path', () => {
      const dependencies = {
        'a': ['d'],
        'b': ['a'],
        'c': ['b'],
        'd': ['c'],  // Completes a loop: d -> c -> b -> a -> d
      };

      const cycle = detectCircularDependency('d', dependencies);
      expect(cycle).toEqual(['d', 'c', 'b', 'a', 'd']);
    });

    test('should not find circular dependency in a DAG', () => {
      const dependencies = {
        'a': [],      // independent
        'b': ['a'],   // depends on a
        'c': ['a', 'b'],  // depends on both a and b
        'd': ['c'],   // depends only on c
      };

      expect(detectCircularDependency('d', dependencies)).toBeNull();
    });

    test('should handle case where node doesn\'t exist in dependency map', () => {
      const dependencies = {
        'a': ['b'],
      };

      expect(detectCircularDependency('nonexistent', dependencies)).toBeNull();
    });
  });

  describe('isDependencyReady', () => {
    test('should return true when no dependencies', () => {
      const graph: DependencyGraph = {
        dependencies: { 'b': [] },
        blockedBy: {},
      };

      const statesMap = new Map<string, SubFeatureState>();
      statesMap.set('b', makeSF('b', 'specified'));

      expect(isDependencyReady('b', graph, statesMap)).toBe(true);
    });

    test('should return true when all dependencies are at least planned', () => {
      const graph: DependencyGraph = {
        dependencies: { 'b': ['a'] },
        blockedBy: {},
      };

      const statesMap = new Map<string, SubFeatureState>();
      statesMap.set('a', makeSF('a', 'planned'));            // order 3 ≥ 3 → ready
      statesMap.set('b', makeSF('b', 'specified'));           // hasn't started yet

      expect(isDependencyReady('b', graph, statesMap)).toBe(true);
    });

    test('should return false when dependencies are not ready (phase < planned)', () => {
      const graph: DependencyGraph = {
        dependencies: { 'b': ['a'] },
        blockedBy: {},
      };

      const statesMap = new Map<string, SubFeatureState>();
      statesMap.set('a', makeSF('a', 'specified'));   // order 2 < 3 → not ready
      statesMap.set('b', makeSF('b', 'specified'));

      expect(isDependencyReady('b', graph, statesMap)).toBe(false);
    });

    test('should return false when any dependency is not ready', () => {
      const graph: DependencyGraph = {
        dependencies: { 'c': ['a', 'b'] },
        blockedBy: {},
      };

      const statesMap = new Map<string, SubFeatureState>();
      statesMap.set('a', makeSF('a', 'planned'));      // ready (order 3)
      statesMap.set('b', makeSF('b', 'registered'));   // not ready (order 0)
      statesMap.set('c', makeSF('c', 'specified'));

      expect(isDependencyReady('c', graph, statesMap)).toBe(false);
    });

    test('should return true when all dependencies meet minimum readiness (phase ≥ planned)', () => {
      // Phases with PHASE_ORDER ≥ 3 (= planned)
      const phasesAtLeastPlanned: Phase[] = [
        'planned', 'tasked', 'builded', 'reviewed', 'validated',
      ];

      for (const phase of phasesAtLeastPlanned) {
        const graph: DependencyGraph = {
          dependencies: { 'b': ['a'] },
          blockedBy: {},
        };

        const statesMap = new Map<string, SubFeatureState>();
        statesMap.set('a', makeSF('a', phase));
        statesMap.set('b', makeSF('b', 'specified'));

        expect(isDependencyReady('b', graph, statesMap)).toBe(true);
      }
    });
  });

  describe('getReadySubFeatures', () => {
    test('should return sub-features with no dependencies and unplanned blockers', () => {
      const graph: DependencyGraph = {
        dependencies: {
          'b': ['a'],
        },
        blockedBy: {
          'c': ['d'],  // c is blocked by d that is not yet planned
        },
      };

      const statesMap = new Map<string, SubFeatureState>();
      statesMap.set('a', makeSF('a', 'planned'));      // ready (order 3)
      statesMap.set('b', makeSF('b', 'specified'));     // dep 'a' ready
      statesMap.set('c', makeSF('c', 'registered'));    // blocked by d
      statesMap.set('d', makeSF('d', 'registered'));    // not planned → blocks c

      const ready = getReadySubFeatures(graph, statesMap);
      // b: dep 'a' is ready, doesn't block others → ready
      // c: blocked by 'd' which isn't planned → not ready
      // a: no deps → ready
      // d: no deps, not blocked → ready

      expect(ready).toContain('a');
      expect(ready).toContain('b');
      expect(ready).not.toContain('c');
      expect(ready).toContain('d');
    });

    test('should return empty when all sub-features blocked', () => {
      const graph: DependencyGraph = {
        dependencies: {
          'b': ['a'],
        },
        blockedBy: {
          'a': ['c'],  // Both 'a' and 'b' are blocked
        },
      };

      const statesMap = new Map<string, SubFeatureState>();
      statesMap.set('a', makeSF('a', 'registered'));
      statesMap.set('b', makeSF('b', 'registered'));
      statesMap.set('c', makeSF('c', 'registered'));

      const ready = getReadySubFeatures(graph, statesMap);
      expect(ready).toContain('c');
      expect(ready.length).toBe(1); // Only 'c' should be ready
    });

    test('should return sub-features when dependencies ready and no one blocks them', () => {
      const graph: DependencyGraph = {
        dependencies: {
          'b': ['a'],
        },
        blockedBy: {
          'a': [],
          'b': [],
        },
      };

      const statesMap = new Map<string, SubFeatureState>();
      statesMap.set('a', makeSF('a', 'planned')); // Ready
      statesMap.set('b', makeSF('b', 'specified'));

      const ready = getReadySubFeatures(graph, statesMap);
      expect(ready).toEqual(expect.arrayContaining(['a', 'b']));
    });

    test('should handle complex dependency and blocking scenario', () => {
      const graph: DependencyGraph = {
        dependencies: {
          'b': ['a'],
          'c': ['a'],
          'd': ['b', 'c'],
        },
        blockedBy: {
          'a': [],
          'b': ['e'],  // 'b' is blocked by 'e'
          'c': [],
          'd': [],
          'e': [],
        },
      };

      const statesMap = new Map<string, SubFeatureState>();
      statesMap.set('a', makeSF('a', 'planned'));    // Ready (order 3)
      statesMap.set('b', makeSF('b', 'registered'));  // Dep ready, but blocked by 'e'
      statesMap.set('c', makeSF('c', 'registered'));   // Ready-ish: dep 'a' is ready
      statesMap.set('d', makeSF('d', 'registered'));   // Not ready: deps not satisfied
      statesMap.set('e', makeSF('e', 'registered'));   // Blocks 'b'

      const ready = getReadySubFeatures(graph, statesMap);
      expect(ready).toContain('a');
      expect(ready).toContain('c');
      expect(ready).toContain('e');
      expect(ready).not.toContain('b'); // Blocked by e which hasn't reached planned
      expect(ready).not.toContain('d'); // Dependencies not ready
    });
  });
});
