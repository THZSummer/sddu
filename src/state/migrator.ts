import fs from 'fs/promises';
import path from 'path';
import {
  StateV3_0_0,
  Phase,
  FeatureStatus,
  PhaseHistoryEntry,
  VALID_PHASES,
  VALID_STATUSES,
} from './schema-v3.0.0';

/**
 * 迁移结果接口定义
 */
export interface MigrationResult {
  success: boolean;
  backupPath?: string;
  migratedToVersion?: string;
  error?: string;
}

// ============================================================================
// Version detection
// ============================================================================

/**
 * 检测状态版本，判断是否需要迁移。
 * Target version: v3.0.0
 */
function needsMigration(state: any): boolean {
  const version = state.version;
  if (!version) return true;

  // Already v3.0.0 — no migration needed
  if (version === 'v3.0.0') return false;

  // v2.x or v1.x — needs migration to v3.0.0
  return true;
}

// ============================================================================
// Legacy v1.x → v2.0.0 migration (preserved from original)
// ============================================================================

type WorkflowStatusV2 = 'specified' | 'planned' | 'tasked' | 'building' | 'reviewed' | 'validated';

interface PhaseHistoryV2 {
  phase: number;
  status: WorkflowStatusV2;
  timestamp: string;
  triggeredBy: string;
  comment?: string;
}

/**
 * 从 v1.2.5/v1.2.11 版本迁移状态到 v2.0.0 版本
 */
export function migrateToV2(oldState: any): any {
  const now = new Date().toISOString();

  const workflowStatusMap: Record<string, WorkflowStatusV2> = {
    'specified': 'specified',
    'planned': 'planned',
    'tasked': 'tasked',
    'implementing': 'building',
    'reviewed': 'reviewed',
    'validated': 'validated',
    'completed': 'validated',
    'drafting': 'specified',
    'discovered': 'specified',
  };

  const status = workflowStatusMap[oldState.status] || 'specified';
  const phase = statusToPhaseV2(status);

  const phaseHistory: PhaseHistoryV2[] = [];
  if (oldState.phaseHistory && Array.isArray(oldState.phaseHistory)) {
    phaseHistory.push(...oldState.phaseHistory);
  } else if (oldState.history && Array.isArray(oldState.history)) {
    for (const h of oldState.history) {
      if (h.phase && h.status) {
        phaseHistory.push({
          phase: h.phase,
          status: h.status,
          timestamp: h.timestamp || now,
          triggeredBy: h.triggeredBy || 'unknown',
          comment: h.comment,
        });
      }
    }
  }

  if (phaseHistory.length === 0) {
    phaseHistory.push({
      phase,
      status,
      timestamp: oldState.createdAt || now,
      triggeredBy: 'migration',
      comment: 'Migrated to v2.0.0',
    });
  }

  return {
    feature: oldState.feature || oldState.id || 'unknown',
    name: oldState.name || oldState.feature || 'Unknown Feature',
    version: '2.0.0',
    status,
    phase,
    phaseHistory,
    files: {
      spec: oldState.files?.spec || 'spec.md',
      plan: oldState.files?.plan || undefined,
      tasks: oldState.files?.tasks || undefined,
      readme: oldState.files?.readme || undefined,
      review: oldState.files?.review || undefined,
      validation: oldState.files?.validation || undefined,
    },
    dependencies: {
      on: oldState.dependencies?.on || [],
      blocking: oldState.dependencies?.blocking || [],
    },
    metadata: {
      priority: oldState.metadata?.priority || oldState.priority,
      featureId: oldState.feature || oldState.id,
      createdAt: oldState.createdAt || now,
      updatedAt: now,
    },
    history: oldState.history || [],
  };
}

function statusToPhaseV2(status: WorkflowStatusV2): number {
  const phaseMap: Record<WorkflowStatusV2, number> = {
    'specified': 1,
    'planned': 2,
    'tasked': 3,
    'building': 4,
    'reviewed': 5,
    'validated': 6,
  };
  return phaseMap[status] || 1;
}

