/**
 * ConsistencyChecker — R5 内置升级机制
 *
 * 每次 SDDU 插件版本升级后，首次执行一致性检测，自动发现并修复
 * 不符合最新 phase/status 规则的 state.json 文件。
 *
 * ## 7 项检测规则
 *
 * 1. missing_state_json       — Feature 目录存在但无 state.json
 * 2. hidden_state_file        — 存在 .state.json（应规范为 state.json）
 * 3. invalid_root_reference   — root state.json 引用的 Feature 目录不存在
 * 4. field_mixing             — state.json 使用 `state`/`status` 字段承载阶段值（应为 `phase`）
 * 5. non_standard_status      — status/phase 字段不在合法值集合内
 * 6. missing_field            — state.json 缺少 `phase` 或 `status` 字段
 * 7. combined_constraint_violation — completed 不在 validated 等组合约束违反
 *
 * ## FR-008 保护
 *
 * 修复 phase 字段时，如果当前 status 已是 suspended/terminated/merged，
 * 不覆盖 status，保留用户意图。
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { constants as fsConstants } from 'fs';
import { scanTreeStructure, FeatureTreeNode } from './tree-scanner';
import {
  Phase, FeatureStatus,
  VALID_PHASES, VALID_STATUSES,
  validateStateV3,
} from './schema-v3.0.0';

// ============================================================================
// Types
// ============================================================================

export type AnomalyType =
  | 'missing_state_json'
  | 'hidden_state_file'
  | 'invalid_root_reference'
  | 'field_mixing'
  | 'non_standard_status'
  | 'missing_field'
  | 'combined_constraint_violation';

export interface ConsistencyAnomaly {
  /** Anomaly type — determines the detection rule that triggered */
  type: AnomalyType;
  /** Path to the feature directory (relative to specs-root) */
  path: string;
  /** Human-readable detail about the anomaly */
  detail: string;
  /** Severity level */
  severity: 'error' | 'warning';
  /** Whether this anomaly can be automatically repaired */
  repairable: boolean;
}

export interface ConsistencyReport {
  /** Current plugin version */
  pluginVersion: string;
  /** The last version that was checked against */
  lastCheckedVersion?: string;
  /** ISO timestamp of when the check was performed */
  checkedAt: string;
  /** Total number of feature directories scanned */
  totalFeatures: number;
  /** All detected anomalies */
  anomalies: ConsistencyAnomaly[];
  /** Successfully repaired anomalies */
  repaired: ConsistencyAnomaly[];
  /** Anomalies that could not be repaired */
  failed: ConsistencyAnomaly[];
}

/** Persisted consistency tracking state */
export interface ConsistencyState {
  pluginVersion: string;
  lastCheckedAt: string;
  lastCheckResult: 'clean' | 'anomalies_found' | 'repair_needed';
  anomalyCount: number;
}

// ============================================================================
// Phase inference helpers
// ============================================================================

/**
 * Map old-style `state` field values to valid Phase values.
 * Handles common legacy patterns.
 */
function inferPhaseFromLegacyState(oldState: string): Phase {
  const mapping: Record<string, Phase> = {
    'drafting': 'registered',
    'discovered': 'discovered',
    'specified': 'specified',
    'planned': 'planned',
    'tasked': 'tasked',
    'building': 'builded',
    'implementing': 'builded',
    'builded': 'builded',
    'reviewed': 'reviewed',
    'validated': 'validated',
    'completed': 'validated',
    'registered': 'registered',
  };
  return mapping[oldState] || 'registered';
}

/**
 * Map a string to a valid FeatureStatus, with FR-008 protection.
 * Returns null if the current status is already a valid non-tracked status
 * (which should be preserved).
 */
