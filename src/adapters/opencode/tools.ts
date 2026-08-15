// OpenCode 平台适配 — 状态工具收敛模块
// 按 ADR-021 从 plugin.ts 拆分：收敛 3 个状态工具及其共享辅助函数
// （legacyStatusToPhase / readFeatureState / writeFeatureState）
// 对外 tool 名保持不变：sddu_update_state / sddu_tag_feature / sddu_get_all_states，行为零变化
// 规则：可 import @opencode-ai/plugin，可 import 所有业务域和 shared/
// 依赖注入：directory / stateMachine 由 plugin.ts 传入（ADR-021：依赖传递替代跨模块全局变量）

import { tool } from '@opencode-ai/plugin';

// 业务域 - 通过域级 index.ts 引用（遵守 ADR-006 R-API-02）
import {
  Phase, FeatureStatus, StateV3_0_0,
  VALID_STATUSES,
  validateStateV3,
  SuspendedInfo,
} from '../../state';
import { scanTreeStructure, resolveDisplayContext } from '../../state';

// State 管理
import { StateMachine } from '../../state';

export interface StateToolsDeps {
  directory: string;
  stateMachine: StateMachine;
}

export function createStateTools({ directory, stateMachine }: StateToolsDeps) {
  // v3.0.0: Map legacy status strings to Phase values
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
    'completed':   'validated',
  };

  // Helper: read a single state.json file
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

  // Helper: write a state.json file to a feature path
  async function writeFeatureState(featurePath: string, state: StateV3_0_0): Promise<boolean> {
    const fs = await import('fs/promises');
    const statePath = `${directory}/.sddu/specs-tree-root/${featurePath}/state.json`;
    try {
      await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf8');
      return true;
    } catch (e) { return false; }
  }

  return {
    // Tool 1: Update phase (advance SDDU workflow stage)
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

    // Tool 2: Tag feature
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

        if (!targetStatus || !VALID_STATUSES.includes(targetStatus)) {
          return JSON.stringify({
            success: false,
            error: `Invalid flow status: "${flow_status}". Valid values: ${VALID_STATUSES.join(', ')}`
          });
        }

        const state = await readFeatureState(feature);
        if (!state) {
          return JSON.stringify({
            success: false,
            error: `Feature "${feature}" state.json not found or invalid`
          });
        }

        const currentStatus = state.status as FeatureStatus;
        const irreversible: FeatureStatus[] = ['completed', 'terminated', 'merged'];
        if (irreversible.includes(currentStatus)) {
          return JSON.stringify({
            success: false,
            error: `Feature "${feature}" has irreversible status "${currentStatus}" and cannot be changed`,
            current: currentStatus,
          });
        }

        if (targetStatus === 'merged' && !merged_into) {
          return JSON.stringify({
            success: false,
            error: 'Merged status requires --merged_into (target feature name). Usage: sddu_tag_feature { feature: "...", flow_status: "merged", merged_into: "target" }'
          });
        }

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

        if (targetStatus === 'suspended') {
          const sinfo: SuspendedInfo = {};
          if (suspended_until) sinfo.suspendedUntil = suspended_until;
          if (suspended_note) sinfo.suspendedNote = suspended_note;
          if (sinfo.suspendedUntil || sinfo.suspendedNote) {
            updated.suspended = sinfo;
          }
        }

        if (targetStatus === 'merged' && merged_into) {
          updated.merged = {
            mergedInto: merged_into,
            mergedAt: now,
          };
        }

        if (targetStatus !== 'suspended') delete (updated as any).suspended;
        if (targetStatus !== 'merged') delete (updated as any).merged;

        const ws = await writeFeatureState(feature, updated);
        if (!ws) {
          return JSON.stringify({ success: false, error: `Failed to write state.json for ${feature}` });
        }

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

    // Tool 3: Get all states (for dashboard generation)
    sddu_get_all_states: tool({
      description: 'Retrieve all feature states and tree structure for dashboard generation.',
      args: {},
      async execute(_args, _context) {
        try {
          const fs = await import('fs/promises');
          const specsDir = `${directory}/.sddu/specs-tree-root`;
          const scanResult = await scanTreeStructure(specsDir);

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

          const displayContexts = new Map<string, { effectiveParent: string | null; isIndependent: boolean }>();
          for (const [featurePath] of allStates) {
            const ctx = resolveDisplayContext(featurePath, allStates, scanResult.flatMap);
            displayContexts.set(featurePath, ctx);
          }

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
  };
}
