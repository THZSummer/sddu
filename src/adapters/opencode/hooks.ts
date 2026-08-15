// OpenCode 平台适配 — 生命周期 hook 收敛模块
// 按 ADR-021 从 plugin.ts 拆分：收敛 4 个生命周期 hook
// （session.created / file.edited / session.idle / session.end），行为零变化
// 全局单例（autoUpdater / stateMachine）由 plugin.ts 持有并注入（ADR-021：依赖传递替代跨模块全局变量）
// 规则：可 import @opencode-ai/plugin，可 import 所有业务域和 shared/

// State 管理
import {
  StateMachine,
  StateLoader,
  ParentStateManager,
  AutoUpdater,
} from '../../state';

export interface LifecycleHooksDeps {
  client: any;
  directory: string;
  autoUpdater: AutoUpdater;
  stateMachine: StateMachine;
  parentStateManager: ParentStateManager;
}

export function createLifecycleHooks({
  client,
  directory,
  autoUpdater,
  stateMachine,
  parentStateManager,
}: LifecycleHooksDeps) {
  return {
    // Listen for session creation
    "session.created": async (input) => {
      await client.app.log({
        body: {
          service: "sddu-plugin",
          level: "debug",
          message: "Session created, initializing SDDU state",
          extra: { directory: directory }
        }
      });

      if (autoUpdater && stateMachine) {
        autoUpdater.setEnabled(true);
      }
    },

    // Listen for file edits
    "file.edited": async (input) => {
      if (input.filePath.includes(".sddu/specs-tree") || input.filePath.includes("specs-tree")) {
        await client.app.log({
          body: {
            service: "sddu-plugin",
            level: "debug",
            message: "Spec file edited, triggering auto-update check",
            extra: { file: input.filePath }
          }
        });

        if (autoUpdater) {
          autoUpdater.triggerAutoUpdate(input.filePath);
        }

        if (stateMachine) {
          try {
            const featureDir = input.filePath.substring(0, input.filePath.lastIndexOf('/'));
            const isParentFeature = await stateMachine.isParentFeature(featureDir);
            if (isParentFeature) {
              await client.app.log({
                body: {
                  service: "sddu-plugin",
                  level: "debug",
                  message: "Detected change in parent feature, considering parent state update",
                  extra: { featureDir: featureDir }
                }
              });
            }
          } catch (error) {
            console.log('Info: Error checking parent state for file:', input.filePath);
          }
        }
      }
    },

    // Listen for session idle events
    "session.idle": async (input) => {
      await client.app.log({
        body: {
          service: "sddu-plugin",
          level: "debug",
          message: "Session idle detected, running complete scan",
          extra: { timestamp: new Date().toISOString() }
        }
      });

      if (autoUpdater) {
        try {
          await autoUpdater.scanAndAutoUpdate();

          if (stateMachine && parentStateManager) {
            const allFeatures = await stateMachine.getAllFeatures();
            for (const feature of allFeatures) {
              try {
                const isParent = await stateMachine.isParentFeature(feature.id);
                if (isParent) {
                  await client.app.log({
                    body: {
                      service: "sddu-plugin",
                      level: "debug",
                      message: `Updating parent feature state for: ${feature.id}`
                    }
                  });

                  await parentStateManager.scanAndUpdateParentState(feature.id,
                    new StateLoader(directory + '/.sddu/specs-tree-root'));
                }
              } catch (error) {
                await client.app.log({
                  body: {
                    service: "sddu-plugin",
                    level: "warn",
                    message: `Error checking parent state for: ${feature.id}`,
                    extra: { error: String(error) }
                  }
                });
              }
            }
          }

          await client.app.log({
            body: {
              service: "sddu-plugin",
              level: "debug",
              message: "Session idle scan completed successfully"
            }
          });
        } catch (error) {
          await client.app.log({
            body: {
              service: "sddu-plugin",
              level: "error",
              message: "Session idle scan failed",
              extra: { error: error instanceof Error ? error.message : String(error) }
            }
          });
        }
      } else {
        await client.app.log({
          body: {
            service: "sddu-plugin",
            level: "warn",
            message: "AutoUpdater not initialized, skipping scan"
          }
        });
      }
    },

    // Listen for session end, clean up resources
    "session.end": async (input) => {
      await client.app.log({
        body: {
          service: "sddu-plugin",
          level: "debug",
          message: "Session ending, cleaning up resources",
          extra: { timestamp: new Date().toISOString() }
        }
      });

      if (autoUpdater) {
        autoUpdater.dispose();
      }
    }
  };
}
