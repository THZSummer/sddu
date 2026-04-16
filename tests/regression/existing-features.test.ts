/**
 * Regression Tests for Tree Structure Optimizations (TASK-041)
 * Ensuring backward compatibility and existing features unaffected
 */

import { 
  TreeStateValidator, 
  ValidationResult  
} from '../../src/state/tree-state-validator';
import { StateV2_1_0, WorkflowStatus } from '../../src/state/schema-v2.0.0';



describe('Tree Structure V2 Backward Compatibility Tests (TASK-041)', () => {
  let validator: TreeStateValidator;

  beforeEach(() => {
    // We'll create validator instances as needed since we can't easily mock the StateLoader dependency here
    validator = new TreeStateValidator({} as any); // Providing a simple mock for this regression test
  });

  describe('NFR-001: Existing features compatibility', () => {
    test('existing feature states can be processed and auto-fixed', () => {
      // Simulate older format with missing fields using `any` to represent real user inputs  
      const mockOldFormat: any = {
        feature: 'existing-feature-with-missing-fields',
        version: 'v2.1.0',  // Proper format
        status: 'specified',
        phase: 1,
        // Intentionally missing: depth, phaseHistory, dependencies, files
      };

      // Test that validation correctly fixes missing fields
      const result: ValidationResult = validator.validate(mockOldFormat);
      
      expect(result.valid).toBe(true);
      expect(result.state.version).toBe('v2.1.0');
      expect(result.state.depth).toBeDefined();
      expect(result.state.phaseHistory).toBeDefined();
      expect(result.state.dependencies).toBeDefined();
      expect(result.state.files).toBeDefined();
  
      // The validator should mark the fixes as autoFixed to track them
      expect(result.autoFixed).toContain('depth');
      expect(result.autoFixed).toContain('phaseHistory');
      expect(result.autoFixed).toContain('dependencies');
      expect(result.autoFixed).toContain('files');
      
      // Check for warning logs when fields are auto-fixed
      expect(result.warnings).not.toHaveLength(0);
    });

    test('fully compliant v2.1.0 states remain valid', () => {
      // States that are already properly formatted should remain valid
      const fullyFormattedState: StateV2_1_0 = {
        feature: "compliant-feature",
        name: "Compliant",
        version: "v2.1.0",
        status: "validated" as WorkflowStatus,
        phase: 6,
        depth: 1,
        phaseHistory: [
          { 
            phase: 1, 
            status: 'specified' as WorkflowStatus, 
            timestamp: '2026-01-01', 
            triggeredBy: 'test' 
          }
        ],
        files: { spec: 'feature/spec.md' },
        dependencies: { on: [], blocking: [] },
      } as any; // Cast to any to allow incomplete for testing

      const result: ValidationResult = validator.validate(fullyFormattedState);
      expect(result.valid).toBe(true);
      expect(result.autoFixed).toHaveLength(0); // Nothing should need fixing in a complete state
    });
  });

  describe('NFR-003: Performance verification', () => {
    test('100 state validations complete within 500ms', async () => {
      const start = Date.now();
      
      // Test batch validation performance
      const promises: Promise<ValidationResult>[] = [];
      for (let i = 0; i < 100; i++) {
        const state: any = {
          feature: `perf-test-${i}`,
          name: `Performance Test Feature ${i}`,
          status: 'specified' as WorkflowStatus,
          phase: 0
        }; // Using `any` to simulate partial states that might need fixing
        
        // Test validation performance
        promises.push(Promise.resolve(validator.validate(state)));
      }
      
      const results = await Promise.all(promises);
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(500); // Less than 500ms for 100 operations
      
      // Verify all results are valid
      expect(results.filter(r => r.valid).length).toBe(100);
      
      // Check that autoFixing worked for missing fields (most should need fixes)
      const hasAutoFixes = results.some(r => r.autoFixed.length > 0);
      expect(hasAutoFixes).toBe(true);
    });
  });

  describe('NFR-007: Automatic repair warnings', () => {
    test('auto-fix operations are logged with appropriate messages', () => {
      const incompleteState: any = {
        feature: 'incomplete',
        phase: 1
        // Missing many required fields
      };

      const result: ValidationResult = validator.validate(incompleteState);
      
      // Should contain warnings about auto-fixes
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.toLowerCase().includes('fixed') || w.toLowerCase().includes('added'))).toBe(true);
      
      // Should specifically mention which fields were auto-fixed
      expect(result.autoFixed).toContain('version');
      expect(result.autoFixed).toContain('status');
      expect(result.autoFixed).toContain('depth');
      expect(result.autoFixed).toContain('dependencies');
      expect(result.autoFixed).toContain('files');
    });

    test('version format repairs are properly identified', () => {
      const stateWithBadVersion: any = {
        feature: 'test',
        version: '2.1.0', // Missing 'v' prefix - though the correct value is provided
        phase: 1
      };
      
      const result: ValidationResult = validator.validate(stateWithBadVersion);
      
      expect(result.state.version).toBe('v2.1.0');
      if (result.autoFixed.includes('version')) {
        // Extra verification only if it fixed the version
        expect(result.warnings.some(w => w.includes('v2.1.0'))).toBe(true);
      }
    });
  });

  describe('Schema compliance fixes from legacy states', () => {
    test('fixes phaseHistory when present but empty by adding entry', () => {
      const stateWithEmptyHistory: any = {
        feature: 'test-empty-history',
        version: 'v2.1.0',
        phase: 2,
        status: 'planned' as WorkflowStatus,
        phaseHistory: [] // Empty array - should be populated
      };
      
      const result: ValidationResult = validator.validate(stateWithEmptyHistory);
      
      expect(result.state.phaseHistory).toBeDefined();
      expect(result.state.phaseHistory.length).toBe(1); // Should have been auto-generated
      expect(result.autoFixed).toContain('phaseHistory');
    });

    test('fills missing dependencies with default structure', () => {
      const stateWithoutDeps: any = {
        feature: 'no-deps',
        version: 'v2.1.0',
        phase: 1,
        status: 'specified' as WorkflowStatus
        // Missing dependencies entirely  
      };
      
      const result: ValidationResult = validator.validate(stateWithoutDeps);
      
      expect(result.state.dependencies).toBeDefined();
      expect(result.state.dependencies.on).toEqual([]);
      expect(result.state.dependencies.blocking).toEqual([]);
      expect(result.autoFixed).toContain('dependencies');
    });

    test('ensures required files structure exists', () => {
      const stateWithoutFiles: any = {
        feature: 'specs-tree-no-files',
        version: 'v2.1.0',
        phase: 1,
        status: 'specified' as WorkflowStatus
        // Missing files entirely
      };
      
      const result: ValidationResult = validator.validate(stateWithoutFiles);
      
      expect(result.state.files).toBeDefined();
      expect(result.state.files.spec).toBeDefined();
      expect(result.autoFixed).toContain('files');
    });
  });

  describe('Backward compatibility verification', () => {
    test('validator handles states with multiple missing fields', () => {
      // Mix of issues to test comprehensive fixing  
      const problematicState: any = {
        feature: 'specs-tree-problematic',
        // version missing
        phase: 3,
        // status missing, phaseHistory missing, dependencies missing, files missing...  
      };
      
      const result: ValidationResult = validator.validate(problematicState);
      
      expect(result.valid).toBe(true); // Should still be valid after fixes
      expect(result.state.version).toBe('v2.1.0');
      expect(result.state.status).toBeDefined();
      expect(result.state.phaseHistory).toBeDefined();
      expect(result.autoFixed.length).toBeGreaterThan(3); // Many things need fixing
      
      expect(result.warnings).not.toHaveLength(0); // Should have warnings about fixes made
    });
  });
});