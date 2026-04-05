/**
 * SDD 统一错误处理系统
 * 实现 FR-016~019: 统一错误处理体系，解决 T-005 错误处理不统一问题
 */

// 错误代码枚举，分类管理各种错误
export enum ErrorCode {
  // 状态管理相关错误
  STATE_INVALID_TRANSITION = 'STATE_INVALID_TRANSITION',      // 无效的状态迁移
  STATE_VALIDATION_FAILED = 'STATE_VALIDATION_FAILED',        // 状态验证失败
  STATE_FILE_NOT_FOUND = 'STATE_FILE_NOT_FOUND',              // 状态文件未找到
  STATE_LOAD_ERROR = 'STATE_LOAD_ERROR',                      // 状态加载错误
  STATE_SAVE_ERROR = 'STATE_SAVE_ERROR',                      // 状态保存错误
  STATE_MISSING_DEPENDENCY = 'STATE_MISSING_DEPENDENCY',      // 状态依赖缺失
  
  // 发现阶段相关错误
  DISCOVERY_STEP_EXECUTION_FAILED = 'DISCOVERY_STEP_EXECUTION_FAILED',  // 发现步骤执行失败
  DISCOVERY_CONTEXT_INVALID = 'DISCOVERY_CONTEXT_INVALID',      // 发现上下文无效
  DISCOVERY_CONFIG_MISSING = 'DISCOVERY_CONFIG_MISSING',        // 发现配置缺失
  DISCOVERY_RESULT_INVALID = 'DISCOVERY_RESULT_INVALID',        // 发现结果无效
  DISCOVERY_STEP_NOT_FOUND = 'DISCOVERY_STEP_NOT_FOUND',        // 发现步骤未找到
  
  // 工具函数相关错误
  TOOL_ARGUMENT_INVALID = 'TOOL_ARGUMENT_INVALID',              // 工具参数无效
  TOOL_FILE_OPERATION_FAILED = 'TOOL_FILE_OPERATION_FAILED',    // 文件操作失败
  TOOL_PARSE_ERROR = 'TOOL_PARSE_ERROR',                        // 解析错误
  TOOL_EXECUTE_ERROR = 'TOOL_EXECUTE_ERROR',                    // 执行错误
  TOOL_TIMEOUT_ERROR = 'TOOL_TIMEOUT_ERROR',                    // 工具超时错误
  
  // Agent 相关错误
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',                          // Agent 未找到
  AGENT_ALREADY_REGISTERED = 'AGENT_ALREADY_REGISTERED',        // Agent 已注册
  AGENT_REGISTRATION_FAILED = 'AGENT_REGISTRATION_FAILED',      // Agent 注册失败
  AGENT_EXECUTION_ERROR = 'AGENT_EXECUTION_ERROR',              // Agent 执行错误
  AGENT_CONFIGURATION_ERROR = 'AGENT_CONFIGURATION_ERROR',      // Agent 配置错误
  
  // 文件系统相关错误
  FILE_READ_ERROR = 'FILE_READ_ERROR',                          // 文件读取错误
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',                        // 文件写入错误
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',                    // 文件访问被拒
  FILE_NOT_EXIST = 'FILE_NOT_EXIST',                            // 文件不存在
  FILE_FORMAT_INVALID = 'FILE_FORMAT_INVALID',                  // 文件格式无效
}

// 错误上下文接口，提供详细的错误信息
export interface ErrorContext {
  code: ErrorCode;
  details?: Record<string, any>;        // 具体错误详情
  stack?: string;                       // 堆栈跟踪
  timestamp: string;                    // 时间戳
  component?: string;                   // 组件名称
  userId?: string;                      // 用户ID
  sessionId?: string;                   // 会话ID
}

/**
 * SDD 基础错误类
 * 所有 SDD 错误类的基类
 */
export class SddError extends Error {
  public readonly code: ErrorCode;
  public readonly context: ErrorContext;
  public readonly isSddError = true;