function inferStatus(
  rawStatus: string | undefined | null,
  currentStatus?: FeatureStatus | null,
): FeatureStatus {
  // FR-008: If current status is already a valid non-tracked status, preserve it
  if (currentStatus && VALID_STATUSES.includes(currentStatus) && currentStatus !== 'tracked') {
    return currentStatus;
  }

  // If no raw status provided, default to tracked
  if (!rawStatus) return 'tracked';

  // Direct match
  if (VALID_STATUSES.includes(rawStatus as FeatureStatus)) {
    return rawStatus as FeatureStatus;
  }

  // Legacy mappings
  const legacyMap: Record<string, FeatureStatus> = {
    'active': 'tracked',
    'in-progress': 'tracked',
    'done': 'completed',
    'finished': 'completed',
    'paused': 'suspended',
    'on-hold': 'suspended',
    'cancelled': 'terminated',
    'abandoned': 'terminated',
    'deprecated': 'terminated',
  };
  if (legacyMap[rawStatus]) {
    return legacyMap[rawStatus];
  }

  // Default
  return 'tracked';
}

// ============================================================================
// ConsistencyChecker class
// ============================================================================

export class ConsistencyChecker {
  private pluginVersion: string;
  private lastCheckedVersion: string | null;
  private consistencyStatePath: string;
  private readonly specsRootDir: string;

  constructor(pluginVersion: string, specsRootDir: string = '.sddu/specs-tree-root') {
    this.pluginVersion = pluginVersion;
    this.specsRootDir = specsRootDir;
    this.consistencyStatePath = path.join('.sddu', '.consistency-state.json');
    this.lastCheckedVersion = null;
    // We deliberately do NOT load the last-checked version in the constructor
    // because loading requires async I/O. Callers should use the async methods.
  }

  // ==========================================================================
  // Version management
  // ==========================================================================

  /**
   * Determine whether a consistency check is needed.
   * Returns true if the plugin version has changed since the last check.
   */
  needsCheck(): boolean {
    return this.lastCheckedVersion !== this.pluginVersion;
  }

  /** Load the persisted consistency state. Must be called before needsCheck(). */
  async loadState(): Promise<void> {
    try {
      await fs.access(this.consistencyStatePath, fsConstants.F_OK);
      const raw = await fs.readFile(this.consistencyStatePath, 'utf8');
      const data: ConsistencyState = JSON.parse(raw);
      this.lastCheckedVersion = data.pluginVersion || null;
    } catch {
      // No previous state — first run
      this.lastCheckedVersion = null;
    }
  }

  /** Persist the current version as the last-checked version. */
  async saveCheckedVersion(): Promise<void> {
    this.lastCheckedVersion = this.pluginVersion;

    const state: ConsistencyState = {
      pluginVersion: this.pluginVersion,
      lastCheckedAt: new Date().toISOString(),
      lastCheckResult: 'clean',
      anomalyCount: 0,
    };

    const dir = path.dirname(this.consistencyStatePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.consistencyStatePath, JSON.stringify(state, null, 2));
  }

  /** Get the last check result, if any. */
  getLastCheckResult(): ConsistencyState | null {
    if (!this.lastCheckedVersion) return null;
    return {
      pluginVersion: this.lastCheckedVersion,
      lastCheckedAt: '',
      lastCheckResult: 'clean',
      anomalyCount: 0,
    };
  }

  // ==========================================================================
  // Detection: checkAll
  // ==========================================================================

  /**
   * Run all 7 consistency checks against every feature in the specs tree.
   * Returns a full report of all detected anomalies.
   */
  async checkAll(specsRootDir?: string): Promise<ConsistencyReport> {
    const root = specsRootDir || this.specsRootDir;
    const now = new Date().toISOString();

    const report: ConsistencyReport = {
      pluginVersion: this.pluginVersion,
      lastCheckedVersion: this.lastCheckedVersion ?? undefined,
      checkedAt: now,
      totalFeatures: 0,
      anomalies: [],
      repaired: [],
      failed: [],
    };

    // 1. Scan the full tree structure
    let scanResult: { nodes: FeatureTreeNode[]; flatMap: Map<string, FeatureTreeNode> };
    try {
      scanResult = await scanTreeStructure(root);
    } catch (err: any) {
      // If scanning fails entirely, we can't do anything
      report.anomalies.push({
        type: 'invalid_root_reference',
        path: root,
        detail: `Failed to scan specs tree: ${err.message}`,
        severity: 'error',
        repairable: false,
      });
      return report;
    }

    report.totalFeatures = scanResult.nodes.length;

    // 2. For each feature directory, run the 7 detection rules
    for (const [featurePath, node] of Array.from(scanResult.flatMap.entries())) {
      const anomalies = await this.checkFeature(featurePath, node, root);
      report.anomalies.push(...anomalies);
    }

    // 3. Check root references
    const rootAnomalies = await this.checkRootReferences(root);
    report.anomalies.push(...rootAnomalies);

    // 4. Persist detection state
    await this.saveCheckedVersion();

    return report;
  }

