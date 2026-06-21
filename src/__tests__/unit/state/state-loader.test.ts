/**
 * Unit tests for StateLoader — v3.0.0 adaptation (TASK-005)
 * Testing features:
 * - computeDepth() in various path scenarios
 * - initPhaseHistory() consistent strategy with v3.0.0 types
 * - create() method auto-population with v3.0.0 defaults
 * - v3.0.0 validation on create()
 */

import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { StateLoader } from '../../../state/state-loader';
import { StateV3_0_0, Phase, FeatureStatus, PhaseHistoryEntry } from '../../../state/schema-v3.0.0';

// Mock filesystem operations
jest.mock('fs/promises');

// Use real path module (not mocked) so that path.basename/dirname work correctly
// The original mock broke path.basename which is needed by create()

describe('StateLoader v3.0.0 Unit Tests', () => {
  let stateLoader: StateLoader;
  const mockSpecRootDir = '.sddu/specs-tree-root';

  beforeEach(() => {
    stateLoader = new StateLoader(mockSpecRootDir);
    jest.clearAllMocks();
  });

  describe('TASK-005.1: computeDepth() functionality', () => {
    test('computes depth as 0 for root level feature', () => {
      const depth = (stateLoader as any).computeDepth('specs-tree-ecommerce');
      expect(depth).toBe(0);
    });

    test('computes depth as 1 for first-level subtree', () => {
      const depth = (stateLoader as any).computeDepth('specs-tree-ecommerce/specs-tree-frontend');
      expect(depth).toBe(1);
    });

    test('computes depth as 2 for second-level subtree', () => {
      const depth = (stateLoader as any).computeDepth('specs-tree-ecommerce/specs-tree-backend/specs-tree-api');
      expect(depth).toBe(2);
    });

    test('computes depth as 3 for third-level subtree', () => {
      const depth = (stateLoader as any).computeDepth('specs-tree-ecommerce/specs-tree-backend/specs-tree-api/specs-tree-auth');
      expect(depth).toBe(3);
    });

    test('handles features without specs-tree prefix gracefully', () => {
      const depth = (stateLoader as any).computeDepth('regular-folder/subfolder');
      expect(depth).toBe(0);
    });
  });

  describe('TASK-005.2: initPhaseHistory() — v3.0.0 types', () => {
    test('initializes history with current phase if no history provided', () => {
      const initialState = {
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
      };
      const now = '2026-04-15T10:00:00.000Z';
      const result = (stateLoader as any).initPhaseHistory(initialState, now);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        phase: 'specified',
        timestamp: now,
        triggeredBy: 'StateLoader.create'
      });
    });

    test('uses existing history if provided', () => {
      const existingHistory: PhaseHistoryEntry[] = [{
        phase: 'discovered' as Phase,
        timestamp: '2026-04-15T09:00:00.000Z',
        triggeredBy: 'system'
      }];
      const initialState = {
        phase: 'specified' as Phase,
        status: 'tracked' as FeatureStatus,
        phaseHistory: existingHistory
      };
      const now = '2026-04-15T10:00:00.000Z';
      const result = (stateLoader as any).initPhaseHistory(initialState, now);

      expect(result).toEqual(existingHistory);
    });

    test('defaults to safe values if incomplete initial state provided', () => {
      const initialState = {};
      const now = '2026-04-15T10:00:00.000Z';
      const result = (stateLoader as any).initPhaseHistory(initialState, now);

      expect(result).toHaveLength(1);
      expect(result[0].phase).toBe('registered');
      expect(result[0].timestamp).toBe(now);
      expect(result[0].triggeredBy).toBe('StateLoader.create');
    });
  });

  describe('TASK-005.3: create() method — v3.0.0 defaults', () => {
    test('writes phase="registered", status="tracked", version="v3.0.0" by default', async () => {
      const featurePath = 'specs-tree-ecommerce/specs-tree-frontend';
      const initialState: Partial<StateV3_0_0> = {
        name: 'Frontend App',
      };
      
      // Mock: file does NOT exist (access rejects with ENOENT)
      (fsPromises.access as jest.Mock).mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await stateLoader.create(featurePath, initialState);

      expect(result).toBe(true);
      expect(fsPromises.mkdir).toHaveBeenCalledWith(
        path.dirname(`${mockSpecRootDir}/${featurePath}/state.json`),
        { recursive: true }
      );
      expect(fsPromises.writeFile).toHaveBeenCalledTimes(1);
      
      const writtenContent = jest.mocked(fsPromises.writeFile).mock.calls[0][1] as string;
      const parsedState = JSON.parse(writtenContent);
      
      expect(parsedState.phase).toBe('registered');
      expect(parsedState.status).toBe('tracked');
      expect(parsedState.version).toBe('v3.0.0');
      expect(parsedState.depth).toBe(1);
    });

    test('auto-initializes phaseHistory with v3.0.0 PhaseHistoryEntry format', async () => {
      const featurePath = 'specs-tree-ecommerce';
      const initialState: Partial<StateV3_0_0> = {
        name: 'Ecommerce Platform',
        phase: 'planned' as Phase,
        status: 'tracked' as FeatureStatus,
      };
      
      // Mock: file does NOT exist
      (fsPromises.access as jest.Mock).mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);

      await stateLoader.create(featurePath, initialState);

      const writtenContent = jest.mocked(fsPromises.writeFile).mock.calls[0][1] as string;
      const parsedState = JSON.parse(writtenContent);
      
      expect(parsedState.phaseHistory).toBeDefined();
      expect(parsedState.phaseHistory).toHaveLength(1);
      expect(parsedState.phaseHistory[0].phase).toBe('planned');
      expect(parsedState.phaseHistory[0].triggeredBy).toBe('StateLoader.create');
      expect(parsedState.phaseHistory[0].timestamp).toBeDefined();
    });

    test('throws when validateStateV3 fails (e.g. invalid phase)', async () => {
      const featurePath = 'specs-tree-invalid';
      const initialState: Partial<StateV3_0_0> = {
        name: 'Invalid Feature',
        phase: 'unknown' as any,
      };
      
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);

      await expect(stateLoader.create(featurePath, initialState)).rejects.toThrow();
    });

    test('does not overwrite existing state file', async () => {
      const featurePath = 'specs-tree-existing';
      const initialState: Partial<StateV3_0_0> = {
        name: 'Existing Feature',
      };
      
      // First call: file does NOT exist → create succeeds
      (fsPromises.access as jest.Mock).mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await stateLoader.create(featurePath, initialState);
      expect(result).toBe(true);

      // Second call: file EXISTS → create should fail
      (fsPromises.access as jest.Mock).mockResolvedValue(undefined);

      const result2 = await stateLoader.create(featurePath, initialState);
      expect(result2).toBe(false); // Should fail
    });
  });

  describe('TASK-005.4: applyReparation — preserves non-tracked status (FR-008)', () => {
    test('does not overwrite suspended status during repair', async () => {
      const badState = {
        feature: 'test-feat',
        name: 'Test',
        version: '2.1.0',  // old version triggers repair
        phase: 'specified',
        status: 'suspended',
        depth: 0,
        phaseHistory: [],
        files: { spec: 'test-feat/spec.md' },
        dependencies: { on: [], blocking: [] },
        suspended: { suspendedNote: 'waiting for deps' },
      };

      const result = await (stateLoader as any).applyReparation(badState, 'specs-tree-test-feat');

      expect(result.state.status).toBe('suspended');  // Must not be overwritten to 'tracked'
      expect(result.state.version).toBe('v3.0.0');     // Version updated
    });

    test('does not overwrite terminated status during repair', async () => {
      const badState = {
        feature: 'test-feat-term',
        name: 'Terminated',
        version: '2.0.0',
        phase: 'specified',
        status: 'terminated',
        depth: 0,
        phaseHistory: [],
        files: { spec: 'test-feat-term/spec.md' },
        dependencies: { on: [], blocking: [] },
      };

      const result = await (stateLoader as any).applyReparation(badState, 'specs-tree-test-feat-term');

      expect(result.state.status).toBe('terminated');  // Must remain terminated
    });

    test('does not overwrite merged status during repair', async () => {
      const badState = {
        feature: 'test-feat-merge',
        name: 'Merged',
        version: '1.0.0',
        phase: 'validated',
        status: 'merged',
        depth: 0,
        phaseHistory: [],
        files: { spec: 'test-feat-merge/spec.md' },
        dependencies: { on: [], blocking: [] },
        merged: { mergedInto: 'specs-tree-other', mergedAt: '2026-01-01T00:00:00.000Z' },
      };

      const result = await (stateLoader as any).applyReparation(badState, 'specs-tree-test-feat-merge');

      expect(result.state.status).toBe('merged');  // Must remain merged
    });

    test('sets default tracked when status is missing', async () => {
      const badState = {
        feature: 'test-feat-no-status',
        name: 'No Status',
        version: '2.0.0',
        phase: 'specified',
        // no status field
        depth: 0,
        phaseHistory: [],
        files: { spec: 'test-feat-no-status/spec.md' },
        dependencies: { on: [], blocking: [] },
      };

      const result = await (stateLoader as any).applyReparation(badState, 'specs-tree-test-feat-no-status');

      expect(result.state.status).toBe('tracked');  // Default to tracked when missing
    });
  });
});