// ============================================================================
// New: v2.x → v3.0.0 migration
// ============================================================================

/**
 * Map old v2.x phase number (0-6) to new v3.0.0 Phase string.
 */
function mapOldPhaseToV3(oldPhase: number): Phase {
  const map: Record<number, Phase> = {
    0: 'registered',
    1: 'specified',
    2: 'planned',
    3: 'tasked',
    4: 'builded',
    5: 'reviewed',
    6: 'validated',
  };
  return map[oldPhase] || 'registered';
}

/**
 * Map old v2.x WorkflowStatus string to new v3.0.0 FeatureStatus.
 * Old v2.x statuses were stage-oriented, not flow-oriented.
 * They map to 'tracked' by default (the normal flow state).
 *
 * Exception: if the old state had status='validated', we can infer 'completed'
 * only if we're sure it was actually completed.
 */
function mapOldStatusToV3(oldStatus: string): FeatureStatus {
  // If the old "status" field was actually a flow state (suspended/terminated/merged)
  // from a v3.x-style state, preserve it directly.
  if (VALID_STATUSES.includes(oldStatus as FeatureStatus)) {
    return oldStatus as FeatureStatus;
  }
  return 'tracked';
}

/**
 * Extract phase value from an old state object.
 * The old schema used either `status` (for stage) or `state` (for phase).
 * We need to find the actual stage indicator.
 */
function extractPhaseFromOldState(oldState: any): number {
  // Try the explicit phase field (v2.x)
  if (typeof oldState.phase === 'number') return oldState.phase;

  // Try inferring from old status/state field
  if (typeof oldState.status === 'string') {
    const map: Record<string, number> = {
      'drafting': 0,
      'registered': 0,
      'discovered': 0,
      'specified': 1,
      'planned': 2,
      'tasked': 3,
      'building': 4,
      'implementing': 4,
      'reviewed': 5,
      'validated': 6,
      'completed': 6,
    };
    if (map[oldState.status] !== undefined) return map[oldState.status];
  }
  if (typeof oldState.state === 'string') {
    const map: Record<string, number> = {
      'registered': 0,
      'discovered': 0,
      'specified': 1,
      'planned': 2,
      'tasked': 3,
      'builded': 4,
      'building': 4,
      'reviewed': 5,
      'validated': 6,
      'completed': 6,
      'terminated': 6,
      'suspended': 6,
      'merged': 6,
    };
    if (map[oldState.state] !== undefined) return map[oldState.state];
  }
  return 1; // Default to specified
}

/**
 * Try to detect if the old state had a non-tracked flow status.
 * The old schema didn't have flow statuses, so by default everything was "in flow".
 * However, in transitional states, some features might have had a `state` field
 * with values like 'suspended', 'terminated', or 'merged'.
 */
function extractFlowStatusFromOldState(oldState: any): FeatureStatus {
  // If the old state's `state` field was a flow status (not a phase)
  const flowValues = ['suspended', 'terminated', 'merged'];
  if (typeof oldState.state === 'string' && flowValues.includes(oldState.state)) {
    // This was a mixed-format state. The `state` field was a flow status.
    return oldState.state as FeatureStatus;
  }

  // Check if there's a separate `status` field that contains a flow status
  if (typeof oldState.status === 'string') {
    if (VALID_STATUSES.includes(oldState.status as FeatureStatus)) {
      return oldState.status as FeatureStatus;
    }
  }

  return 'tracked';
}

/**
 * Migrate from v2.x (or any unknown/legacy format) to v3.0.0.
 *
 * Migration logic:
 *   1. Old `state`/`status` field → infer new `phase` (Phase string)
 *   2. Old `status` field (if flow-oriented) → new `status` (FeatureStatus), default 'tracked'
 *   3. Convert PhaseHistory[] → PhaseHistoryEntry[]
 */
