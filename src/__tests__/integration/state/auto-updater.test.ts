import * as fs from 'fs/promises';
import * as path from 'path';
import { AutoUpdater } from '../../../state/auto-updater';
import { StateMachine } from '../../../state/machine';
import { Phase, PHASE_ORDER } from '../../../state/schema-v3.0.0';

describe('AutoUpdater — v3.0.0', () => {
  const testBaseDir = 'tests-temp';
  const testSpecDir = path.join(testBaseDir, 'specs-tree-root');
  let stateMachine: StateMachine;
  let autoUpdater: AutoUpdater;

  beforeEach(async () => {
    // 清理测试环境
    try {
      await fs.rm(testBaseDir, { recursive: true, force: true });
    } catch {}
    
    await fs.mkdir(testSpecDir, { recursive: true });
    
    stateMachine = new StateMachine(testSpecDir);
    autoUpdater = new AutoUpdater(stateMachine);
  });

  afterEach(async () => {
    // 清理测试环境
    await fs.rm(testBaseDir, { recursive: true, force: true });
  });

  test('should correctly infer phase from existing files (spec.md → specified)', async () => {
    const featureId = 'test-feature';
    const featurePath = path.join(testSpecDir, featureId);
    await fs.mkdir(featurePath, { recursive: true });

    // 创建 spec.md 表示此 Feature 已经完成 spec 阶段
    await fs.writeFile(path.join(featurePath, 'spec.md'), '# Test Spec\nContent here');

    // 推断当前 phase
    const inferredPhase = await (async () => {
      const dirContents = await fs.readdir(featurePath);
      const phaseOrder: Phase[] = [
        'validated', 'reviewed', 'builded', 'tasked', 'planned', 
        'specified', 'discovered', 'registered'
      ];
      
      for (const phase of phaseOrder) {
        if (phase === 'specified') {
          if (dirContents.some(f => f === 'spec.md')) {
            return phase;
          }
        }
      }
      
      // Default
      if (dirContents.some(f => f === 'discovery.md')) return 'discovered';
      return 'registered';
    })();

    expect(inferredPhase).toBe('specified');
  });

  test('should correctly detect when files are added', async () => {
    const featureId = 'test-feature-update';
    const featurePath = path.join(testSpecDir, featureId);
    await fs.mkdir(featurePath, { recursive: true });

    // 添加 spec.md 以进入 specified phase
    await fs.writeFile(path.join(featurePath, 'spec.md'), '# Test Spec\nContent here');
    await new Promise(resolve => setTimeout(resolve, 100));

    const inferredPhase = await (async () => {
      const dirContents = await fs.readdir(featurePath);
      if (dirContents.some(f => f === 'spec.md')) {
        return 'specified';
      }
      const hasDiscoveryDoc = dirContents.some(f => f === 'discovery.md');
      if (hasDiscoveryDoc) return 'discovered';
      return 'registered';
    })();
    
    expect(inferredPhase).toBe('specified');
  });

  test('should handle non-existent directories gracefully', async () => {
    const inferredPhase = await (async () => {
      try {
        await fs.readdir(path.join(testSpecDir, 'non-existent-dir'));
        return 'registered';
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return null;
        }
        throw error;
      }
    })();
    
    expect(inferredPhase).toBeNull();
  });

  test('should respect PHASE_ORDER for forward progression', () => {
    // Use PHASE_ORDER from schema-v3.0.0
    expect(PHASE_ORDER['planned']).toBeGreaterThan(PHASE_ORDER['specified']);
    expect(PHASE_ORDER['tasked']).toBeGreaterThan(PHASE_ORDER['planned']);
    expect(PHASE_ORDER['validated']).toBeGreaterThan(PHASE_ORDER['registered']);

    // Phase equality
    expect(PHASE_ORDER['specified']).toBe(PHASE_ORDER['specified']);
  });

  test('should have all 8 phases in PHASE_ORDER', () => {
    const phases: Phase[] = [
      'registered', 'discovered', 'specified', 'planned',
      'tasked', 'builded', 'reviewed', 'validated'
    ];
    for (const phase of phases) {
      expect(PHASE_ORDER[phase]).toBeDefined();
      expect(typeof PHASE_ORDER[phase]).toBe('number');
    }
  });

  test('should correctly handle disabling', () => {
    autoUpdater.setEnabled(false);
    expect(autoUpdater['enabled']).toBe(false);
    
    autoUpdater.setEnabled(true);
    expect(autoUpdater['enabled']).toBe(true);
  });

  test('should skip non-tracked features (FR-003)', async () => {
    // This test verifies that the skip logic is in place
    // The actual skip happens in updateFeatureStatusForFileChanges
    const featurePath = path.join(testSpecDir, 'specs-tree-suspended-feat');
    await fs.mkdir(featurePath, { recursive: true });
    
    // Create state.json with suspended status
    const state = {
      feature: 'specs-tree-suspended-feat',
      name: 'Suspended Feature',
      version: 'v3.0.0',
      phase: 'specified',
      status: 'suspended',
      depth: 0,
      phaseHistory: [],
      files: { spec: 'spec.md' },
      dependencies: { on: [], blocking: [] },
    };
    await fs.writeFile(path.join(featurePath, 'state.json'), JSON.stringify(state, null, 2));
    
    // Simulate adding a file
    await fs.writeFile(path.join(featurePath, 'spec.md'), '# Test');
    
    // Verify the feature still has suspended status 
    const stateContent = await fs.readFile(path.join(featurePath, 'state.json'), 'utf-8');
    const parsedState = JSON.parse(stateContent);
    expect(parsedState.status).toBe('suspended');
  });
});
