# Feature Specification: SDD 工具系统优化

## 元数据

| 元数据 | 值 |
|--------|-----|
| **Feature ID** | `sdd-tools-optimization` |
| **Feature 名称** | SDD 工具系统优化 |
| **规范版本** | 1.0.0 |
| **创建日期** | 2026-04-01 |
| **作者** | SDD Team |
| **优先级** | P1 |
| **状态** | specified |
| **相关干系人** | Plugin 开发团队、Agent 用户 |

---

## 1. 上下文

### 1.1 问题描述

当前 SDD 插件的工具功能分散在多个位置，缺少统一管理和标准化：

| 当前位置 | 内容 | 问题 |
|----------|------|------|
| `src/index.ts` | 核心工具定义（sdd_init, sdd_specify, sdd_status, sdd_roadmap） | 工具逻辑与插件入口耦合 |
| `src/state/` | 状态管理相关工具 | 状态操作分散 |
| `src/utils/` | 工具函数（tasks-parser, dependency-notifier, readme-generator） | 缺少统一导出 |

### 1.2 影响范围

- **影响模块**: 工具注册系统、Agent 调用接口、插件事件处理
- **向后兼容**: 需要保持现有工具 API 不变
- **依赖关系**: 依赖 `.sdd/.specs/sdd-plugin-phase2/plan.md` 中的 Structured Output 规划

### 1.3 业务价值

- 提高工具代码的可维护性和可测试性
- 支持更复杂的工具类型（如 Structured Output）
- 为未来工具扩展提供清晰的架构基础

---

## 2. Goals & Non-Goals

### 2.1 Goals

| ID | 目标 | 验收标准 |
|----|------|----------|
| G-001 | 创建统一的 `src/tools/` 目录 | 所有工具文件位于此目录下 |
| G-002 | 重构工具注册机制 | 工具与插件入口解耦 |
| G-003 | 实现 Phase 2 规划的 Structured Output 工具 | 支持 JSON Schema 验证的输出工具 |
| G-004 | 增强工具类型定义和错误处理 | 完整的 TypeScript 类型定义和错误边界 |

### 2.2 Non-Goals

| ID | 非目标 | 说明 |
|----|--------|------|
| NG-001 | 修改现有工具的 API 签名 | 保持向后兼容 |
| NG-002 | 添加新的业务功能工具 | 本次仅重构，不新增业务工具 |
| NG-003 | 修改 Agent 系统 | Agent 调用方式保持不变 |
| NG-004 | 重构状态机或命令系统 | 仅关注工具层优化 |

---

## 3. 用户故事

| ID | 角色 | 故事 | 价值 |
|----|------|------|------|
| US-001 | 插件开发者 | 我希望工具代码集中管理 | 便于维护和测试 |
| US-002 | 插件开发者 | 我希望有清晰的工具类型定义 | 减少类型错误 |
| US-003 | Agent 用户 | 我希望工具调用有标准化的错误提示 | 快速定位问题 |
| US-004 | Agent 用户 | 我希望有结构化输出工具 | 获取可解析的 JSON 结果 |

---

## 4. 功能需求

### 4.1 工具目录结构

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| FR-001 | 创建 `src/tools/` 目录 | 目录包含所有工具模块 |
| FR-002 | 工具模块按功能分组 | core/, output/, state/, utils/ 子目录 |
| FR-003 | 提供统一的工具注册函数 | `registerTools(pluginContext)` |
| FR-004 | 导出工具类型定义 | `src/tools/types.ts` |

### 4.2 核心工具迁移

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| FR-010 | 迁移 sdd_init 工具到 `src/tools/core/init.ts` | 功能不变，可独立测试 |
| FR-011 | 迁移 sdd_specify 工具到 `src/tools/core/specify.ts` | 功能不变，可独立测试 |
| FR-012 | 迁移 sdd_status 工具到 `src/tools/core/status.ts` | 功能不变，可独立测试 |
| FR-013 | 迁移 sdd_roadmap 工具到 `src/tools/core/roadmap.ts` | 功能不变，可独立测试 |

### 4.3 Structured Output 工具

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| FR-020 | 实现 JSON Schema 定义工具 | `src/tools/output/schema-builder.ts` |
| FR-021 | 实现 Spec 输出工具 | 输出符合 spec.json 格式的结构化数据 |
| FR-022 | 实现 Plan 输出工具 | 输出符合 plan.md 结构的结构化数据 |
| FR-023 | 实现 Tasks 输出工具 | 输出符合 tasks.md 格式的结构化数据 |
| FR-024 | 实现输出验证函数 | 验证输出是否符合 Schema |

