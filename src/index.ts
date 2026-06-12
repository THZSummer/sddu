// SDDU Plugin for OpenCode
// Specification: https://opencode.ai/docs/plugins/

import { 
  Phase, FeatureStatus, StateV3_0_0, 
  VALID_PHASES, VALID_STATUSES, 
  validateStateV3,
  SuspendedInfo, MergedInfo,
} from './state/schema-v3.0.0';
import { scanTreeStructure, resolveDisplayContext, FeatureTreeNode } from './state/tree-scanner';
import { ConsistencyChecker, ConsistencyAnomaly } from './state/consistency-checker';

// 统一导入使用新的类型定义系统
import { tool } from '@opencode-ai/plugin';
import { 
  // Discovery 相关类型和类
  DiscoveryWorkflowEngine,
  CoachingLevel,
  CoachingConfig,
  CoachingModeEngine,
  DiscoveryStateValidator,
  DISCOVERY_WORKFLOW,
  DiscoveryConfig,
} from './discovery/workflow-engine';

// 重新导入状态相关类型和类
import { 
  // 状态管理相关类和接口
  StateMachine,
  DependencyChecker,
  StateLoader,
  FeatureStateEnum,
  FeatureState,
  TransitionResult,
  HistoryEntry,
  FeatureWithFullHistory,
} from './state/machine';

// Import Tree related functionality
import { ParentStateManager } from './state/parent-state-manager';
import { TreeStateValidator } from './state/tree-state-validator';

// 导入 AutoUpdater 
import { AutoUpdater } from './state/auto-updater';

import { 
  // 迁移相关类和类型
  migrateState,
  MigrationResult,
} from './state/migrator';

// 从命令模块导入
import { SdduMigrateSchemaCommand } from './commands/sddu-migrate-schema';

import { StateV2_0_0, StateV2_1_0 } from './state/schema-v2.0.0';

// 全局实例存储，以确保在会话生命周期内保持单例
let globalAutoUpdater: AutoUpdater | null = null;
let globalStateMachine: StateMachine | null = null;

