// 状态机实现 - 带流程防跳过验证
import * as fs from 'fs/promises';
import * as path from 'path';
import { PhaseHistory, WorkflowStatus, StateV2_0_0, validateState } from './schema-v2.0.0';
import { DependencyChecker } from './dependency-checker';

// 导出 DependencyChecker 以便其他模块使用
export { DependencyChecker };

// Type mapping from old states to new workflow states
export type OldFeatureStateEnum = 'drafting' | 'discovered' | 'specified' | 'planned' | 'tasked' | 'implementing' | 'reviewed' | 'validated' | 'completed';

// Agent workflow stages matching SDD Agent phases
export type AgentWorkflowStateEnum = 'drafting' | 'discovered' | 'specified' | 'planned' | 'tasked' | 'implementing' | 'reviewed' | 'validated' | 'completed';

// Mapping for phase tracking (matching SDD workflow)
export type SddPhase = 1 | 2 | 3 | 4 | 5 | 6;

// New status enum aligned with schema v2.0.0
export type FeatureStateEnum = 'drafting' | 'discovered' | 'specified' | 'planned' | 'tasked' | 'implementing' | 'reviewed' | 'validated' | 'completed';

export interface FeatureState {
  id: string;
  name: string;
  state: FeatureStateEnum;
  createdAt: string;
  updatedAt: string;
  tasks?: any[];
}

export interface TransitionResult {
  allowed: boolean;
  current?: string;
  target?: string;
  reason?: string;
  allowedTargets?: string[];
  missingStages?: { state: string; name: string }[];
  missingFiles?: string[];
  presentFiles?: string[];
}

export { 
  // Re-export types from other modules
  PhaseHistory, 
  WorkflowStatus, 
  StateV2_0_0, 
  validateState 
};

// Interface for Agent workflow integration
export interface AgentTransitionHook {
  onTransitionStart?(featureId: string, targetState: FeatureStateEnum): void;
  onTransitionComplete?(featureId: string, previousState: FeatureStateEnum, newState: FeatureStateEnum, triggeredBy?: string, comment?: string): void;
  onError?(error: any, featureId?: string, targetState?: string): void;
}

// Interface for AutoUpdater integration
export interface AutoUpdaterIntegration {
  onFileChange?(filePath: string): void;
  onSessionIdle?(): void;
}

// History entry for StateMachine
export interface HistoryEntry {
  timestamp: string;
  from: FeatureStateEnum;
  to: FeatureStateEnum;
  triggeredBy: string;  // The agent/workflow step that triggered the change
  actor?: string;       // The person/system performing the action
  comment?: string;     // Additional context about the transition
}

export interface FeatureWithFullHistory extends FeatureState {
  phaseHistory: PhaseHistory[];
  history: HistoryEntry[];
}

export class StateMachine {
  private states: Map<string, FeatureWithFullHistory> = new Map();
  private stateFilePath: string;
  private dependencyChecker?: DependencyChecker;
  
  // Hook for Agent workflow integration
  private agentHook?: AgentTransitionHook;
  
  // Updated state workflow rules for Agent integration
  private validTransitions: Record<FeatureStateEnum, FeatureStateEnum[]> = {
    'drafting': ['discovered', 'specified'],  // Allow direct transition or discovery-first
    'discovered': ['specified'],              // discovery produces spec-ready state
    'specified': ['planned'],                 // spec leads to planning (Phase 1→2)
    'planned': ['tasked'],                    // planning leads to task breakdown (Phase 2→3)
    'tasked': ['implementing'],               // tasks assigned to implementation (Phase 3→4)
    'implementing': ['reviewed'],             // implementation needs review (Phase 4→5)
    'reviewed': ['validated'],                // review leads to validation (Phase 5→6)
    'validated': ['completed'],               // validation completes the feature (6→end)
    'completed': []                           // Final state
  };
  
  // Required files for each state - updated for agent workflow
  private requiredFiles: Record<FeatureStateEnum, string[]> = {
    'drafting': [],
    'discovered': ['discovery.md'],
    'specified': ['spec.md', 'discovery.md'],
    'planned': ['spec.md', 'plan.md', 'discovery.md'], 
    'tasked': ['spec.md', 'plan.md', 'tasks.md', 'discovery.md'], 
    'implementing': ['spec.md', 'plan.md', 'tasks.md', 'discovery.md'],
    'reviewed': ['spec.md', 'plan.md', 'tasks.md', 'review.md', 'discovery.md'],
    'validated': ['spec.md', 'plan.md', 'tasks.md', 'review.md', 'validation.md', 'discovery.md'],
    'completed': ['spec.md', 'plan.md', 'tasks.md', 'review.md', 'validation.md', 'discovery.md']
  };

