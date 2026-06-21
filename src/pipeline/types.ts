/**
 * SDDU 管线类型定义 — 工作流阶段流转规则与管线配置
 * 规则：零 @opencode-ai/plugin 依赖，不反向引用 adapters/
 */

import { Phase } from '../state';

/** 管线阶段流转配置 */
export interface PipelineStageConfig {
  /** 源阶段 */
  from: Phase;
  /** 目标阶段 */
  to: Phase;
  /** 是否需要人工确认 */
  requiresApproval: boolean;
  /** 流转前置条件描述 */
  preconditions: string[];
  /** 负责此流转的 Agent 名称 */
  responsibleAgent: string;
}

/** 管线工作流状态 */
export type PipelineWorkflowStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

/** 管线执行上下文 */
export interface PipelineContext {
  /** 特性名称 */
  featureName: string;
  /** 当前阶段 */
  currentPhase: Phase;
  /** 目标阶段 */
  targetPhase: Phase;
  /** 工作流状态 */
  workflowStatus: PipelineWorkflowStatus;
  /** 上下文数据 */
  data: Record<string, unknown>;
  /** 执行历史 */
  executionHistory: PipelineExecutionRecord[];
}

/** 管线执行记录 */
export interface PipelineExecutionRecord {
  /** 记录时间戳 */
  timestamp: string;
  /** 执行的动作 */
  action: string;
  /** 源阶段 */
  fromPhase?: Phase;
  /** 目标阶段 */
  toPhase?: Phase;
  /** 触发的 Agent */
  triggeredBy: string;
  /** 备注 */
  comment?: string;
}

/** 管线验证结果 */
export interface PipelineValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误详情 */
  errors: string[];
  /** 警告 */
  warnings: string[];
}