export const SDDUPlugin = async ({ project, client, $, directory, worktree }) => {
  // Initialize StateMachine with the new distributed approach
  const stateMachine = new StateMachine(directory + '/.sddu/specs-tree-root');  // Updated to .sddu path for new structure
   
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
  
  // Store as global instances for subsequent event access
  globalAutoUpdater = autoUpdater;
  globalStateMachine = stateMachine;
  
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

  // v3.0.0: Map legacy status strings to Phase values
  // This map converts user-friendly agent status names to valid Phase values.
  const legacyStatusToPhase: Record<string, Phase> = {
    'discovered':  'discovered',
    'discovery':   'discovered',
    'specified':   'specified',
    'spec':        'specified',
    'planned':     'planned',
    'plan':        'planned',
    'tasked':      'tasked',
    'tasks':       'tasked',
    'builded':     'builded',
    'building':    'builded',
    'implementing':'builded',
    'build':       'builded',
    'reviewed':    'reviewed',
    'review':      'reviewed',
    'validated':   'validated',
    'validate':    'validated',
    'completed':   'validated',  // Legacy: 'completed' targets validated phase
  };

  // ==========================================================================
  // Helper: read a single state.json file
  // ==========================================================================
  async function readFeatureState(featurePath: string): Promise<StateV3_0_0 | null> {
    const fs = await import('fs/promises');
    const statePath = `${directory}/.sddu/specs-tree-root/${featurePath}/state.json`;
    try {
      const raw = await fs.readFile(statePath, 'utf8');
      const data = JSON.parse(raw);
      if (validateStateV3(data)) return data as StateV3_0_0;
      return null;
    } catch { return null; }
  }

  // ==========================================================================
  // Helper: write a state.json file to a feature path
  // ==========================================================================
  async function writeFeatureState(featurePath: string, state: StateV3_0_0): Promise<boolean> {
    const fs = await import('fs/promises');
    const statePath = `${directory}/.sddu/specs-tree-root/${featurePath}/state.json`;
    try {
      await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf8');
      return true;
    } catch (e) { return false; }
  }

  return {
    tool: {
      // -----------------------------------------------------------------------
      // Tool 1: Update phase (advance SDDU workflow stage)
      // -----------------------------------------------------------------------
      sddu_update_state: tool({
        description: 'Advance the SDDU phase of a feature (e.g. specified→planned→tasked→builded).',
        args: {
          feature: tool.schema.string().describe('Feature path (e.g. specs-tree-myfeature)'),
          phase: tool.schema.string().optional().describe('Target phase (v3.0.0): discovered, specified, planned, tasked, builded, reviewed, validated'),
          status: tool.schema.string().optional().describe('(deprecated) Use "phase" instead. Same values.'),
          comment: tool.schema.string().optional(),
          data: tool.schema.object({}).passthrough().optional(),
        },
        async execute(args, context) {
          const { feature, phase, status: rawStatus, comment, data } = args;
          const inputStatus = (phase || rawStatus || '').toLowerCase().trim();
          const targetPhase = legacyStatusToPhase[inputStatus];

          if (!targetPhase) {
            return JSON.stringify({ 
              success: false, 
              error: `Invalid phase: "${rawStatus}". Valid values: discovered, specified, planned, tasked, builded, reviewed, validated` 
            });
          }

          try {
            const result = await stateMachine.updateState(
              feature,
              targetPhase,
              data || {},
              context.agent || 'sddu_update_state',
              comment || `Updated to ${targetPhase}`
            );
            return JSON.stringify({
              success: true,
              feature: result.feature,
              phase: result.phase,
              status: result.status,
              message: `Phase advanced to ${targetPhase} (status: ${result.status})`
            });
          } catch (error: any) {
            return JSON.stringify({ success: false, error: error.message });
          }
        }
      }),

      // -----------------------------------------------------------------------
      // Tool 2: Tag feature — set flow status (suspended / terminated / merged / tracked)
      // -----------------------------------------------------------------------
      sddu_tag_feature: tool({
        description: 'Tag a feature with a flow status: suspended, terminated, merged (into target), or tracked (resume).',
        args: {
          feature: tool.schema.string().describe('Feature path (e.g. specs-tree-myfeature)'),
          flow_status: tool.schema.string().describe('Target flow status: suspended, terminated, merged, tracked'),
          suspended_until: tool.schema.string().optional().describe('ISO date for suspended expiry reminder (YYYY-MM-DD)'),
          suspended_note: tool.schema.string().optional().describe('Reason for suspension'),
          merged_into: tool.schema.string().optional().describe('Target feature name for merged status (required when flow_status=merged)'),
          comment: tool.schema.string().optional(),
        },
        async execute(args, context) {
          const { feature, flow_status, suspended_until, suspended_note, merged_into, comment } = args;
          const targetStatus = flow_status?.toLowerCase().trim() as FeatureStatus;

          // Validate flow status
          if (!targetStatus || !VALID_STATUSES.includes(targetStatus)) {
            return JSON.stringify({
              success: false,
              error: `Invalid flow status: "${flow_status}". Valid values: ${VALID_STATUSES.join(', ')}`
            });
          }

          // Read current state
          const state = await readFeatureState(feature);
          if (!state) {
            return JSON.stringify({
              success: false,
              error: `Feature "${feature}" state.json not found or invalid`
            });
          }

          // Validate transition
          const currentStatus = state.status as FeatureStatus;

          // completed / terminated / merged are irreversible
          const irreversible: FeatureStatus[] = ['completed', 'terminated', 'merged'];
          if (irreversible.includes(currentStatus)) {
            return JSON.stringify({
              success: false,
              error: `Feature "${feature}" has irreversible status "${currentStatus}" and cannot be changed`,
              current: currentStatus,
            });
          }

          // merged requires merged_into
          if (targetStatus === 'merged' && !merged_into) {
            return JSON.stringify({
              success: false,
              error: 'Merged status requires --merged_into (target feature name). Usage: sddu_tag_feature { feature: "...", flow_status: "merged", merged_into: "target" }'
            });
          }

          // Build updated state
          const now = new Date().toISOString();
          const updated: StateV3_0_0 = {
            ...state,
            status: targetStatus,
            history: [
              ...(state.history || []),
              {
                timestamp: now,
                from: currentStatus,
                to: targetStatus,
                triggeredBy: context.agent || 'sddu_tag_feature',
                comment: comment || `Tagged as ${targetStatus}`,
              },
            ],
          };

          // Add suspended metadata
          if (targetStatus === 'suspended') {
            const sinfo: SuspendedInfo = {};
            if (suspended_until) sinfo.suspendedUntil = suspended_until;
            if (suspended_note) sinfo.suspendedNote = suspended_note;
            if (sinfo.suspendedUntil || sinfo.suspendedNote) {
              updated.suspended = sinfo;
            }
          }

          // Add merged metadata
          if (targetStatus === 'merged' && merged_into) {
            updated.merged = {
              mergedInto: merged_into,
              mergedAt: now,
            };
          }

          // Clean up old metadata on status change
          if (targetStatus !== 'suspended') delete (updated as any).suspended;
          if (targetStatus !== 'merged') delete (updated as any).merged;

          // Write updated state
          const ws = await writeFeatureState(feature, updated);
          if (!ws) {
            return JSON.stringify({ success: false, error: `Failed to write state.json for ${feature}` });
          }

          // Also update root state.json if it references this feature
          try {
            const fs = await import('fs/promises');
            const rootStatePath = `${directory}/.sddu/specs-tree-root/state.json`;
            const rootRaw = await fs.readFile(rootStatePath, 'utf8');
            const rootState = JSON.parse(rootRaw);
            if (rootState.features && Array.isArray(rootState.features)) {
              const idx = rootState.features.findIndex((f: any) => 
                f.path === feature || f.feature === feature || f.id === feature
              );
              if (idx >= 0) {
                rootState.features[idx].status = targetStatus;
                if (targetStatus === 'merged' && merged_into) {
                  rootState.features[idx].mergedInto = merged_into;
                }
                rootState.updatedAt = now;
                await fs.writeFile(rootStatePath, JSON.stringify(rootState, null, 2), 'utf8');
              }
            }
          } catch { /* root state.json sync is best-effort */ }

          return JSON.stringify({
            success: true,
            feature: updated.feature,
            phase: updated.phase,
            status: targetStatus,
            previous_status: currentStatus,
            message: `Feature "${feature}" tagged as "${targetStatus}"${targetStatus === 'merged' ? ' → ' + merged_into : ''}`,
          });
        }
      }),

      // -----------------------------------------------------------------------
      // Tool 3: Get all states (for dashboard generation)
      // -----------------------------------------------------------------------
      sddu_get_all_states: tool({
        description: 'Retrieve all feature states and tree structure for dashboard generation.',
        args: {},
        async execute(_args, _context) {
          try {
            const fs = await import('fs/promises');
            const specsDir = `${directory}/.sddu/specs-tree-root`;
            const scanResult = await scanTreeStructure(specsDir);

            // Load all states
            const allStates = new Map<string, StateV3_0_0>();
            const anomalies: Array<{ type: string; path: string; detail: string }> = [];

            for (const [featurePath, node] of scanResult.flatMap) {
              const statePath = `${specsDir}/${featurePath}/state.json`;
              try {
                const raw = await fs.readFile(statePath, 'utf8');
                const data = JSON.parse(raw);
                if (validateStateV3(data)) {
                  allStates.set(featurePath, data as StateV3_0_0);
                } else {
                  anomalies.push({
                    type: 'invalid_state_schema',
                    path: featurePath,
                    detail: 'state.json exists but fails v3.0.0 validation',
                  });
                  // Try to provide partial data for display
                  allStates.set(featurePath, data as any);
                }
              } catch {
                anomalies.push({
                  type: 'missing_state_json',
                  path: featurePath,
                  detail: 'Feature directory exists but no valid state.json',
                });
              }
            }

            // Resolve display contexts (FR-004: child-belongs-to-parent)
            const displayContexts = new Map<string, { effectiveParent: string | null; isIndependent: boolean }>();
            for (const [featurePath] of allStates) {
              const ctx = resolveDisplayContext(featurePath, allStates, scanResult.flatMap);
              displayContexts.set(featurePath, ctx);
            }

            // Build dashboard data
            const features = Array.from(allStates.entries()).map(([path, state]) => {
              const ctx = displayContexts.get(path);
              return {
                path,
                feature: state.feature || path,
                name: state.name || state.feature || path,
                phase: state.phase || 'unknown',
                status: state.status || 'unknown',
                depth: state.depth || 0,
                childrens: state.childrens || [],
                suspended: state.suspended || null,
                merged: state.merged || null,
                files: state.files || {},
                phaseHistory: state.phaseHistory || [],
                display: {
                  effectiveParent: ctx?.effectiveParent || null,
                  isIndependent: ctx?.isIndependent ?? true,
                },
              };
            });

            // Categorize
            const active = features.filter(f => f.status === 'tracked' && f.phase !== 'validated');
            const completed = features.filter(f => f.status === 'completed' || (f.phase === 'validated' && f.status === 'tracked'));
            const suspended = features.filter(f => f.status === 'suspended');
            const terminated = features.filter(f => f.status === 'terminated');
            const merged = features.filter(f => f.status === 'merged');
            const errorFeatures = features.filter(f => f.phase === 'unknown' || f.status === 'unknown');

            return JSON.stringify({
              success: true,
              summary: {
                total: features.length,
                active: active.length,
                completed: completed.length,
                suspended: suspended.length,
                terminated: terminated.length,
                merged: merged.length,
                anomalies: anomalies.length + errorFeatures.length,
              },
              categories: {
                active,
                completed,
                suspended,
                terminated,
                merged,
              },
              anomalies,
              error_features: errorFeatures,
              tree_nodes: scanResult.nodes.map(n => ({
                id: n.id,
                path: n.path,
                featureName: n.featureName,
                level: n.level,
                children: n.children.map(c => ({ id: c.id, path: c.path })),
              })),
            });
          } catch (error: any) {
            return JSON.stringify({ success: false, error: error.message });
          }
        }
      }),
    },
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
      
      // Initialize SDDU state
      if (globalAutoUpdater && globalStateMachine) {
        // Ensure AutoUpdater is active when session starts
        globalAutoUpdater.setEnabled(true);
      }
    },

    // Listen for file edits
    "file.edited": async (input) => {
      // Track spec file changes in both old and new structure paths
      if (input.filePath.includes(".sddu/specs-tree") || input.filePath.includes("specs-tree")) {
        await client.app.log({
          body: {
            service: "sddu-plugin",
            level: "debug",
            message: "Spec file edited, triggering auto-update check",
            extra: { file: input.filePath }
          }
        });
        
        // Trigger auto-update check
        if (globalAutoUpdater) {
          globalAutoUpdater.triggerAutoUpdate(input.filePath);
        }
        
        // Check if this is a parent feature being edited and update accordingly
        if (globalStateMachine) {
          // Determine if the file belongs to a potential parent node
          try {
            const featureDir = input.filePath.substring(0, input.filePath.lastIndexOf('/'));
            const isParentFeature = await globalStateMachine.isParentFeature(featureDir);
            if (isParentFeature) {
              // If it's a parent feature, potentially update the aggregated state in parent feature
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
            // Safe to ignore - may be just checking features in process
            console.log('Info: Error checking parent state for file:', input.filePath);
          }
        }
      }
    },
    
    // Listen for session idle events (simulated session.idle)
    "session.idle": async (input) => {
      await client.app.log({
        body: {
          service: "sddu-plugin", 
          level: "debug",
          message: "Session idle detected, running complete scan",
          extra: { timestamp: new Date().toISOString() }
        }
      });
      
      // If autoUpdater is available, run full scan
      if (globalAutoUpdater) {
        try {
          await globalAutoUpdater.scanAndAutoUpdate();
          
          // For tree structure - if there are parent features, update their children information
          if (globalStateMachine && parentStateManager) {
            // Scan for any updated parent features and update their aggregated state
            const allFeatures = await globalStateMachine.getAllFeatures();
            for (const feature of allFeatures) {
              try {
                // Only run the parent state update for parent features, not individual leaf features
                const isParent = await globalStateMachine.isParentFeature(feature.id);
                if (isParent) {
                  await client.app.log({
                    body: {
                      service: "sddu-plugin", 
                      level: "debug",
                      message: `Updating parent feature state for: ${feature.id}`
                    }
                  });
                  
                  // Update parent state with current children information
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
      
      if (globalAutoUpdater) {
        globalAutoUpdater.dispose();
        globalAutoUpdater = null;
      }
      
      globalStateMachine = null;
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
  DiscoveryConfig,
  
  // State Management
  AutoUpdater,
  StateMachine,
  DependencyChecker,
  StateLoader,         // New export for distributed state
  ParentStateManager,  // New export for parent feature management
  TreeStateValidator,  // New export for tree state validation
  
  // Schema (v2.x — legacy, deprecated)
  StateV2_0_0,
  StateV2_1_0,
  
  // Types (backward-compatible)
  FeatureStateEnum,
  FeatureState,
  TransitionResult,
  HistoryEntry,
  FeatureWithFullHistory,
  
  // Migration  
  SdduMigrateSchemaCommand,
  migrateState,
  MigrationResult,
};

export default SDDUPlugin;
