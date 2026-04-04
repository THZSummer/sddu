// 状态机实现 - 带流程防跳过验证
import * as fs from 'fs/promises';
import * as path from 'path';

// 添加新的枚举值以支持Discovery状态
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

export class StateMachine {
  private states: Map<string, FeatureState> = new Map();
  private stateFilePath: string;
  
  // 更新状态流转规则，将discovered加入状态流转中
  private validTransitions: Record<FeatureStateEnum, FeatureStateEnum[]> = {
    'drafting': ['discovered', 'specified'],     // drafting状态既可以跳转到discovered也可以直接到specified（允许跳过）
    'discovered': ['specified'],                // discovered后必须到specified
    'specified': ['planned'],
    'planned': ['tasked'],
    'tasked': ['implementing'],
    'implementing': ['reviewed'],
    'reviewed': ['validated'],
    'validated': ['completed'],
    'completed': []                             // 终态，不可再流转
  };
  
  // 每个状态对应的必需文件 - 需包含所有状态
  private requiredFiles: Record<FeatureStateEnum, string[]> = {
    'drafting': [],                           // 起始阶段不需要特殊文件
    'discovered': ['discovery.md'],           // 由discovery命令产生
    'specified': ['spec.md', 'discovery.md'], // 保留discovery.md同时需要spec.md
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

  async load() {
    try {
      const data = await fs.readFile(this.stateFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed.features) {
        Object.entries(parsed.features).forEach(([key, value]: [string, any]) => {
          this.states.set(key, value);
        });
      }
    } catch {
      // 文件不存在
    }
  }

  async save() {
    const dir = path.dirname(this.stateFilePath);
    await fs.mkdir(dir, { recursive: true });
    
    const data = {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      features: Object.fromEntries(this.states)
    };
    
    await fs.writeFile(this.stateFilePath, JSON.stringify(data, null, 2));
  }

  async createFeature(name: string): Promise<FeatureState> {
    const id = name.toLowerCase().replace(/\s+/g, '-').slice(0, 50);
    const now = new Date().toISOString();
    
    const state: FeatureState = {
      id,
      name,
      state: 'drafting',
      createdAt: now,
      updatedAt: now,
      tasks: []
    };
    
    this.states.set(id, state);
    await this.save();
    return state;
  }

  getState(featureId: string): FeatureState | undefined {
    return this.states.get(featureId);
  }

  getAllFeatures(): FeatureState[] {
    return Array.from(this.states.values());
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
          break; // 对于其他阶段的跳跃，不需要在这里记录，因为我们的跳转规则限制了可跳过的阶段
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
   * 更新状态（带验证）
   */
  async updateState(featureId: string, newState: FeatureStateEnum, data: any = {}): Promise<FeatureState> {
    await this.load();
    
    const feature = this.states.get(featureId);
    if (!feature) {
      throw new Error(`Feature 不存在：${featureId}`);
    }
    
    // 验证流转 - 这里会返回是否符合规则以及可能的警告
    const validation = await this.validateStageTransition(featureId, newState);
    
    // 注意：对于跳过discovered阶段的情况，我们只发出警告而不是阻止，因为这是可选的
    if (!validation.allowed && !validation.missingStages?.some(ms => ms.state === 'discovered')) {
      // 只有在不是discovered跳过的情况下才抛出错误
      throw new Error(`状态流转失败：${validation.reason}`);
    }
    
    feature.state = newState as FeatureStateEnum;
    feature.updatedAt = new Date().toISOString();
    Object.assign(feature, data);
    
    this.states.set(featureId, feature);
    await this.save();
    
    return feature;
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