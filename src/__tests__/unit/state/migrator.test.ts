import fs from 'fs/promises';
import path from 'path';
import {
  migrateState,
  migrateToV2,
  migrateToV3,
  backupState,
  rollbackState,
  hasBackup,
  MigrationResult,
} from '../../../state/migrator';
import { StateV3_0_0, VALID_PHASES } from '../../../state/schema-v3.0.0';

describe('状态迁移工具测试', () => {
  const mockFeatureId = 'test-feature';
  const mockSpecsDir = '/tmp/test-specs';
  const mockSpecsPath = path.join(mockSpecsDir, mockFeatureId);

  beforeEach(async () => {
    try {
      await fs.rm(mockSpecsDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
    await fs.mkdir(mockSpecsPath, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(mockSpecsDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  // ===========================================================================
  // backupState tests
  // ===========================================================================
  describe('backupState 函数测试', () => {
    test('应该在备份目录创建备份文件', async () => {
      const testState = { feature: 'test', status: 'testing' };

      const backupPath = await backupState(testState, mockFeatureId, mockSpecsDir);

      expect(backupPath).toContain('.state.backup');
      expect(backupPath).toContain('state-');
      expect(backupPath).toContain('.json');

      const backupContent = await fs.readFile(backupPath, 'utf-8');
      const parsedBackup = JSON.parse(backupContent);
      expect(parsedBackup).toEqual(testState);
    });
  });

  // ===========================================================================
  // migrateState tests (v3.0.0 target)
  // ===========================================================================
  describe('migrateState 函数测试 — v3.0.0 target', () => {
    test('当状态已经是 v3.0.0 时不应迁移', async () => {
      const latestState = {
        version: 'v3.0.0',
        feature: 'test-feature',
        phase: 'planned',
        status: 'tracked',
      };

      const result = await migrateState(latestState, mockFeatureId, mockSpecsDir);

      expect(result.success).toBe(true);
      expect(result.migratedToVersion).toBe('v3.0.0');
    });

    test('应该从 v2.0.0 版本迁移到 v3.0.0', async () => {
      const oldState = {
        version: '2.0.0',
        feature: 'test-migration',
        status: 'planned',
        phase: 2,
        createdAt: '2026-03-01T00:00:00Z',
      };

      const result = await migrateState(oldState, mockFeatureId, mockSpecsDir);

      expect(result.success).toBe(true);
      expect(result.migratedToVersion).toBe('v3.0.0');
      expect(result.backupPath).toBeDefined();
    });

    test('应该处理缺少版本号的老状态', async () => {
      const oldState = {
        feature: 'test-no-version',
        status: 'specified',
        someData: 'value',
      };

      const result = await migrateState(oldState, mockFeatureId, mockSpecsDir);

      expect(result.success).toBe(true);
      expect(result.migratedToVersion).toBe('v3.0.0');
    });

    test('当迁移失败时应该返回错误', async () => {
      const readonlyState = Object.freeze({
        feature: 'readonly-test',
        status: 'planned',
      });

      const result = await migrateState(readonlyState, mockFeatureId, '/nonexistent/path');

      expect(result.success).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  // ===========================================================================
  // migrateToV3 tests (direct v2→v3 migration)
  // ===========================================================================
  describe('migrateToV3 — v2.x → v3.0.0 直接迁移', () => {
    test('正确迁移 v2.0.0 状态到 v3.0.0', () => {
      const v2State = {
        feature: 'my-feature',
        version: '2.0.0',
        status: 'planned',
        phase: 2,
        phaseHistory: [
          { phase: 1, status: 'specified', timestamp: '2026-01-01T00:00:00.000Z', triggeredBy: 'system' },
          { phase: 2, status: 'planned', timestamp: '2026-01-02T00:00:00.000Z', triggeredBy: 'system' },
        ],
        dependencies: { on: ['other-feature'], blocking: ['blocked-feature'] },
        files: { spec: 'spec.md', plan: 'plan.md' },
        depth: 1,
      };

      const result = migrateToV3(v2State);

      expect(result.version).toBe('v3.0.0');
      expect(result.feature).toBe('my-feature');
      // v2.x phase=2 (planned) → v3.0.0 phase='planned'
      expect(result.phase).toBe('planned');
      // Old WorkflowStatus → new FeatureStatus (defaults to 'tracked')
      expect(result.status).toBe('tracked');

      // Phase history should be converted
      expect(result.phaseHistory).toHaveLength(2);
      expect(result.phaseHistory[0].phase).toBe('specified');
      expect(result.phaseHistory[1].phase).toBe('planned');
      expect(result.phaseHistory[0].triggeredBy).toBe('system');

      // Dependencies preserved
      expect(result.dependencies.on).toEqual(['other-feature']);
      expect(result.dependencies.blocking).toEqual(['blocked-feature']);

      // Files preserved
      expect(result.files.spec).toBe('spec.md');
      expect(result.files.plan).toBe('plan.md');
    });

    test('迁移后的状态通过 validateStateV3 校验', () => {
      const v2State = {
        feature: 'validatable-feature',
        version: '2.0.0',
        status: 'planned',
        phase: 2,
        phaseHistory: [
          { phase: 1, status: 'specified', timestamp: '2026-01-01T00:00:00.000Z', triggeredBy: 'system' },
        ],
        dependencies: { on: [], blocking: [] },
        files: { spec: 'spec.md' },
        depth: 0,
      };

      const result = migrateToV3(v2State);

      const { validateStateV3 } = require('./schema-v3.0.0');
      expect(validateStateV3(result)).toBe(true);
    });

    test('迁移无版本号的老格式', () => {
      const legacyState = {
        feature: 'legacy-feature',
        status: 'tasked',
        dependencies: { on: [], blocking: [] },
        files: { spec: 'legacy-spec.md' },
        depth: 0,
      };

      const result = migrateToV3(legacyState);

      expect(result.version).toBe('v3.0.0');
      expect(result.feature).toBe('legacy-feature');
      expect(result.phase).toBe('tasked'); // old 'tasked' → new 'tasked' Phase
      expect(result.status).toBe('tracked');
    });

    test('保留已有的 suspended status', () => {
      const suspendedState = {
        feature: 'suspended-feature',
        version: '2.1.0',
        status: 'suspended',
        phase: 1,
        state: 'suspended',
        suspended: { suspendedUntil: '2027-01-01', suspendedNote: 'waiting' },
        phaseHistory: [],
        dependencies: { on: [], blocking: [] },
        files: { spec: 'spec.md' },
        depth: 0,
      };

      const result = migrateToV3(suspendedState);

      // 'suspended' IS a valid FeatureStatus, so the migrator preserves it.
      // The `state` field value 'suspended' is also recognized as a flow status.
      expect(result.status).toBe('suspended');
      // Phase is inferred from the old 'phase: 1' → v3.0.0 'specified'
      expect(result.phase).toBe('specified');
    });

    test('保留已有的 terminated status (from state field)', () => {
      const terminatedState = {
        feature: 'terminated-feature',
        version: '2.1.0',
        status: 'terminated',
        phase: 3,
        state: 'terminated',
        phaseHistory: [],
        dependencies: { on: [], blocking: [] },
        files: { spec: 'spec.md' },
        depth: 0,
      };

      const result = migrateToV3(terminatedState);

      // Since 'terminated' is in flowValues, status is preserved
      expect(result.status).toBe('terminated');
    });

    test('迁移时创建默认 phaseHistory（无历史记录）', () => {
      const leanState = {
        feature: 'lean-feature',
        status: 'specified',
        phase: 1,
        dependencies: { on: [], blocking: [] },
        files: { spec: 'spec.md' },
        depth: 0,
      };

      const result = migrateToV3(leanState);

      expect(result.phaseHistory).toHaveLength(1);
      expect(result.phaseHistory[0].phase).toBe('specified');
      expect(result.phaseHistory[0].triggeredBy).toBe('migration');
      expect(result.phaseHistory[0].comment).toBe('Migrated to v3.0.0');
    });
  });

  // ===========================================================================
  // hasBackup tests
  // ===========================================================================
  describe('hasBackup 函数测试', () => {
    test('应该检测到存在的备份', async () => {
      const testState = { feature: 'test', status: 'testing' };
      await backupState(testState, mockFeatureId, mockSpecsDir);

      const hasBkp = await hasBackup(mockSpecsDir);
      expect(hasBkp).toBe(true);
    });

    test('应该当没有备份时返回 false', async () => {
      const hasBkp = await hasBackup(mockSpecsDir);
      expect(hasBkp).toBe(false);
    });

    test('应该当备份目录不存在时返回 false', async () => {
      const nonexistentDir = '/tmp/nonexistent-specs';
      const hasBkp = await hasBackup(nonexistentDir);
      expect(hasBkp).toBe(false);
    });
  });

  // ===========================================================================
  // rollbackState tests
  // ===========================================================================
  describe('rollbackState 函数测试', () => {
    test('应该能够回滚到指定的备份', async () => {
      const originalState = { feature: 'rollback-test', status: 'backed-up', version: '1.0' };

      const backupPath = await backupState(originalState, mockFeatureId, mockSpecsDir);

      const rolledBackState = await rollbackState(mockFeatureId, mockSpecsDir, backupPath);

      expect(rolledBackState).toEqual(originalState);
    });

    test('应该在没有备份时抛出错误', async () => {
      await expect(rollbackState(mockFeatureId, mockSpecsDir)).rejects.toThrow(
        '无法回滚: 未找到备份目录'
      );
    });

    test('应该在指定备份不存在时抛出错误', async () => {
      const fakeBackupPath = path.join(mockSpecsDir, '.state.backup', 'nonexistent.json');

      await expect(
        rollbackState(mockFeatureId, mockSpecsDir, fakeBackupPath)
      ).rejects.toThrow('备份文件不存在:');
    });
  });

  // ===========================================================================
  // Integration tests
  // ===========================================================================
  describe('集成测试', () => {
    test('完整的迁移流程：备份 → 迁移 (v2 → v3)', async () => {
      const originalV2State = {
        feature: 'integration-test',
        status: 'planned',
        phase: 2,
        createdAt: '2026-03-01T00:00:00Z',
        dependencies: { on: [], blocking: [] },
        files: { spec: 'spec.md' },
        depth: 0,
      };

      expect(await hasBackup(mockSpecsDir)).toBe(false);

      const result = await migrateState(originalV2State, mockFeatureId, mockSpecsDir);

      expect(result.success).toBe(true);
      expect(result.backupPath).toBeDefined();
      expect(result.migratedToVersion).toBe('v3.0.0');

      expect(await hasBackup(mockSpecsDir)).toBe(true);

      const restoredState = await rollbackState(mockFeatureId, mockSpecsDir, result.backupPath!);
      expect(restoredState).toEqual(originalV2State);
    });
  });
});