  // ==========================================================================
  // Individual feature check (7 detection rules)
  // ==========================================================================

  private async checkFeature(
    featurePath: string,
    node: FeatureTreeNode,
    specsRootDir: string,
  ): Promise<ConsistencyAnomaly[]> {
    const anomalies: ConsistencyAnomaly[] = [];
    const dirFullPath = path.join(specsRootDir, featurePath);
    const stateFilePath = path.join(dirFullPath, 'state.json');
    const hiddenStatePath = path.join(dirFullPath, '.state.json');

    // ---- Check file existence ----
    let stateExists = false;
    let hiddenStateExists = false;

    try {
      await fs.access(stateFilePath, fsConstants.F_OK);
      stateExists = true;
    } catch { /* state.json does not exist */ }

    try {
      await fs.access(hiddenStatePath, fsConstants.F_OK);
      hiddenStateExists = true;
    } catch { /* .state.json does not exist */ }

    // Detection 1: missing_state_json
    if (!stateExists && !hiddenStateExists) {
      anomalies.push({
        type: 'missing_state_json',
        path: featurePath,
        detail: `Feature directory exists but no state.json found (feature: ${node.featureName})`,
        severity: 'error',
        repairable: true,
      });
      return anomalies; // No further checks possible without a state file
    }

    // Detection 2: hidden_state_file
    if (hiddenStateExists) {
      anomalies.push({
        type: 'hidden_state_file',
        path: featurePath,
        detail: `Found .state.json — should be renamed to state.json (feature: ${node.featureName})`,
        severity: 'warning',
        repairable: true,
      });
    }

    // ---- Read and validate state content ----
    // Prefer state.json; fall back to .state.json
    const fileToRead = stateExists ? stateFilePath : hiddenStatePath;

    let rawContent: string;
    let stateData: Record<string, unknown>;
    try {
      rawContent = await fs.readFile(fileToRead, 'utf8');
      stateData = JSON.parse(rawContent);
    } catch (err: any) {
      anomalies.push({
        type: 'missing_field',
        path: featurePath,
        detail: `Failed to parse state file: ${err.message}`,
        severity: 'error',
        repairable: false,
      });
      return anomalies;
    }

    // Detection 4: field_mixing — old `state` field used for stage value
    if (typeof stateData.state === 'string' && stateData.state.length > 0) {
      // Old `state` field exists — this is field mixing
      // Only flag if `phase` is missing OR if `state` seems to carry a stage value
      const isPhaseValue = VALID_PHASES.includes(stateData.state as Phase);
      const isStatusValue = VALID_STATUSES.includes(stateData.state as FeatureStatus);
      // If state carries a stage-like value, it's field mixing
      if (isPhaseValue || !isStatusValue) {
        anomalies.push({
          type: 'field_mixing',
          path: featurePath,
          detail: `Uses 'state' field (value: "${stateData.state}") to carry stage info — should use 'phase' field instead`,
          severity: 'error',
          repairable: true,
        });
      }
    }

    // Also check for old `status` field carrying stage values
    if (typeof stateData.status === 'string' && typeof stateData.phase !== 'string') {
      // If status carries what looks like a stage value (in VALID_PHASES but not VALID_STATUSES)
      const asPhase = stateData.status;
      if (VALID_PHASES.includes(asPhase as Phase) && !VALID_STATUSES.includes(asPhase as FeatureStatus)) {
        anomalies.push({
          type: 'field_mixing',
          path: featurePath,
          detail: `'status' field carries stage value "${asPhase}" — should be in 'phase' field`,
          severity: 'error',
          repairable: true,
        });
      }
    }

    // Detection 6: missing_field — missing phase or status
    const hasPhase = typeof stateData.phase === 'string' && stateData.phase.length > 0;
    const hasStatus = typeof stateData.status === 'string' && stateData.status.length > 0;

    if (!hasPhase && !hasStatus) {
      anomalies.push({
        type: 'missing_field',
        path: featurePath,
        detail: 'state.json is missing both phase and status fields',
        severity: 'error',
        repairable: true,
      });
    } else if (!hasPhase) {
      anomalies.push({
        type: 'missing_field',
        path: featurePath,
        detail: 'state.json is missing the phase field',
        severity: 'error',
        repairable: true,
      });
    } else if (!hasStatus) {
      anomalies.push({
        type: 'missing_field',
        path: featurePath,
        detail: 'state.json is missing the status field',
        severity: 'error',
        repairable: true,
      });
    }

    // Detection 5: non_standard_status — invalid phase or status values
    if (hasPhase && !VALID_PHASES.includes(stateData.phase as Phase)) {
      anomalies.push({
        type: 'non_standard_status',
        path: featurePath,
        detail: `Non-standard phase value "${stateData.phase}" — valid values: [${VALID_PHASES.join(', ')}]`,
        severity: 'error',
        repairable: true,
      });
    }
    if (hasStatus && !VALID_STATUSES.includes(stateData.status as FeatureStatus)) {
      anomalies.push({
        type: 'non_standard_status',
        path: featurePath,
        detail: `Non-standard status value "${stateData.status}" — valid values: [${VALID_STATUSES.join(', ')}]`,
        severity: 'error',
        repairable: true,
      });
    }

    // Detection 7: combined_constraint_violation
    const currentPhase = stateData.phase as string | undefined;
    const currentStatus = stateData.status as string | undefined;

    // completed only valid when phase is validated
    if (currentStatus === 'completed' && currentPhase && currentPhase !== 'validated') {
      anomalies.push({
        type: 'combined_constraint_violation',
        path: featurePath,
        detail: `status='completed' is only valid when phase='validated' (current phase: "${currentPhase}")`,
        severity: 'error',
        repairable: true,
      });
    }

    // merged requires mergedInto
    if (currentStatus === 'merged') {
      const merged = stateData.merged as Record<string, unknown> | undefined;
      if (!merged || typeof merged.mergedInto !== 'string' || !merged.mergedInto) {
        anomalies.push({
          type: 'combined_constraint_violation',
          path: featurePath,
          detail: 'status="merged" requires merged.mergedInto field to be set',
          severity: 'error',
          repairable: false, // Can't auto-fix without knowing the target
        });
      }
    }

    return anomalies;
  }

