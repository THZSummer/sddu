/**
 * Integration Tests for Tree Structure Optimization (TASK-040)
 * Full workflow integration tests covering Discovery -> Spec -> Plan -> Tasks -> Build
 */

import { StateMachine } from '../../src/state/machine';
import { StateLoader } from '../../src/state/state-loader';
import { TreeStateValidator } from '../../src/state/tree-state-validator';
import { DiscoveryWorkflowEngine } from '../../src/discovery/workflow-engine';
import { DiscoveryContext } from '../../src/discovery/types';
import * as path from 'path';
import * as fs from 'fs/promises';

// Mock filesystem to control the test environment
// Use requireActual for path so path.join/basename/dirname work correctly
jest.mock('path', () => jest.requireActual('path'));

// In-memory filesystem mock for fs/promises
const mockFiles: Map<string, string> = new Map();
jest.mock('fs/promises', () => ({
  access: jest.fn(async (p: string, _mode?: number) => {
    if (!mockFiles.has(p)) {
      const err: any = new Error(`ENOENT: no such file or directory, access '${p}'`);
      err.code = 'ENOENT';
      throw err;
    }
  }),
  mkdir: jest.fn(async (_p: string, _opts?: any) => {
    // Always succeed
  }),
  writeFile: jest.fn(async (p: string, data: string) => {
    mockFiles.set(p, data);
  }),
  readFile: jest.fn(async (p: string, _encoding: string) => {
    const content = mockFiles.get(p);
    if (content === undefined) {
      const err: any = new Error(`ENOENT: no such file or directory, open '${p}'`);
      err.code = 'ENOENT';
      throw err;
    }
    return content;
  }),
  // Stub readdir used by tree-scanner during loadAll()
  readdir: jest.fn(async (_dirPath: string) => {
    return [] as any;
  }),
  stat: jest.fn(async (_p: string) => {
    const err: any = new Error(`ENOENT: no such file or directory`);
    err.code = 'ENOENT';
    throw err;
  }),
}));

