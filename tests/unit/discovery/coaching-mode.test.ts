/**
 * Discovery Coaching Mode Tests
 */

import { CoachingModeEngine, CoachingLevel } from '../../src/discovery/coaching-mode';
import { DiscoveryContext } from '../../src/discovery/types';

describe('CoachingModeEngine', () => {
  let engine: CoachingModeEngine;
  
  beforeEach(() => {
    engine = new CoachingModeEngine();
  });
  
  test('should detect idea level for short inputs', () => {
    const level = engine.detectLevel('I think we need a login system');
    expect(level).toBe(CoachingLevel.IDEA_STAGE);
  });
  
  test('should detect pain level based on keywords', () => {
    const level = engine.detectLevel('The login page is slow and users are complaining');
    expect(level).toBe(CoachingLevel.PAIN_STAGE);
  });
  
  test('should detect solution level based on keywords', () => {
    const level = engine.detectLevel('We need to implement OAuth with Google and Facebook');
    expect(level).toBe(CoachingLevel.SOLUTION_STAGE);
  });
  
  test('should detect execution level for detailed text', () => {
    const level = engine.detectLevel('This has been launched in production since Jan 2026. We observed 15% increase in login rate.');
    expect(level).toBe(CoachingLevel.EXECUTION_STAGE);
  });
  
  test('should use manually specified level if provided', () => {
    const level = engine.detectLevel('', CoachingLevel.SOLUTION_STAGE);
    expect(level).toBe(CoachingLevel.SOLUTION_STAGE);
  });
  
  test('should return correct guidance strategy', () => {
    const strategy = engine.getGuidanceStrategy(CoachingLevel.IDEA_STAGE);
    expect(strategy.level).toBe(CoachingLevel.IDEA_STAGE);
    expect(strategy.intervention).toBe('high');
  });
  
  test('should adjust prompts by level', () => {
    const prompts = ['How can we improve?', 'What is the problem?'];
    const adjusted = engine.adjustPromptsByLevel(prompts, CoachingLevel.IDEA_STAGE);
    
    expect(adjusted).toHaveLength(2);
    expect(adjusted[0]).toContain('[Detailed Guidance]');
  });
});