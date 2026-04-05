// Schema Migration Test
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import { migrateState, MigrationResult } from '../../src/state/migrator';
import { SddMigrateSchemaCommand, MigrationReport } from '../../src/commands/sdd-migrate-schema';

describe('Schema Migration', () => {
  const testDir = 'test-migration';

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  it('should migrate from v1.2.5 to v2.0.0', async () => {
    const oldState = {
      version: '1.2.5',
      feature: 'test-feature',
      name: 'Test Feature',
      status: 'planned',
      phase: 2,
      files: {
        spec: 'spec.md',
        plan: 'plan.md'
      },
      dependencies: {
        on: [],
        blocking: []
      },
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z'
    };

    const result: MigrationResult = await migrateState(oldState, 'test-feature', testDir);
    
    assert.equal(result.success, true);
    assert.equal(result.migratedToVersion, '2.0.0');
    assert.ok(result.backupPath);
  });

  it('should migrate from v1.2.11 to v2.0.0', async () => {
    const oldState = {
      version: '1.2.11',
      feature: 'test-feature',
      name: 'Test Feature',
      status: 'tasked',
      phase: 3,
      files: {
        spec: 'spec.md',
        plan: 'plan.md',
        tasks: 'tasks.md'
      },
      dependencies: {
        on: ['other-feature'],
        blocking: []
      },
      history: [
        {
          timestamp: '2026-04-01T00:00:00Z',
          from: 'specified',
          to: 'planned',
          triggeredBy: '@sdd-plan'
        }
      ],
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-05T00:00:00Z'
    };

    const result: MigrationResult = await migrateState(oldState, 'test-feature', testDir);
    
    assert.equal(result.success, true);
    assert.equal(result.migratedToVersion, '2.0.0');
  });

  it('should skip migration if already v2.0.0', async () => {
    const oldState = {
      version: '2.0.0',
      feature: 'test-feature',
      name: 'Test Feature',
      status: 'planned',
      phase: 2,
      files: { spec: 'spec.md' },
      dependencies: { on: [], blocking: [] },
      phaseHistory: []
    };

    const result: MigrationResult = await migrateState(oldState, 'test-feature', testDir);
    
    assert.equal(result.success, true);
    assert.equal(result.migratedToVersion, '2.0.0');
  });

  it('should create backup before migration', async () => {
    const oldState = {
      version: '1.2.5',
      feature: 'test-feature',
      name: 'Test Feature',
      status: 'planned',
      phase: 2
    };

    const result: MigrationResult = await migrateState(oldState, 'test-feature', testDir);
    
    assert.ok(result.backupPath);
    
    // 验证备份文件存在
    try {
      await fs.access(result.backupPath!);
      assert.ok(true);
    } catch {
      assert.fail('备份文件不存在');
    }
  });

  it('should preserve history during migration', async () => {
    const oldState = {
      version: '1.2.5',
      feature: 'test-feature',
      name: 'Test Feature',
      status: 'reviewed',
      phase: 5,
      history: [
        {
          timestamp: '2026-04-01T10:00:00Z',
          from: 'specified',
          to: 'planned',
          triggeredBy: '@sdd-plan',
          comment: '规划完成'
        },
        {
          timestamp: '2026-04-03T10:00:00Z',
          from: 'planned',
          to: 'tasked',
          triggeredBy: '@sdd-tasks',
          comment: '任务分解完成'
        }
      ]
    };

    const result: MigrationResult = await migrateState(oldState, 'test-feature', testDir);
    
    assert.equal(result.success, true);
  });
});

describe('SddMigrateSchemaCommand', () => {
  const testDir = 'test-command';

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  it('should migrate single feature', async () => {
    // 创建测试 Feature
    const featureDir = path.join(testDir, 'test-feature');
    await fs.mkdir(featureDir, { recursive: true });
    
    const state = {
      version: '1.2.5',
      feature: 'test-feature',
      name: 'Test Feature',
      status: 'planned',
      phase: 2
    };
    
    await fs.writeFile(
      path.join(featureDir, 'state.json'),
      JSON.stringify(state, null, 2)
    );

    const command = new SddMigrateSchemaCommand(testDir);
    const report: MigrationReport = await command.execute({
      feature: 'test-feature',
      dryRun: false
    });

    assert.equal(report.total, 1);
    assert.equal(report.success, 1);
    assert.equal(report.failed, 0);
  });

  it('should migrate all features', async () => {
    // 创建多个测试 Features
    for (let i = 1; i <= 3; i++) {
      const featureDir = path.join(testDir, `feature-${i}`);
      await fs.mkdir(featureDir, { recursive: true });
      
      const state = {
        version: '1.2.5',
        feature: `feature-${i}`,
        name: `Feature ${i}`,
        status: 'planned',
        phase: 2
      };
      
      await fs.writeFile(
        path.join(featureDir, 'state.json'),
        JSON.stringify(state, null, 2)
      );
    }

    const command = new SddMigrateSchemaCommand(testDir);
    const report: MigrationReport = await command.execute({
      all: true,
      dryRun: false
    });

    assert.equal(report.total, 3);
    assert.equal(report.success, 3);
  });

  it('should support dry-run mode', async () => {
    const featureDir = path.join(testDir, 'test-feature');
    await fs.mkdir(featureDir, { recursive: true });
    
    const state = {
      version: '1.2.5',
      feature: 'test-feature',
      name: 'Test Feature',
      status: 'planned',
      phase: 2
    };
    
    await fs.writeFile(
      path.join(featureDir, 'state.json'),
      JSON.stringify(state, null, 2)
    );

    const command = new SddMigrateSchemaCommand(testDir);
    const report: MigrationReport = await command.execute({
      feature: 'test-feature',
      dryRun: true
    });

    assert.equal(report.total, 1);
    assert.equal(report.success, 1);
    
    // 验证文件没有被修改
    const content = await fs.readFile(
      path.join(featureDir, 'state.json'),
      'utf-8'
    );
    const newState = JSON.parse(content);
    assert.equal(newState.version, '1.2.5');
  });

  it('should skip features already on v2.0.0', async () => {
    const featureDir = path.join(testDir, 'test-feature');
    await fs.mkdir(featureDir, { recursive: true });
    
    const state = {
      version: '2.0.0',
      feature: 'test-feature',
      name: 'Test Feature',
      status: 'planned',
      phase: 2,
      phaseHistory: []
    };
    
    await fs.writeFile(
      path.join(featureDir, 'state.json'),
      JSON.stringify(state, null, 2)
    );

    const command = new SddMigrateSchemaCommand(testDir);
    const report: MigrationReport = await command.execute({
      feature: 'test-feature',
      dryRun: false
    });

    assert.equal(report.total, 1);
    assert.equal(report.skipped, 1);
  });
});
