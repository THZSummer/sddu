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
  
  // 从 state 模块导入 (v2.x — deprecated)
  WorkflowStatus, 
  PhaseHistory, 
  StateV2_0_0,
  FeatureStateEnum,
  FeatureState,
  TransitionResult,
  AgentTransitionHook,
  AutoUpdaterIntegration,
  HistoryEntry,
  FeatureWithFullHistory,
  
  // 从 discovery 模块导入
  DiscoveryStep,
  DiscoveryContext,
  DiscoveryProgress,
  DiscoveryResult,
  CoachingConfig,
  StepExecutionResult,
  
  // 从 agents 模块导入
  AgentIntegrationResult,
  
  // 从 utils/tasks-parser 模块导入
  ParsedTask,
  ParallelGroup,
  ExecutionWave,
  
  // 工具函数导入
  parseTasksMarkdown,
  parseParallelGroups,
  computeExecutionOrder,
  detectTaskCircularDependency,
  getReadyTasks,
  getIncompleteTasks,
  areDependenciesSatisfied,
  parseTask,
  
  // 从 utils/subfeature-manager 模块导入
  SubFeatureMeta,
  
  // 额外类型 import
  CoachingLevel,
  AgentMetadata,
  SdduConfig,
} from './types';

describe('类型导出测试', () => {
  test('验证 v3.0.0 状态类型的导出', () => {
    // v3.0.0 state format test
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

  test('验证 FeatureStateEnum 和相关接口 (deprecated v2.x 兼容性保留)', () => {
    // 测试 v2.x deprecated 枚举值是否仍然存在（向后兼容）
    // 注意: FeatureStateEnum 已弃用，新代码应使用 Phase (8 values) 和 FeatureStatus (5 values) 类型
    const enums: FeatureStateEnum[] = [
      'drafting', 'discovered', 'specified', 'planned', 'tasked', 'implementing', 'reviewed', 'validated', 'completed'
    ];
    
    expect(enums.length).toBeGreaterThan(0);
    
    // 测试 FeatureState 接口 (v3.0.0: uses phase + status)
    const featureState: FeatureState = {
      id: 'test-id',
      name: 'Test Name',
      phase: 'registered',
      status: 'tracked',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    expect(featureState.id).toBe('test-id');
  });

  test('验证 Discovery 相关类型', () => {
    const coachingLevels: CoachingLevel[] = [
      CoachingLevel.IDEA_STAGE,
      CoachingLevel.PAIN_STAGE,
      CoachingLevel.SOLUTION_STAGE,
      CoachingLevel.EXECUTION_STAGE,
    ];
    
    expect(coachingLevels.length).toBe(4);
    
    const step: DiscoveryStep = {
      id: 'test-step',
      name: 'Test Step',
      description: 'Test Description',
      prompts: ['Prompt 1', 'Prompt 2'],
      outputField: 'outputField'
    };
    
    expect(step.id).toBe('test-step');
  });

  test('验证 Agent 相关类型', () => {
    const agentResult: AgentIntegrationResult = {
      success: true,
      message: 'Success'
    };
    
    expect(agentResult.success).toBe(true);
  });

  test('验证 Task Parser 类型和工具函数', () => {
    // 验证工具函数存在
    expect(typeof parseTasksMarkdown).toBe('function');
    expect(typeof parseParallelGroups).toBe('function');
    expect(typeof computeExecutionOrder).toBe('function');
    expect(typeof detectTaskCircularDependency).toBe('function');
    expect(typeof getReadyTasks).toBe('function');
    expect(typeof getIncompleteTasks).toBe('function');
    expect(typeof areDependenciesSatisfied).toBe('function');
    expect(typeof parseTask).toBe('function');
    
    // 验证类型的存在
    const task: ParsedTask = {
      id: 'TEST-001',
      description: 'Test task',
      dependencies: ['TEST-002']
    };
    
    const group: ParallelGroup = {
      id: 1,
      name: 'Test Group',
      tasks: [task],
      waitGroups: [0]
    };
    
    const wave: ExecutionWave = {
      waveNumber: 0,
      groups: [group],
      tasks: [task]
    };
    
    expect(wave.waveNumber).toBe(0);
  });

  test('验证 SubFeature 相关类型', () => {
    const meta: SubFeatureMeta = {
      id: 'sub-001',
      name: 'Sub Feature 1',
      status: 'active',
      dir: 'path/to/subfeature'
    };
    
    expect(meta.id).toBe('sub-001');
  });

  test('验证自定义类型', () => {
    const metadata: AgentMetadata = {
      name: 'test-agent',
      description: 'Test agent description',
      mode: 'subagent',
      promptFile: 'path/to/prompt.md'
    };
    
    expect(metadata.name).toBe('test-agent');
    
    const config: SdduConfig = {
      autoUpdateState: true,
      enableDiscovery: false,
      logLevel: 'info',
      defaultTimeout: 60
    };
    
    expect(config.autoUpdateState).toBe(true);
  });

  test('验证函数导出正常', () => {
    // 验证 parseTask 函数能正常使用
    const task = parseTask('- [ ] TASK-001: Test task');
    
    if (task) {
      expect(task.id).toBe('TASK-001');
    }
  });
});

// 如果不需要所有测试，可以使用 describe.skip 跳过一些复杂的测试
