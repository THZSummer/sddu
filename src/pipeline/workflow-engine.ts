/**
 * SDDU 工作流阶段流转引擎 — 管线级阶段流转编排
 * 规则：零 @opencode-ai/plugin 依赖，不反向引用 adapters/
 */

import {
  Phase,
  PHASE_ORDER,
  VALID_PHASES,
  validateStateV3,
} from '../state';
import {
  PipelineContext,
  PipelineWorkflowStatus,
  PipelineExecutionRecord,
  PipelineValidationResult,
} from './types';
import { CoachingModeEngine as PipelineCoachingEngine, CoachingLevel } from './coaching-mode';
import { PipelineStateValidator } from './state-validator';

/**
 * 管线工作流引擎
 * 负责编排 SDDU 8 阶段工作流（registered → discovered → specified → planned → tasked → builded → reviewed → validated）的阶段流转
 */
export class PipelineWorkflowEngine {
  private coachingEngine: PipelineCoachingEngine;
  private stateValidator: PipelineStateValidator;
  private contexts: Map<string, PipelineContext> = new Map();

  constructor() {
    this.coachingEngine = new PipelineCoachingEngine();
    this.stateValidator = new PipelineStateValidator();
  }

  /**
   * 获取所有有效阶段列表
   */
  getValidPhases(): readonly Phase[] {
    return VALID_PHASES;
  }

  /**
   * 获取阶段顺序映射
   */
  getPhaseOrder(): Record<Phase, number> {
    return PHASE_ORDER;
  }

  /**
   * 检查阶段流转是否合法
   */
  canTransition(from: Phase, to: Phase): boolean {
    return this.stateValidator.validateTransition(from, to).valid;
  }

  /**
   * 获取当前阶段的推荐下一阶段
   */
  getNextRecommendedPhase(currentPhase: Phase): Phase | null {
    const currentOrder = PHASE_ORDER[currentPhase] ?? -1;
    if (currentOrder >= 0 && currentOrder < VALID_PHASES.length - 1) {
      return VALID_PHASES[currentOrder + 1];
    }
    return null;
  }

  /**
   * 创建管线执行上下文
   */
  createContext(featureName: string, currentPhase: Phase, targetPhase: Phase): PipelineContext {
    const context: PipelineContext = {
      featureName,
      currentPhase,
      targetPhase,
      workflowStatus: 'idle',
      data: {},
      executionHistory: [],
    };
    this.contexts.set(featureName, context);
    return context;
  }

  /**
   * 开始阶段流转
   */
  async startTransition(
    featureName: string,
    from: Phase,
    to: Phase,
    triggeredBy: string,
    comment?: string
  ): Promise<PipelineValidationResult> {
    // 验证流转合法性
    const validation = this.stateValidator.validateTransition(from, to);
    if (!validation.valid) {
      return validation;
    }

    // 获取或创建上下文
    let context = this.contexts.get(featureName);
    if (!context) {
      context = this.createContext(featureName, from, to);
    }

    // 更新上下文
    context.currentPhase = from;
    context.targetPhase = to;
    context.workflowStatus = 'running';

    // 记录执行历史
    const record: PipelineExecutionRecord = {
      timestamp: new Date().toISOString(),
      action: `Transition: ${from} → ${to}`,
      fromPhase: from,
      toPhase: to,
      triggeredBy,
      comment,
    };
    context.executionHistory.push(record);

    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * 完成阶段流转
   */
  completeTransition(featureName: string): PipelineContext | null {
    const context = this.contexts.get(featureName);
    if (context) {
      const lastRecord = context.executionHistory[context.executionHistory.length - 1];
      context.currentPhase = context.targetPhase;
      context.workflowStatus = 'completed';

      const record: PipelineExecutionRecord = {
        timestamp: new Date().toISOString(),
        action: `Completed: reached ${context.targetPhase}`,
        fromPhase: lastRecord?.fromPhase,
        toPhase: context.targetPhase,
        triggeredBy: 'PipelineWorkflowEngine',
        comment: 'Transition completed',
      };
      context.executionHistory.push(record);
    }
    return context || null;
  }

  /**
   * 获取上下文
   */
  getContext(featureName: string): PipelineContext | undefined {
    return this.contexts.get(featureName);
  }

  /**
   * 获取所有上下文
   */
  getAllContexts(): Map<string, PipelineContext> {
    return this.contexts;
  }

  /**
   * 检测辅导级别
   */
  detectCoachingLevel(userInput: string): CoachingLevel {
    return this.coachingEngine.detectLevel(userInput);
  }
}