  constructor(message: string, context: ErrorContext) {
    super(message);
    
    // 设置 prototype 链
    Object.setPrototypeOf(this, SddError.prototype);
    
    this.code = context.code;
    this.context = context;
    this.name = this.constructor.name;
  }

  /**
   * 获取错误的详细信息
   */
  public toDetailedString(): string {
    return `SDD Error [${this.code}]: ${this.message}\nDetails: ${JSON.stringify(this.context.details, null, 2)}`;
  }
}

/**
 * 状态管理错误
 */
export class StateError extends SddError {
  constructor(code: Exclude<ErrorCode, ErrorCode.STATE_INVALID_TRANSITION>, message: string, details?: Record<string, any>) {
    super(message, {
      code: code,
      details,
      timestamp: new Date().toISOString(),
      component: 'State Manager'
    });

    Object.setPrototypeOf(this, StateError.prototype);
  }
}

/**
 * 发现阶段错误
 */
export class DiscoveryError extends SddError {
  constructor(code: ErrorCode, message: string, details?: Record<string, any>) {
    super(message, {
      code: code,
      details,
      timestamp: new Date().toISOString(),
      component: 'Discovery Engine'
    });

    Object.setPrototypeOf(this, DiscoveryError.prototype);
  }
}

/**
 * 工具函数错误
 */
export class ToolError extends SddError {
  constructor(code: ErrorCode, message: string, details?: Record<string, any>) {
    super(message, {
      code: code,
      details,
      timestamp: new Date().toISOString(),
      component: 'Tools'
    });

    Object.setPrototypeOf(this, ToolError.prototype);
  }
}

/**
 * Agent 错误
 */
export class AgentError extends SddError {
  constructor(code: ErrorCode, message: string, details?: Record<string, any>) {
    super(message, {
      code: code,
      details,
      timestamp: new Date().toISOString(),
      component: 'Agent System'
    });

    Object.setPrototypeOf(this, AgentError.prototype);
  }
}

/**
 * 配置相关错误
 */
export class ConfigError extends SddError {
  constructor(code: ErrorCode, message: string, details?: Record<string, any>) {
    super(message, {
      code: code,
      details,
      timestamp: new Date().toISOString(),
      component: 'Config Manager'
    });

    Object.setPrototypeOf(this, ConfigError.prototype);
  }
}

/**
 * 错误处理器
 * 提供标准化的错误处理方式
 */
export class ErrorHandler {
  /**
   * 根据错误类型执行不同的处理策略
   */
  static handle(error: unknown, defaultSeverity: 'warn' | 'error' = 'error'): SddError | Error {
    // 如果已经是 SddError 直接返回
    if (error instanceof SddError) {
      return this.logError(error);
    }

    // 如果是标准 JS 错误，包装成 SddError
    if (error instanceof Error) {
      const sddError = new SddError(error.message, {
        code: ErrorCode.TOOL_EXECUTE_ERROR,  // 默认工具执行错误
        details: { originalError: error.message, cause: error },
        timestamp: new Date().toISOString(),
        component: 'General Handler'
      });
      return this.logError(sddError);
    }

    // 其他未知错误类型，转换为字符串处理
    const stringError = String(error);
    const sddError = new SddError(stringError, {
      code: ErrorCode.TOOL_EXECUTE_ERROR,
      details: { originalError: stringError },
      timestamp: new Date().toISOString(),
      component: 'General Handler'
    });
    
    return this.logError(sddError);
  }

  /**
   * 记录错误日志
   */
  private static logError<T extends SddError | Error>(error: T): T {
    // 使用类型谓词，区分两种情况的处理
    if (error instanceof SddError) {
      console.error(`[SDD-${error.code}] ${error.message}`, error.context);
    } else {
      console.error('[SDD-UNHANDLED] Unhandled error:', error.message);
    }
    
    return error;
  }
}

/**
 * 格式化错误信息
 */
export function formatErrorMessage(error: SddError): string {
  if (error.context.details) {
    return `${error.message} (${error.code}) - Details: ${JSON.stringify(error.context.details)}`;
  }
  return `${error.message} (${error.code})`;
}

export default ErrorHandler;