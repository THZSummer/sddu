// 状态机实现 - v3.0.0 两字段模型 (phase + status)
// Phase 流转单向不可逆，Status 独立管理
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  Phase, FeatureStatus, StateV3_0_0, PhaseHistoryEntry,
  PHASE_ORDER, VALID_PHASES,
  validateStateV3, shouldRecommendContinue, getNextRecommendedPhase,
} from './schema-v3.0.0';
import { DependencyChecker } from './dependency-checker';
import { StateLoader } from './state-loader';

// 导出 DependencyChecker 和 StateLoader 以便其他模块使用
export { DependencyChecker, StateLoader };

// ============================================================================
// Error Types
// ============================================================================

/** Phase 回退错误 — Phase 流转单向不可逆 */
export class PhaseReversalError extends Error {
  constructor(public currentPhase: Phase, public targetPhase: Phase) {
    super(`Phase 流转单向不可逆: 不能从 ${currentPhase} 回退到 ${targetPhase}`);
    this.name = 'PhaseReversalError';
  }
}

/** Phase 跳跃错误 — Phase 必须按序推进 */
export class PhaseSkipError extends Error {
  constructor(
    public currentPhase: Phase,
    public targetPhase: Phase,
    public missingPhases: Phase[],
  ) {
    super(
      `Phase 必须按序推进: 当前为 ${currentPhase}, ` +
      `下一步为 ${missingPhases[0] || '?'}, 不能跳到 ${targetPhase}`,
    );
    this.name = 'PhaseSkipError';
  }
}

// ============================================================================
// Types & Interfaces (backward‑compatible external surface)
// ============================================================================

/**
 * @deprecated Use `Phase` from schema-v3.0.0 instead.
 * Kept for compilation compatibility until TASK-005/010/011 migrate all consumers.
 * ├── Old SdduPhase (v2.x): drafting → discovered → specified → planned → tasked → implementing → reviewed → validated → completed
 * └── New Phase (v3.0.0):  registered → discovered → specified → planned → tasked → builded → reviewed → validated
 */
export type FeatureStateEnum = 'drafting' | 'discovered' | 'specified' | 'planned' | 'tasked' | 'implementing' | 'reviewed' | 'validated' | 'completed';

// FeatureState 保留给 discovery/state-validator 等外部模块使用
export interface FeatureState {
  id: string;
  name: string;
  phase: Phase;
  status: FeatureStatus;
  createdAt: string;
  updatedAt: string;
  tasks?: any[];
}

export interface TransitionResult {
  allowed: boolean;
  current?: Phase;
  target?: Phase;
  reason?: string;
  allowedTargets?: Phase[];
  missingStages?: { phase: Phase; name: string }[];
  missingFiles?: string[];
  presentFiles?: string[];
}

// Interface for Agent workflow integration
export interface AgentTransitionHook {
  onTransitionStart?(featureId: string, targetPhase: Phase): void;
  onTransitionComplete?(
    featureId: string,
    previousPhase: Phase,
    newPhase: Phase,
    triggeredBy?: string,
    comment?: string,
  ): void;
  onError?(error: any, featureId?: string, targetPhase?: string): void;
}

// Interface for AutoUpdater integration
export interface AutoUpdaterIntegration {
  onFileChange?(filePath: string): void;
  onSessionIdle?(): void;
}

// History entry for StateMachine
export interface HistoryEntry {
  timestamp: string;
  from: Phase;
  to: Phase;
  triggeredBy: string;
  actor?: string;
  comment?: string;
}

// FeatureWithFullHistory based on StateV3_0_0
export interface FeatureWithFullHistory extends StateV3_0_0 {
  id: string;    // Legacy compat — mirrors feature field
  name: string;  // Legacy compat — mirrors name field
  tasks?: any[]; // Legacy compat
}

// ============================================================================
// Phase → Agent Action mapping
// ============================================================================

