/**
 * Unit tests for ConsistencyChecker (TASK-007)
 *
 * Covers:
 *  - Version comparison (needsCheck, loadState, saveCheckedVersion)
 *  - All 7 detection rules
 *  - Repair with/without confirmation
 *  - FR-008: protection of non-tracked statuses during repair
 */

import { ConsistencyChecker, ConsistencyAnomaly } from '../consistency-checker';
import { Phase, FeatureStatus, StateV3_0_0 } from '../schema-v3.0.0';
import * as fsPromises from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Mocks
// ============================================================================

jest.mock('fs/promises');
jest.mock('../tree-scanner', () => ({
  scanTreeStructure: jest.fn(),
}));

import { scanTreeStructure } from '../tree-scanner';

// ============================================================================
// Helpers
// ============================================================================

function makeValidState(overrides: Partial<StateV3_0_0> = {}): StateV3_0_0 {
  return {
    feature: 'specs-tree-test-feature',
    version: 'v3.0.0',
    phase: 'registered' as Phase,
    status: 'tracked' as FeatureStatus,
    depth: 0,
    phaseHistory: [{ phase: 'registered' as Phase, timestamp: '2026-01-01T00:00:00.000Z', triggeredBy: 'test' }],
    files: { spec: 'specs-tree-test-feature/spec.md' },
    dependencies: { on: [], blocking: [] },
    ...overrides,
  };
}

function makeFeatureNode(id: string, featureName: string): any {
  return {
    id,
    path: `.sddu/specs-tree-root/${id}`,
    featureName,
    level: 0,
    children: [],
  };
}

function setupMockTree(features: Array<{ id: string; name: string }>) {
  const nodes: any[] = [];
  const flatMap = new Map<string, any>();
  for (const f of features) {
    const node = makeFeatureNode(f.id, f.name);
    nodes.push(node);
    flatMap.set(`.sddu/specs-tree-root/${f.id}`, node);
  }
  (scanTreeStructure as jest.Mock).mockResolvedValue({ nodes, flatMap });
}

// ============================================================================
// Tests
// ============================================================================

