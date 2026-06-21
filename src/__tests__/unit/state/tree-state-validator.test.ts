import * as fs from 'fs';
import * as path from 'path';
import { TreeStateValidator } from '../../../state/tree-state-validator';
import { StateLoader } from '../../../state/state-loader';
import { StateV3_0_0, Phase, FeatureStatus } from '../../../state/schema-v3.0.0';
import { scanTreeStructure, FeatureTreeNode, ScanResult, isParentFeature } from '../../../state/tree-scanner';

// ============================================================================
// Mock scanTreeStructure — tests use synthetic paths that don't exist on disk.
// ============================================================================
jest.mock('../../../state/tree-scanner', () => {
  const actual = jest.requireActual('./tree-scanner');
  return {
    ...actual,
    scanTreeStructure: jest.fn(),
    isParentFeature: actual.isParentFeature,
  };
});

const mockedScanTreeStructure = scanTreeStructure as jest.MockedFunction<
  typeof scanTreeStructure
>;

/** Build the minimal default mock tree (no parent/child to avoid side-effects). */
function buildMockTree(): ScanResult {
  const testNode: FeatureTreeNode = {
    id: 'specs-tree-test',
    path: '/path/to/specs-tree-test',
    featureName: 'test',
    level: 0,
    children: [],
  };

  const nodeA: FeatureTreeNode = {
    id: 'specs-tree-a',
    path: '/path/to/specs-tree-a',
    featureName: 'a',
    level: 0,
    children: [],
  };

  const nodeB: FeatureTreeNode = {
    id: 'specs-tree-b',
    path: '/path/to/specs-tree-b',
    featureName: 'b',
    level: 0,
    children: [],
  };

  const nodeSingle: FeatureTreeNode = {
    id: 'specs-tree-single',
    path: '/path/to/specs-tree-single',
    featureName: 'single',
    level: 0,
    children: [],
  };

  const nodes = [testNode, nodeA, nodeB, nodeSingle];
  const flatMap = new Map<string, FeatureTreeNode>();
  for (const n of nodes) flatMap.set(n.path, n);

  return { nodes, flatMap };
}

/** Build a mock tree that includes parent/child for depth and parent-child relation tests. */
function buildParentMockTree(): ScanResult {
  const childNode: FeatureTreeNode = {
    id: 'specs-tree-child',
    path: '/path/to/specs-tree-parent/specs-tree-child',
    featureName: 'child',
    level: 1,
    children: [],
    parent: '/path/to/specs-tree-parent',
  };

  const parentNode: FeatureTreeNode = {
    id: 'specs-tree-parent',
    path: '/path/to/specs-tree-parent',
    featureName: 'parent',
    level: 0,
    children: [childNode],
  };

  const nodes = [parentNode, childNode];
  const flatMap = new Map<string, FeatureTreeNode>();
  for (const n of nodes) flatMap.set(n.path, n);

  return { nodes, flatMap };
}

// Create a mock StateLoader for testing purposes
class MockStateLoader {
  stateMap: Map<string, StateV3_0_0> = new Map();
  // Adding required private properties
  private cache: Map<string, any> = new Map();
  private cacheExpiryMs: number = 3000;
  private specRootDir: string = '.sddu/specs-tree-root';

  async loadAll(): Promise<Map<string, StateV3_0_0>> {
    // This would scan the tree and return all states, simplified for testing
    return this.stateMap;
  }

  async get(featurePath: string): Promise<StateV3_0_0 | null> {
    if (this.stateMap.has(featurePath)) {
      return this.stateMap.get(featurePath) || null;
    }
    return null;
  }

  async set(featurePath: string, state: StateV3_0_0): Promise<boolean> {
    this.stateMap.set(featurePath, state);
    return true;
  }

