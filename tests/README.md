# SDDU 测试目录说明

## 目录结构

```
tests/
├── README.md           # 本说明文档
├── unit/               # 单元测试
│   ├── discovery/      # Discovery 模块单元测试
│   │   ├── coaching-mode.test.ts
│   │   ├── state-validator.test.ts
│   │   └── workflow-engine.test.ts
│   ├── compatibility.test.ts
│   ├── state-manager.test.ts
│   └── workspace.test.ts
├── state/              # State 模块集成测试
│   ├── agent-integration.test.ts
│   ├── auto-updater.test.ts
│   ├── auto-updater-integration.test.ts
│   ├── dependency-checker.test.ts
│   ├── migrator-v2.test.ts
│   ├── session-idle-integration.test.ts
│   └── simple-agent-integration.test.ts
├── e2e/                # 端到端测试
│   ├── multi-feature.test.ts
│   └── sddu-workflow.test.ts
├── compatibility/      # 兼容性测试
│   └── legacy.test.ts
├── fixtures/           # 测试夹具/测试数据
└── reports/            # 测试报告
```

## 各子目录用途

| 目录 | 用途 |
|------|------|
| `unit/` | 单元测试，测试单个函数、类或模块 |
| `unit/discovery/` | Discovery 模块相关单元测试 |
| `state/` | State 模块集成测试 |
| `e2e/` | 端到端测试，测试完整工作流程 |
| `compatibility/` | 兼容性测试，确保新旧格式兼容 |
| `fixtures/` | 测试夹具、模拟数据和测试模板 |
| `reports/` | 测试运行报告和输出 |

## 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm test -- --testPathPattern=tests/unit

# 运行 Discovery 模块测试
npm test -- --testPathPattern=tests/unit/discovery

# 运行集成测试
npm test -- --testPathPattern=tests/state

# 运行端到端测试
npm test -- --testPathPattern=tests/e2e

# 生成测试覆盖率报告
npm test -- --coverage
```

## 测试框架

本项目使用 **Jest** 作为测试框架。

### 相关配置

- 测试文件命名：`*.test.ts`
- 测试框架：Jest
- 语言：TypeScript
- 断言库：Jest 内置断言

### 测试文件结构示例

```typescript
import { MyComponent } from '../src/my-component';

describe('MyComponent', () => {
  let component: MyComponent;

  beforeEach(() => {
    component = new MyComponent();
  });

  test('should do something', () => {
    expect(component.doSomething()).toBe('expected');
  });
});
```

## 测试代码规范

1. 所有测试文件使用 `.test.ts` 后缀
2. 测试文件应放置在与其测试的源代码相对应的目录结构中
3. 使用 `describe` 块组织相关测试
4. 使用 `test` 或 `it` 定义单个测试用例
5. 使用有意义的测试用例名称，描述预期行为
6. 每个测试应独立，不依赖其他测试的状态