describe('ConsistencyChecker (TASK-007)', () => {
  const PLUGIN_VERSION = '1.2.0';
  const SPECS_ROOT = '.sddu/specs-tree-root';

  let checker: ConsistencyChecker;

  beforeEach(() => {
    jest.clearAllMocks();
    checker = new ConsistencyChecker(PLUGIN_VERSION, SPECS_ROOT);
  });

  // ========================================================================
  // Version management
  // ========================================================================

  describe('version management', () => {
    test('needsCheck() returns true when no previous state loaded', () => {
      expect(checker.needsCheck()).toBe(true);
    });

    test('needsCheck() returns false after loadState with same version', async () => {
      (fsPromises.access as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify({ pluginVersion: '1.2.0', lastCheckedAt: '2026-01-01', lastCheckResult: 'clean', anomalyCount: 0 }),
      );

      await checker.loadState();
      expect(checker.needsCheck()).toBe(false);
    });

    test('needsCheck() returns true after loadState with different version', async () => {
      (fsPromises.access as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify({ pluginVersion: '1.1.0', lastCheckedAt: '2026-01-01', lastCheckResult: 'clean', anomalyCount: 0 }),
      );

      await checker.loadState();
      expect(checker.needsCheck()).toBe(true);
    });

    test('needsCheck() returns true when consistency state file does not exist', async () => {
      (fsPromises.access as jest.Mock).mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

      await checker.loadState();
      expect(checker.needsCheck()).toBe(true);
    });

    test('saveCheckedVersion() persists current version', async () => {
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);

      await checker.saveCheckedVersion();

      // needsCheck() should now be false since lastCheckedVersion was set in memory
      expect(checker.needsCheck()).toBe(false);
    });
  });

  // ========================================================================
  // Detection 1: missing_state_json
  // ========================================================================

  describe('detection 1: missing_state_json', () => {
    test('flags feature with no state.json', async () => {
      setupMockTree([{ id: 'specs-tree-empty', name: 'empty' }]);

      // Neither state.json nor .state.json exists
      (fsPromises.access as jest.Mock).mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      const report = await checker.checkAll(SPECS_ROOT);

      const missingAnomalies = report.anomalies.filter(a => a.type === 'missing_state_json');
      expect(missingAnomalies.length).toBe(1);
      expect(missingAnomalies[0].path).toContain('specs-tree-empty');
      expect(missingAnomalies[0].severity).toBe('error');
      expect(missingAnomalies[0].repairable).toBe(true);
    });

    test('does not flag feature with state.json', async () => {
      setupMockTree([{ id: 'specs-tree-has-state', name: 'has-state' }]);

      // state.json exists
      (fsPromises.access as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('state.json') && !filePath.includes('.state.json')) {
          return Promise.resolve();
        }
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      });
      // Mock reading valid state
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(makeValidState()));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      const report = await checker.checkAll(SPECS_ROOT);

      const missingAnomalies = report.anomalies.filter(a => a.type === 'missing_state_json');
      expect(missingAnomalies.length).toBe(0);
    });
  });

  // ========================================================================
  // Detection 2: hidden_state_file
  // ========================================================================

  describe('detection 2: hidden_state_file', () => {
    test('flags .state.json as hidden state file', async () => {
      setupMockTree([{ id: 'specs-tree-hidden', name: 'hidden' }]);

      // state.json does NOT exist, .state.json EXISTS
      (fsPromises.access as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('.state.json')) return Promise.resolve();
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      });
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(makeValidState()));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      const report = await checker.checkAll(SPECS_ROOT);

      const hiddenAnomalies = report.anomalies.filter(a => a.type === 'hidden_state_file');
      expect(hiddenAnomalies.length).toBe(1);
      expect(hiddenAnomalies[0].severity).toBe('warning');
      expect(hiddenAnomalies[0].repairable).toBe(true);
    });
  });

  // ========================================================================
  // Detection 3: invalid_root_reference
  // ========================================================================

  describe('detection 3: invalid_root_reference', () => {
    test('flags root state.json childrens referencing non-existent dirs', async () => {
      setupMockTree([{ id: 'specs-tree-valid', name: 'valid' }]);

      const rootStatePath = path.join(SPECS_ROOT, 'state.json');
      const validFeatureStatePath = path.join(SPECS_ROOT, 'specs-tree-valid', 'state.json');
      const validFeatureDir = path.join(SPECS_ROOT, 'specs-tree-valid');
      const ghostDir = path.join(SPECS_ROOT, 'specs-tree-ghost');

      // Mock access: root state exists; feature dir+state exist; ghost dir does not
      (fsPromises.access as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath === rootStatePath) return Promise.resolve();
        if (filePath === validFeatureStatePath) return Promise.resolve();
        if (filePath === validFeatureDir) return Promise.resolve();  // directory exists
        if (filePath.includes('specs-tree-ghost')) {
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        }
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      });

      // Root state has childrens refs; feature state is valid
      (fsPromises.readFile as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath === rootStatePath) {
          return Promise.resolve(JSON.stringify({
            childrens: [
              { path: 'specs-tree-ghost', featureName: 'ghost' },
              { path: 'specs-tree-valid', featureName: 'valid' },
            ],
          }));
        }
        if (filePath === validFeatureStatePath) {
          return Promise.resolve(JSON.stringify(makeValidState({ feature: 'specs-tree-valid' })));
        }
        return Promise.reject(new Error('Unexpected readFile call'));
      });
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      const report = await checker.checkAll(SPECS_ROOT);

      const rootAnomalies = report.anomalies.filter(a => a.type === 'invalid_root_reference');
      expect(rootAnomalies.length).toBe(1);
      expect(rootAnomalies[0].path).toBe('specs-tree-ghost');
      expect(rootAnomalies[0].detail).toContain('does not exist');
    });

    test('no anomaly when root state.json does not exist', async () => {
      setupMockTree([{ id: 'specs-tree-foo', name: 'foo' }]);

      (fsPromises.access as jest.Mock).mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      (fsPromises.readFile as jest.Mock).mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      const report = await checker.checkAll(SPECS_ROOT);

      const rootAnomalies = report.anomalies.filter(a => a.type === 'invalid_root_reference');
      // May have 0 or 1 depending on access pattern, but should not flag root ref
      const rootRefAnomalies = rootAnomalies.filter(a => a.detail.includes('does not exist'));
      expect(rootRefAnomalies.length).toBe(0);
    });
  });

  // ========================================================================
  // Detection 4: field_mixing
  // ========================================================================

  describe('detection 4: field_mixing', () => {
    test('flags state.json using old `state` field for stage value', async () => {
      setupMockTree([{ id: 'specs-tree-mixed', name: 'mixed' }]);

      (fsPromises.access as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('state.json') && !filePath.includes('.state.json')) return Promise.resolve();
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      });

      // State with old `state` field
      const oldState = {
        feature: 'specs-tree-mixed',
        state: 'specified',  // old field carrying stage value
        status: 'tracked',
        version: 'v2.0.0',
        depth: 0,
      };
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(oldState));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      const report = await checker.checkAll(SPECS_ROOT);

      const mixingAnomalies = report.anomalies.filter(a => a.type === 'field_mixing');
      expect(mixingAnomalies.length).toBe(1);
      expect(mixingAnomalies[0].detail).toContain('state');
      expect(mixingAnomalies[0].detail).toContain('phase');
    });
  });

  // ========================================================================
  // Detection 5: non_standard_status
  // ========================================================================

  describe('detection 5: non_standard_status', () => {
    test('flags non-standard phase value', async () => {
      setupMockTree([{ id: 'specs-tree-bad-phase', name: 'bad-phase' }]);

      (fsPromises.access as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('state.json') && !filePath.includes('.state.json')) return Promise.resolve();
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      });

      const badState = makeValidState({ phase: 'unknown' as Phase, feature: 'specs-tree-bad-phase' });
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(badState));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      const report = await checker.checkAll(SPECS_ROOT);

      const statusAnomalies = report.anomalies.filter(a => a.type === 'non_standard_status');
      expect(statusAnomalies.length).toBe(1);
      expect(statusAnomalies[0].detail).toContain('phase');
    });

    test('flags non-standard status value', async () => {
      setupMockTree([{ id: 'specs-tree-bad-status', name: 'bad-status' }]);

      (fsPromises.access as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('state.json') && !filePath.includes('.state.json')) return Promise.resolve();
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      });

      const badState = makeValidState({ status: 'unknown' as FeatureStatus, feature: 'specs-tree-bad-status' });
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(badState));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      const report = await checker.checkAll(SPECS_ROOT);

      const statusAnomalies = report.anomalies.filter(a =>
        a.type === 'non_standard_status' && a.detail.includes('status'),
      );
      expect(statusAnomalies.length).toBe(1);
    });
  });

  // ========================================================================
  // Detection 6: missing_field
  // ========================================================================

  describe('detection 6: missing_field', () => {
    test('flags state.json missing phase field', async () => {
      setupMockTree([{ id: 'specs-tree-no-phase', name: 'no-phase' }]);

      (fsPromises.access as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('state.json') && !filePath.includes('.state.json')) return Promise.resolve();
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      });

      const stateNoPhase = { feature: 'specs-tree-no-phase', status: 'tracked', version: 'v3.0.0' };
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(stateNoPhase));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      const report = await checker.checkAll(SPECS_ROOT);

      const missingAnomalies = report.anomalies.filter(a => a.type === 'missing_field');
      expect(missingAnomalies.length).toBe(1);
      expect(missingAnomalies[0].detail).toContain('phase');
    });

    test('flags state.json missing status field', async () => {
      setupMockTree([{ id: 'specs-tree-no-status', name: 'no-status' }]);

      (fsPromises.access as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('state.json') && !filePath.includes('.state.json')) return Promise.resolve();
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      });

      const stateNoStatus = { feature: 'specs-tree-no-status', phase: 'specified', version: 'v3.0.0' };
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(stateNoStatus));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      const report = await checker.checkAll(SPECS_ROOT);

      const missingAnomalies = report.anomalies.filter(a => a.type === 'missing_field');
      expect(missingAnomalies.length).toBe(1);
      expect(missingAnomalies[0].detail).toContain('status');
    });

    test('flags state.json missing both phase and status', async () => {
      setupMockTree([{ id: 'specs-tree-nothing', name: 'nothing' }]);

      (fsPromises.access as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('state.json') && !filePath.includes('.state.json')) return Promise.resolve();
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      });

      const emptyState = { feature: 'specs-tree-nothing', version: 'v3.0.0' };
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(emptyState));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      const report = await checker.checkAll(SPECS_ROOT);

      const missingAnomalies = report.anomalies.filter(a => a.type === 'missing_field');
      expect(missingAnomalies.length).toBe(1);
      expect(missingAnomalies[0].detail).toContain('both');
    });
  });

  // ========================================================================
  // Detection 7: combined_constraint_violation
  // ========================================================================

  describe('detection 7: combined_constraint_violation', () => {
    test('flags completed status outside validated phase', async () => {
      setupMockTree([{ id: 'specs-tree-bad-combo', name: 'bad-combo' }]);

      (fsPromises.access as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('state.json') && !filePath.includes('.state.json')) return Promise.resolve();
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      });

      const badCombo = makeValidState({
        feature: 'specs-tree-bad-combo',
        phase: 'specified' as Phase,
        status: 'completed' as FeatureStatus,
      });
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(badCombo));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      const report = await checker.checkAll(SPECS_ROOT);

      const comboAnomalies = report.anomalies.filter(a => a.type === 'combined_constraint_violation');
      expect(comboAnomalies.length).toBe(1);
      expect(comboAnomalies[0].detail).toContain('completed');
      expect(comboAnomalies[0].detail).toContain('validated');
    });

    test('flags merged status without mergedInto', async () => {
      setupMockTree([{ id: 'specs-tree-bad-merge', name: 'bad-merge' }]);

      (fsPromises.access as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('state.json') && !filePath.includes('.state.json')) return Promise.resolve();
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      });

      const badMerge = makeValidState({
        feature: 'specs-tree-bad-merge',
        phase: 'specified' as Phase,
        status: 'merged' as FeatureStatus,
        // No merged field
      });
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(badMerge));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      const report = await checker.checkAll(SPECS_ROOT);

      const comboAnomalies = report.anomalies.filter(a => a.type === 'combined_constraint_violation');
      const mergeAnomalies = comboAnomalies.filter(a => a.detail.includes('mergedInto'));
      expect(mergeAnomalies.length).toBe(1);
      expect(mergeAnomalies[0].repairable).toBe(false); // Can't auto-fix without target
    });
  });

  // ========================================================================
  // Multiple anomalies in a single scan
  // ========================================================================

  describe('comprehensive scan', () => {
    test('detects multiple anomaly types across features', async () => {
      setupMockTree([
        { id: 'specs-tree-clean', name: 'clean' },
        { id: 'specs-tree-mixed', name: 'mixed' },
        { id: 'specs-tree-bad-combo', name: 'bad-combo' },
      ]);

      (fsPromises.access as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('/state.json') && !filePath.includes('.state.json')) return Promise.resolve();
        if (filePath.includes('.consistency-state.json')) return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      });

      (fsPromises.readFile as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('specs-tree-clean')) {
          return Promise.resolve(JSON.stringify(makeValidState({ feature: 'specs-tree-clean' })));
        }
        if (filePath.includes('specs-tree-mixed')) {
          return Promise.resolve(JSON.stringify({
            feature: 'specs-tree-mixed',
            state: 'specified',  // old field mixing
            status: 'wip',       // non-standard
            version: 'v2.0.0',
          }));
        }
        if (filePath.includes('specs-tree-bad-combo')) {
          return Promise.resolve(JSON.stringify(makeValidState({
            feature: 'specs-tree-bad-combo',
            phase: 'specified' as Phase,
            status: 'completed' as FeatureStatus,
          })));
        }
        return Promise.resolve('{}');
      });
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      const report = await checker.checkAll(SPECS_ROOT);

      expect(report.totalFeatures).toBe(3);
      expect(report.anomalies.length).toBeGreaterThanOrEqual(3); // at least 3 anomalies from mixed + bad-combo

      // Verify anomaly types are grouped by type
      const types = new Set(report.anomalies.map(a => a.type));
      expect(types.has('field_mixing')).toBe(true);
      expect(types.has('non_standard_status')).toBe(true);
      expect(types.has('combined_constraint_violation')).toBe(true);
    });
  });

  // ========================================================================
  // Repair: repair()
  // ========================================================================

  describe('repair', () => {
    test('does NOT repair when confirmed is false', async () => {
      const anomalies: ConsistencyAnomaly[] = [{
        type: 'missing_state_json',
        path: 'specs-tree-missing',
        detail: 'No state.json',
        severity: 'error',
        repairable: true,
      }];

      const { repaired, failed } = await checker.repair(anomalies, SPECS_ROOT, false);

      expect(repaired.length).toBe(0);
      expect(failed.length).toBe(0);
      // No writeFile should have been called
      expect(fsPromises.writeFile).not.toHaveBeenCalled();
    });

    test('repairs missing_state_json when confirmed', async () => {
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const anomalies: ConsistencyAnomaly[] = [{
        type: 'missing_state_json',
        path: 'specs-tree-missing',
        detail: 'No state.json',
        severity: 'error',
        repairable: true,
      }];

      const { repaired, failed } = await checker.repair(anomalies, SPECS_ROOT, true);

      expect(repaired.length).toBe(1);
      expect(failed.length).toBe(0);
      expect(fsPromises.writeFile).toHaveBeenCalled();

      // Verify the written content has correct defaults
      const writeCall = (fsPromises.writeFile as jest.Mock).mock.calls[0];
      const writtenContent = typeof writeCall[1] === 'string' ? writeCall[1] : '';
      if (writtenContent) {
        const parsed = JSON.parse(writtenContent);
        expect(parsed.phase).toBe('registered');
        expect(parsed.status).toBe('tracked');
        expect(parsed.version).toBe('v3.0.0');
      }
    });

    test('repairs hidden_state_file when confirmed', async () => {
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(makeValidState()));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const anomalies: ConsistencyAnomaly[] = [{
        type: 'hidden_state_file',
        path: 'specs-tree-hidden',
        detail: 'Has .state.json',
        severity: 'warning',
        repairable: true,
      }];

      const { repaired, failed } = await checker.repair(anomalies, SPECS_ROOT, true);

      expect(repaired.length).toBe(1);
      expect(failed.length).toBe(0);
    });

    test('repairs field_mixing when confirmed', async () => {
      (fsPromises.access as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        feature: 'specs-tree-mixed',
        state: 'specified',
        status: 'tracked',
        version: 'v2.0.0',
      }));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const anomalies: ConsistencyAnomaly[] = [{
        type: 'field_mixing',
        path: 'specs-tree-mixed',
        detail: 'Uses state field',
        severity: 'error',
        repairable: true,
      }];

      const { repaired, failed } = await checker.repair(anomalies, SPECS_ROOT, true);

      expect(repaired.length).toBe(1);

      // Verify `state` field was removed and `phase` added
      const writeCall = (fsPromises.writeFile as jest.Mock).mock.calls[0];
      const content = typeof writeCall[1] === 'string' ? JSON.parse(writeCall[1]) : null;
      if (content) {
        expect(content.phase).toBe('specified');
        expect(content.state).toBeUndefined(); // Old field removed
      }
    });

    // ========================================================================
    // FR-008: Protection of non-tracked statuses during repair
    // ========================================================================

    test('FR-008: preserves suspended status when repairing missing_field', async () => {
      (fsPromises.access as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        feature: 'specs-tree-suspended',
        // missing phase, but has suspended status
        status: 'suspended',
        suspended: { suspendedNote: 'waiting for deps' },
        version: 'v2.0.0',
      }));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const anomalies: ConsistencyAnomaly[] = [{
        type: 'missing_field',
        path: 'specs-tree-suspended',
        detail: 'Missing phase field',
        severity: 'error',
        repairable: true,
      }];

      const { repaired, failed } = await checker.repair(anomalies, SPECS_ROOT, true);

      expect(repaired.length).toBe(1);

      const writeCall = (fsPromises.writeFile as jest.Mock).mock.calls[0];
      const content = typeof writeCall[1] === 'string' ? JSON.parse(writeCall[1]) : null;
      if (content) {
        expect(content.phase).toBe('registered'); // Default phase applied
        expect(content.status).toBe('suspended'); // FR-008: NOT overwritten to 'tracked'
        expect(content.suspended).toBeDefined();
      }
    });

    test('FR-008: preserves terminated status when repairing field_mixing', async () => {
      (fsPromises.access as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        feature: 'specs-tree-terminated',
        state: 'specified',
        status: 'terminated',
        version: 'v2.0.0',
      }));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const anomalies: ConsistencyAnomaly[] = [{
        type: 'field_mixing',
        path: 'specs-tree-terminated',
        detail: 'Uses state field',
        severity: 'error',
        repairable: true,
      }];

      const { repaired, failed } = await checker.repair(anomalies, SPECS_ROOT, true);

      expect(repaired.length).toBe(1);

      const writeCall = (fsPromises.writeFile as jest.Mock).mock.calls[0];
      const content = typeof writeCall[1] === 'string' ? JSON.parse(writeCall[1]) : null;
      if (content) {
        expect(content.phase).toBe('specified');
        expect(content.status).toBe('terminated'); // FR-008: preserved
      }
    });

    test('FR-008: preserves merged status when repairing non_standard_status', async () => {
      (fsPromises.access as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        feature: 'specs-tree-merged',
        phase: 'validated',
        status: 'merged',
        merged: { mergedInto: 'specs-tree-target', mergedAt: '2026-01-01T00:00:00.000Z' },
        version: 'v3.0.0',
      }));
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const anomalies: ConsistencyAnomaly[] = [{
        type: 'non_standard_status',
        path: 'specs-tree-merged',
        detail: 'Non-standard phase value',
        severity: 'error',
        repairable: true,
      }];

      const { repaired } = await checker.repair(anomalies, SPECS_ROOT, true);
      expect(repaired.length).toBe(1);

      const writeCall = (fsPromises.writeFile as jest.Mock).mock.calls[0];
      const content = typeof writeCall[1] === 'string' ? JSON.parse(writeCall[1]) : null;
      if (content) {
        expect(content.status).toBe('merged'); // FR-008: preserved
      }
    });
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  describe('edge cases', () => {
    test('scan failure triggers root reference anomaly', async () => {
      (scanTreeStructure as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      const report = await checker.checkAll(SPECS_ROOT);

      expect(report.totalFeatures).toBe(0);
      expect(report.anomalies.length).toBe(1);
      expect(report.anomalies[0].type).toBe('invalid_root_reference');
      expect(report.anomalies[0].detail).toContain('Failed to scan');
      expect(report.anomalies[0].repairable).toBe(false);
    });

    test('checkAll persists version after completion', async () => {
      setupMockTree([]);
      (fsPromises.access as jest.Mock).mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);

      await checker.checkAll(SPECS_ROOT);

      // Verify that consistency state was saved
      const writeCalls = (fsPromises.writeFile as jest.Mock).mock.calls;
      const consistencyWrite = writeCalls.find((call: any) =>
        typeof call[0] === 'string' && call[0].includes('.consistency-state.json'),
      );
      expect(consistencyWrite).toBeDefined();
    });
  });
});