  async create(featurePath: string, initialState: StateV3_0_0): Promise<boolean> {
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

// Helper: create a v3.0.0-compliant state object
function makeV3State(overrides: Partial<StateV3_0_0> = {}): StateV3_0_0 {
  return {
    feature: 'test-feature',
    version: 'v3.0.0',
    phase: 'builded',
    status: 'tracked',
    depth: 0,
    phaseHistory: [{
      phase: 'specified',
      timestamp: '2026-01-01T00:00:00.000Z',
      triggeredBy: 'test-agent'
    }],
    files: { spec: 'spec.md' },
    dependencies: { on: [], blocking: [] },
    childrens: [],
    ...overrides,
  };
}

describe('TreeStateValidator', () => {
  let validator: TreeStateValidator;
  let mockStateLoader: MockStateLoader;

  beforeEach(() => {
    mockStateLoader = new MockStateLoader();
    validator = new TreeStateValidator(mockStateLoader as any);
    mockedScanTreeStructure.mockResolvedValue(buildMockTree());
  });

  describe('validateTree', () => {
    it('should validate a correct tree structure', async () => {
      const validState = makeV3State({
        feature: 'test-feature',
      });

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
        phase: 'builded',
        status: 'tracked',
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
      // Invalid version that triggers v3.0.0 schema validation failure
      const invalidVersionState: any = {
        feature: 'test-feature',
        version: '2.1.0', // Missing 'v' prefix AND wrong version — triggers schema validation
        phase: 'builded',
        status: 'tracked',
        depth: 0,
        phaseHistory: [{
          phase: 'specified',
          timestamp: '2026-01-01T00:00:00.000Z',
          triggeredBy: 'test-agent'
        }],
        files: { spec: 'spec.md' },
        dependencies: { on: [], blocking: [] }
      };

      mockStateLoader.stateMap.set('/path/to/specs-tree-test', invalidVersionState);

      const result = await validator.validateTree('/path');

      expect(result.valid).toBe(false);
      // v3.0.0 validator reports this as an invalid schema (version must be 'v3.0.0')
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'TREE_INVALID_SCHEMA'
      }));
    });

    it('should detect invalid depth', async () => {
      mockedScanTreeStructure.mockResolvedValue(buildParentMockTree());

      const inconsistentDepthState = makeV3State({
        feature: 'parent-feature',
        depth: 5,  // Wrong depth - should be 0 based on node.level
      });

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
      const validState = makeV3State({
        feature: 'test-feature',
      });

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
      const invalidVersionState: any = {
        feature: 'test-feature',
        version: '2.1.0', // Missing 'v' prefix — v3.0.0 schema rejects this
        phase: 'builded',
        status: 'tracked',
        depth: 0,
        phaseHistory: [{
          phase: 'specified',
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
      mockedScanTreeStructure.mockResolvedValue(buildParentMockTree());

      const parentState = makeV3State({
        feature: 'parent-feature',
        childrens: [
          { path: '/path/to/specs-tree-parent/specs-tree-child', featureName: 'child', phase: 'builded', status: 'tracked', lastModified: '2026-01-01T00:00:00.000Z' }
        ]
      });

      mockStateLoader.stateMap.set('/path/to/specs-tree-parent', parentState);

      const result = await validator.validateParentChildRelations('/path/to/specs-tree-parent');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing children in parent state', async () => {
      mockedScanTreeStructure.mockResolvedValue(buildParentMockTree());

      const parentState = makeV3State({
        feature: 'parent-feature',
        childrens: []  // Missing child that actually exists in directory
      });

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
      // Two features depending on each other — dep IDs must be substrings of state map keys.
      const featureA = makeV3State({
        feature: 'specs-tree-a',
        dependencies: { on: ['specs-tree-b'], blocking: [] }
      });

      const featureB = makeV3State({
        feature: 'specs-tree-b',
        dependencies: { on: ['specs-tree-a'], blocking: [] }  // Circular dependency: B depends on A
      });

      mockStateLoader.stateMap.set('/path/to/specs-tree-a', featureA);
      mockStateLoader.stateMap.set('/path/to/specs-tree-b', featureB);

      const cycles = await validator.detectCircularDependencies('/path');

      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should return empty array when no circular dependencies exist', async () => {
      const singleFeature = makeV3State({
        feature: 'single-feature',
        dependencies: { on: [], blocking: [] }
      });

      mockStateLoader.stateMap.set('/path/to/specs-tree-single', singleFeature);

      const cycles = await validator.detectCircularDependencies('/path');

      expect(cycles).toHaveLength(0);
    });
  });
});
