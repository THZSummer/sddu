import * as fs from 'fs/promises';
import * as path from 'path';
import { StateMachine } from './machine';
import { FeatureStateEnum } from './machine';

/**
 * 自动状态更新器
 * 监听文件变化并自动更新 Feature 状态
 */
export class AutoUpdater {
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceDelay: number = 5000; // 5秒防抖延迟
  private enabled: boolean = true;
  private specsDir: string;
  
  // 关键文件列表，用于确定 Feature 状态
  private readonly keyFiles: Record<FeatureStateEnum, string[]> = {
    'drafting': [],                                // 空状态或刚创建
    'discovered': ['discovery.md'],                // 包含发现文档
    'specified': ['spec.md'] as string[],          // spec.md 存在
    'planned': ['spec.md', 'plan.md'],             // spec.md 和 plan.md 存在
    'tasked': ['spec.md', 'plan.md', 'tasks.md'],  // spec.md, plan.md, tasks.md 存在
    'implementing': ['spec.md', 'plan.md', 'tasks.md'], // 实现期间保持 tasked 文件
    'reviewed': ['spec.md', 'plan.md', 'tasks.md'],     // review 是过程状态，保留原始文件
    'validated': ['spec.md', 'plan.md', 'tasks.md', 'validation.md'], // 有验证文件
    'completed': ['spec.md', 'plan.md', 'tasks.md']      // 验证后为完成状态
  };

  constructor(private stateMachine: StateMachine) {
    this.specsDir = stateMachine['specsDir'];
  }

