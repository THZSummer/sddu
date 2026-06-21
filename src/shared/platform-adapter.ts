/**
 * SDDU 多平台适配接口契约 — 零平台依赖，零业务域依赖
 *
 * 定义 SDDU 方法论引擎对宿主平台的能力需求契约。
 * 任何 LLM 平台（OpenCode、VS Code Copilot、Cursor 等）实现此接口即可接入 SDDU 方法论引擎。
 *
 * 设计原则：
 * - 契约描述 SDDU 引擎「需要什么」，而非「OpenCode 提供什么」
 * - 接口不绑定任何具体平台的类型或 API
 * - 当前只有 OpenCode 适配实现，但接口为未来多平台扩展预留接入点
 *
 * @experimental 接口标记为实验性，将在 v4.1+ 中根据实际迁移需求迭代
 */

/** 工具注册描述符 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

/** Agent 注册描述符 */
export interface AgentDefinition {
  name: string;
  description: string;
  mode: 'subagent';
  promptSource: string;  // 指向方法论模板的路径（平台适配层负责解析）
}

/** 事件处理器 */
export type EventHandler = (payload: unknown) => void | Promise<void>;

/** 平台资源句柄（文件系统、目录、工作区等平台提供的原语） */
export interface PlatformContext {
  /** 项目根目录的绝对路径 */
  directory: string;
  /** 持久化 KV 存储（平台提供） */
  store: {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
  };
  /** 平台日志接口 */
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): Promise<void>;
}

/** 多平台适配器接口 —— 任何 LLM 平台实现此接口即可接入 SDDU 方法论引擎 */
export interface PlatformAdapter {
  /** 平台身份 */
  readonly platform: string;

  /** 注册一个工具函数到平台 */
  registerTool(def: ToolDefinition): void;

  /** 注册一个子 Agent 到平台 */
  registerAgent(def: AgentDefinition): void;

  /** 监听平台生命周期事件 */
  onEvent(event: string, handler: EventHandler): void;

  /** 获取平台上下文（文件系统、存储等） */
  getContext(): PlatformContext;
}
