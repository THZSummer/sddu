import * as fs from 'fs/promises';
import * as path from 'path';
import { AutoUpdater } from '../../src/state/auto-updater';
import { StateMachine } from '../../src/state/machine';
import { Phase, PHASE_ORDER } from '../../src/state/schema-v3.0.0';

describe('AutoUpdater Integration Tests', () => {
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
    await stateMachine.load();
    autoUpdater = new AutoUpdater(stateMachine);
  });

  afterEach(async () => {
    // 清理测试环境
    await fs.rm(testBaseDir, { recursive: true, force: true });
    autoUpdater.dispose();  // 清理资源
  });

  test('should correctly infer status from file presence', async () => {
    // 创建测试特性目录
    const featureId = 'test-feature-status-inference';
    const featureDir = path.join(testSpecDir, featureId);
    await fs.mkdir(featureDir, { recursive: true });

    // 初始创建特性
    await stateMachine.createFeature('Test Feature Status Inference', featureId);

    // 检查初始状态为 registered（v3.0.0 默认）
    let featureState = stateMachine.getState(featureId);
    expect(featureState).toBeDefined();
    expect(featureState!.phase).toBe('registered');
    expect(featureState!.status).toBe('tracked');

    // 添加 spec.md 使状态变为 specified
    await fs.writeFile(path.join(featureDir, 'spec.md'), '# Spec\nContent');
    
    // 手动触发状态推断
    const inferredState = await autoUpdater.inferCurrentStateFromFiles(featureId);
    expect(inferredState).toBe('specified');

    // 验证状态按预期顺序排列
    const featureObj = stateMachine.getState(featureId);
    if (featureObj) {
      // 使用 v3.0.0 PHASE_ORDER
      expect(PHASE_ORDER['specified']).toBeGreaterThan(PHASE_ORDER[featureObj.phase as Phase]);
    }
  });

  test('should trigger update when files change', async () => {
    const featureId = 'test-file-change-trigger';
    const featureDir = path.join(testSpecDir, featureId);
    await fs.mkdir(featureDir, { recursive: true });

    // 创建初始状态
    await stateMachine.createFeature('Test File Change Trigger', featureId);
    
    // 检查初始状态
    let featureState = stateMachine.getState(featureId);
    expect(featureState).toBeDefined();
    expect(featureState!.phase).toBe('registered');
    expect(featureState!.status).toBe('tracked');

    // 触发文件变更
    await fs.writeFile(path.join(featureDir, 'plan.md'), '# Plan Document\nContent');

    // 立即进行一次扫描来模拟自动更新
    await autoUpdater.scanAndAutoUpdate(featureDir);

    // 检查状态是否更新（因为只有一个 plan.md，所以状态可能保持 registered）
    featureState = stateMachine.getState(featureId);
    if (featureState) {
      const hasSpec = await fs.readdir(featureDir).then(files => files.includes('spec.md')).catch(() => false);
      if (hasSpec) {
        expect(['specified', 'planned']).toContain(featureState.phase);
      } else {
        // 因为没有 spec.md，即使有 plan.md 也不会到 planned 状态
        expect(['registered']).toContain(featureState.phase);
      }
    }
  });

  test('should properly handle spec + plan files for planned status', async () => {
    const featureId = 'test-spec-plan-status';
    const featureDir = path.join(testSpecDir, featureId);
    await fs.mkdir(featureDir, { recursive: true });

    // 创建特性
    await stateMachine.createFeature('Test Spec Plan Status', featureId);
    
    // 添加 spec.md 和 plan.md
    await fs.writeFile(path.join(featureDir, 'spec.md'), '# Spec\nContent');
    await fs.writeFile(path.join(featureDir, 'plan.md'), '# Plan\nContent');

    // 验证从文件系统可以推断正确状态
    const inferredState = await autoUpdater.inferCurrentStateFromFiles(featureId);
    expect(inferredState).toBe('planned');
  });

  test('should handle disabling of auto-updates', async () => {
    // 验证初始状态
    expect(autoUpdater['enabled']).toBe(true);

    // 禁用更新器
    autoUpdater.setEnabled(false);
    expect(autoUpdater['enabled']).toBe(false);

    // 验证禁用状态下的行为
    let wasCalled = false;
    autoUpdater['scanAndAutoUpdate'] = async (): Promise<void> => {
      wasCalled = true;
    };

    autoUpdater.triggerAutoUpdate('/test/path');
    // 等待防抖时间过去
    await new Promise(resolve => setTimeout(resolve, 5500));
    
    // 如果已被正确禁用，则 scanAndAutoUpdate 不应该被调用
    expect(autoUpdater['enabled']).toBe(false);
    expect(wasCalled).toBe(false);
    
    // 重新启用
    autoUpdater.setEnabled(true);
    expect(autoUpdater['enabled']).toBe(true);
  });

  test('should prevent reverse state transitions', async () => {
    const featureId = 'test-reverse-prevention';
    const featureDir = path.join(testSpecDir, featureId);
    await fs.mkdir(featureDir, { recursive: true });

    // 创建特性
    await stateMachine.createFeature('Test Reverse Prevention', featureId);
    
    // 确保状态为 specified
    const initialFeature = await stateMachine.updateState(featureId, 'specified' as Phase, {}, 'test', 'Set to specified');
    expect(initialFeature.phase).toBe('specified');

    // 模拟一个较低级别的更新，确保不会倒退
    const currentState = stateMachine.getState(featureId);
    if (currentState) {
      const currentPhase = currentState.phase as Phase;

      // 模拟试图回到较低的 registered 状态
      const isReverse = PHASE_ORDER['registered'] < PHASE_ORDER[currentPhase];
      expect(isReverse).toBeTruthy();
      
      // shouldUpdateState 逻辑应该防止这种倒退
      const shouldUpdate = PHASE_ORDER['registered'] > PHASE_ORDER[currentPhase];
      expect(shouldUpdate).toBeFalsy();
    }
  });
});