export function migrateToV3(oldState: any): StateV3_0_0 {
  const now = new Date().toISOString();
  const featureId = oldState.feature || oldState.id || 'unknown';

  // Infer phase
  const oldPhaseNum = extractPhaseFromOldState(oldState);
  const newPhase: Phase = mapOldPhaseToV3(oldPhaseNum);

  // Infer status
  const newStatus: FeatureStatus = extractFlowStatusFromOldState(oldState);

  // Convert phase history
  const newPhaseHistory: PhaseHistoryEntry[] = [];
  if (oldState.phaseHistory && Array.isArray(oldState.phaseHistory)) {
    for (const h of oldState.phaseHistory) {
      newPhaseHistory.push({
        phase:
          typeof h.phase === 'number'
            ? mapOldPhaseToV3(h.phase)
            : VALID_PHASES.includes(h.phase as Phase)
              ? (h.phase as Phase)
              : newPhase,
        timestamp: h.timestamp || now,
        triggeredBy: h.triggeredBy || 'migration',
        comment: h.comment,
      });
    }
  } else if (oldState.history && Array.isArray(oldState.history)) {
    for (const h of oldState.history) {
      newPhaseHistory.push({
        phase: newPhase,
        timestamp: h.timestamp || now,
        triggeredBy: h.triggeredBy || 'migration',
        comment: 'Migrated from legacy history',
      });
    }
  }

  if (newPhaseHistory.length === 0) {
    newPhaseHistory.push({
      phase: newPhase,
      timestamp: oldState.metadata?.createdAt || oldState.createdAt || now,
      triggeredBy: 'migration',
      comment: 'Migrated to v3.0.0',
    });
  }

  // Build v3.0.0 state
  const result: StateV3_0_0 = {
    feature: featureId,
    name: oldState.name || featureId || undefined,
    version: 'v3.0.0',
    phase: newPhase,
    status: newStatus,

    // Suspended/Merged metadata — preserve if present
    ...(newStatus === 'suspended' && oldState.suspended
      ? {
          suspended: {
            suspendedUntil: oldState.suspended.suspendedUntil,
            suspendedNote: oldState.suspended.suspendedNote,
          },
        }
      : newStatus === 'merged' && oldState.merged
        ? {
            merged: {
              mergedInto: oldState.merged.mergedInto || 'unknown',
              mergedAt: oldState.merged.mergedAt || now,
            },
          }
        : {}),

    depth: typeof oldState.depth === 'number' ? oldState.depth : 1,
    childrens: oldState.childrens || [],
    phaseHistory: newPhaseHistory,
    dependencies: {
      on: oldState.dependencies?.on || [],
      blocking: oldState.dependencies?.blocking || [],
    },
    files: {
      spec: oldState.files?.spec || 'spec.md',
      plan: oldState.files?.plan,
      tasks: oldState.files?.tasks,
      readme: oldState.files?.readme,
      review: oldState.files?.review,
      validation: oldState.files?.validation,
      discovery: oldState.files?.discovery,
    },
    metadata: {
      priority: oldState.metadata?.priority || oldState.priority,
      featureId: oldState.feature || oldState.id,
      createdAt: oldState.metadata?.createdAt || oldState.createdAt || now,
      updatedAt: now,
    },
    history: oldState.history || [],
  };

  return result;
}

// ============================================================================
// Backup functions (unchanged from original)
// ============================================================================

/**
 * 创建状态迁移备份
 */