### 4.4 工具注册机制

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| FR-030 | 实现工具注册表 | `src/tools/registry.ts` |
| FR-031 | 支持工具元数据注册 | name, description, args, execute |
| FR-032 | 支持工具拦截器 | 前置/后置处理钩子 |
| FR-033 | 支持工具日志记录 | 自动记录调用和错误 |

### 4.5 错误处理增强

| FR-ID | 需求 | 验收标准 |
|-------|------|----------|
| FR-040 | 定义工具错误类型 | `ToolError`, `ValidationError`, `ExecutionError` |
| FR-041 | 实现错误处理中间件 | 统一捕获和处理工具错误 |
| FR-042 | 提供友好的错误消息 | 用户可读的错误描述 |
| FR-043 | 记录错误上下文 | 用于调试和问题追踪 |

---

## 5. 非功能需求

| NFR-ID | 类型 | 需求 | 验收标准 |
|--------|------|------|----------|
| NFR-001 | 兼容性 | 保持向后兼容 | 现有 Agent 调用不受影响 |
| NFR-002 | 可测试性 | 工具可独立测试 | 单元测试覆盖率 > 80% |
| NFR-003 | 类型安全 | 完整 TypeScript 类型 | 无 `any` 类型，严格模式 |
| NFR-004 | 性能 | 工具加载时间 | 启动时间增加 < 100ms |
| NFR-005 | 可维护性 | 代码组织清晰 | 每个工具文件 < 200 行 |
| NFR-006 | 文档 | 工具文档完整 | 每个工具有 JSDoc 注释 |

---

## 6. 技术设计

### 6.1 目录结构

```
src/tools/
├── index.ts                 # 统一导出
├── types.ts                 # 类型定义
├── registry.ts              # 工具注册表
├── errors.ts                # 错误类型
├── core/                    # 核心工具
│   ├── init.ts
│   ├── specify.ts
│   ├── status.ts
│   └── roadmap.ts
├── output/                  # Structured Output 工具
│   ├── schema-builder.ts
│   ├── spec-output.ts
│   ├── plan-output.ts
│   └── tasks-output.ts
├── state/                   # 状态相关工具
│   ├── get-state.ts
│   ├── update-state.ts
│   └── validate-state.ts
└── utils/                   # 工具函数
    ├── logger.ts
    ├── validator.ts
    └── formatter.ts
```

### 6.2 类型定义 (`src/tools/types.ts`)

```typescript
// 工具元数据
export interface ToolMetadata {
  name: string;
  description: string;
  version?: string;
  deprecated?: boolean;
}

// 工具参数定义
export interface ToolArgDefinition {
  type: 'string' | 'number' | 'boolean' | 'object';
  description: string;
  required?: boolean;
  default?: unknown;
}

// 工具参数类型
export interface ToolArgs {
  [key: string]: unknown;
}

// 工具执行上下文
export interface ToolContext {
  $: typeof $;
  directory: string;
  client: unknown;
  project?: unknown;
  worktree?: unknown;
}

// 工具执行结果
export interface ToolResult<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    duration: number;
    timestamp: string;
  };
}

// 工具定义
export interface ToolDefinition<TArgs extends ToolArgs = ToolArgs, TResult = string> {
  metadata: ToolMetadata;
  args: Record<keyof TArgs, ToolArgDefinition>;
  execute: (args: TArgs, context: ToolContext) => Promise<TResult>;
}
```

### 6.3 工具注册表 (`src/tools/registry.ts`)

```typescript
import type { ToolDefinition, ToolContext } from './types';

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private interceptors: {
    before: Array<(tool: string, args: unknown) => void>;
    after: Array<(tool: string, result: unknown) => void>;
  } = { before: [], after: [] };

  register(tool: ToolDefinition): void {
    this.tools.set(tool.metadata.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAll(): Map<string, ToolDefinition> {
    return new Map(this.tools);
  }

  addInterceptor(
    type: 'before' | 'after',
    handler: (tool: string, data: unknown) => void
  ): void {
    this.interceptors[type].push(handler);
  }

  async execute(
    name: string,
    args: unknown,
    context: ToolContext
  ): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    // 执行前置拦截器
    for (const handler of this.interceptors.before) {
      handler(name, args);
    }

    // 执行工具
    const result = await tool.execute(args as never, context);

    // 执行后置拦截器
    for (const handler of this.interceptors.after) {
      handler(name, result);
    }

    return result;
  }
}

// 单例实例
export const registry = new ToolRegistry();
```

### 6.4 Structured Output Schema (`src/tools/output/schema-builder.ts`)

