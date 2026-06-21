// SDDU 共享类型定义 — 零平台依赖，零业务域依赖
// 可被所有业务域和 adapters 安全引用

/**
 * Agent 元数据接口，用于动态 Agent 注册
 */
export interface AgentMetadata {
  name: string;
  description: string;
  mode: string;
  promptFile: string;
}

/**
 * SDDU 配置选项接口
 * 统一配置接口，便于扩展
 */
export interface SdduConfig {
  autoUpdateState?: boolean;  // 是否自动更新状态
  enableDiscovery?: boolean;  // 是否启用自动发现
  logLevel?: 'debug' | 'info' | 'warn' | 'error';  // 日志级别
  defaultTimeout?: number;    // 默认超时时间
  maxRetries?: number;        // 最大重试次数

  // Tree structure configurations
  enableTreeStructure?: boolean;  // Whether to enable tree structure optimization
  maxTreeDepth?: number;          // Maximum allowed tree depth (default: 5)
}

/** @deprecated Use `Phase` from v3.0.0 instead. `WorkflowStatus` was the old 6-state schema. */
export type WorkflowStatus = 'specified' | 'planned' | 'tasked' | 'implementing' | 'reviewed' | 'validated';

/** @deprecated Use `PhaseHistoryEntry` from v3.0.0 instead. */
export type PhaseHistory = Array<{
  phase: string;
  timestamp: string;
  triggeredBy: string;
  comment?: string;
}>;