const phaseActionMap: Record<Phase, string> = {
  'registered': '@sddu discovery [feature]',  // Action to advance FROM registered
  'discovered': '@sddu spec [feature]',        // Action to advance FROM discovered
  'specified':  '@sddu plan [feature]',         // Action to advance FROM specified
  'planned':    '@sddu tasks [feature]',         // Action to advance FROM planned
  'tasked':     '@sddu build [TASK-XXX]',       // Action to advance FROM tasked
  'builded':    '@sddu review [feature]',       // Action to advance FROM builded
  'reviewed':   '@sddu validate [feature]',     // Action to advance FROM reviewed
  'validated':  '已完成',
};

const phaseNameMap: Record<Phase, string> = {
  'registered': '注册 (registered)',
  'discovered': '需求挖掘 (discovery)',
  'specified':  '规范编写 (spec)',
  'planned':    '技术规划 (plan)',
  'tasked':     '任务分解 (tasks)',
  'builded':    '任务实现 (build)',
  'reviewed':   '代码审查 (review)',
  'validated':  '最终验证 (validate)',
};

// Required files for each phase
const requiredFiles: Record<Phase, string[]> = {
  'registered': [],
  'discovered': ['discovery.md'],
  'specified':  ['spec.md'],
  'planned':    ['spec.md', 'plan.md'],
  'tasked':     ['spec.md', 'plan.md', 'tasks.md'],
  'builded':    ['spec.md', 'plan.md', 'tasks.md'],
  'reviewed':   ['spec.md', 'plan.md', 'tasks.md', 'review.md'],
  'validated':  ['spec.md', 'plan.md', 'tasks.md', 'review.md', 'validation.md'],
};

// ============================================================================
// StateMachine class
// ============================================================================

export class StateMachine {
  private stateLoader: StateLoader;
  private specsDir: string;
  private dependencyChecker?: DependencyChecker;

  // Hook for Agent workflow integration
  private agentHook?: AgentTransitionHook;

  constructor(specsDir: string = '.sddu/specs-tree-root') {
    this.specsDir = specsDir;
    this.stateLoader = new StateLoader(specsDir);
  }

  // ---------- hooks ----------

  setAgentHook(hook: AgentTransitionHook) {
    this.agentHook = hook;
  }

  setDependencyChecker(checker: DependencyChecker) {
    this.dependencyChecker = checker;
  }

  // ---------- load / save ----------

  async load(featurePath?: string) {
    if (featurePath) {
      return await this.stateLoader.get(featurePath);
    }
    return null;
  }

  async save() {
    console.warn('Using StateLoader for distributed saving, no centralized save operation');
  }

  // ---------- create / get ----------

  /**
   * 创建 Feature — 默认 phase: 'registered', status: 'tracked'
   */
  async createFeature(name: string, featurePath: string): Promise<FeatureWithFullHistory> {
    const id = name.toLowerCase().replace(/\s+/g, '-').slice(0, 50);

    // Create minimal initial state with v3.0.0 defaults
    const initialState: Partial<StateV3_0_0> = {
      feature: featurePath,
      name,
      version: 'v3.0.0',
      phase: 'registered',
      status: 'tracked',
      phaseHistory: [{
        phase: 'registered',
        timestamp: new Date().toISOString(),
        triggeredBy: 'StateMachine.createFeature',
      }],
      files: {
        spec: `${path.basename(featurePath)}/spec.md`,
      },
      dependencies: {
        on: [],
        blocking: [],
      },
    };

    // Save via StateLoader
    const success = await this.stateLoader.create(featurePath, initialState);
    if (!success) {
      throw new Error('Failed to create distributed state for feature: ' + id);
    }

    // Get the fully hydrated state after creation
    const finalState = await this.stateLoader.get(featurePath) as StateV3_0_0;
    if (!finalState) {
      throw new Error('Created feature state could not be loaded immediately after creation: ' + id);
    }

    return {
      ...finalState,
      id,
      name: finalState.name || name,
      tasks: [],
    } as FeatureWithFullHistory;
  }

  /**
   * 获取 Feature 当前状态
   */
  async getState(featurePath: string): Promise<FeatureWithFullHistory | undefined> {
    const state = await this.stateLoader.get(featurePath) as StateV3_0_0;
    if (!state) return undefined;

    return {
      ...state,
      id: state.feature,
      name: state.name || state.feature,
      tasks: [] as string[],
    };
  }