  constructor(private specsDir: string = 'specs-tree-root') {
    this.stateFilePath = path.join(specsDir, '.sdd', 'state.json');
  }

  // Set the agent hook for workflow integration
  setAgentHook(hook: AgentTransitionHook) {
    this.agentHook = hook;
  }
  
  // Set the dependency checker for state validation
  setDependencyChecker(checker: DependencyChecker) {
    this.dependencyChecker = checker;
  }

  async load() {
    try {
      const data = await fs.readFile(this.stateFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed.features) {
        for (const [key, value] of Object.entries<any>(parsed.features)) {
          // Convert loaded objects to FeatureWithFullHistory structure with defaults for new fields
          const featureState = {
            id: value.id,
            name: value.name,
            state: value.state,
            createdAt: value.createdAt,
            updatedAt: value.updatedAt,
            tasks: value.tasks || [],
            // Initialize new fields if not present
            phaseHistory: value.phaseHistory || [],
            history: value.history || []
          };
          this.states.set(key, featureState as FeatureWithFullHistory);
        }
      }
    } catch {
      // 文件不存在 - 初始化为空状态
      console.log('State file not found, will initialize empty state');
    }
  }

  async save() {
    const dir = path.dirname(this.stateFilePath);
    await fs.mkdir(dir, { recursive: true });
    
    const data = {
      version: '2.0.0',
      updatedAt: new Date().toISOString(),
      features: Object.fromEntries(this.states)
    };
    
    await fs.writeFile(this.stateFilePath, JSON.stringify(data, null, 2));
  }

  async createFeature(name: string): Promise<FeatureWithFullHistory> {
    const id = name.toLowerCase().replace(/\s+/g, '-').slice(0, 50);
    const now = new Date().toISOString();
    
    const state: FeatureWithFullHistory = {
      id,
      name,
      state: 'drafting',
      createdAt: now,
      updatedAt: now,
      tasks: [],
      phaseHistory: [],
      history: []
    };
    
    this.states.set(id, state);
    await this.save();
    return state;
  }

  getState(featureId: string): FeatureWithFullHistory | undefined {
    return this.states.get(featureId);
  }

  getAllFeatures(): FeatureWithFullHistory[] {
    return Array.from(this.states.values());
  }
  
  /**
   * 获取特定 feature 当前的相位 (SDD Phase: 1-6)
   */
  getCurrentPhase(featureId: string): number {
    const feature = this.getState(featureId);
    if (!feature) return 0;
    
    switch(feature.state) {
      case 'drafting':
      case 'discovered': 
      case 'specified': return 1;  // Spec phase
      case 'planned': return 2;    // Plan phase
      case 'tasked': return 3;     // Tasks phase
      case 'implementing': return 4; // Build phase
      case 'reviewed': return 5;   // Review phase
      case 'validated': return 6;  // Validate phase
      case 'completed': return 7;  // Completed
      default: return 0;
    }
  }
  
  /**
   * 验证状态流转是否合法
   */
  canTransition(featureId: string, targetState: FeatureStateEnum): { valid: boolean; reason?: string; current?: FeatureStateEnum; target?: FeatureStateEnum; allowed?: FeatureStateEnum[] } {
    const current = this.states.get(featureId);
    if (!current) {
      return { valid: false, reason: 'Feature 不存在', current: undefined, target: targetState };
    }
    
    const currentState = current.state as FeatureStateEnum;
    const allowedTargets = this.validTransitions[currentState] || [];
    
    if (!allowedTargets.includes(targetState)) {
      return {
        valid: false,
        reason: `不允许从 ${currentState} 跳转到 ${targetState}`,
        current: currentState,
        target: targetState,
        allowed: allowedTargets
      };
    }
    
    return { valid: true, current: currentState, target: targetState };
  }
  
