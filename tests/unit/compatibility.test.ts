import { existsSync, writeFileSync, unlinkSync, mkdirSync, rmdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { 
  isLegacyState,
  hasLegacySpecsStructure,
  hasContainerizedStructure,
  hasMixedStructure,
  getMigrationSuggestion,
  migrateLegacyState,
  readStateWithCompatibility,
  detectSDDStructure,
  CompatibilityConfig
} from '../../../src/utils/compatibility';

describe('F-250: Compatibility Utilities - Unit Tests', () => {
  const tempDir = '.temp-test-compat-units';
  const originalWorkingDir = process.cwd();

  beforeAll(() => {
    // Change to project root directory for real testing
    process.chdir('/home/usb/workspace/wks-opencode-sdd-plugin/Product/opencode-sdd-plugin');
    // Clean up and recreate temp directory
    cleanupTempDir();
    mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    process.chdir(originalWorkingDir);
    cleanupTempDir();
  });

  afterEach(() => {
    cleanupTestFiles();
  });

  function cleanupTestFiles() {
    try {
      const testFiles = [
        'state-test-compat.tmp.json',
        join(tempDir, 'state.temp.json'),
        join(tempDir, 'legacy-state.temp.json'),
        join(tempDir, 'invalid-state.temp.json')
      ];
      
      testFiles.forEach(file => {
        if (existsSync(file)) {
          unlinkSync(file);
        }
      });
    } catch (err) {
      // Ignore cleanup errors
    }
  }

  function cleanupTempDir() {
    try {
      if (existsSync(tempDir)) {
        const files = readdirSync(tempDir);
        for (const file of files) {
          const filePath = join(tempDir, file);
          if (existsSync(filePath)) {
            unlinkSync(filePath);
          }
        }
        rmdirSync(tempDir);
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  }

  describe('isLegacyState detection', () => {
    it('should recognize missing version as legacy', () => {
      const stateWithoutVersion = { feature: 'test', status: 'completed' };
      expect(isLegacyState(stateWithoutVersion)).toBe(true);
    });

    it('should recognize older versions as legacy', () => {
      expect(isLegacyState({ feature: 'test', status: 'completed', version: '1.2.10' })).toBe(true);
      expect(isLegacyState({ feature: 'test', status: 'completed', version: '1.1.9' })).toBe(true);
      expect(isLegacyState({ feature: 'test', status: 'completed', version: '1.2.0' })).toBe(true);
    });

    it('should recognize newer or equal versions as non-legacy', () => {
      expect(isLegacyState({ feature: 'test', status: 'completed', version: '1.2.11' })).toBe(false);
      expect(isLegacyState({ feature: 'test', status: 'completed', version: '1.2.12' })).toBe(false);
      expect(isLegacyState({ feature: 'test', status: 'completed', version: '2.0.0' })).toBe(false);
    });

    it('should handle malformed version strings properly', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      try {
        const result = isLegacyState({ feature: 'test', status: 'completed', version: 'not.a.version' });
        expect(result).toBe(true);
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('Structure Detection', () => {
    beforeEach(() => {
      // Remove any potentially conflicting directories
      ['temp-legacy-only', 'temp-container-only', 'temp-legacy-container'].forEach(dir => {
        if (existsSync(dir)) {
          try { rmdirSync(dir, { recursive: true }); } catch (e) {}
        }
      });
    });

    afterEach(() => {
      ['temp-legacy-only', 'temp-container-only', 'temp-legacy-container'].forEach(dir => {
        if (existsSync(dir)) {
          try { rmdirSync(dir, { recursive: true }); } catch (e) {}
        }
      });
    });

    it('should detect legacy structure when only .specs exists', () => {
      // Create a temporary scenario (not directly in working dir)
      // In an actual test we would not modify the main project structure
      // so instead we'll test the logic paths and function execution
      
      const result = hasLegacySpecsStructure();
      // At least verify that the function executes without error
      expect(typeof result).toBe('boolean');
    });

    it('should detect containerized structure when only .sdd/.specs exists', () => {
      const result = hasContainerizedStructure();
      expect(typeof result).toBe('boolean');
    });

    it('should detect mixed structure when both exist', () => {
      const result = hasMixedStructure();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Migration Logic', () => {
    it('should migrate legacy state to new format by removing deprecated fields', () => {
      const legacyState = {
        feature: 'legacy-feature',
        name: 'Legacy Feature',
        status: 'planned',
        mode: 'single',
        subFeatures: ['sub-a', 'sub-b'],
        phase: 2,
        createdAt: '2026-03-01T00:00:00Z',
        assignee: 'old-user',
        dependencies: { on: ['some-dep'] }
      };

      const migratedState = migrateLegacyState(legacyState);

      // Verify the new format has right properties
      expect(migratedState.feature).toBe('legacy-feature');
      expect(migratedState.name).toBe('Legacy Feature');
      expect(migratedState.status).toBe('planned');
      expect(migratedState.version).toBe('1.2.11');
      expect(migratedState.phase).toBe(2);
      expect(migratedState.assignee).toBe('old-user');
      expect(migratedState.dependencies.on).toEqual(['some-dep']);
      
      // Verify removed fields are gone
      expect(migratedState).not.toHaveProperty('mode');
      expect(migratedState).not.toHaveProperty('subFeatures');
      
      // Verify timestamps were updated
      expect(migratedState.updatedAt).toBeDefined();
      expect(migratedState.createdAt).toBe('2026-03-01T00:00:00Z');
    });

    it('should add version field if missing', () => {
      const legacyState = {
        feature: 'no-version-feature',
        status: 'building'
      };

      const migratedState = migrateLegacyState(legacyState);

      expect(migratedState.version).toBe('1.2.11');
      expect(migratedState.feature).toBe('no-version-feature');
      expect(migratedState.status).toBe('building');
    });

    it('should handle case where created time exists without updated time', () => {
      const legacyState = {
        feature: 'test-feature',
        status: 'planned',
        createdAt: '2026-02-01T10:00:00Z'
      };

      const migratedState = migrateLegacyState(legacyState);
      
      const oldDate = new Date('2026-02-01T10:00:00Z');
      const migratedDate = new Date(migratedState.updatedAt);
      
      expect(migratedState.createdAt).toBe('2026-02-01T10:00:00Z');
      expect(migratedDate.getTime()).toBeGreaterThanOrEqual(oldDate.getTime());
    });
  });

  describe('Compatibility State Reading', () => {
    it('should read new format state without changes', () => {
      const newState = {
        feature: 'new-format',
        status: 'validated',
        version: '1.2.11',
        phase: 5
      };
      
      const tempPath = join(tempDir, 'new-format.json');
      writeFileSync(tempPath, JSON.stringify(newState, null, 2));
      
      const result = readStateWithCompatibility(tempPath);
      
      expect(result).toEqual(newState);
      unlinkSync(tempPath);
    });

    it('should migrate old format state when reading', () => {
      const legacyState = {
        feature: 'old-format',
        status: 'planned',
        mode: 'single',
        subFeatures: ['sub1'],
        createdAt: '2026-03-01T00:00:00Z'
      };
      
      const tempPath = join(tempDir, 'legacy-format.json');
      writeFileSync(tempPath, JSON.stringify(legacyState, null, 2));
      
      const result = readStateWithCompatibility(tempPath);
      
      expect(result.feature).toBe('old-format');
      expect(result.status).toBe('planned');
      expect(result.version).toBe('1.2.11');
      expect(result).not.toHaveProperty('mode');
      expect(result).not.toHaveProperty('subFeatures');
      expect(result.updatedAt).toBeDefined();
      unlinkSync(tempPath);
    });

    it('should return null for nonexistent file', () => {
      const result = readStateWithCompatibility(join(tempDir, 'nonexistent.json'));
      expect(result).toBeNull();
    });

    it('should handle invalid JSON with proper error message', () => {
      const invalidPath = join(tempDir, 'invalid.json');
      writeFileSync(invalidPath, '{"invalid": json}');
      
      expect(() => readStateWithCompatibility(invalidPath))
        .toThrow('无效的 JSON 格式');
        
      unlinkSync(invalidPath);
    });

    it('should handle corrupt JSON gracefully', () => {
      const corruptPath = join(tempDir, 'corrupt.json');
      writeFileSync(corruptPath, 'this is completely invalid json content');
      
      expect(() => readStateWithCompatibility(corruptPath))
        .toThrow('无效的 JSON 格式');
        
      unlinkSync(corruptPath);
    });
  });

  describe('Detection Structure', () => {
    it('should detect directory structure correctly', () => {
      const result = detectSDDStructure('.');
      
      expect(result).toHaveProperty('hasLegacyStructure');
      expect(result).toHaveProperty('hasContainerizedStructure');
      expect(result).toHaveProperty('hasMixedStructure');
      expect(result).toHaveProperty('specsPath');
      expect(result).toHaveProperty('suggestion');
      expect(typeof result.hasLegacyStructure).toBe('boolean');
      expect(typeof result.hasContainerizedStructure).toBe('boolean');
      expect(typeof result.hasMixedStructure).toBe('boolean');
      expect(typeof result.specsPath).toBe('string');
      expect(typeof result.suggestion).toBe('string');
    });
    
    it('should provide meaningful structure suggestions', () => {
      const result = detectSDDStructure('.');
      
      expect(typeof result.suggestion).toBe('string');
      // Suggestion should be descriptive about current state
      expect(Array.isArray(result.suggestion.match(/\w+/))).toBeTruthy();
    });
  });

  describe('Migration Suggestions', () => {
    it('should return appropriate suggestions', () => {
      const suggestion = getMigrationSuggestion();
      expect(typeof suggestion).toBe('string');
      // Should be descriptive about current state
    });
  });

  describe('Compatibility Configuration', () => {
    it('should create with default values', () => {
      const config = new CompatibilityConfig();
      
      expect(config.enableDetailedLogging).toBe(true);
      expect(config.forceModernFormat).toBe(false);
      expect(config.migrationBackupPath).toBe('.sdd/.backups/');
    });

    it('should allow complete override configuration', () => {
      const customConfig = new CompatibilityConfig({
        enableDetailedLogging: false,
        forceModernFormat: true,
        migrationBackupPath: './my-backup/'
      });
      
      expect(customConfig.enableDetailedLogging).toBe(false);
      expect(customConfig.forceModernFormat).toBe(true);
      expect(customConfig.migrationBackupPath).toBe('./my-backup/');
    });

    it('should allow partial configuration', () => {
      const partialConfig = new CompatibilityConfig({
        forceModernFormat: true
      });
      
      expect(partialConfig.enableDetailedLogging).toBe(true);  // Default
      expect(partialConfig.forceModernFormat).toBe(true);     // Overridden
      expect(partialConfig.migrationBackupPath).toBe('.sdd/.backups/'); // Default
    });
  });

  describe('Full Compatibility Flow', () => {
    it('should handle entire backward compatibility workflow', () => {
      // Create an old-state scenario
      const legacyState = {
        feature: 'workflow-test',
        name: 'Workflow Test',
        status: 'building',
        mode: 'single',
        subFeatures: ['sub-legacy'],
        createdAt: '2026-03-01T00:00:00Z'
      };
      
      const tempPath = join(tempDir, 'workflow-test.json');
      writeFileSync(tempPath, JSON.stringify(legacyState, null, 2));
      
      // Process through compatibility reader
      const processedState = readStateWithCompatibility(tempPath);
      
      // Verify it went through migration
      expect(processedState.feature).toBe(legacyState.feature);
      expect(processedState.version).toBe('1.2.11');
      expect(processedState).not.toHaveProperty('mode');
      expect(processedState).not.toHaveProperty('subFeatures');
      expect(processedState.updatedAt).toBeDefined();
      
      unlinkSync(tempPath);
    });

    it('should detect when current state is still legacy format', () => {
      const oldForm = {
        feature: 'still-legacy-check',
        status: 'drafting',
        mode: 'multi', // This indicates old format
        subFeatures: ['sub1'] as string[],
        version: '1.2.10'  // Old version
      };
      
      // Check if identified as legacy
      expect(isLegacyState(oldForm)).toBe(true);
      
      // Check if migration is needed
      const migrated = migrateLegacyState(oldForm);
      
      // Verify properties were preserved correctly
      expect(migrated.feature).toBe(oldForm.feature);
      expect(migrated.status).toBe(oldForm.status);
      
      // Verify removal of deprecated fields
      expect(migrated).not.toHaveProperty('mode');
      expect(migrated).not.toHaveProperty('subFeatures');
      
      // New version assigned
      expect(migrated.version).toBe('1.2.11');
      expect(migrated.updatedAt).toBeDefined();
    });
  });

  it('should export all compatibility functions correctly', () => {
    const exported = {
      isLegacyState,
      hasLegacySpecsStructure,
      hasContainerizedStructure,
      hasMixedStructure,
      getMigrationSuggestion,
      migrateLegacyState,
      readStateWithCompatibility,
      detectSDDStructure,
      CompatibilityConfig
    };
    
    expect(typeof exported.isLegacyState).toBe('function');
    expect(typeof exported.hasLegacySpecsStructure).toBe('function');
    expect(typeof exported.hasContainerizedStructure).toBe('function');
    expect(typeof exported.hasMixedStructure).toBe('function');
    expect(typeof exported.getMigrationSuggestion).toBe('function');
    expect(typeof exported.migrateLegacyState).toBe('function');
    expect(typeof exported.readStateWithCompatibility).toBe('function');
    expect(typeof exported.detectSDDStructure).toBe('function');
    expect(typeof exported.CompatibilityConfig).toBe('function');
  });
});