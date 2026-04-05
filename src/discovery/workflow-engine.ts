/**
 * Discovery工作流引擎
 * 实现7步需求挖掘流程
 */

import { DiscoveryStep, DiscoveryContext, StepExecutionResult, CoachingConfig } from './types';
import { CoachingModeEngine, CoachingLevel } from './coaching-mode';
import { StateMachine } from '../state/machine';
import { DiscoveryStateValidator } from './state-validator';

// 定义Discovery工作流状态
export type DiscoveryWorkflowStatus = 'pending' | 'running' | 'completed' | 'failed';

// 定义状态变化回调接口
export type StatusChangeCallback = (
  featureId: string, 
  status: DiscoveryWorkflowStatus, 
  data?: any
) => void | Promise<void>;

// Discovery配置接口，增加状态联动配置
export interface DiscoveryConfig {
  autoUpdateState?: boolean;
  onStatusChange?: StatusChangeCallback[];
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 7 步发现工作流定义
 */
export const DISCOVERY_WORKFLOW: DiscoveryStep[] = [
  {
    id: 'problem-space',
    name: '问题空间探索',
    description: '背景理解、痛点挖掘、业务价值澄清',
    prompts: [
      '是什么触发这个想法？（用户反馈、数据分析、竞品观察、内部痛点？）',
      '如果不做这个功能会发生什么？',
      '当前用户是如何解决这个问题的？',
      '最痛的一个点是什么？用用户原话描述',
      '这个痛点发生的频率？影响的用户规模？',
      '痛点的紧迫性（现在必须解决 vs 可以稍后）',
      '预期带来的业务价值是什么？（增收、降本、提效、风控、体验）',
      '如何衡量成功？是否有明确的北极星指标？'
    ],
    outputField: 'problemSpaceExploration'
  },
  {
    id: 'user-persona',
    name: '用户画像与场景',
    description: '目标用户定义、用户场景还原、用户旅程地图',
    prompts: [
      '这个功能为谁而做？（用户角色细分）',
      '不同角色的诉求有何差异？',
      '谁有决策权？谁是最终使用者？谁是影响者？',
      '用户在什么场景下遇到这个问题？（时间、地点、上下文）',
      '触发这个问题的具体情境是什么？',
      '用户期望的「理想状态」是什么？',
      '当前的用户旅程是什么？包含痛点',
      '期望的用户旅程是什么？目标状态'
    ],
    outputField: 'userPersonaAndScenarios'
  },
  {
    id: 'requirement-classification',
    name: '需求分类与优先级',
    description: 'MoSCoW 分类、需求归类、优先级排序',
    prompts: [
      '必备需求（Must have）：没有这个功能产品无法使用',
      '期望需求（Should have）：显著提升用户体验',
      '惊喜需求（Nice to have）：超出预期，带来 wow 体验',
      '功能需求：用户需要完成什么任务',
      '体验需求：用户希望有什么感受',
      '合规需求：法律、安全、政策约束',
      '技术需求：性能、稳定性、扩展性',
      '使用 MoSCoW 法则（Must/Should/Could/Won\'t）进行优先级排序'
    ],
    outputField: 'requirementClassification'
  },
  {
    id: 'competitive-analysis',
    name: '竞品与方案调研',
    description: '竞品对标、替代方案评估',
    prompts: [
      '竞品是如何解决这个问题的？',
      '他们的方案有哪些优缺点？',
      '我们可以差异化的地方在哪里？',
      '除了我们设想的方案，还有哪些可能的解决路径？',
      '每个方案的优缺点、实现成本、用户价值是什么？',
      '推荐哪个方案？为什么？'
    ],
    outputField: 'competitiveAnalysis'
  },
  {
    id: 'risks-assumptions',
    name: '风险与假设识别',
    description: '关键假设、潜在风险',
    prompts: [
      '我们做这个功能基于哪些假设？',
      '哪些假设需要验证？',
      '如何设计 MVP 来验证这些假设？',
      '技术风险：是否有未知的技术难点？',
      '市场风险：用户需求是否真实存在？',
      '资源风险：是否有足够资源投入？',
      '合规风险：是否有政策或法律风险？'
    ],
    outputField: 'risksAssumptions'
  },
  {
    id: 'success-criteria',
    name: '成功标准定义',
    description: '定性指标、定量指标、验收标准',
    prompts: [
      '北极星指标是什么？',
      '次要指标有哪些？（转化率、留存率、活跃度等）',
      '目标数值和基线数据是多少？',
      '用户体验达到什么水平？（可用性测试评分、NPS）',
      '关键干系人的满意度如何衡量？',
      '达到什么标准算「成功上线」？',
      '达到 what standard 算「验证通过」？'
    ],
    outputField: 'successCriteria'
  },
  {
    id: 'scope-boundary',
    name: '范围边界划定',
    description: 'MVP/V1/未来版本规划',
    prompts: [
      '本次一定要做的是什么？',
      '本次明确不做的是什么？（防止范围蔓延）',
      '可以拆分到后续迭代的是什么？',
      'MVP 版本：最小可行产品，验证核心价值',
      'V1 版本：完整功能，满足主流场景',
      '未来版本：高级功能，差异化竞争',
      'MVP 版本的范围确定了吗？'
    ],
    outputField: 'scopeBoundary'
  }
];

/**
 * Discovery 工作流引擎
 */
export class DiscoveryWorkflowEngine {
  private coachingModeEngine: CoachingModeEngine;
  private config: DiscoveryConfig;
  private stateMachine?: StateMachine;
  
