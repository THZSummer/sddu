// 测试 StateMachine 与 Agent 工作流的集成
import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';
import { StateMachine } from '../../dist/state/machine.js';  // 添加 .js 后缀
import * as fs from 'fs/promises';
import * as path from 'path';

describe('StateMachine与Agent工作流集成测试', () => {
  let stateMachine: StateMachine;
  const testSpecsDir = path.join('.tmp', 'test-specs-agent-integration');
  
  beforeEach(async () => {
    // 创建临时测试目录
    stateMachine = new StateMachine(testSpecsDir);
    // 清理可能存在的状态文件
    try {
      await fs.rm(path.join(testSpecsDir, '.sdd'), { recursive: true, force: true });
    } catch {}
  });

  it('应该在 Agent 完成后自动添加到 phaseHistory', async () => {
    // 创建测试 feature
    const feature = await stateMachine.createFeature('Test Feature Agent');
    const featureId = feature.id; // 使用实际创建的 ID
    assert.ok(feature);
    
    // 更新状态，模拟 Agent 执行  
    const newState = await stateMachine.updateState(
      featureId,
      'specified',  // 第一阶段：规约
      {},
      '@sdd-spec',  // triggeredBy agent
      'Agent executed specification',
      true  // skip validation for this test since we don't have required files
    );
    
    // 检查 phaseHistory 记录
    assert.ok(newState.phaseHistory);
    assert.equal(newState.phaseHistory.length, 1);
    assert.equal(newState.phaseHistory[0].phase, 1); // spec phase映射为1
    assert.equal(newState.phaseHistory[0].status, 'specified');
    assert.equal(newState.phaseHistory[0].triggeredBy, '@sdd-spec');
    assert.equal(newState.phaseHistory[0].comment, 'Agent executed specification');
    
    console.log('✅ Agent 集成测试: phaseHistory 正确记录');
  });
  
  it('应该为所有 Agent 映射正确的相位和状态', async () => {
    // 创建测试 feature
    const feature = await stateMachine.createFeature('Test Feature Agent Mapping');
    const featureId = feature.id; // 使用实际创建的 ID
    assert.ok(feature);
    
    // 测试多个状态迁移
    const stateTests = [
      { state: 'specified', phase: 1, status: 'specified', agent: '@sdd-spec' },
      { state: 'planned', phase: 2, status: 'planned', agent: '@sdd-plan' },
      { state: 'tasked', phase: 3, status: 'tasked', agent: '@sdd-tasks' },
      { state: 'implementing', phase: 4, status: 'building', agent: '@sdd-build' },
      { state: 'reviewed', phase: 5, status: 'reviewed', agent: '@sdd-review' },
      { state: 'validated', phase: 6, status: 'validated', agent: '@sdd-validate' }
    ];
    
    for (const test of stateTests) {
      const newState = await stateMachine.updateState(
        featureId,
        test.state as any,
        {},
        test.agent,
        `Running ${test.agent}`,
        true  // skip validation
      );
      
      const lastHistory = newState.phaseHistory[newState.phaseHistory.length - 1];
      assert.ok(lastHistory, `History item exists for ${test.state}`);
      assert.equal(lastHistory.phase, test.phase, `Phase correctly mapped for ${test.state}`);
      assert.equal(lastHistory.status, test.status, `Status correctly mapped for ${test.state}`);
      assert.equal(lastHistory.triggeredBy, test.agent, `Agent correctly recorded for ${test.state}`);
      
      console.log(`✅ 状态 ${test.state} 的相位和状态映射正确`);
    }
  });

  it('应该在 history 数组中记录详细转换信息', async () => {
    const feature = await stateMachine.createFeature('Test Feature History');
    const featureId = feature.id; // 使用实际创建的 ID
    assert.ok(feature);
    
    // 进行状态转换
    const newState = await stateMachine.updateState(
      featureId,
      'planned',
      {},
      '@sdd-plan',
      'Planned the feature',
      true  // skip validation
    );
    
    assert.ok(newState.history);
    assert.equal(newState.history.length, 1);
    
    const historyRecord = newState.history[0];
    assert.equal(historyRecord.from, 'drafting'); // 前一个状态
    assert.equal(historyRecord.to, 'planned'); // 新状态
    assert.equal(historyRecord.triggeredBy, '@sdd-plan');
    assert.equal(historyRecord.comment, 'Planned the feature');
    
    console.log('✅ History 记录详细转换信息测试通过');
  });
  
  it('应该允许设置 agent hook 并调用相关回调', async () => {
    const feature = await stateMachine.createFeature('Test Feature Hooks');
    const featureId = feature.id; // 使用实际创建的 ID
    assert.ok(feature);
    
    const hookResults: string[] = [];
    
    // 设置测试 hook
    stateMachine.setAgentHook({
      onTransitionStart: (featureId, targetState) => {
        hookResults.push(`start:${featureId}->${targetState}`);
        console.log(`Hook: Transition started for ${featureId} to ${targetState}`);
      },
      onTransitionComplete: (featureId, previousState, newState, triggeredBy, comment) => {
        hookResults.push(`complete:${featureId}->${newState}`);
        console.log(`Hook: Transition completed for ${featureId}: ${previousState}->${newState}`);
      },
      onError: (error, featureId, targetState) => {
        hookResults.push(`error:${featureId||'unknown'}->${targetState||'unknown'}`);
        console.log(`Hook: Error for ${featureId}: ${error.message}`);
      }
    });
    
    const newState = await stateMachine.updateState(
      featureId,
      'planned',
      {},
      '@sdd-plan',
      'Testing hooks',
      true  // skip validation
    );
    
    // 检查 hook 被正确调用
    assert.ok(hookResults.some(r => r.includes('start:')), 'onTransitionStart hook called');
    assert.ok(hookResults.some(r => r.includes('complete:')), 'onTransitionComplete hook called');
    
    console.log('✅ Agent hooks 调用测试通过');
  });
});