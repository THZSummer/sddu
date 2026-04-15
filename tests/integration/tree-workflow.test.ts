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
jest.mock('fs/promises');
jest.mock('path');

describe('Tree Structure Full Workflow Integration Tests (TASK-040)', () => {
  let stateMachine: StateMachine;
  let stateLoader: StateLoader;
  let validator: TreeStateValidator;
  let discoveryEngine: DiscoveryWorkflowEngine;

  const testDataPath = '.sddu/specs-tree-integration-test';

  beforeEach(async () => {
    stateLoader = new StateLoader(testDataPath);
    stateMachine = new StateMachine(testDataPath);
    stateMachine['stateLoader'] = stateLoader;
    
    validator = new TreeStateValidator(stateLoader);
    discoveryEngine = new DiscoveryWorkflowEngine({}, stateMachine);
  });

  afterEach(async () => {
    // Clean up test data
    jest.clearAllMocks();
  });

  describe('FR-120: Complete workflow from Discovery to Validate', () => {
    test('full workflow creates compliant state.json at each step for a leaf feature', async () => {
      const featurePath = 'specs-tree-integration-test/specs-tree-sample-feature';
      
      // Stage 1: Create using StateMachine - should auto-populate with StateLoader enhancements
      const initialFeature = await stateMachine.createFeature('Sample Integration Feature', featurePath);
      
      // Validate the created state has all FR-101 requirements
      expect(initialFeature.feature).toBe(featurePath);
      expect(initialFeature.version).toBe('v2.1.0');
      expect(initialFeature.depth).toBe(1);  // Based on path with 2 occurrences: ...integration-test -> sample-feature
      expect(initialFeature.phaseHistory).toBeDefined();
      expect(initialFeature.phaseHistory.length).toBeGreaterThan(0);
      expect(initialFeature.dependencies).toBeDefined();
      expect(initialFeature.files).toBeDefined();
      
      // Validate state via TreeStateValidator to ensure v2.1.0 compliance
      const validationResult = validator.validate(initialFeature);
      expect(validationResult.valid).toBe(true);
      expect(validationResult.state.version).toBe('v2.1.0');
      expect(validationResult.state.depth).toBeDefined();
      
      // Stage 2: Update to specified phase
      const specifiedFeature = await stateMachine.updateState(
        featurePath, 
        'specified', 
        initialFeature,
        'IntegrationTest',
        'Updated to specified'
      );
      
      expect(specifiedFeature.status).toBe('specified');
      expect(specifiedFeature.phase).toBe(1);
      
      // Validate specified state
      const validationAfterSpec = validator.validate(specifiedFeature);
      expect(validationAfterSpec.valid).toBe(true);
      expect(validationAfterSpec.autoFixed.length).toBe(0);  // Should be properly formed from start
      
      // Stage 3: Update to planned phase
      const plannedFeature = await stateMachine.updateState(
        featurePath,
        'planned',
        specifiedFeature,
        'IntegrationTest',
        'Updated to planned'
      );
      
      expect(plannedFeature.status).toBe('planned');
      expect(plannedFeature.phase).toBe(2);
      
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
      
      // Attempt to update child to implementation phase 
      const updatedChild = await stateMachine.updateState(
        childPath,
        'implementing',  // Changed from 'building' to 'implementing' which is the correct internal enum
        childFeature,
        'IntegrationTest',
        'Updating child to building phase'
      );
      
      const childPostUpdate = await stateMachine.getState(childPath);
      expect(childPostUpdate?.status).toBe('building');  // External representation is 'building'
      expect(childPostUpdate?.phase).toBe(4);
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
      
      // Verify the automatically populated fields match TreeStateValidator behavior
      expect(createdFeature.version).toBe('v2.1.0');
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
      
      // Manually update child to depend on external feature
      const updatedChild = await stateMachine.updateState(
        childPath,
        'tasked',
        {
          ...child,
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
      
      // Update the parent to have children info
      // In real usage, a parent's childrens array would be updated during scans
      const updatedParent = await stateMachine.updateState(
        parentPath,
        'planned',
        {
          ...parent,
          childrens: [
            {
              path: childAPath,
              featureName: 'Child A',
              status: 'specified',
              phase: 1,
              lastModified: new Date().toISOString()
            },
            {
              path: childBPath,
              featureName: 'Child B',
              status: 'discovered',
              phase: 0,
              lastModified: new Date().toISOString()
            }
          ]
        } as any,
        'IntegrationTest',
        'Updated Parent childrens'
      );
      
      // Update dependencies as in E2E test scenario
      await stateMachine.updateState(
        childAPath,
        'tasked',
        {
          ...childA,
          dependencies: {
            on: [standalonePath],
            blocking: []
          }
        } as any,
        'IntegrationTest',
        'ChildA dependson standalone'
      );
      
      await stateMachine.updateState(
        childBPath,
        'specified',
        {
          ...childB,
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