  constructor(config?: DiscoveryConfig, stateMachine?: StateMachine) {
    this.coachingModeEngine = new CoachingModeEngine();
    this.config = {
      autoUpdateState: false,
      onStatusChange: [],
      logLevel: 'info',
      ...config
    };
    this.stateMachine = stateMachine;
  }
  
  /**
   * 设置状态机用于状态联动
   */
  setStateMachine(stateMachine: StateMachine): void {
    this.stateMachine = stateMachine;
  }
  
  /**
   * 注册状态变化回调
   */
  onStatusChange(callback: StatusChangeCallback): void {
    this.config.onStatusChange?.push(callback);
  }
  
  /**
   * 通知状态变化
   */
  private async notifyStatusChange(
    featureId: string, 
    status: DiscoveryWorkflowStatus, 
    data?: any
  ): Promise<void> {
    if (this.config.onStatusChange && this.config.onStatusChange.length > 0) {
      for (const callback of this.config.onStatusChange) {
        try {
          await Promise.resolve(callback(featureId, status, data));
        } catch (error) {
          console.error('Error in status change callback:', error);
        }
      }
    }
    
    if (this.config.logLevel !== 'error') {
      console.log(`[DiscoveryWorkflow] Status changed for ${featureId}: ${status}`);
    }
  }

