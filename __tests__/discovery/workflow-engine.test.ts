/**
 * Discovery Workflow Engine Tests
 */

import { DiscoveryWorkflowEngine } from '../../src/discovery/workflow-engine';
import { DiscoveryContext } from '../../src/discovery/types';

describe('DiscoveryWorkflowEngine', () => {
  let engine: DiscoveryWorkflowEngine;
  
  beforeEach(() => {
    engine = new DiscoveryWorkflowEngine();
  });
  
  test('should initialize workflow engine correctly', () => {
    expect(engine).toBeDefined();
  });
  
  test('should return total of 7 steps', () => {
    const totalSteps = engine.getTotalSteps();
    expect(totalSteps).toBe(7); // There should be 7 steps in the discovery workflow
  });
  
  test('should execute discovery workflow from scratch', async () => {
    const context: DiscoveryContext = {
      featureName: 'test-feature',
      userInput: 'A simple login functionality',
      currentStepIndex: 0,
      data: {}
    };
    
    const result = await engine.execute(context);
    
    expect(result).toBeDefined();
    expect(result.featureName).toBe('test-feature');
    expect(result.currentStepIndex).toBe(7); // All 7 steps completed
  });
  
  test('should calculate progress correctly', () => {
    const context: DiscoveryContext = {
      featureName: 'test-feature',
      userInput: 'A simple login functionality',
      currentStepIndex: 3, // At step 4 of 7
      data: {}
    };
    
    const progress = engine.getCurrentProgress(context);
    expect(progress).toBe(43); // Approximately 3/7 * 100 = 42.86 -> rounded to 43
  });
});