  /**
   * 获取缺失的前置阶段（用于显示跳过阶段的警告）
   */
  getMissingStages(featureId: string, targetState: FeatureStateEnum): { state: string; name: string }[] {
    const current = this.states.get(featureId);
    if (!current) return [];
    
    const currentState = current.state as FeatureStateEnum;
    const allStates: FeatureStateEnum[] = ['drafting', 'discovered', 'specified', 'planned', 'tasked', 'implementing', 'reviewed', 'validated', 'completed'];
    const currentIndex = allStates.indexOf(currentState);
    const targetIndex = allStates.indexOf(targetState);
    
    if (currentIndex === -1 || targetIndex === -1) return [];
    if (targetIndex <= currentIndex) return []; // 逆向或同阶段
    
    const stageNames: Record<FeatureStateEnum, string> = {
      'drafting': '草稿阶段 (discovery)',
      'discovered': '需求挖掘 (discovery)', 
      'specified': '规范编写 (spec)',
      'planned': '技术规划 (plan)', 
      'tasked': '任务分解 (tasks)',
      'implementing': '任务实现 (build)', 
      'reviewed': '代码审查 (review)',
      'validated': '最终验证 (validate)',
      'completed': '完成'
    };
    
    const missing: { state: string; name: string }[] = [];
    for (let i = currentIndex + 1; i < targetIndex; i++) {
      const stateValue = allStates[i];
      if(stateValue) {
        // 如果是discovered并且我们要跳过它，将其加入警告列表
        if(stateValue === 'discovered') {
          missing.push({ state: stateValue, name: stageNames[stateValue] });
        } else {
          // 对于 SDD 工作流阶段，标记可能的跳跃 - 根据 SDD 阶段 1-6 进行考虑
          missing.push({ state: stateValue, name: stageNames[stateValue] });
        }
      }
    }
    
    return missing;
  }
  
  /**
   * 检查必需文件是否存在
   */
  async checkRequiredFiles(featureId: string, targetState: FeatureStateEnum): Promise<{ valid: boolean; missing: string[]; present?: string[]; reason?: string }> {
    const required = this.requiredFiles[targetState];
    if (!required) return { valid: true, missing: [] }; // 若没有指定文件要求则认为有效
    
    const feature = this.states.get(featureId);
    if (!feature) return { valid: false, missing: required, reason: 'Feature 不存在' };
    
    const featureDir = path.join(this.specsDir, feature.id);
    const missing: string[] = [];
    
    for (const file of required) {
      const filePath = path.join(featureDir, file);
      try {
        await fs.access(filePath);
      } catch {
        missing.push(file);
      }
    }
    
    return {
      valid: missing.length === 0,
      missing,
      present: required.filter(f => !missing.includes(f))
    };
  }
  
  /**
   * 完整的阶段跳转验证（核心方法 - 防跳过提醒关键）
   */
  async validateStageTransition(featureId: string, targetState: FeatureStateEnum): Promise<TransitionResult> {
    // 1. 加载最新状态
    await this.load();
    
    // 2. 验证状态流转合法性
    const transitionCheck = this.canTransition(featureId, targetState);
    if (!transitionCheck.valid) {
      return {
        allowed: false,
        reason: transitionCheck.reason,
        current: transitionCheck.current,
        target: targetState,
        allowedTargets: transitionCheck.allowed,
        missingStages: this.getMissingStages(featureId, targetState)
      };
    }
    
    // 3. 检查必需文件
    const fileCheck = await this.checkRequiredFiles(featureId, targetState);
    if (!fileCheck.valid) {
      return {
        allowed: false,
        reason: '缺失必需文件',
        current: transitionCheck.current,
        target: targetState,
        missingFiles: fileCheck.missing,
        presentFiles: fileCheck.present
      };
    }
    
    // 4. 特殊处理：如果从drafting直接跳转到非discovered状态，给出警告
    const feature = this.states.get(featureId);
    if (feature && feature.state === 'drafting' && targetState !== 'discovered') {
      const missingStages = this.getMissingStages(featureId, targetState);
      return {
        allowed: true,     // 仍然允许通过，但返回警告
        current: transitionCheck.current,
        target: targetState,
        reason: '允许跳过阶段，建议先执行 @sdd discovery [feature] 进行需求挖掘',
        missingStages: missingStages
      };
    }
    
    // 5. 验证通过
    return {
      allowed: true,
      current: transitionCheck.current,
      target: targetState
    };
  }
  
