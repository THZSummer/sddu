import { StateManager } from './manager';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, rmdirSync, readdirSync } from 'fs';
import { tmpdir } from 'os';

describe('StateManager', () => {
  let stateManager: StateManager;
  let tempSpecsDir: string;
  // Mock original functions
  const originalGetSpecsDir = jest.requireActual('../utils/workspace').getSpecsDir;
  let tempDir: string;

  beforeEach(() => {
    // 创建临时目录
    tempDir = join(tmpdir(), `sdd-state-test-${Date.now()}`);
    tempSpecsDir = join(tempDir, '.sdd', '.specs');
    mkdirSync(tempSpecsDir, { recursive: true });

    // Mock getSpecsDir函数
    jest.spyOn(require('../utils/workspace'), 'getSpecsDir').mockReturnValue(tempSpecsDir);
    
    // 重新实例化stateManager以使更改生效
    stateManager = new StateManager();
  });

  afterEach(() => {
    // 恢复原始函数
    jest.clearAllMocks();
    (require('../utils/workspace') as any).getSpecsDir.mockRestore();

    // 清理临时目录
    try {
      removeDirectoryRecursively(tempDir);
    } catch (err) {
      console.warn('Could not clean up temp directory:', err);
    }
  });

  // 递归删除目录的辅助函数
  function removeDirectoryRecursively(dirPath: string): void {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        removeDirectoryRecursively(fullPath);
      } else {
        unlinkSync(fullPath);
      }
    }
    rmdirSync(dirPath);
  }

  describe('getStatePath', () => {
    it('should return correct path for state file', () => {
      const feature = 'test-feature';
      // 因为我们mock了getSpecsDir，所以这里使用的是tempSpecsDir
      const expectedPath = join(tempSpecsDir, feature, 'state.json');
      
      // 直接访问私有方法进行测试
      const getStatePathMethod = (stateManager as any).getStatePath.bind(stateManager);
      const actualPath = getStatePathMethod(feature);
      
      expect(actualPath).toBe(expectedPath);
    });
  });

  describe('initialize', () => {
    it('should create initial state for a feature', () => {
      const feature = 'test-feature';
      const state = stateManager.initialize(feature, 'Test Feature');

      expect(state.feature).toBe(feature);
      expect(state.name).toBe('Test Feature');
      expect(state.version).toBe('1.2.11');
      expect(state.status).toBe('drafting');
      expect(state.createdAt).toBeDefined();
      expect(state.updatedAt).toBeDefined();
      
      // 验证文件是否已创建
      const statePath = join(tempSpecsDir, feature, 'state.json');
      expect(existsSync(statePath)).toBe(true);
    });
  });

  describe('load', () => {
    it('should return null for non-existent feature', () => {
      const state = stateManager.load('non-existent-feature');
      
      expect(state).toBeNull();
    });

    it('should load existing state', () => {
      const feature = 'loaded-test-feature';
      // 先创建一个状态
      const initialState = stateManager.initialize(feature, 'Loaded Test Feature');
      
      // 重新加载
      const loadedState = stateManager.load(feature);
      
      expect(loadedState).toEqual(initialState);
    });
  });

  describe('save', () => {
    it('should save state to file', () => {
      const feature = 'save-test-feature';
      const stateToSave = {
        feature,
        name: 'Save Test Feature',
        version: '1.2.11' as const,
        status: 'specified' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      stateManager.save(stateToSave);
      
      // 加载刚保存的状态
      const loadedState = stateManager.load(feature);
      expect(loadedState).toEqual({
        ...stateToSave,
        // updatedAt在保存时会被更新
        updatedAt: expect.any(String)
      });
      
      // 验证文件存在
      const statePath = join(tempSpecsDir, feature, 'state.json');
      expect(existsSync(statePath)).toBe(true);
    });
  });

  describe('updateStatus', () => {
    it('should update status for existing feature', () => {
      const feature = 'update-test-feature';
      stateManager.initialize(feature, 'Update Test Feature');

      // 更新状态
      stateManager.updateStatus(feature, 'specified', { 
        phase: 2, 
        assignee: 'test-user' 
      });

      // 验证状态已更新
      const updatedState = stateManager.load(feature);
      expect(updatedState?.status).toBe('specified');
      expect(updatedState?.phase).toBe(2);
      expect(updatedState?.assignee).toBe('test-user');
      expect(Date.parse(updatedState!.updatedAt!)).not.toBeNaN(); // 验证updatedAt是有效的日期格式
    });

    it('should initialize new state if feature does not exist', () => {
      const feature = 'new-update-test-feature';
      
      // 直接更新不存在的feature状态，应创建新状态
      stateManager.updateStatus(feature, 'planned', { 
        phase: 2 
      });
      
      const newState = stateManager.load(feature);
      expect(newState?.status).toBe('planned');
      expect(newState?.phase).toBe(2);
      expect(newState?.feature).toBe(feature);
    });
  });

  describe('getStatus', () => {
    it('should return status for feature', () => {
      const feature = 'status-test-feature';
      stateManager.initialize(feature, 'Status Test Feature');
      
      // 默认状态为drafting
      const status = stateManager.getStatus(feature);
      expect(status).toBe('drafting');
      
      // 更新后再测试
      stateManager.updateStatus(feature, 'specified');
      const updatedStatus = stateManager.getStatus(feature);
      expect(updatedStatus).toBe('specified');
    });

    it('should return null for non-existent feature', () => {
      const status = stateManager.getStatus('non-existent-feature');
      expect(status).toBeNull();
    });
  });

  describe('hasState', () => {
    it('should return false for non-existent feature', () => {
      const hasState = stateManager.hasState('non-existent-feature');
      expect(hasState).toBe(false);
    });

    it('should return true for existed feature', () => {
      const feature = 'has-state-test-feature';
      stateManager.initialize(feature, 'Has State Test Feature');
      
      const hasState = stateManager.hasState(feature);
      expect(hasState).toBe(true);
    });
  });

  describe('scanSubFeatures', () => {
    // 此处需要动态访问私有属性_specsDir
    beforeEach(() => {
      // 设置正确的specsDir，模拟实际场景
      (stateManager as any).specsDir = tempSpecsDir;
    });

    it('should scan sub-features in parent feature directory', () => {
      const parentFeature = 'parent-feature';
      const parentDir = join(tempSpecsDir, parentFeature);
      mkdirSync(parentDir, { recursive: true });

      // 创建一些子目录来模拟子feature
      const subFeature1 = 'sub-feature-1';
      const subFeature2 = 'sub-feature-2';
      const subDir1 = join(parentDir, subFeature1);
      const subDir2 = join(parentDir, subFeature2);
      mkdirSync(subDir1, { recursive: true });
      mkdirSync(subDir2, { recursive: true });

      // 为sub-feature-1创建状态文件
      const stateFile1 = join(subDir1, 'state.json');
      const stateForSub1 = {
        feature: `${parentFeature}/${subFeature1}`,
        name: 'Sub Feature 1',
        version: '1.2.11' as const,
        status: 'specified' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      writeFileSync(stateFile1, JSON.stringify(stateForSub1, null, 2));

      // 执行扫描
      const results = stateManager.scanSubFeatures(parentFeature);

      // 验证结果
      expect(results).toHaveLength(2);
      
      const result1 = results.find(r => r.id === subFeature1);
      const result2 = results.find(r => r.id === subFeature2);
      
      expect(result1).toBeDefined();
      expect(result1?.hasStateFile).toBe(true);
      expect(result1?.state).toEqual(stateForSub1);
      expect(result1?.error).toBeUndefined();
      
      expect(result2).toBeDefined();
      expect(result2?.hasStateFile).toBe(false);
      expect(result2?.state).toBeUndefined();
      expect(result2?.error).toBeUndefined();
    });

    it('should handle case with no sub-features', () => {
      const parentFeature = 'empty-parent';
      const parentDir = join(tempSpecsDir, parentFeature);
      mkdirSync(parentDir, { recursive: true });

      const results = stateManager.scanSubFeatures(parentFeature);
      expect(results).toHaveLength(0);
    });

    it('should handle non-existent parent directory', () => {
      const results = stateManager.scanSubFeatures('non-existent-parent');
      expect(results).toHaveLength(0);
    });
  });
});
