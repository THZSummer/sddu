#!/usr/bin/env node
/**
 * SDDU 基本功能验证脚本
 */

console.log('🧪 SDDU 基本功能验证测试...\n');

// 测试 1: 导入 SDDU 插件
try {
  const { SDDUPlugin } = require('./dist/index.js');
  console.log('✅ 1. SDDUPlugin 导入成功');
} catch (error) {
  console.log('❌ 1. SDDUPlugin 导入失败:', error.message);
}

// 测试 2: 导入 SDDU 错误处理系统
try {
  const { SdduError, StateError, DiscoveryError } = require('./dist/errors.js');
  console.log('✅ 2. SDDU 错误处理系统导出正常');
} catch (error) {
  console.log('❌ 2. SDDU 错误处理系统导出异常:', error.message);
}

// 测试 3: 检查 Agent 注册系统
try {
  const { registerAgents } = require('./dist/agents/sddu-agents.js');
  console.log('✅ 3. SDDU Agent 系统导出正常');
} catch (error) {
  console.log('❌ 3. SDDU Agent 系统导出异常:', error.message);
}

// 测试 4: 检查命令模块
try {
  const { SddMigrateSchemaCommand } = require('./dist/commands/sdd-migrate-schema.js');
  console.log('✅ 4. SDDU 命令系统导出正常');
} catch (error) {
  console.log('❌ 4. SDDU 命令系统导出异常:', error.message);
}

// 测试 5: 检查状态机
try {
  const { StateMachine } = require('./dist/state/machine.js');
  console.log('✅ 5. SDDU 状态机导出正常');
} catch (error) {
  console.log('❌ 5. SDDU 状态机导出异常:', error.message);
}

console.log('\n🎯 SDDU 基本功能验证完成！');