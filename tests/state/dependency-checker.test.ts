// Dependency Checker 测试
import { DependencyChecker } from '../state/dependency-checker';
import { StateMachine, FeatureStateEnum } from '../state/machine';
import * as fs from 'fs/promises';
import * as path from 'path';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

describe('DependencyChecker', () => {
  let checker: DependencyChecker;
  let stateMachine: StateMachine;
  const testDir = 'test-specs';

  beforeEach(async () => {
    // 创建测试目录
    await fs.mkdir(testDir, { recursive: true });
    stateMachine = new StateMachine(testDir);
    checker = new DependencyChecker(stateMachine, testDir);
  });

  afterEach(async () => {
    // 清理测试目录
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  it('should initialize correctly', () => {
    assert.ok(checker);
  });

  it('should scan features from state files', async () => {
    // 创建测试 Feature
    const featureDir = path.join(testDir, 'test-feature');
    await fs.mkdir(featureDir, { recursive: true });
    
    const state = {
      feature: 'test-feature',
      name: 'Test Feature',
      version: '2.0.0',
      status: 'planned',
      phase: 2,
      phaseHistory: [],
      files: { spec: 'spec.md', plan: 'plan.md' },
      dependencies: { on: [], blocking: [] }
    };
    
    await fs.writeFile(
      path.join(featureDir, 'state.json'),
      JSON.stringify(state, null, 2)
    );

    const features = await checker.scanAllFeatures();
    assert.ok(features.has('test-feature'));
    const feature = features.get('test-feature');
    assert.equal(feature?.featureId, 'test-feature');
    assert.equal(feature?.state, 'planned');
  });

  it('should check dependencies for state change', async () => {
    // 创建依赖的 Feature
    const depFeatureDir = path.join(testDir, 'dep-feature');
    await fs.mkdir(depFeatureDir, { recursive: true });
    
    const depState = {
      feature: 'dep-feature',
      name: 'Dependency Feature',
      version: '2.0.0',
      status: 'specified',
      phase: 1,
      phaseHistory: [],
      files: { spec: 'spec.md' },
      dependencies: { on: [], blocking: [] }
    };
    
    await fs.writeFile(
      path.join(depFeatureDir, 'state.json'),
      JSON.stringify(depState, null, 2)
    );

    // 创建主 Feature，依赖 dep-feature
    const mainFeatureDir = path.join(testDir, 'main-feature');
    await fs.mkdir(mainFeatureDir, { recursive: true });
    
    const mainState = {
      feature: 'main-feature',
      name: 'Main Feature',
      version: '2.0.0',
      status: 'specified',
      phase: 1,
      phaseHistory: [],
      files: { spec: 'spec.md' },
      dependencies: { on: ['dep-feature'], blocking: [] }
    };
    
    await fs.writeFile(
      path.join(mainFeatureDir, 'state.json'),
      JSON.stringify(mainState, null, 2)
    );

    // 检查状态变更（应该失败，因为依赖未就绪）
    const result = await checker.checkDependenciesForStateChange('main-feature', 'planned');
    assert.equal(result.allowed, false);
    assert.ok(result.blockingFeatures && result.blockingFeatures.length > 0);
  });

  it('should allow state change when dependencies are ready', async () => {
    // 创建依赖的 Feature（已经就绪）
    const depFeatureDir = path.join(testDir, 'dep-feature');
    await fs.mkdir(depFeatureDir, { recursive: true });
    
    const depState = {
      feature: 'dep-feature',
      name: 'Dependency Feature',
      version: '2.0.0',
      status: 'planned',
      phase: 2,
      phaseHistory: [],
      files: { spec: 'spec.md', plan: 'plan.md' },
      dependencies: { on: [], blocking: [] }
    };
    
    await fs.writeFile(
      path.join(depFeatureDir, 'state.json'),
      JSON.stringify(depState, null, 2)
    );

    // 创建主 Feature
    const mainFeatureDir = path.join(testDir, 'main-feature');
    await fs.mkdir(mainFeatureDir, { recursive: true });
    
    const mainState = {
      feature: 'main-feature',
      name: 'Main Feature',
      version: '2.0.0',
      status: 'specified',
      phase: 1,
      phaseHistory: [],
      files: { spec: 'spec.md' },
      dependencies: { on: ['dep-feature'], blocking: [] }
    };
    
    await fs.writeFile(
      path.join(mainFeatureDir, 'state.json'),
      JSON.stringify(mainState, null, 2)
    );

    // 检查状态变更（应该成功）
    const result = await checker.checkDependenciesForStateChange('main-feature', 'planned');
    assert.equal(result.allowed, true);
  });

  it('should detect circular dependencies', async () => {
    // 创建循环依赖的 Features
    const featureADir = path.join(testDir, 'feature-a');
    await fs.mkdir(featureADir, { recursive: true });
    
    const stateA = {
      feature: 'feature-a',
      name: 'Feature A',
      version: '2.0.0',
      status: 'planned',
      phase: 2,
      phaseHistory: [],
      files: { spec: 'spec.md', plan: 'plan.md' },
      dependencies: { on: ['feature-b'], blocking: [] }
    };
    
    await fs.writeFile(
      path.join(featureADir, 'state.json'),
      JSON.stringify(stateA, null, 2)
    );

    const featureBDir = path.join(testDir, 'feature-b');
    await fs.mkdir(featureBDir, { recursive: true });
    
    const stateB = {
      feature: 'feature-b',
      name: 'Feature B',
      version: '2.0.0',
      status: 'planned',
      phase: 2,
      phaseHistory: [],
      files: { spec: 'spec.md', plan: 'plan.md' },
      dependencies: { on: ['feature-a'], blocking: [] }
    };
    
    await fs.writeFile(
      path.join(featureBDir, 'state.json'),
      JSON.stringify(stateB, null, 2)
    );

    const cycles = await checker.detectCircularDependencies();
    assert.ok(cycles.length > 0);
  });

  it('should cache results', async () => {
    const features1 = await checker.scanAllFeatures();
    const features2 = await checker.scanAllFeatures();
    
    // 第二次应该使用缓存
    assert.strictEqual(features1, features2);
  });

  it('should clear cache', async () => {
    await checker.scanAllFeatures();
    checker.clearCache();
    
    const features = await checker.scanAllFeatures();
    assert.ok(features);
  });
});