  /**
   * 获取所有 Feature
   */
  async getAllFeatures(): Promise<FeatureWithFullHistory[]> {
    const allStates = await this.stateLoader.loadAll();
    const features: FeatureWithFullHistory[] = [];

    // Use Array.from to avoid downlevelIteration issues
    for (const [featurePath, state] of Array.from(allStates.entries())) {
      features.push({
        ...state,
        id: state.feature,
        name: state.name || state.feature,
        tasks: [] as string[],
      });
    }

    return features;
  }

  /**
   * 判断是否为父特性（有子特性）
   */
  async isParentFeature(featurePath: string): Promise<boolean> {
    const state = await this.stateLoader.get(featurePath);

    if (state && state.childrens && Array.isArray(state.childrens) && state.childrens.length > 0) {
      return true;
    }

    // Fallback: check tree structure
    try {
      const treeStructure = await this.stateLoader.getTreeStructure();
      const node = treeStructure.flatMap.get(featurePath);
      if (node) {
        return node.children.length > 0;
      }
    } catch (error: any) {
      console.warn(`Error checking tree structure for ${featurePath}:`, error.message);
    }

    return false;
  }

  /**
   * 获取当前 phase
   */
  async getCurrentPhase(featurePath: string): Promise<Phase | null> {
    const feature = await this.getState(featurePath);
    if (!feature) return null;
    return feature.phase;
  }

  // ---------- phase validation ----------

  /**
   * 验证 phase 推进是否合法（单向，不可回退或跳跃）
   */
  validatePhaseTransition(currentPhase: Phase, targetPhase: Phase): {
    valid: boolean;
    reason?: string;
    missingPhases?: Phase[];
  } {
    const currentOrder = PHASE_ORDER[currentPhase];
    const targetOrder = PHASE_ORDER[targetPhase];

    if (targetOrder === undefined) {
      return { valid: false, reason: `无效的目标 phase: ${targetPhase}` };
    }

    // Same phase — no-op, considered valid
    if (targetOrder === currentOrder) {
      return { valid: true };
    }

    // Rollback — reject
    if (targetOrder < currentOrder) {
      return {
        valid: false,
        reason: `Phase 流转单向不可逆: 不能从 ${currentPhase} 回退到 ${targetPhase}`,
      };
    }

    // Skip — reject, return missing phases
    if (targetOrder > currentOrder + 1) {
      const missingPhases: Phase[] = [];
      for (let i = currentOrder + 1; i < targetOrder; i++) {
        const p = VALID_PHASES[i];
        if (p) missingPhases.push(p);
      }
      return {
        valid: false,
        reason: `Phase 必须按序推进: 当前为 ${currentPhase}, 不能跳到 ${targetPhase}`,
        missingPhases,
      };
    }

    // Single step forward — valid
    return { valid: true };
  }

  /**
   * 获取缺失的前置阶段
   */
  getMissingPhases(currentPhase: Phase, targetPhase: Phase): Phase[] {
    const currentOrder = PHASE_ORDER[currentPhase];
    const targetOrder = PHASE_ORDER[targetPhase];

    if (targetOrder <= currentOrder) return [];

    const missing: Phase[] = [];
    for (let i = currentOrder + 1; i < targetOrder; i++) {
      const p = VALID_PHASES[i];
      if (p) missing.push(p);
    }
    return missing;
  }

  // ---------- file checking ----------