```typescript
import type { JSONSchema7 } from 'json-schema';

export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  items?: SchemaField;  // for array
  properties?: Record<string, SchemaField>;  // for object
}

export function buildSchema(
  name: string,
  fields: Record<string, SchemaField>
): JSONSchema7 {
  const schema: JSONSchema7 = {
    type: 'object',
    properties: {},
    required: []
  };

  for (const [key, field] of Object.entries(fields)) {
    if (schema.properties) {
      schema.properties[key] = buildFieldSchema(field);
    }
    if (field.required && schema.required) {
      schema.required.push(key);
    }
  }

  return schema;
}

function buildFieldSchema(field: SchemaField): JSONSchema7 {
  switch (field.type) {
    case 'array':
      return {
        type: 'array',
        items: field.items ? buildFieldSchema(field.items) : {},
        description: field.description
      };
    case 'object':
      return {
        type: 'object',
        properties: field.properties 
          ? Object.fromEntries(
              Object.entries(field.properties).map(([k, v]) => [k, buildFieldSchema(v)])
            )
          : {},
        description: field.description
      };
    default:
      return {
        type: field.type,
        description: field.description
      };
  }
}
```

### 6.5 错误处理 (`src/tools/errors.ts`)

```typescript
export class ToolError extends Error {
  constructor(
    message: string,
    public readonly toolName: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

export class ValidationError extends ToolError {
  constructor(toolName: string, public readonly field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`, toolName, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ExecutionError extends ToolError {
  constructor(
    toolName: string,
    message: string,
    public readonly cause?: Error
  ) {
    super(message, toolName, 'EXECUTION_ERROR');
    this.name = 'ExecutionError';
  }
}

export class NotFoundError extends ToolError {
  constructor(toolName: string, resource: string) {
    super(`${resource} not found`, toolName, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}
```

### 6.6 插件集成 (`src/index.ts` 修改)

```typescript
import { registry } from './tools/registry';
import { registerCoreTools } from './tools/core';
import { registerOutputTools } from './tools/output';
import { registerStateTools } from './tools/state';

export const SDDPlugin = async ({ project, client, $, directory, worktree }) => {
  // 注册所有工具
  registerCoreTools(registry);
  registerOutputTools(registry);
  registerStateTools(registry);

  // 添加日志拦截器
  registry.addInterceptor('after', async (toolName, result) => {
    await client.app.log({
      body: {
        service: 'sdd-plugin',
        level: 'debug',
        message: `Tool executed: ${toolName}`,
        extra: { tool: toolName, result }
      }
    });
  });

  const context = { $, directory, client, project, worktree };

  return {
    "session.created": async (input) => {
      // 初始化
    },

    "file.edited": async (input) => {
      // 文件监听
    },

    // 动态工具导出
    tool: Object.fromEntries(
      Array.from(registry.getAll()).map(([name, tool]) => [
        name,
        {
          description: tool.metadata.description,
          args: tool.args,
          async execute(args) {
            return await registry.execute(name, args, context);
          }
        }
      ])
    )
  };
};
```

---

## 7. 边界情况

| EC-ID | 场景 | 处理方式 |
|-------|------|----------|
| EC-001 | 工具执行超时 | 设置 30s 超时，返回 timeout 错误 |
| EC-002 | 并发调用同一工具 | 使用队列或 Promise.all 处理 |
| EC-003 | 工具依赖文件不存在 | 返回 NotFoundError，提示先运行初始化工具 |
| EC-004 | Schema 验证失败 | 返回 ValidationError，指出具体字段 |
| EC-005 | 插件上下文丢失 | 返回 ExecutionError，建议重新加载插件 |
| EC-006 | 工具注册冲突（同名） | 抛出警告，保留先注册的工具 |
| EC-007 | 结构化输出数据过大 | 限制输出大小 < 1MB，超出则截断 |

---

## 8. 开放问题

| ID | 问题 | 影响 | 解决建议 |
|----|------|------|----------|
| OP-001 | 是否需要支持工具热重载？ | 开发体验 | 后续迭代考虑 |
| OP-002 | Structured Output 的 Schema 存储位置 | 架构设计 | 建议放在 `src/tools/schemas/` |
| OP-003 | 是否需要工具版本管理？ | 兼容性 | 本次不实现，记录 metadata.version |
| OP-004 | 是否支持工具依赖声明？ | 加载顺序 | 后续考虑依赖图 |
| OP-005 | 工具测试结果如何报告？ | 质量保障 | 集成到 CI/CD 流程 |

---

## 9. 相关文件

| 文件 | 说明 |
|------|------|
| `.sdd/.specs/sdd-plugin-phase2/plan.md` | Phase 2 技术规划（参考） |
| `src/index.ts` | 当前插件入口（待重构） |
| `src/tools/types.ts` | 工具类型定义（新建） |
| `src/tools/registry.ts` | 工具注册表（新建） |

---

**文档状态**: specified  
**下一步**: 运行 `@sdd-plan sdd-tools-optimization` 开始技术规划