export async function backupState(
  state: any,
  featureId: string,
  specsDir: string
): Promise<string> {
  const backupDir = path.join(specsDir, '.state.backup');
  await fs.mkdir(backupDir, { recursive: true });

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
    .substring(0, 15);
  const backupFilename = `state-${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFilename);

  await fs.writeFile(backupPath, JSON.stringify(state, null, 2));

  console.log(`📊 状态备份已创建: ${backupPath}`);
  return backupPath;
}

/**
 * 将状态回滚到备份文件
 */
export async function rollbackState(
  featureId: string,
  specsDir: string,
  backupPath?: string
): Promise<any> {
  let backupToUse = backupPath;

  if (!backupToUse) {
    const backupDir = path.join(specsDir, '.state.backup');
    try {
      const files = await fs.readdir(backupDir);
      const jsonFiles = files
        .filter((f) => f.startsWith('state-') && f.endsWith('.json'))
        .sort()
        .reverse();

      if (jsonFiles.length > 0) {
        backupToUse = path.join(backupDir, jsonFiles[0]);
        console.log(`🔄 使用最新备份进行回滚: ${backupToUse}`);
      } else {
        throw new Error('未找到任何备份文件');
      }
    } catch {
      throw new Error(`无法回滚: 未找到备份目录 ${backupDir}`);
    }
  } else {
    console.log(`🔄 使用指定备份进行回滚: ${backupToUse}`);
  }

  try {
    await fs.access(backupToUse);
  } catch {
    throw new Error(`备份文件不存在: ${backupToUse}`);
  }

  const backupContent = await fs.readFile(backupToUse, 'utf-8');
  const restoredState = JSON.parse(backupContent);

  console.log('✅ 状态已成功回滚至备份');
  return restoredState;
}

// ============================================================================
// Main migration entry point
// ============================================================================

/**
 * 执行状态迁移。
 * Target: v3.0.0
 *
 * This now routes old states through the appropriate migration path:
 *   - v1.x (no version, very old) → v2.0.0 → v3.0.0
 *   - v2.x (version starts with '2') → v3.0.0
 *   - Already v3.0.0 → no migration needed
 */
export async function migrateState(
  oldState: any,
  featureId: string,
  specsDir: string
): Promise<MigrationResult> {
  console.log(`🔄 开始迁移状态：${featureId}`);

  try {
    if (!needsMigration(oldState)) {
      console.log('✅ 状态已是最新版本 (v3.0.0)，无需迁移');
      return {
        success: true,
        migratedToVersion: oldState.version,
      };
    }

    console.log(
      `🔧 检测到需要迁移的状态 - 当前版本：${oldState.version || '未指定'}`
    );

    // Create backup before migration
    const backupPath = await backupState(oldState, featureId, specsDir);

    // Execute migration
    let newState: StateV3_0_0;
    const currentVersion = oldState.version || '1.0.0';

    if (
      currentVersion === 'v1.2.5' ||
      currentVersion === 'v1.2.11' ||
      (!currentVersion.startsWith('v2') && !currentVersion.startsWith('v3'))
    ) {
      // Very old (v1.x or no version) — first migrate to v2, then to v3
      console.log(`📈 执行 ${currentVersion} → v2.0.0 → v3.0.0 迁移逻辑`);
      const v2State = migrateToV2(oldState);
      newState = migrateToV3(v2State);
    } else {
      // v2.x — migrate directly to v3
      console.log(`📈 执行 ${currentVersion} → v3.0.0 迁移逻辑`);
      newState = migrateToV3(oldState);
    }

    // Validate migration result
    if (!newState.version || newState.version !== 'v3.0.0') {
      throw new Error('迁移失败：结果状态版本号错误');
    }
    if (!newState.feature) {
      throw new Error('迁移失败：结果状态缺少 feature 字段');
    }
    if (!newState.phaseHistory || !Array.isArray(newState.phaseHistory)) {
      throw new Error('迁移失败：结果状态缺少 phaseHistory 字段');
    }

    console.log('✅ 状态迁移成功：v3.0.0');

    return {
      success: true,
      backupPath,
      migratedToVersion: 'v3.0.0',
    };
  } catch (error) {
    console.error(
      '❌ 状态迁移失败:',
      error instanceof Error ? error.message : String(error)
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 检查是否存在备份文件
 */
export async function hasBackup(specsDir: string): Promise<boolean> {
  const backupDir = path.join(specsDir, '.state.backup');
  try {
    await fs.access(backupDir);
    const files = await fs.readdir(backupDir);
    return files.some((f) => f.startsWith('state-') && f.endsWith('.json'));
  } catch {
    return false;
  }
}
