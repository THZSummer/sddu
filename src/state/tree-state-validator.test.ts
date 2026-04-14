import * as fs from 'fs';
import * as path from 'path';
import { TreeStateValidator } from './tree-state-validator';
import { StateLoader } from './state-loader';
import { StateV2_1_0 } from './schema-v2.0.0';
import { scanTreeStructure } from './tree-scanner';

// Create a mock StateLoader for testing purposes
class MockStateLoader {
  stateMap: Map<string, StateV2_1_0> = new Map();
  // Adding required private properties
  private cache: Map<string, any> = new Map();
  private cacheExpiryMs: number = 3000;
  private specRootDir: string = '.sddu/specs-tree-root';

  async loadAll(): Promise<Map<string, StateV2_1_0>> {
    // This would scan the tree and return all states, simplified for testing
    return this.stateMap;
  }

  async get(featurePath: string): Promise<StateV2_1_0 | null> {
    if (this.stateMap.has(featurePath)) {
      return this.stateMap.get(featurePath) || null;
    }
    return null;
  }

  async set(featurePath: string, state: StateV2_1_0): Promise<boolean> {
    this.stateMap.set(featurePath, state);
    return true;
  }

  async create(featurePath: string, initialState: StateV2_1_0): Promise<boolean> {
    if (!this.stateMap.has(featurePath)) {
      this.stateMap.set(featurePath, initialState);
      return true;
    }
    return false;
  }

  async getTreeStructure() {
    // Call the actual function but mock the result in the tests via jest.mock
    return scanTreeStructure('.sddu/specs-tree-root');
  }

  clearCache?(): void {}
}