  /**
   * 执行整个工作流
   */
  async execute(context: DiscoveryContext): Promise<DiscoveryContext> {
    console.log(`🚀 开始执行 Discovery 工作流: ${context.featureName}`);
    
    // 通知状态变化 - pending -> running
    await this.notifyStatusChange(context.featureName, 'running');
    
    // 检测用户的辅导级别并应用相应策略
    const coachingLevel = this.coachingModeEngine.detectLevel(context.userInput);
    context = this.coachingModeEngine.applyCoachingStrategy(context, coachingLevel);
    
    const totalSteps = DISCOVERY_WORKFLOW.length;
    
    try {
      for (let i = context.currentStepIndex; i < totalSteps; i++) {
        context.currentStepIndex = i;
        
        const step = DISCOVERY_WORKFLOW[i];
        
        console.log(`步骤 ${i + 1}/${totalSteps}: ${step.name}`);
        
        // 根据辅导级别调整步骤提示
        const adjustedStep = await this.adjustStepByCoachingLevel(step, coachingLevel);
        
        // 执行单步操作
        const result = await this.executeStep(adjustedStep, context);
        
        if (!result.success) {
          throw new Error(`步骤执行失败: ${step.name}. 错误: ${result.message}`);
        }
        
        // 更新上下文数据
        context.data[step.outputField] = result.output[step.outputField];
        
        // 如果不是最后一步，可以中断暂停
        if (i < totalSteps - 1) {
          console.log(`✅ 步骤 "${step.name}" 完成`);
        }
      }
      
      console.log(`🎉 Discovery 工作流执行完成: ${context.featureName}`);
      
      // 通知状态变化 - running -> completed
      await this.notifyStatusChange(context.featureName, 'completed', context);
      
      // 如果配置了自动更新状态且有状态机，则更新特性状态为 discovery 阶段
      if (this.config.autoUpdateState && this.stateMachine) {
        try {
          await this.stateMachine.updateState(
            context.featureName.toLowerCase().replace(/\s+/g, '-'),
            'discovered',
            context,
            'DiscoveryWorkflowEngine',
            `Discovery workflow completed for feature: ${context.featureName}`
          );
        } catch (error) {
          console.warn('Auto-update state failed:', error);
        }
      }
      
      return context;
    } catch (error) {
      console.error('Discovery 工作流执行失败:', error);
      
      // 通知状态变化 - running -> failed
      await this.notifyStatusChange(context.featureName, 'failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * 对单个步骤应用辅导级别调整
   */
  private async adjustStepByCoachingLevel(step: DiscoveryStep, coachingLevel: CoachingLevel): Promise<DiscoveryStep> {
    const adjustedStep = { ...step };
    
    // 根据辅导级别调整提示词详细程度
    adjustedStep.prompts = this.coachingModeEngine.adjustPromptsByLevel(
      step.prompts,
      coachingLevel
    );
    
    return adjustedStep;
  }

  /**
   * 执行单步逻辑
   */
  async executeStep(step: DiscoveryStep, context: DiscoveryContext): Promise<StepExecutionResult> {
    try {
      // 模拟Agent调用
      // 在实际实现中，这里应该调用 @sdd-discovery Agent 处理当前步骤
      const stepOutput = await this.callStepAgent(step, context);
      
      return {
        success: true,
        output: {
          [step.outputField]: stepOutput
        },
        message: `步骤 ${step.id} 执行成功`
      };
    } catch (error) {
      return {
        success: false,
        output: {},
        message: `步骤 ${step.id} 执行失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
  
  /**
   * 调用单个步骤的Agent
   * 这里是模拟实现，在实际中应该调用OpenCode Agent系统
   */
  private async callStepAgent(step: DiscoveryStep, context: DiscoveryContext): Promise<any> {
    // 这里应该调用实际的 @sdd-discovery Agent，针对当前步骤进行交互
    // 因为这是一个虚拟的函数，返回模拟数据
    console.log(`Calling @sdd-discovery Agent for step: ${step.name}`);
    
    // 模拟用户输入或已有的回答
    const simulatedAnswer = `用户对步骤 "${step.name}" 的回答`;
    
    // 结合上下文提供更精确的问题
    const detailedContext = {
      stepId: step.id,
      stepName: step.name,
      stepDescription: step.description,
      prompts: step.prompts.map(prompt => ({ prompt, answer: simulatedAnswer })),
      context
    };
    
    // 返回处理后的结果
    return detailedContext;
  }

  /**
   * 从指定步骤恢复执行（支持中断续执行）
   */
  async resumeFromStep(startStepIndex: number, context: DiscoveryContext): Promise<DiscoveryContext> {
    // 设置从特定步骤开始位置
    context.currentStepIndex = startStepIndex;
    
    // 继续执行剩余流程
    return await this.execute(context);
  }

  /**
   * 获取步骤总数
   */
  getTotalSteps(): number {
    return DISCOVERY_WORKFLOW.length;
  }

  /**
   * 获取当前进度
   */
  getCurrentProgress(context: DiscoveryContext): number {
    return Math.min(100, Math.round((context.currentStepIndex / this.getTotalSteps()) * 100));
  }
}

// 只导出那些从其他模块导入的类型和类，而不包括此文件中定义的
export { 
  CoachingLevel, 
  CoachingConfig, 
  DiscoveryStateValidator 
};

export type { 
  DiscoveryStep,
  DiscoveryContext, 
  StepExecutionResult, 
  CoachingModeEngine
  // 注意：不导出本文件中定义的类型如 DiscoveryConfig, StatusChangeCallback, DiscoveryWorkflowStatus
};