import { StateManager } from '../../../.sdd/src/state/manager';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, rmdirSync, readdirSync } from 'fs';
import { tmpdir } from 'os';

// Mock workspace functions before importing StateManager to ensure the mock works
jest.mock('../../../.sdd/src/utils/workspace', () => {
  return {
    getSpecsDir: jest.fn(),
  };
});

describe('F-250: State Manager - Unit Tests', () => {
  let stateManager: StateManager;
  let tempSpecsDir: string;
  // Using imported mocked version  
  const mockGetSpecsDir = require('../../../.sdd/src/utils/workspace').getSpecsDir;
  let tempDir: string;

  beforeEach(() => {
    // 创建临时目录
    tempDir = join(tmpdir(), `sdd-state-unit-test-${Date.now()}`);
    tempSpecsDir = join(tempDir, '.sdd', '.specs');
    mkdirSync(tempSpecsDir, { recursive: true });

    // Mock getSpecsDir function to return the temp directory
    (mockGetSpecsDir as jest.MockedFunction<any>).mockReturnValue(tempSpecsDir);
    
    // Then create an instance of StateManager
    stateManager = new StateManager();
  });

  afterEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Clear the temp directories
    try {
      removeDirectoryRecursively(tempDir);
    } catch (err) {
      console.warn('Could not clean up temp directory:', err);
    }
  });

  // Recursive helper to remove directory
  function removeDirectoryRecursively(dirPath: string): void {
    if (!existsSync(dirPath)) return;
    
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

  describe('Initialization and Basic Operations', () => {
    it('should create initial state for a feature with correct properties', () => {
      const feature = 'test-feature';
      const stateName = 'Unit Test Feature';
      const state = stateManager.initialize(feature, stateName);

      expect(state.feature).toBe(feature);
      expect(state.name).toBe(stateName);
      expect(state.version).toBe('1.2.11');
      expect(state.status).toBe('drafting');
      expect(state).toHaveProperty('createdAt');
      expect(state).toHaveProperty('updatedAt');
      
      // Verify that the file was created
      const statePath = join(tempSpecsDir, feature, 'state.json');
      expect(existsSync(statePath)).toBe(true);
    });

    it('should create state file in correct location', () => {
      const feature = 'location-test-feature';
      stateManager.initialize(feature);

      const statePath = join(tempSpecsDir, feature, 'state.json');
      expect(existsSync(statePath)).toBe(true);
    });

    it('should create directories recursively if they don\'t exist', () => {
      const feature = 'nested/dir/structure';
      const state = stateManager.initialize(feature);
      
      expect(state.feature).toBe(feature);
      
      const statePath = join(tempSpecsDir, feature, 'state.json');
      expect(existsSync(statePath)).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('should return null for non-existing feature', () => {
      const state = stateManager.load('non-existent-feature');
      expect(state).toBeNull();
    });

    it('should load existing state correctly', () => {
      const feature = 'load-test-feature';
      const initialState = stateManager.initialize(feature, 'Load Test Feature');
      
      const loadedState = stateManager.load(feature);
      expect(loadedState).not.toBeNull();
      expect(loadedState?.feature).toBe(initialState.feature);
      expect(loadedState?.name).toBe(initialState.name);
      expect(loadedState?.version).toBe(initialState.version);
    });

    it('should handle corrupted state file error gracefully', () => {
      const feature = 'corrupted-file-test';
      const featureDir = join(tempSpecsDir, feature);
      mkdirSync(featureDir, { recursive: true });
      
      const statePath = join(featureDir, 'state.json');
      writeFileSync(statePath, '{ not valid json }');
      
      const result = stateManager.load(feature);
      expect(result).toBeNull();
    });
  });

  describe('Saving States', () => {
    it('should save state to file correctly', () => {
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
      
      const statePath = join(tempSpecsDir, feature, 'state.json');
      expect(existsSync(statePath)).toBe(true);
      
      const savedContent = readFileSync(statePath, 'utf-8');
      const parsedState = JSON.parse(savedContent);
      
      expect(parsedState.feature).toBe(feature);
      expect(parsedState.name).toBe('Save Test Feature');
      expect(parsedState.version).toBe('1.2.11');
      expect(parsedState.status).toBe('specified');
    });

    it('should update updatedAt on save', () => {
      const feature = 'timestamp-test-feature';
      const now = new Date().toISOString();
      
      const stateToSave = {
        feature,
        name: 'Timestamp Test Feature',
        version: '1.2.11' as const,
        status: 'planned' as const,
        createdAt: now,
        updatedAt: now,
      };
      
      stateManager.save(stateToSave);
      
      // Load to see if updatedAt is updated
      const loadedState = stateManager.load(feature);
      expect(new Date(loadedState?.updatedAt!).getTime())
        .toBeGreaterThanOrEqual(new Date(now).getTime());
    });
  });

  describe('Updating Status', () => {
    it('should update status for existing feature', () => {
      const feature = 'update-status-test';
      stateManager.initialize(feature, 'Update Status Test');
      
      stateManager.updateStatus(feature, 'specified', { 
        phase: 2, 
        assignee: 'test-user' 
      });
      
      const updatedState = stateManager.load(feature);
      expect(updatedState?.status).toBe('specified');
      expect(updatedState?.phase).toBe(2);
      expect(updatedState?.assignee).toBe('test-user');
      expect(updatedState?.updatedAt).toBeDefined();
    });

    it('should initialize new state if feature does not exist', () => {
      const feature = 'new-initialize-test';
      stateManager.updateStatus(feature, 'planned');
      
      const newState = stateManager.load(feature);
      expect(newState?.status).toBe('planned');
      expect(newState?.feature).toBe(feature);
      expect(newState?.version).toBe('1.2.11');
    });

    it('should merge additional data when updating status', () => {
      const feature = 'merge-data-test';
      stateManager.initialize(feature, 'Merge Data Test');
      
      const additionalData = {
        phase: 3,
        files: {
          plan: 'plan.md',
          tasks: 'tasks.md'
        },
        dependencies: {
          on: ['other-feature']
        }
      };
      
      stateManager.updateStatus(feature, 'validated', additionalData);
      
      const updatedState = stateManager.load(feature);
      expect(updatedState?.status).toBe('validated');
      expect(updatedState?.phase).toBe(3);
      expect(updatedState?.files).toEqual(additionalData.files);
      expect(updatedState?.dependencies).toEqual(additionalData.dependencies);
    });
  });

  describe('Checking Status', () => {
    it('should return correct status for existing feature', () => {
      const feature = 'check-status-test';
      stateManager.initialize(feature, 'Check Status Test');
      expect(stateManager.getStatus(feature)).toBe('drafting');
      
      stateManager.updateStatus(feature, 'specified');
      expect(stateManager.getStatus(feature)).toBe('specified');
    });

    it('should return null for non-existing feature', () => {
      const status = stateManager.getStatus('non-existent-feature');
      expect(status).toBeNull();
    });
  });

  describe('Checking State Existence', () => {
    it('should return false for non-existing feature', () => {
      const hasState = stateManager.hasState('non-existent-feature');
      expect(hasState).toBe(false);
    });

    it('should return true for existing feature', () => {
      const feature = 'has-state-test';
      stateManager.initialize(feature, 'Has State Test');
      
      const hasState = stateManager.hasState(feature);
      expect(hasState).toBe(true);
    });
  });

  describe('Scanning Sub-Features', () => {
    it('should scan sub-features in correct parent directory structure', () => {
      const parentFeature = 'parent-feature';
      const parentDir = join(tempSpecsDir, parentFeature);
      mkdirSync(parentDir, { recursive: true });

      // Create sub feature directories
      const subFeature1 = 'sub-feature-1';
      const subFeature2 = 'sub-feature-2';
      const subDir1 = join(parentDir, subFeature1);
      const subDir2 = join(parentDir, subFeature2);
      mkdirSync(subDir1, { recursive: true });
      mkdirSync(subDir2, { recursive: true });

      // Create valid state files
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

      // Execute scan
      const results = stateManager.scanSubFeatures(parentFeature);

      // Verify results
      expect(results).toHaveLength(2);
      
      const result1 = results.find(r => r.id === subFeature1);
      const result2 = results.find(r => r.id === subFeature2);
      
      expect(result1).toBeDefined();
      expect(result1?.id).toBe(subFeature1);
      expect(result1?.hasStateFile).toBe(true);
      expect(result1?.state).toMatchObject(stateForSub1);
      expect(result1?.error).toBeUndefined();
      
      expect(result2).toBeDefined();
      expect(result2?.id).toBe(subFeature2);
      expect(result2?.hasStateFile).toBe(false);
      expect(result2?.state).toBeUndefined();
      expect(result2?.error).toBeUndefined();
    });

    it('should handle directories with no sub-features', () => {
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

    it('should handle corrupted sub-feature state files', () => {
      const parentFeature = 'parent-with-corrupted-subfeature';
      const parentDir = join(tempSpecsDir, parentFeature);
      mkdirSync(parentDir, { recursive: true });

      // Create sub directory with invalid state file
      const subFeature = 'corrupted-state-subfeature';
      const subDir = join(parentDir, subFeature);
      mkdirSync(subDir, { recursive: true });

      const stateFile = join(subDir, 'state.json');
      writeFileSync(stateFile, 'not valid json');

      const results = stateManager.scanSubFeatures(parentFeature);
      
      const result = results.find(r => r.id === subFeature);
      expect(result).toBeDefined();
      expect(result?.id).toBe(subFeature);
      expect(result?.hasStateFile).toBe(true);
      expect(result?.state).toBeUndefined();
      expect(result?.error).toBeDefined();
      expect(result?.error).toContain('Error loading state file:');
    });
  });

  describe('State Validation', () => {
    it('should properly validate state schema on save', () => {
      const feature = 'validation-test';
      const invalidState = {
        feature,
        // Missing required fields - version
        status: 'specified' as const,
      } as any;

      expect(() => stateManager.save(invalidState)).toThrow();
    });
  });
});