describe('TreeStateValidator', () => {
  let validator: TreeStateValidator;
  let mockStateLoader: MockStateLoader;

  beforeEach(() => {
    mockStateLoader = new MockStateLoader();
    validator = new TreeStateValidator(mockStateLoader as any);
  });

  describe('validateTree', () => {
    it('should validate a correct tree structure', async () => {
      const validState: StateV2_1_0 = {
        feature: 'test-feature',
        version: 'v2.1.0',
        status: 'building',
        phase: 4,
        phaseHistory: [{
          phase: 1,
          status: 'building',
          timestamp: '2026-01-01T00:00:00.000Z',
          triggeredBy: 'test-agent'
        }],
        files: { spec: 'spec.md' },
        dependencies: { on: [], blocking: [] },
        depth: 0,
        childrens: []
      };

      mockStateLoader.stateMap.set('/path/to/specs-tree-test', validState);

      const result = await validator.validateTree('/path');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect invalid schema in feature states', async () => {
      // State missing required field
      const invalidState = {
        feature: 'test-feature',
        // missing version field
        status: 'building',
        phase: 4,
        phaseHistory: [],
        files: { spec: 'spec.md' },
        dependencies: { on: [], blocking: [] }
      };

      mockStateLoader.stateMap.set('/path/to/specs-tree-test', invalidState as any);

      const result = await validator.validateTree('/path');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'TREE_INVALID_SCHEMA'
      }));
    });

    it('should detect incorrect version format', async () => {
      // This should have wrong type on purpose, but in the test, 
      // let's temporarily disable strict typing to pass validation
      const invalidVersionState: any = {
        feature: 'test-feature',
        version: '2.1.0', // Missing 'v' prefix - will fail validation check
        status: 'building',
        phase: 4,
        phaseHistory: [{
          phase: 1,
          status: 'building',
          timestamp: '2026-01-01T00:00:00.000Z',
          triggeredBy: 'test-agent'
        }],
        files: { spec: 'spec.md' },
        dependencies: { on: [], blocking: [] }
      };

      mockStateLoader.stateMap.set('/path/to/specs-tree-test', invalidVersionState);

      const result = await validator.validateTree('/path');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'TREE_INVALID_VERSION_FORMAT',
        message: expect.stringContaining(`got '2.1.0'`)
      }));
    });

    it('should detect invalid depth', async () => {
      const inconsistentDepthState: StateV2_1_0 = {
        feature: 'parent-feature',
        version: 'v2.1.0',
        status: 'building',
        phase: 4,
        phaseHistory: [{
          phase: 1,
          status: 'building',
          timestamp: '2026-01-01T00:00:00.000Z',
          triggeredBy: 'test-agent'
        }],
        files: { spec: 'spec.md' },
        dependencies: { on: [], blocking: [] },
        depth: 5,  // Wrong depth - should be 0 based on node.level
        childrens: []
      };

      mockStateLoader.stateMap.set('/path/to/specs-tree-parent', inconsistentDepthState);

      const result = await validator.validateTree('/path');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'TREE_INVALID_DEPTH',
        message: expect.stringContaining('has depth 5, but expected depth 0')
      }));
    });
  });

  describe('validateFeature', () => {
    it('should validate a single valid feature', async () => {
      const validState: StateV2_1_0 = {
        feature: 'test-feature',
        version: 'v2.1.0',
        status: 'building',
        phase: 4,
        phaseHistory: [{
          phase: 1,
          status: 'building',
          timestamp: '2026-01-01T00:00:00.000Z',
          triggeredBy: 'test-agent'
        }],
        files: { spec: 'spec.md' },
        dependencies: { on: [], blocking: [] },
        childrens: []
      };

      mockStateLoader.stateMap.set('/path/to/specs-tree-test', validState);

      const result = await validator.validateFeature('/path/to/specs-tree-test');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect missing feature state file', async () => {
      const result = await validator.validateFeature('/nonexistent/path');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'FEATURE_STATE_MISSING',
        path: '/nonexistent/path'
      }));
    });

    it('should detect incorrect version format in feature', async () => {
      const invalidVersionState: any = {  // Using 'any' to bypass strict typing for this test
        feature: 'test-feature',
        version: '2.1.0', // Missing 'v' prefix
        status: 'building',
        phase: 4,
        phaseHistory: [{
          phase: 1,
          status: 'building',
          timestamp: '2026-01-01T00:00:00.000Z',
          triggeredBy: 'test-agent'
        }],
        files: { spec: 'spec.md' },
        dependencies: { on: [], blocking: [] }
      };

      mockStateLoader.stateMap.set('/path/to/specs-tree-test', invalidVersionState);

      const result = await validator.validateFeature('/path/to/specs-tree-test');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'FEATURE_INVALID_VERSION_FORMAT'
      }));
    });
  });

  describe('validateParentChildRelations', () => {
    it('should validate proper parent-child relationship', async () => {
      const parentState: StateV2_1_0 = {
        feature: 'parent-feature',
        version: 'v2.1.0',
        status: 'building',
        phase: 4,
        phaseHistory: [{
          phase: 1,
          status: 'building',
          timestamp: '2026-01-01T00:00:00.000Z',
          triggeredBy: 'test-agent'
        }],
        files: { spec: 'spec.md' },
        dependencies: { on: [], blocking: [] },
        childrens: [
          { path: '/path/to/specs-tree-parent/specs-tree-child', featureName: 'child', status: 'building', phase: 4, lastModified: '2026-01-01T00:00:00.000Z' }
        ]
      };

      mockStateLoader.stateMap.set('/path/to/specs-tree-parent', parentState);

      const result = await validator.validateParentChildRelations('/path/to/specs-tree-parent');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing children in parent state', async () => {
      const parentState: StateV2_1_0 = {
        feature: 'parent-feature',
        version: 'v2.1.0',
        status: 'building',
        phase: 4,
        phaseHistory: [{
          phase: 1,
          status: 'building',
          timestamp: '2026-01-01T00:00:00.000Z',
          triggeredBy: 'test-agent'
        }],
        files: { spec: 'spec.md' },
        dependencies: { on: [], blocking: [] },
        childrens: []  // Missing child that actually exists in directory
      };

      mockStateLoader.stateMap.set('/path/to/specs-tree-parent', parentState);

      const result = await validator.validateParentChildRelations('/path/to/specs-tree-parent');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'PARENT_MISSING_CHILD_IN_STATE'
      }));
    });
  });

  describe('detectCircularDependencies', () => {
    it('should detect simple circular dependency', async () => {
      // Two features depending on each other
      const featureA: StateV2_1_0 = {
        feature: 'feature-a',
        version: 'v2.1.0',
        status: 'building',
        phase: 4,
        phaseHistory: [{
          phase: 1,
          status: 'building',
          timestamp: '2026-01-01T00:00:00.000Z',
          triggeredBy: 'test-agent'
        }],
        files: { spec: 'spec.md' },
        dependencies: { on: ['feature-b'], blocking: [] }
      };

      const featureB: StateV2_1_0 = {
        feature: 'feature-b',
        version: 'v2.1.0',
        status: 'building',
        phase: 4,
        phaseHistory: [{
          phase: 1,
          status: 'building',
          timestamp: '2026-01-01T00:00:00.000Z',
          triggeredBy: 'test-agent'
        }],
        files: { spec: 'spec.md' },
        dependencies: { on: ['feature-a'], blocking: [] }  // Circular dependency: B depends on A
      };

      mockStateLoader.stateMap.set('/path/to/specs-tree-a', featureA);
      mockStateLoader.stateMap.set('/path/to/specs-tree-b', featureB);

      const cycles = await validator.detectCircularDependencies('/path');

      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should return empty array when no circular dependencies exist', async () => {
      const singleFeature: StateV2_1_0 = {
        feature: 'single-feature',
        version: 'v2.1.0',
        status: 'building',
        phase: 4,
        phaseHistory: [{
          phase: 1,
          status: 'building',
          timestamp: '2026-01-01T00:00:00.000Z',
          triggeredBy: 'test-agent'
        }],
        files: { spec: 'spec.md' },
        dependencies: { on: [], blocking: [] }
      };

      mockStateLoader.stateMap.set('/path/to/specs-tree-single', singleFeature);

      const cycles = await validator.detectCircularDependencies('/path');

      expect(cycles).toHaveLength(0);
    });
  });
});