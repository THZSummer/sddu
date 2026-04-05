// 简化版 StateMachine 与 Agent 工作流集成测试
import assert from 'assert';
import { StateMachine } from '../../dist/state/machine.js';
import * as fs from 'fs/promises';
import * as path from 'path';

async function runSimpleTest() {
  console.log('🧪 开始简单集成测试...');
  const testSpecsDir = '.tmp/test-agent-integration-simple';
  const stateMachine = new StateMachine(testSpecsDir);

  try {
    // 创建测试 feature
    console.log('📁 创建测试 Feature...');
    const feature = await stateMachine.createFeature('Test Agent Integration Feature');
    console.log('✅ 创建成功，Feature ID:', feature.id);
    
    // 设置一个 agent hook 来捕获事件
    console.log('🔌 设置代理钩子...');
    const hookLog: string[] = [];
    stateMachine.setAgentHook({
      onTransitionStart: (featureId, targetState) => {
        hookLog.push(`START:${featureId}->${targetState}`);
        console.log(`  🔄 开始过渡: ${featureId} -> ${targetState}`);
      },
      onTransitionComplete: (featureId, previousState, newState, triggeredBy, comment) => {
        hookLog.push(`COMPLETE:${featureId}:${previousState}->${newState}`);
        console.log(`  ✅ 完成过渡: ${featureId} ${previousState} -> ${newState} (via: ${triggeredBy})`);
      },
      onError: (error, featureId, targetState) => {
        hookLog.push(`ERROR:${featureId||'unknown'}->${targetState||'unknown'}`);
        console.log(`  ❌ 错误: ${error.message}`);
      }
    });

    // 测试更新状态，跳过验证（模拟 Agent 行为）
    console.log('🔄 测试状态更新...');
    const updatedFeature = await stateMachine.updateState(
      feature.id,
      'specified',
      {},
      '@sdd-spec', // triggeredBy
      'Test agent spec execution',
      true  // skipValidation = true, 这是关键变化
    );

    console.log('📊 检查更新结果...');
    console.log(`  - 最新状态: ${updatedFeature.state}`);
    console.log(`  - Phase History 长度: ${updatedFeature.phaseHistory.length}`);
    console.log(`  - History 长度: ${updatedFeature.history.length}`);

    // 验证结果
    assert.equal(updatedFeature.state, 'specified', '状态应更新为 specified');
    assert.ok(updatedFeature.phaseHistory.length >= 1, '应有至少一个 phase history');
    assert.ok(updatedFeature.history.length >= 1, '应有至少一个 history 记录');

    // 检查最新的 phase history
    const latestPhaseHistory = updatedFeature.phaseHistory[updatedFeature.phaseHistory.length - 1];
    assert.equal(latestPhaseHistory.status, 'specified', 'Phase history 的状态应为 specified');
    assert.ok(latestPhaseHistory.timestamp, 'Phase history 应有时间戳');
    assert.equal(latestPhaseHistory.triggeredBy, '@sdd-spec', '应有正确的触发来源');

    // 检查最新的 history
    const latestHistory = updatedFeature.history[updatedFeature.history.length - 1];
    assert.equal(latestHistory.to, 'specified', 'History 的目标状态应为 specified');
    assert.equal(latestHistory.triggeredBy, '@sdd-spec', 'History 应有正确的触发来源');
    assert.ok(latestHistory.comment, 'History 应有注释');

    // 验证 hooks 是否被调用
    assert.ok(hookLog.some(log => log.includes('START')), 'onTransitionStart 应被调用');
    assert.ok(hookLog.some(log => log.includes('COMPLETE')), 'onTransitionComplete 应被调用');

    console.log('✅ 集成测试通过！');
    console.log('🎉 所有集成组件正常工作:');
    console.log('   - StateMachine 支持 Agent 钩子');
    console.log('   - 状态更新自动记录 history 和 phaseHistory');
    console.log('   - 支持代理触发和注释记录');
    console.log('   - 支持跳过验证 (针对代理集成场景)');

    return true;
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    return false;
  } finally {
    // 清理测试数据
    try {
      await fs.rm(testSpecsDir, { recursive: true, force: true });
      console.log('🧹 测试清理完成');
    } catch (cleanupError) {
      console.warn('⚠️ 清理测试数据失败:', cleanupError);
    }
  }
}

// 运行测试
runSimpleTest()
  .then(success => {
    if (success) {
      console.log('\n🎉 Agent 集成测试成功完成！\n');
    } else {
      console.log('\n💥 Agent 集成测试失败！\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(' catastrophically failed:', error);
    process.exit(1);
  });