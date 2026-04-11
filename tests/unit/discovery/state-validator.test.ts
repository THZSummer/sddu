/**
 * Discovery State Validator Tests
 */

import { DiscoveryStateValidator } from '../../src/discovery/state-validator';
import { StateMachine } from '../../src/state/machine';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('DiscoveryStateValidator', () => {
  let stateMachine: StateMachine;
  let validator: DiscoveryStateValidator;
  
  // Create temporary test directory
  const testDir = '.temp-test-discovery';
  
  beforeEach(async () => {
    // Create temp specs tree
    await fs.mkdir(path.join(testDir, '.sdd'), { recursive: true });
    
    // Initialize state machine with temp directory
    stateMachine = new StateMachine(testDir);
    validator = new DiscoveryStateValidator(stateMachine);
    
    // Make sure we use the same test directory for the state machine
    (stateMachine as any).specsDir = testDir + '/.sdd/specs-tree-root';
    await fs.mkdir((stateMachine as any).specsDir, { recursive: true });
  });
  
  afterEach(async () => {
    // Cleanup test directories
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });
  
  test('should validate transition from drafting to discovered when discovery.md exists', async () => {
    // Create a feature in 'drafting' state
    const featureState = await stateMachine.createFeature('test-feature');
    
    // Create discovery.md file
    const discoveryPath = path.join((stateMachine as any).specsDir, featureState.id, 'discovery.md');
    await fs.mkdir(path.dirname(discoveryPath), { recursive: true });
    await fs.writeFile(discoveryPath, '# Test Discovery\n\n## Problem Statement\nTest content.');
    
    const result = await validator.canTransitionToDiscovered(featureState.id);
    expect(result.canTransition).toBeTruthy();
    expect(result.discoveryExists).toBeTruthy();
  });
  
  test('should still allow transition when discovery.md does not exist (optional feature)', async () => {
    // Create a feature in 'drafting' state
    const featureState = await stateMachine.createFeature('test-feature-no-discovery');
    
    // Don't create discovery.md, just have the base dir
    await fs.mkdir(path.join((stateMachine as any).specsDir, featureState.id), { recursive: true });
    
    const result = await validator.canTransitionToDiscovered(featureState.id);
    expect(result.canTransition).toBeTruthy(); // Should still allow since discovery is optional
    expect(result.warning).toBeDefined(); // But should show a warning
  });
  
  test('should reject transition if feature does not exist', async () => {
    const result = await validator.canTransitionToDiscovered('non-existent-feature');
    expect(result.canTransition).toBeFalsy();
    expect(result.reason).toContain('Feature 不存在');
  });
  
  test('should reject transition if current state is not drafting', async () => {
    // Create a feature and set its state to 'specified'
    await stateMachine.createFeature('test-feature-specified');
    const featureId = 'test-feature-specified';
    
    // Manually update state for test purposes to specified
    // Since the updateState method is protected, we'll simulate the state in memory
    (stateMachine as any).states.set(featureId, {
      id: featureId,
      name: 'Test Feature Specified',
      state: 'specified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: []
    });
    
    const result = await validator.canTransitionToDiscovered(featureId);
    expect(result.canTransition).toBeFalsy();
    expect(result.reason).toContain('只有 drafting 状态可以转移到 discovered 状态');
  });
});