  // ==========================================================================
  // Root reference check
  // ==========================================================================

  private async checkRootReferences(specsRootDir: string): Promise<ConsistencyAnomaly[]> {
    const anomalies: ConsistencyAnomaly[] = [];

    // Check if there's a root-level state.json at the specs root
    const rootStatePath = path.join(specsRootDir, 'state.json');

    try {
      await fs.access(rootStatePath, fsConstants.F_OK);
    } catch {
      // No root state file — nothing to validate
      return anomalies;
    }

    try {
      const raw = await fs.readFile(rootStatePath, 'utf8');
      const rootState = JSON.parse(raw);

      // Check childrens references
      if (rootState.childrens && Array.isArray(rootState.childrens)) {
        for (const child of rootState.childrens) {
          if (child && typeof child.path === 'string') {
            const childDir = path.join(specsRootDir, child.path);
            try {
              await fs.access(childDir, fsConstants.F_OK);
            } catch {
              anomalies.push({
                type: 'invalid_root_reference',
                path: child.path,
                detail: `Root state references feature "${child.path}" but directory does not exist`,
                severity: 'error',
                repairable: true,
              });
            }
          }
        }
      }

      // Check currentFeature reference
      if (rootState.currentFeature && typeof rootState.currentFeature === 'string') {
        const currentDir = path.join(specsRootDir, rootState.currentFeature);
        try {
          await fs.access(currentDir, fsConstants.F_OK);
        } catch {
          anomalies.push({
            type: 'invalid_root_reference',
            path: rootState.currentFeature,
            detail: `Root state currentFeature "${rootState.currentFeature}" references non-existent directory`,
            severity: 'error',
            repairable: true,
          });
        }
      }
    } catch (err: any) {
      anomalies.push({
        type: 'invalid_root_reference',
        path: specsRootDir,
        detail: `Failed to parse root state.json: ${err.message}`,
        severity: 'error',
        repairable: false,
      });
    }

    return anomalies;
  }