  /**
   * 检查所需文件是否存在（区分父/叶子特性）
   */
  async checkRequiredFiles(
    featurePath: string,
    targetPhase: Phase,
    isParent: boolean = false,
  ): Promise<{ valid: boolean; missing: string[]; present?: string[]; reason?: string }> {
    const required = requiredFiles[targetPhase];
    if (!required || required.length === 0) {
      return { valid: true, missing: [] };
    }

    const filesToCheck = isParent
      ? required.filter(f => f.includes('discovery') || f.includes('spec') || f.includes('plan'))
      : required;

    const missing: string[] = [];
    for (const file of filesToCheck) {
      const filePath = path.join(this.specsDir, featurePath, file);
      try {
        await fs.access(filePath);
      } catch {
        if (file === 'discovery.md') continue; // discovery optional in tree
        missing.push(file);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      present: filesToCheck.filter(f => !missing.includes(f)),
    };
  }

  // ---------- transition validation ----------

  /**
   * 完整的阶段跳转验证（核心方法）
   */
  async validateStageTransition(
    featurePath: string,
    targetPhase: Phase,
  ): Promise<TransitionResult> {
    const isParent = await this.isParentFeature(featurePath);

    // 1. Check feature exists
    const current = await this.getState(featurePath);
    if (!current) {
      return {
        allowed: false,
        current: undefined,
        target: targetPhase,
        reason: 'Feature 路径不存在',
      };
    }

    // 2. Validate phase progression
    const phaseCheck = this.validatePhaseTransition(current.phase, targetPhase);
    if (!phaseCheck.valid) {
      const missingPhases = phaseCheck.missingPhases || [];
      return {
        allowed: false,
        current: current.phase,
        target: targetPhase,
        reason: phaseCheck.reason,
        missingStages: missingPhases.map(p => ({
          phase: p,
          name: phaseNameMap[p] || p,
        })),
      };
    }

    // 3. Parent features cannot advance beyond planning (phase order 3)
    if (isParent) {
      const targetOrder = PHASE_ORDER[targetPhase];
      if (targetOrder > 3) {
        return {
          allowed: false,
          current: current.phase,
          target: targetPhase,
          reason: 'Parent features cannot advance beyond planning phase; only leaf features should proceed to implementation.',
        };
      }
    }

    // 4. Check required files
    const fileCheck = await this.checkRequiredFiles(featurePath, targetPhase, isParent);
    if (!fileCheck.valid) {
      return {
        allowed: false,
        current: current.phase,
        target: targetPhase,
        reason: '缺失必需文件',
        missingFiles: fileCheck.missing,
        presentFiles: fileCheck.present,
      };
    }

    // 5. Validate successful
    return {
      allowed: true,
      current: current.phase,
      target: targetPhase,
    };
  }

  // ---------- state update ----------

  /**
   * 更新 Feature phase（带验证 + FR-006 自动完成 + hooks）
   */
  async updateState(
    featurePath: string,
    targetPhase: Phase,
    data: any = {},
    triggeredBy?: string,
    comment?: string,
    skipValidation: boolean = false,
    isParent: boolean = false,
  ): Promise<FeatureWithFullHistory> {
    const feature = await this.getState(featurePath);
    if (!feature) {
      throw new Error(`State does not exist at ${featurePath}`);
    }

    const previousPhase = feature.phase;
    const currentStatus = feature.status;

    // Validate transition (unless skipped)
    if (!skipValidation) {
      const validation = await this.validateStageTransition(featurePath, targetPhase);

      if (!validation.allowed) {
        // Check if this is a rollback
        const currentOrder = PHASE_ORDER[previousPhase];
        const targetOrder = PHASE_ORDER[targetPhase];
        if (targetOrder < currentOrder) {
          throw new PhaseReversalError(previousPhase, targetPhase);
        }
        // Check if this is a skip
        if (targetOrder > currentOrder + 1) {
          const missing = this.getMissingPhases(previousPhase, targetPhase);
          throw new PhaseSkipError(previousPhase, targetPhase, missing);
        }
        // Other validation failure
        throw new Error(`State transition failed: ${validation.reason}`);
      }

      // Dependency check
      if (this.dependencyChecker) {
        const depCheck = await this.dependencyChecker.checkDependenciesForStateChange(
          featurePath,
          targetPhase,
        );
        if (!depCheck.allowed && depCheck.blockingFeatures?.length > 0) {
          const blockingList = depCheck.blockingFeatures
            .map((bf: any) => `  - ${bf.featureId} (${bf.featureName}): ${bf.currentState} < ${bf.requiredState}`)
            .join('\n');
          throw new Error(
            `Dependency check failed, the following dependent Feature are not ready:\n${blockingList}`,
          );
        }
      }
    }

    // FR-006: auto-set status to completed when phase reaches validated
    let newStatus: FeatureStatus = currentStatus;
    if (targetPhase === 'validated' && currentStatus === 'tracked') {
      newStatus = 'completed';
    }

    // Pre-transition hook
    try {
      if (this.agentHook?.onTransitionStart) {
        this.agentHook.onTransitionStart(
          featurePath.split('/').pop() || featurePath,
          targetPhase,
        );
      }
    } catch (error) {
      console.warn('Warning: Agent hook onTransitionStart failed:', error);
    }

    // Build updated state — merge data parameter for caller-supplied fields
    const now = new Date().toISOString();

    const updatedState: StateV3_0_0 = {
      ...feature,
      ...data,
      phase: targetPhase,
      status: newStatus,
      version: 'v3.0.0',
      phaseHistory: [
        ...(feature.phaseHistory || []),
        {
          phase: targetPhase,
          timestamp: now,
          triggeredBy: triggeredBy || 'system',
          comment,
        },
      ],
      dependencies: (data as any).dependencies ?? {
        on: feature.dependencies?.on || [],
        blocking: feature.dependencies?.blocking || [],
      },
      files: {
        spec: (data as any).files?.spec ?? feature.files?.spec ?? '',
        plan: (data as any).files?.plan ?? feature.files?.plan,
        tasks: (data as any).files?.tasks ?? feature.files?.tasks,
        readme: (data as any).files?.readme ?? feature.files?.readme,
        review: (data as any).files?.review ?? feature.files?.review,
        validation: (data as any).files?.validation ?? feature.files?.validation,
      },
      // Preserve depth and childrens — prefer data-supplied values
      depth: (data as any).depth ?? feature.depth ?? 0,
      childrens: (data as any).childrens ?? feature.childrens,
    };

    // Add history entry
    const updatedHistory = [
      ...(feature.history || []),
      {
        timestamp: now,
        from: previousPhase,
        to: targetPhase,
        triggeredBy: triggeredBy || 'system',
        comment,
      },
    ];
    updatedState.history = updatedHistory;

    // Validate against v3.0.0 schema
    if (!validateStateV3(updatedState)) {
      throw new Error(`New state for ${featurePath} failed validation against v3.0.0 schema`);
    }

    // Save via StateLoader
    const success = await this.stateLoader.set(featurePath, updatedState);
    if (!success) {
      throw new Error(`Failed to save state to ${featurePath}`);
    }

    // Post-transition hook
    try {
      if (this.agentHook?.onTransitionComplete) {
        this.agentHook.onTransitionComplete(
          featurePath.split('/').pop() || featurePath,
          previousPhase,
          targetPhase,
          triggeredBy,
          comment,
        );
      }
    } catch (error) {
      console.warn('Warning: Agent hook onTransitionComplete failed:', error);
      if (this.agentHook?.onError) {
        this.agentHook.onError(error, featurePath, targetPhase);
      }
    }

    return {
      ...updatedState,
      id: updatedState.feature,
      name: updatedState.name || updatedState.feature,
      tasks: [...(feature.tasks || [])],
    };
  }

  // ---------- next step ----------

  /**
   * 获取下一步推荐 phase（仅 tracked 且未到 validated 时）
   * 返回值: { phase: Phase; action: string } | null
   */
  async getNextStep(
    featurePath: string,
  ): Promise<{ phase: Phase; action: string } | null> {
    const feature = await this.getState(featurePath);
    if (!feature) return null;

    const { phase, status } = feature;

    // Use schema-v3.0.0 derivation functions
    if (!shouldRecommendContinue(phase, status)) {
      return null;
    }

    const nextPhase = getNextRecommendedPhase(phase, status);
    if (!nextPhase) return null;

    // Action is based on the CURRENT phase (what to do to advance FROM it)
    return {
      phase: nextPhase,
      action: phaseActionMap[phase] || '未知',
    };
  }
}
