/**
 * types.ts 单元测试
 * 测试统一类型出口文件的所有导出
 */

import {
  // 从 state 模块导入 (v3.0.0)
  StateV3_0_0,
  Phase,
  FeatureStatus,
  validateStateV3,
} from '../../../state';

import {
  // 从 shared/types 导入
  AgentMetadata,
  SdduConfig,
} from '../../../shared/types';

describe('类型导出测试', () => {
  test('验证 v3.0.0 状态类型的导出', () => {
    const state: StateV3_0_0 = {
      feature: 'test-feature',
      version: 'v3.0.0',
      phase: 'discovered',
      status: 'tracked',
      phaseHistory: [{
        phase: 'registered',
        timestamp: new Date().toISOString(),
        triggeredBy: 'test'
      }],
      depth: 0,
      files: {
        spec: 'spec.md'
      },
      dependencies: {
        on: [],
        blocking: []
      }
    };

    expect(validateStateV3(state)).toBe(true);
    expect(state.feature).toBe('test-feature');
  });

  test('验证 AgentMetadata 类型', () => {
    const metadata: AgentMetadata = {
      name: 'test-agent',
      description: 'Test agent description',
      mode: 'subagent',
      promptFile: 'path/to/prompt.md'
    };

    expect(metadata.name).toBe('test-agent');
  });

  test('验证 SdduConfig 类型', () => {
    const config: SdduConfig = {
      autoUpdateState: true,
      enableDiscovery: false,
      logLevel: 'info',
      defaultTimeout: 60
    };

    expect(config.autoUpdateState).toBe(true);
  });
});