describe('Tree Structure Full Workflow Integration Tests (TASK-040)', () => {
  let stateMachine: StateMachine;
  let stateLoader: StateLoader;
  let validator: TreeStateValidator;
  let discoveryEngine: DiscoveryWorkflowEngine;

  const testDataPath = '.sddu/specs-tree-integration-test';

  beforeEach(async () => {
    mockFiles.clear();
    stateLoader = new StateLoader(testDataPath);
    stateMachine = new StateMachine(testDataPath);
    stateMachine['stateLoader'] = stateLoader;
    
    validator = new TreeStateValidator(stateLoader);
    discoveryEngine = new DiscoveryWorkflowEngine({}, stateMachine);
  });

  afterEach(async () => {
    // Clean up test data
    jest.clearAllMocks();
    mockFiles.clear();
  });

  /** Write required artifact files for a phase transition (mock filesystem) */
  async function writeArtifactFiles(featurePath: string, targetPhase: string): Promise<void> {
    const requiredByPhase: Record<string, string[]> = {
      'registered': [],
      'discovered': ['discovery.md'],
      'specified':  ['spec.md'],
      'planned':    ['spec.md', 'plan.md'],
      'tasked':     ['spec.md', 'plan.md', 'tasks.md'],
      'builded':    ['spec.md', 'plan.md', 'tasks.md'],
      'reviewed':   ['spec.md', 'plan.md', 'tasks.md', 'review.md'],
      'validated':  ['spec.md', 'plan.md', 'tasks.md', 'review.md', 'validation.md'],
    };
    const files = requiredByPhase[targetPhase] || [];
    for (const file of files) {
      const filePath = path.join(testDataPath, featurePath, file);
      await fs.writeFile(filePath, `// mock ${file} content`);
    }
  }

  describe('FR-120: Complete workflow from Discovery to Validate', () => {
    test('full workflow creates compliant state.json at each step for a leaf feature', async () => {
      const featurePath = 'specs-tree-integration-test/specs-tree-sample-feature';
      
      // Stage 1: Create using StateMachine - should auto-populate with StateLoader enhancements
      const initialFeature = await stateMachine.createFeature('Sample Integration Feature', featurePath);
      
      // Validate the created state has all FR-101 requirements (v3.0.0)
      expect(initialFeature.feature).toBe(featurePath);
      expect(initialFeature.version).toBe('v3.0.0');
      expect(initialFeature.depth).toBe(1);  // Based on path with 2 occurrences: ...integration-test -> sample-feature
      expect(initialFeature.phaseHistory).toBeDefined();
      expect(initialFeature.phaseHistory.length).toBeGreaterThan(0);
      expect(initialFeature.dependencies).toBeDefined();
      expect(initialFeature.files).toBeDefined();
      
      // Validate state via TreeStateValidator to ensure v3.0.0 compliance
      const validationResult = validator.validate(initialFeature);
      expect(validationResult.valid).toBe(true);
      expect(validationResult.state.version).toBe('v3.0.0');
      expect(validationResult.state.depth).toBeDefined();
      
      // Stage 2a: Update to discovered phase (v3.0.0: phase order is sequential)
      // discovery.md is optional; skip writing for discovered
      const discoveredFeature = await stateMachine.updateState(
        featurePath, 
        'discovered', 
        initialFeature,
        'IntegrationTest',
        'Updated to discovered'
      );
      
      expect(discoveredFeature.phase).toBe('discovered');
      expect(discoveredFeature.status).toBe('tracked');
      
      // Stage 2b: Update to specified phase — needs spec.md
      await writeArtifactFiles(featurePath, 'specified');
      const specifiedFeature = await stateMachine.updateState(
        featurePath, 
        'specified', 
        discoveredFeature,
        'IntegrationTest',
        'Updated to specified'
      );
      
      expect(specifiedFeature.phase).toBe('specified');
      expect(specifiedFeature.status).toBe('tracked');
      
      // Validate specified state
      const validationAfterSpec = validator.validate(specifiedFeature);
      expect(validationAfterSpec.valid).toBe(true);
      expect(validationAfterSpec.autoFixed.length).toBe(0);  // Should be properly formed from start
      
      // Stage 3: Update to planned phase — needs spec.md + plan.md
      await writeArtifactFiles(featurePath, 'planned');
      const plannedFeature = await stateMachine.updateState(
        featurePath,
        'planned',
        specifiedFeature,
        'IntegrationTest',
        'Updated to planned'
      );
      
      expect(plannedFeature.phase).toBe('planned');
      expect(plannedFeature.status).toBe('tracked');
      
      // All updates should maintain schema compliance
      const validationAfterPlan = validator.validate(plannedFeature);
      expect(validationAfterPlan.valid).toBe(true);
    });

    test('works correctly with parent features and does not proceed too far', async () => {
      const parentPath = 'specs-tree-integration-parent';
      const childPath = 'specs-tree-integration-parent/specs-tree-integration-child';
      
      // Create parent and child features
      const parentFeature = await stateMachine.createFeature('Parent Feature', parentPath);
      const childFeature = await stateMachine.createFeature('Child Feature', childPath);
      
      // Verify that depth is calculated properly based on path nesting
      expect(parentFeature.depth).toBe(0); // Root under integration-test 
      expect(childFeature.depth).toBe(1);  // Nested under parent
      
      // Step through phases sequentially: registered → discovered → specified → planned → tasked → builded
      const childDiscovered = await stateMachine.updateState(
        childPath,
        'discovered',
        childFeature,
        'IntegrationTest',
        'Child to discovered'
      );
      await writeArtifactFiles(childPath, 'specified');
      const childSpecified = await stateMachine.updateState(
        childPath,
        'specified',
        childDiscovered,
        'IntegrationTest',
        'Child to specified'
      );
      await writeArtifactFiles(childPath, 'planned');
      const childPlanned = await stateMachine.updateState(
        childPath,
        'planned',
        childSpecified,
        'IntegrationTest',
        'Child to planned'
      );
      await writeArtifactFiles(childPath, 'tasked');
      const childTasked = await stateMachine.updateState(
        childPath,
        'tasked',
        childPlanned,
        'IntegrationTest',
        'Child to tasked'
      );
      
      // Attempt to update child to build phase (v3.0.0: 'builded' replaces 'implementing'/'building')
      await writeArtifactFiles(childPath, 'builded');
      const updatedChild = await stateMachine.updateState(
        childPath,
        'builded',
        childTasked,
        'IntegrationTest',
        'Updating child to build phase'
      );
      
      const childPostUpdate = await stateMachine.getState(childPath);
      expect(childPostUpdate?.phase).toBe('builded');
      expect(childPostUpdate?.status).toBe('tracked');
      expect(childPostUpdate?.depth).toBe(1);
      
      // Verify child is stored properly in parent's childrens array when scanned
      // Note: This test verifies structure rather than actual integration since scanning happens separately      
      expect(childPostUpdate?.feature).toBe(childPath);
    });
  });

  describe('FR-102/FR-103: Integration with TreeStateValidator enhancements', () => {
    test('StateMachine creation calls StateLoader which internally calls TreeStateValidator for auto-filling', async () => {
      const testFeaturePath = 'specs-tree-test-auto-fill';
      
      const createdFeature = await stateMachine.createFeature('Auto Fill Test', testFeaturePath);
      
      // Verify the automatically populated fields match TreeStateValidator behavior (v3.0.0)
      expect(createdFeature.version).toBe('v3.0.0');
      expect(createdFeature.depth).toBeDefined();  // Should be computed based on path
      expect(createdFeature.phaseHistory).toBeDefined();
      expect(createdFeature.files).toBeDefined();
      expect(createdFeature.files.spec).toBeDefined();
    });
  });

  describe('FR-123: Cross-tree dependency resolution in integrated workflow', () => {
    test('dependencies between different features in the tree can be established and maintained', async () => {
      const parentPath = 'specs-tree-dep-test/specs-tree-parent';
      const childPath = 'specs-tree-dep-test/specs-tree-child';
      const externalPath = 'specs-tree-dep-external';
      
      // Create three features
      const parent = await stateMachine.createFeature('Parent for Dep Test', parentPath);
      const child = await stateMachine.createFeature('Child for Dep Test', childPath);
      const external = await stateMachine.createFeature('External Dep', externalPath);
      
      // Step through phases to get child to 'tasked' where dependencies can be set
      const childDiscovered = await stateMachine.updateState(
        childPath,
        'discovered',
        child,
        'IntegrationTest',
        'Child to discovered'
      );
      await writeArtifactFiles(childPath, 'specified');
      const childSpecified = await stateMachine.updateState(
        childPath,
        'specified',
        childDiscovered,
        'IntegrationTest',
        'Child to specified'
      );
      await writeArtifactFiles(childPath, 'planned');
      const childPlanned = await stateMachine.updateState(
        childPath,
        'planned',
        childSpecified,
        'IntegrationTest',
        'Child to planned'
      );
      
      // Manually update child to depend on external feature
      await writeArtifactFiles(childPath, 'tasked');
      const updatedChild = await stateMachine.updateState(
        childPath,
        'tasked',
        {
          ...childPlanned,
          dependencies: {
            on: [externalPath],
            blocking: []
          }
        } as any,
        'IntegrationTest',
        'Added dependency on external'
      );
      
      // Verify dependency was saved
      const retrievedChild = await stateMachine.getState(childPath);
      expect(retrievedChild?.dependencies.on).toContain(externalPath);
    });

    test('child nodes can access parent and sibling states via state loader', async () => {
      const parentPath = 'specs-tree-access-parent';
      const child1Path = 'specs-tree-access-parent/specs-tree-sibling-1';
      const child2Path = 'specs-tree-access-parent/specs-tree-sibling-2';
      
      const parent = await stateMachine.createFeature('Access Test Parent', parentPath);
      const child1 = await stateMachine.createFeature('Sibling 1', child1Path);
      const child2 = await stateMachine.createFeature('Sibling 2', child2Path);
      
      // Verify all have correct depths calculated
      const retrievedParent = await stateMachine.getState(parentPath);
      const retrievedChild1 = await stateMachine.getState(child1Path);
      const retrievedChild2 = await stateMachine.getState(child2Path);
      
      expect(retrievedParent?.depth || 0).toBeLessThan(retrievedChild1?.depth || 0);
      expect(retrievedChild1?.depth).toBe(retrievedChild2?.depth);
    });
  });

  describe('E2E Validation through Task-024', () => {
    test('integration with E2E validation scenarios works properly', async () => {
      // Create the specific scenario that E2E tests expect
      const parentPath = 'specs-tree-e2e-parent';
      const childAPath = 'specs-tree-e2e-parent/specs-tree-e2e-child-a';
      const childBPath = 'specs-tree-e2e-parent/specs-tree-e2e-child-b';
      const standalonePath = 'specs-tree-e2e-standalone';
      
      const parent = await stateMachine.createFeature('E2E Test Parent', parentPath);
      const childA = await stateMachine.createFeature('Child A', childAPath);
      const childB = await stateMachine.createFeature('Child B', childBPath);
      const standalone = await stateMachine.createFeature('Standalone', standalonePath);
      
      // Step through phases sequentially to reach desired states
      // Parent: registered → discovered → specified → planned
      const parentDiscovered = await stateMachine.updateState(
        parentPath,
        'discovered',
        parent,
        'IntegrationTest',
        'Parent to discovered'
      );
      await writeArtifactFiles(parentPath, 'specified');
      const parentSpecified = await stateMachine.updateState(
        parentPath,
        'specified',
        parentDiscovered,
        'IntegrationTest',
        'Parent to specified'
      );
      
      // Update the parent to have children info (v3.0.0 format)
      // In real usage, a parent's childrens array would be updated during scans
      await writeArtifactFiles(parentPath, 'planned');
      const updatedParent = await stateMachine.updateState(
        parentPath,
        'planned',
        {
          ...parentSpecified,
          childrens: [
            {
              path: childAPath,
              featureName: 'Child A',
              phase: 'specified',
              status: 'tracked',
              lastModified: new Date().toISOString()
            },
            {
              path: childBPath,
              featureName: 'Child B',
              phase: 'discovered',
              status: 'tracked',
              lastModified: new Date().toISOString()
            }
          ]
        } as any,
        'IntegrationTest',
        'Updated Parent childrens'
      );
      
      // ChildA: registered → discovered → specified → planned → tasked
      const childADiscovered = await stateMachine.updateState(
        childAPath,
        'discovered',
        childA,
        'IntegrationTest',
        'ChildA to discovered'
      );
      await writeArtifactFiles(childAPath, 'specified');
      const childASpecified = await stateMachine.updateState(
        childAPath,
        'specified',
        childADiscovered,
        'IntegrationTest',
        'ChildA to specified'
      );
      await writeArtifactFiles(childAPath, 'planned');
      const childAPlanned = await stateMachine.updateState(
        childAPath,
        'planned',
        childASpecified,
        'IntegrationTest',
        'ChildA to planned'
      );
      
      // Update dependencies as in E2E test scenario
      await writeArtifactFiles(childAPath, 'tasked');
      await stateMachine.updateState(
        childAPath,
        'tasked',
        {
          ...childAPlanned,
          dependencies: {
            on: [standalonePath],
            blocking: []
          }
        } as any,
        'IntegrationTest',
        'ChildA dependson standalone'
      );
      
      // ChildB: registered → discovered → specified
      const childBDiscovered = await stateMachine.updateState(
        childBPath,
        'discovered',
        childB,
        'IntegrationTest',
        'ChildB to discovered'
      );
      
      await writeArtifactFiles(childBPath, 'specified');
      await stateMachine.updateState(
        childBPath,
        'specified',
        {
          ...childBDiscovered,
          dependencies: {
            on: [childAPath],  // Cross-subtree reference for dependency testing
            blocking: []
          }
        } as any,
        'IntegrationTest',
        'ChildB dependson childA'
      );
      
      // Verify state consistency matches E2E expectations 
      const finalParent = await stateMachine.getState(parentPath);
      const finalChildA = await stateMachine.getState(childAPath);
      const finalChildB = await stateMachine.getState(childBPath);
      const finalStandalone = await stateMachine.getState(standalonePath);
      
      expect(finalParent?.childrens?.length).toBe(2);
      expect(finalChildA?.dependencies.on).toContain(standalonePath);
      expect(finalChildB?.dependencies.on).toContain(childAPath);
    });
  });
});
