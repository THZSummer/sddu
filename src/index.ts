// SDD Plugin for OpenCode
// Specification: https://opencode.ai/docs/plugins/

// 导入 Discovery 工作流引擎（注意: 临时使用相对导入，避免循环依赖）
// 在完整项目设置完成后将使用正式导入
import { DISCOVERY_WORKFLOW, DiscoveryWorkflowEngine } from './discovery/workflow-engine';
import { CoachingLevel, CoachingConfig } from './discovery/types';
import { CoachingModeEngine } from './discovery/coaching-mode';
import { DiscoveryStateValidator } from './discovery/state-validator';
import { AutoUpdater } from './state/auto-updater';
import { StateMachine } from './state/machine';
import { DependencyChecker } from './state/dependency-checker';
import { SddMigrateSchemaCommand } from './commands/sdd-migrate-schema';
import { StateV2_0_0, WorkflowStatus, PhaseHistory, validateState } from './state/schema-v2.0.0';
import { migrateState, MigrationResult } from './state/migrator';

// 全局实例存储，以确保在会话生命周期内保持单例
let globalAutoUpdater: AutoUpdater | null = null;

export const SDDPlugin = async ({ project, client, $, directory, worktree }) => {
  // 初始化状态机和自动更新器
  const stateMachine = new StateMachine(directory + '/specs-tree-root');
  
  // 等待状态加载后再初始化 autoUpdater
  await stateMachine.load();
  const autoUpdater = new AutoUpdater(stateMachine);
  
  // 存储为全局实例，便于后续事件访问
  globalAutoUpdater = autoUpdater;
  
  // 启动时启用自动更新器
  autoUpdater.setEnabled(true);

  // 使用官方日志 API
  await client.app.log({
    body: {
      service: "sdd-plugin",
      level: "info",
      message: "SDD Plugin loaded with Discovery Engine and AutoUpdater",
      extra: {
        directory: directory,
        project: project?.name,
        features: ["spec", "plan", "task", "build", "review", "validate", "discovery", "autoUpdater"]
      }
    }
  });

  return {
    // 监听会话创建
    "session.created": async (input) => {
      await client.app.log({
        body: {
          service: "sdd-plugin",
          level: "debug",
          message: "Session created, initializing SDD state",
          extra: { directory: directory }
        }
      });
      
      // 可以在这里初始化 SDD 状态
      if (globalAutoUpdater) {
        // 会话启动时确保 AutoUpdater 处于活跃状态
        globalAutoUpdater.setEnabled(true);
      }
    },

    // 监听文件编辑
    "file.edited": async (input) => {
      // 追踪规范文件变更
      if (input.filePath.includes("specs-tree-root/")) {
        await client.app.log({
          body: {
            service: "sdd-plugin",
            level: "debug",
            message: "Spec file edited, triggering auto-update check",
            extra: { file: input.filePath }
          }
        });
        
        // 触发自动更新检查
        if (globalAutoUpdater) {
          globalAutoUpdater.triggerAutoUpdate(input.filePath);
        }
      }
    },
    
    // 监听会话空闲事件 (模拟 session.idle)
    "session.idle": async (input) => {
      await client.app.log({
        body: {
          service: "sdd-plugin", 
          level: "debug",
          message: "Session idle detected, running complete scan",
          extra: { timestamp: new Date().toISOString() }
        }
      });
      
      // 如果 autoUpdater 可用，运行完整扫描
      if (globalAutoUpdater) {
        try {
          await globalAutoUpdater.scanAndAutoUpdate();
          await client.app.log({
            body: {
              service: "sdd-plugin",
              level: "debug", 
              message: "Session idle scan completed successfully"
            }
          });
        } catch (error) {
          await client.app.log({
            body: {
              service: "sdd-plugin",
              level: "error",
              message: "Session idle scan failed",
              extra: { error: error instanceof Error ? error.message : String(error) }
            }
          });
        }
      } else {
        await client.app.log({
          body: {
            service: "sdd-plugin",
            level: "warn",
            message: "AutoUpdater not initialized, skipping scan"
          }
        });
      }
    },
    
    // 监听会话结束，清理资源
    "session.end": async (input) => {
      await client.app.log({
        body: {
          service: "sdd-plugin",
          level: "debug",
          message: "Session ending, cleaning up resources",
          extra: { timestamp: new Date().toISOString() }
        }
      });
      
      if (globalAutoUpdater) {
        globalAutoUpdater.dispose();
        globalAutoUpdater = null;
      }
    }
  };
};

// 导出所有公共 API
export {
  // Discovery
  DISCOVERY_WORKFLOW,
  DiscoveryWorkflowEngine,
  CoachingLevel,
  CoachingConfig,
  CoachingModeEngine,
  DiscoveryStateValidator,
  
  // State Management
  AutoUpdater,
  StateMachine,
  DependencyChecker,
  
  // Schema v2.0.0
  StateV2_0_0,
  WorkflowStatus,
  PhaseHistory,
  validateState,
  
  // Migration
  SddMigrateSchemaCommand,
  migrateState,
  MigrationResult
};

export default SDDPlugin;
