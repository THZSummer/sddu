// OpenCode 平台适配 — 插件入口（瘦身：初始化 + 组装）
// 按 ADR-021 拆分：3 状态工具收敛至 tools.ts，4 生命周期 hook 收敛至 hooks.ts
// 本文件只保留「编排」——实例化各组件、注入依赖、返回 tools + hooks 组合对象
// 规则：可 import @opencode-ai/plugin，可 import 所有业务域和 shared/

// State 管理
import {
  StateMachine,
  DependencyChecker,
  ParentStateManager,
  AutoUpdater,
} from '../../state';

import { createStateTools } from './tools';
import { createLifecycleHooks } from './hooks';
import { createDecisionProxy } from './decision-proxy';

export const SDDUPlugin = async ({ project, client, $, directory, worktree, serverUrl }) => {
  // Initialize StateMachine with the new distributed approach
  const stateMachine = new StateMachine(directory + '/.sddu/specs-tree-root');

  // Initialize the dependency checker with updated state machine
  const dependencyChecker = new DependencyChecker(stateMachine, directory + '/.sddu/specs-tree-root');
  stateMachine.setDependencyChecker(dependencyChecker);

  // Initialize ParentStateManager for handling parent feature state updates
  const parentStateManager = new ParentStateManager();

  // Await state loading using distributed approach
  try {
    await stateMachine.load();
  } catch (error) {
    await client.app.log({
      body: {
        service: "sddu-plugin",
        level: "debug",
        message: "No existing states loaded, starting fresh",
        extra: { error: String(error) }
      }
    });
  }

  // Initialize AutoUpdater with the state machine
  const autoUpdater = new AutoUpdater(stateMachine);

  // Enable auto-updater at startup
  autoUpdater.setEnabled(true);

  // Use official logging API
  await client.app.log({
    body: {
      service: "sddu-plugin",
      level: "info",
      message: "SDDU Plugin loaded with Tree Structure Optimization, Discovery Engine and AutoUpdater",
      extra: {
        directory: directory,
        project: project?.name,
        features: ["spec", "plan", "task", "build", "review", "validate", "discovery", "autoUpdater", "tree-structure"]
      }
    }
  });

  // 组装：状态工具 + 生命周期 hook（依赖注入，替代跨模块全局单例）
  // 决策代理层（方案 D：Question 协议层拦截 + 代答，见 ADR-018）
  const decisionProxy = createDecisionProxy({
    client,
    directory,
    serverUrl,
    // 启动诉求由 sddu-auto 启动阶段写入 contextFile，决策时代理层懒加载
    contextFile: directory + '/.sddu/specs-tree-root/auto-context.json',
  });

  return {
    tool: createStateTools({ directory, stateMachine }),
    ...createLifecycleHooks({ client, directory, autoUpdater, stateMachine, parentStateManager }),
    event: decisionProxy.event,
    "chat.message": decisionProxy.chatMessage,
    dispose: decisionProxy.dispose,
  };
};

export default SDDUPlugin;