  /**
   * 启用/禁用自动更新器
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 启用防抖以避免频繁更新
   */
  private debouncedUpdate(targetPath?: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.scanAndAutoUpdate(targetPath).catch(error => {
        console.error('AutoUpdater scan error:', error);
      });
    }, this.debounceDelay);
  }

  /**
   * 扫描并自动更新相关的 Feature 状态
   */
  async scanAndAutoUpdate(targetPath?: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      console.log(`AutoUpdater: 开始扫描 ${targetPath || '所有目录'} 的状态变更`);
      let featuresToCheck: string[] = [];

      if (targetPath) {
        // 从文件路径提取对应的 Feature ID
        const relativePath = path.relative(this.specsDir, targetPath);
        if (relativePath.startsWith('specs-tree-root/')) {
          const parts = relativePath.split(path.sep);
          if (parts.length > 1) {
            const featureId = parts[1]; // feature 目录名是第二个部分
            featuresToCheck = [featureId];
          }
        } else {
          // 如果不在预期目录下，尝试查找所有特征
          featuresToCheck = await this.getAllFeatureIds();
        }
      } else {
        // 扫描所有 Features
        featuresToCheck = await this.getAllFeatureIds();
      }

      // 针对每个需要检查的 Feature 进行状态推断和更新
      for (const featureId of featuresToCheck) {
        await this.updateFeatureStatusForFileChanges(featureId);
      }

    } catch (error) {
      console.error('AutoUpdater 扫描失败:', error);
    }
  }

  /**
   * 从目录中获取所有 Feature ID
   */
  private async getAllFeatureIds(): Promise<string[]> {
    try {
      const specsDirPath = path.join(this.specsDir);
      const items = await fs.readdir(specsDirPath, { withFileTypes: true });
      const dirs = items
        .filter(item => item.isDirectory())
        .map(item => item.name);
      
      return dirs;
    } catch (error) {
      console.error('获取 Features 列表失败:', error);
      return [];
    }
  }

  /**
   * 推断给定 Feature 目录中的最新状态
   */
  async inferCurrentStateFromFiles(featureId: string): Promise<FeatureStateEnum | null> {
    const featureDir = path.join(this.specsDir, featureId);
    
    try {
      const dirContents = await fs.readdir(featureDir);
      
      // 从最高级别的状态开始尝试匹配
      const stateOrder: FeatureStateEnum[] = [
        'validated', 'reviewed', 'implementing', 'tasked', 'planned', 
        'specified', 'discovered', 'drafting'
      ];
      
      for (const state of stateOrder) {
        const requiredFiles = this.keyFiles[state] || [];
        const missingFiles = await this.checkMissingFiles(featureDir, requiredFiles);
        
        if (missingFiles.length === 0 && state !== 'implementing' && state !== 'reviewed') {
          return state;
        }
        
        // 对于实现过程和审查中的特殊状态，需要特别处理
        if (state === 'implementing' || state === 'reviewed') {
          // 检查这些状态依赖的基础文件是否存在
          const basicRequiredFiles = this.keyFiles['tasked'] || [];
          const basicMissing = await this.checkMissingFiles(featureDir, basicRequiredFiles);
          if (basicMissing.length === 0) {
            // 基础文件存在，我们可以确定当前处于进行中状态
            return state === 'implementing' ? 'implementing' : 'reviewed';
          }
        }
      }
      
      // 检查是否包含发现文档但没有 spec -> discovered 状态
      const hasDiscoveryDoc = dirContents.some(f => f === 'discovery.md');
      if (hasDiscoveryDoc) {
        return 'discovered';
      }
      
      // 检查其他基础功能文件
      if (dirContents.some(f => f.includes('spec'))) {
        return 'specified';
      }
      
      // 默认为 drafting 状态（如果目录存在但没有特征文件）
      if (await this.isFeatureDirectory(featureDir)) {
        return 'drafting';
      }
      
      return null;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Feature 目录不存在
        console.log(`Feature 目录不存在: ${featureDir}`);
        return null;
      }
      console.error(`无法推断 Feature ${featureId} 的状态:`, error);
      return null;
    }
  }

  /**
   * 检查 Feature 目录下是否有任何相关文件
   */
  private async isFeatureDirectory(dirPath: string): Promise<boolean> {
    try {
      const contents = await fs.readdir(dirPath);
      // 检查是否有多数我们认为的相关文件
      const relevantFiles = contents.filter(file => 
        file.endsWith('.md') || 
        file === 'src' || 
        file === 'tests' ||
        file === 'package.json'
      );
      return relevantFiles.length > 0; // 只要有任意文件或目录，就认为是个有效的 Feature 目录
    } catch (error) {
      return false;
    }
  }

  /**
   * 检查给定目录中缺失的文件
   */
  private async checkMissingFiles(dir: string, requiredFiles: string[]): Promise<string[]> {
    const missing: string[] = [];
    for (const file of requiredFiles) {
      try {
        await fs.access(path.join(dir, file));
      } catch {
        missing.push(file);
      }
    }
    return missing;
  }

  /**
   * 为文件变化更新单个 Feature 的状态
   */
  private async updateFeatureStatusForFileChanges(featureId: string): Promise<void> {
    try {
      // 从文件系统推理当前状态
      const inferredState = await this.inferCurrentStateFromFiles(featureId);
      
      if (inferredState === null) {
        console.log(`无法为 ${featureId} 推断新的状态，跳过更新`);
        return;
      }

      // 从状态机获取当前状态
      const currentStateObj = this.stateMachine.getState(featureId);
      const currentState = currentStateObj ? currentStateObj.state : 'drafting';

      // 检查状态是否真的发生了改变
      if (currentState === inferredState) {
        console.log(`Feature ${featureId} 状态未发生改变 (${currentState})，跳过更新`);
        return;
      }

      // 仅当推测状态在状态流转序列中位于当前状态之后时，才进行更新
      if (this.shouldUpdateState(currentState as FeatureStateEnum, inferredState)) {
        console.log(`AutoUpdater: 更新 Feature ${featureId} 从 ${currentState} 到 ${inferredState}`);
        
        // 更新状态到状态机，跳过常规验证，因为我们是从文件状态推导的
        await this.stateMachine.updateState(featureId, inferredState, {}, 'auto-updater', 
          `自动检测到状态从 ${currentState} 到 ${inferredState}`, true); // 跳过验证
      } else {
        console.log(`状态变化无效，跳过更新: ${featureId} 从 ${currentState} 到 ${inferredState}`);
      }
    } catch (error) {
      console.error(`自动更新 Feature ${featureId} 状态失败:`, error);
    }
  }

  /**
   * 判断是否应该执行状态更新
   * 
   * 仅当日志化状态从早期阶段到晚期阶段时，或者状态真正发生变化但仍在合理范围内时生效
   */
  private shouldUpdateState(currentState: FeatureStateEnum, targetState: FeatureStateEnum): boolean {
    if (currentState === targetState) {
      return false; // 状态相同则不更新
    }

    // 使用状态机的有效转换规则
    // 一般来说，我们允许正向转换但不支持反向转换
    const stateOrder: Record<FeatureStateEnum, number> = {
      'drafting': 0,
      'discovered': 1,
      'specified': 2,
      'planned': 3,
      'tasked': 4,
      'implementing': 5,
      'reviewed': 6,
      'validated': 7,
      'completed': 8
    };

    const currentOrder = stateOrder[currentState] ?? -1;
    const targetOrder = stateOrder[targetState] ?? -1;

    return targetOrder > currentOrder; // 仅当目标状态顺序高于当前状态时才更新
  }

  /**
   * 监听指定目录的文件变更事件
   * 在实际环境中，这个方法会被 VSCode 文件更改事件驱动
   */
  listenForChanges(dirPath?: string): void {
    console.log('AutoUpdater: 准备监听文件变更...');
    // 注意：实际集成会依赖 VSCode 的 FileSystemWatcher 或类似机制
    // 这里我们仅提供一个可以被事件触发的接口
  }

  /**
   * 触发自动更新检查（供外部事件处理器使用）
   */
  triggerAutoUpdate(targetPath?: string): void {
    if (!this.enabled) {
      console.log('AutoUpdater: 已禁用，跳过触发');
      return;
    }
    
    console.log(`AutoUpdater: 检测到文件变更，准备扫描${targetPath ? ` @ ${targetPath}` : ''}`);
    this.debouncedUpdate(targetPath);
  }

  /**
   * 清理资源：取消所有待处理的定时器
   */
  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}