  // ==========================================================================
  // Repair: repair
  // ==========================================================================

  /**
   * Execute repairs for the given list of anomalies.
   *
   * @param anomalies  - Anomalies to repair
   * @param specsRootDir - Root of the specs tree
   * @param confirmed  - Must be true to execute repairs (user confirmation gate)
   */
  async repair(
    anomalies: ConsistencyAnomaly[],
    specsRootDir: string,
    confirmed: boolean = false,
  ): Promise<{ repaired: ConsistencyAnomaly[]; failed: ConsistencyAnomaly[] }> {
    const repaired: ConsistencyAnomaly[] = [];
    const failed: ConsistencyAnomaly[] = [];

    if (!confirmed) {
      // User did not confirm — do not execute repairs
      return { repaired, failed };
    }

    for (const anomaly of anomalies) {
      try {
        await this.repairOne(anomaly, specsRootDir);
        repaired.push(anomaly);
      } catch (err: any) {
        failed.push({
          ...anomaly,
          detail: `${anomaly.detail} [Repair failed: ${err.message}]`,
        });
      }
    }

    return { repaired, failed };
  }

  /**
   * Repair a single anomaly.
   * FR-008: When repairing phase, preserve non-tracked status values.
   */
  private async repairOne(
    anomaly: ConsistencyAnomaly,
    specsRootDir: string,
  ): Promise<void> {
    const dirFullPath = path.join(specsRootDir, anomaly.path);
    const stateFilePath = path.join(dirFullPath, 'state.json');
    const hiddenStatePath = path.join(dirFullPath, '.state.json');

    switch (anomaly.type) {

      // ---- 1: missing_state_json ----
      case 'missing_state_json': {
        // Infer feature name from the path
        const featureName = path.basename(anomaly.path).replace(/^specs-tree-/, '') || anomaly.path;
        const now = new Date().toISOString();

        const newState = {
          feature: anomaly.path,
          name: featureName,
          version: 'v3.0.0',
          phase: 'registered' as Phase,
          status: 'tracked' as FeatureStatus,
          depth: 0,
          phaseHistory: [{
            phase: 'registered' as Phase,
            timestamp: now,
            triggeredBy: 'ConsistencyChecker.repair',
          }],
          files: {
            spec: `${anomaly.path}/spec.md`,
          },
          dependencies: {
            on: [] as string[],
            blocking: [] as string[],
          },
        };

        await fs.mkdir(dirFullPath, { recursive: true });
        await fs.writeFile(stateFilePath, JSON.stringify(newState, null, 2));
        return;
      }

      // ---- 2: hidden_state_file ----
      case 'hidden_state_file': {
        // Read .state.json content
        const content = await fs.readFile(hiddenStatePath, 'utf8');
        // Write to state.json
        await fs.writeFile(stateFilePath, content);
        // Optionally remove .state.json (keep as backup for safety)
        // await fs.unlink(hiddenStatePath);
        return;
      }

      // ---- 3: invalid_root_reference ----
      case 'invalid_root_reference': {
        const rootStatePath = path.join(specsRootDir, 'state.json');
        try {
          const raw = await fs.readFile(rootStatePath, 'utf8');
          const rootState = JSON.parse(raw);

          // Remove invalid childrens references
          if (rootState.childrens && Array.isArray(rootState.childrens)) {
            rootState.childrens = rootState.childrens.filter(
              (c: any) => c && c.path !== anomaly.path,
            );
          }

          // Clear invalid currentFeature
          if (rootState.currentFeature === anomaly.path) {
            delete rootState.currentFeature;
          }

          await fs.writeFile(rootStatePath, JSON.stringify(rootState, null, 2));
        } catch {
          throw new Error('Root state.json not found or unreadable');
        }
        return;
      }

      // ---- 4: field_mixing ----
      case 'field_mixing': {
        // Read the current state
        const fileToRead = await this.pickStateFile(stateFilePath, hiddenStatePath);
        const raw = await fs.readFile(fileToRead, 'utf8');
        const data = JSON.parse(raw);

        // Map old `state` field to `phase`
        if (typeof data.state === 'string' && data.state.length > 0) {
          const inferredPhase = inferPhaseFromLegacyState(data.state);
          data.phase = inferredPhase;
          delete data.state; // Remove old field
        }

        // If `status` field carries a stage value, map it
        const currentRawStatus = data.status as string | undefined;
        if (currentRawStatus && VALID_PHASES.includes(currentRawStatus as Phase)) {
          // status field carries stage value → move to phase
          if (!data.phase || !VALID_PHASES.includes(data.phase as Phase)) {
            data.phase = currentRawStatus;
          }
          // Re-infer status (FR-008: preserve valid non-tracked)
          data.status = inferStatus(undefined, data.status as FeatureStatus);
        }

        // Ensure status exists
        if (!data.status) {
          data.status = inferStatus(undefined);
        }

        // Ensure version
        if (data.version !== 'v3.0.0') {
          data.version = 'v3.0.0';
        }

        await fs.writeFile(stateFilePath, JSON.stringify(data, null, 2));
        return;
      }

      // ---- 5: non_standard_status ----
      case 'non_standard_status': {
        const fileToRead = await this.pickStateFile(stateFilePath, hiddenStatePath);
        const raw = await fs.readFile(fileToRead, 'utf8');
        const data = JSON.parse(raw);

        // Fix non-standard phase
        if (data.phase && !VALID_PHASES.includes(data.phase as Phase)) {
          // Try to infer from old `state` field
          if (typeof data.state === 'string') {
            data.phase = inferPhaseFromLegacyState(data.state);
          } else {
            data.phase = 'registered';
          }
        }

        // Fix non-standard status (FR-008: preserve valid non-tracked)
        if (data.status && !VALID_STATUSES.includes(data.status as FeatureStatus)) {
          const currentStatus = data.status as string;
          // FR-008: if current status is already valid non-tracked, keep it
          if (VALID_STATUSES.includes(currentStatus as FeatureStatus)) {
            // Already valid — no change needed
          } else {
            data.status = inferStatus(currentStatus, data.status as FeatureStatus);
          }
        }

        // Ensure version
        if (data.version !== 'v3.0.0') {
          data.version = 'v3.0.0';
        }

        await fs.writeFile(stateFilePath, JSON.stringify(data, null, 2));
        return;
      }

      // ---- 6: missing_field ----
      case 'missing_field': {
        const fileToRead = await this.pickStateFile(stateFilePath, hiddenStatePath);
        let data: Record<string, unknown>;

        try {
          const raw = await fs.readFile(fileToRead, 'utf8');
          data = JSON.parse(raw);
        } catch {
          // File unreadable — create minimal state
          data = {};
        }

        // Fix missing phase
        if (typeof data.phase !== 'string' || !data.phase) {
          // Try to infer from old state field
          if (typeof data.state === 'string' && data.state.length > 0) {
            data.phase = inferPhaseFromLegacyState(data.state);
          } else {
            data.phase = 'registered';
          }
        }

        // Fix missing status (FR-008: only default to tracked if truly missing)
        if (typeof data.status !== 'string' || !data.status) {
          // Infer from context: if previously had a valid status, keep it
          data.status = 'tracked';
        }

        // Ensure version
        if (data.version !== 'v3.0.0') {
          data.version = 'v3.0.0';
        }

        // Ensure minimum required fields
        if (typeof data.depth !== 'number') data.depth = 0;
        if (!Array.isArray(data.phaseHistory)) data.phaseHistory = [];
        if (!data.files || typeof data.files !== 'object') {
          data.files = { spec: `${anomaly.path}/spec.md` };
        }
        if (!data.dependencies || typeof data.dependencies !== 'object') {
          data.dependencies = { on: [], blocking: [] };
        }

        // Remove old state field if present
        if ('state' in data) delete data.state;

        await fs.writeFile(stateFilePath, JSON.stringify(data, null, 2));
        return;
      }

      // ---- 7: combined_constraint_violation ----
      case 'combined_constraint_violation': {
        const fileToRead = await this.pickStateFile(stateFilePath, hiddenStatePath);
        const raw = await fs.readFile(fileToRead, 'utf8');
        const data = JSON.parse(raw);

        // Fix: completed must have phase=validated
        if (data.status === 'completed' && data.phase !== 'validated') {
          data.phase = 'validated';
        }

        // merged without mergedInto — can't auto-fix, skip
        if (data.status === 'merged') {
          const merged = data.merged as Record<string, unknown> | undefined;
          if (!merged || typeof merged.mergedInto !== 'string' || !merged.mergedInto) {
            // Can't fix without target — this should have repairable: false
            throw new Error('Cannot auto-repair: merged status requires a target feature (mergedInto)');
          }
        }

        // Ensure version
        if (data.version !== 'v3.0.0') {
          data.version = 'v3.0.0';
        }

        await fs.writeFile(stateFilePath, JSON.stringify(data, null, 2));
        return;
      }

      default:
        throw new Error(`Unknown anomaly type: ${(anomaly as any).type}`);
    }
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  /**
   * Pick the first existing state file (prefer state.json over .state.json).
   * Throws if neither exists.
   */
  private async pickStateFile(
    stateFilePath: string,
    hiddenStatePath: string,
  ): Promise<string> {
    try {
      await fs.access(stateFilePath, fsConstants.F_OK);
      return stateFilePath;
    } catch { /* not found */ }

    try {
      await fs.access(hiddenStatePath, fsConstants.F_OK);
      return hiddenStatePath;
    } catch { /* not found */ }

    throw new Error(`No state file found (tried state.json and .state.json)`);
  }
}

// ============================================================================
// FR-013: 长期停滞检测
// ============================================================================

export interface StaleFeature {
  featurePath: string;
  featureName: string;
  phase: string;
  lastUpdated: string;
  staleDays: number;
}

/**
 * 检测长期停滞的 Feature。
 *
 * 扫描所有 `status === 'tracked' && phase !== 'validated'` 的特性，
 * 检查 `updatedAt`（或 `updatedDate`）距今是否超过阈值。
 *
 * @param specsRootDir - specs-tree-root 目录路径
 * @param staleDaysThreshold - 停滞阈值（天），默认 30
 * @returns 停滞特性列表
 */
export async function detectStaleFeatures(
  specsRootDir: string,
  staleDaysThreshold: number = 30,
): Promise<StaleFeature[]> {
  const staleFeatures: StaleFeature[] = [];
  const now = Date.now();
  const thresholdMs = staleDaysThreshold * 24 * 60 * 60 * 1000;

  let entries: Array<{ name: string; isDirectory: () => boolean }>;
  try {
    entries = await fs.readdir(specsRootDir, { withFileTypes: true }) as any;
  } catch {
    return staleFeatures; // directory doesn't exist
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('specs-tree-')) continue;

    const featureDir = path.join(specsRootDir, entry.name);
    const stateFilePath = path.join(featureDir, 'state.json');

    let stateRaw: string;
    try {
      stateRaw = await fs.readFile(stateFilePath, 'utf-8');
    } catch {
      continue; // no state.json, skip
    }

    let state: any;
    try {
      state = JSON.parse(stateRaw);
    } catch {
      continue;
    }

    // Only check tracked + non-validated features
    const status = state.status || state.state;
    const phase = state.phase;
    if (status !== 'tracked' || phase === 'validated') continue;

    // Check last update time
    const updatedAt = state.updatedAt || state.updatedDate || state.metadata?.updatedAt;
    if (!updatedAt) continue;

    const updatedTime = new Date(updatedAt).getTime();
    if (isNaN(updatedTime)) continue;

    const staleMs = now - updatedTime;
    if (staleMs < thresholdMs) continue;

    staleFeatures.push({
      featurePath: entry.name,
      featureName: entry.name.substring('specs-tree-'.length),
      phase,
      lastUpdated: updatedAt,
      staleDays: Math.floor(staleMs / (24 * 60 * 60 * 1000)),
    });
  }

  // Sort by most stale first
  staleFeatures.sort((a, b) => b.staleDays - a.staleDays);

  return staleFeatures;
}
