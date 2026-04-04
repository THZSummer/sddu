// SDD Plugin for OpenCode
// Specification: https://opencode.ai/docs/plugins/

// 导入 Discovery 工作流引擎（注意: 临时使用相对导入，避免循环依赖）
// 在完整项目设置完成后将使用正式导入
import { DISCOVERY_WORKFLOW, DiscoveryWorkflowEngine } from './discovery/workflow-engine';
import { CoachingLevel, CoachingConfig } from './discovery/types';
import { CoachingModeEngine } from './discovery/coaching-mode';
import { DiscoveryStateValidator } from './discovery/state-validator';

export const SDDPlugin = async ({ project, client, $, directory, worktree }) => {
  // 使用官方日志 API
  await client.app.log({
    body: {
      service: "sdd-plugin",
      level: "info",
      message: "SDD Plugin loaded with Discovery Engine",
      extra: {
        directory: directory,
        project: project?.name,
        features: ["spec", "plan", "task", "build", "review", "validate", "discovery"]
      }
    }
  });

  return {
    // 监听会话创建
    "session.created": async (input) => {
      // 可以在这里初始化 SDD 状态
    },

    // 监听文件编辑
    "file.edited": async (input) => {
      // 追踪规范文件变更
      if (input.filePath.includes("specs-tree-root/")) {
        await client.app.log({
          body: {
            service: "sdd-plugin",
            level: "debug",
            message: "Spec file edited",
            extra: { file: input.filePath }
          }
        });
      }
    }
  };
};

// 导出 Discovery 相关类型和类，以便其他模块可以使用
export {
  DISCOVERY_WORKFLOW,
  DiscoveryWorkflowEngine,
  CoachingLevel,
  CoachingConfig,
  CoachingModeEngine,
  DiscoveryStateValidator
};

export default SDDPlugin;