  /**
   * 更新状态（带验证），支持钩子和历史追踪
   */
  async updateState(featureId: string, newState: FeatureStateEnum, data: any = {}, triggeredBy?: string, comment?: string, skipValidation: boolean = false): Promise<FeatureWithFullHistory> {
    await this.load();
    
    const feature = this.states.get(featureId) as FeatureWithFullHistory | undefined;
    if (!feature) {
      throw new Error(`Feature 不存在：${featureId}`);
    }
    
    // 记录原始状态
    const originalState = { ...feature };
    
    // 只在非强制更新情况下检查验证
    if (!skipValidation) {
      // 验证流转 - 这里会返回是否符合规则以及可能的警告
      const validation = await this.validateStageTransition(featureId, newState);
      
      // 注意：对于跳过 discovered 阶段的情况，我们只发出警告而不是阻止，因为这是可选的
      if (!validation.allowed && !validation.missingStages?.some(ms => ms.state === 'discovered')) {
        // 只有在不是 discovered 跳过的情况下才抛出错误
        throw new Error(`状态流转失败：${validation.reason}`);
      }
      
      // 依赖状态检查（如果依赖检查器已初始化）
      if (this.dependencyChecker) {
        const depCheck = await this.dependencyChecker.checkDependenciesForStateChange(featureId, newState);
        if (!depCheck.allowed && depCheck.blockingFeatures && depCheck.blockingFeatures.length > 0) {
          const blockingList = depCheck.blockingFeatures
            .map(bf => `  - ${bf.featureId} (${bf.featureName}): ${bf.currentState} < ${bf.requiredState}`)
            .join('\n');
          throw new Error(`依赖检查失败，以下依赖 Feature 未就绪:\n${blockingList}`);
        }
      }
    } else {
      console.log(`Skipping validation for direct agent state update`);
    }
    
    const previousState = feature.state as FeatureStateEnum;
    
    // 执行过渡前的Hook (如果注册了agent hook)
    try {
      if (this.agentHook?.onTransitionStart) {
        this.agentHook.onTransitionStart(featureId, newState);
      }
    } catch (error) {
      console.warn('Warning: Agent hook onTransitionStart failed:', error);
      // 不阻塞主操作
    }
    
    // 更新状态
    feature.state = newState as FeatureStateEnum;
    feature.updatedAt = new Date().toISOString();
    Object.assign(feature, data);
    
    // Determine SDD phase number based on state
    const phase = this.getCurrentPhase(featureId);
    const workflowStatus = this.mapWorkflowStatus(newState);
    
    // Add to phase history
    const phaseHistoryItem: PhaseHistory = {
      phase: phase as number,
      status: workflowStatus,
      timestamp: new Date().toISOString(),
      triggeredBy: triggeredBy || 'unknown',
      comment: comment
    };
    
    // Add to detailed history
    const historyItem: HistoryEntry = {
      timestamp: new Date().toISOString(),
      from: previousState,
      to: newState,
      triggeredBy: triggeredBy || 'unknown',
      comment: comment
    };
    
    feature.phaseHistory = feature.phaseHistory || [];
    feature.history = feature.history || [];
    
    feature.phaseHistory.push(phaseHistoryItem);
    feature.history.push(historyItem);
    
    this.states.set(featureId, feature);
    await this.save();
    
    // 执行过渡完成后的Hook (如果注册了agent hook)
    try {
      if (this.agentHook?.onTransitionComplete) {
        this.agentHook.onTransitionComplete(
          featureId, 
          previousState, 
          newState, 
          triggeredBy,
          comment
        );
      }
    } catch (error) {
      console.warn('Warning: Agent hook onTransitionComplete failed:', error);
      if (this.agentHook?.onError) {
        this.agentHook.onError(error, featureId, newState);
      }
      // 不阻塞主操作
    }
    
    return feature;
  }
  
  // Map internal state to workflow status as defined in schema v2.0.0
  private mapWorkflowStatus(state: FeatureStateEnum): WorkflowStatus {
    switch (state) {
      case 'specified': return 'specified';
      case 'planned': return 'planned';
      case 'tasked': return 'tasked';
      case 'implementing': return 'building'; // implementing maps to 'building'
      case 'reviewed': return 'reviewed';
      case 'validated': return 'validated';
      default: 
        // For other states like 'drafting', 'discovered', 'completed', return 'validated' as a generic completion
        if (state === 'completed') return 'validated';
        return 'specified';
    }
  }
  
  /**
   * 获取下一步建议
   */
  getNextStep(featureId: string): { state: string; action: string } | null {
    const feature = this.states.get(featureId);
    if (!feature) return null;
    
    const stateValue = feature.state as FeatureStateEnum;
    const allowed = this.validTransitions[stateValue] || [];
    if (allowed.length === 0) {
      return { state: 'completed', action: '已完成，无需操作' };
    }
    
    const nextState = allowed[0];
    const actionMap: Record<FeatureStateEnum, string> = {
      'drafting': '推荐执行 @sdd discovery [feature] 进行需求挖掘，或者直接 @sdd spec [feature] 定义规范',
      'discovered': '@sdd spec [feature]',      // 从discovered阶段建议下一步spec
      'specified': '@sdd plan [feature]',
      'planned': '@sdd tasks [feature]',
      'tasked': '@sdd build [TASK-XXX]',
      'implementing': '@sdd review [feature]',
      'reviewed': '@sdd validate [feature]',
      'validated': '完成',
      'completed': '完成'
    };
    
    return { state: nextState, action: actionMap[nextState] || '未知' };
  }
}