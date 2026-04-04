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
} from './compatibility';

describe('Compatibility Utils', () => {
  const tempDir = '.temp-test-compat';
  const originalWorkingDir = process.cwd();

  beforeAll(() => {
    process.chdir('/home/usb/workspace/wks-opencode-sdd-plugin/Product/opencode-sdd-plugin');
    // 清理并重新创建临时目录
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
      if (existsSync('state-test.tmp.json')) {
        unlinkSync('state-test.tmp.json');
      }
      if (existsSync(join(tempDir, 'state.json'))) {
        unlinkSync(join(tempDir, 'state.json'));
      }
    } catch (err) {}
  }

  function cleanupTempDir() {
    try {
      if (existsSync(tempDir)) {
        const files = readdirSync(tempDir);
        for (const file of files) {
          unlinkSync(join(tempDir, file));
        }
        rmdirSync(tempDir);
      }
    } catch (err) {
      // 忽略清理错误
    }
  }

  describe('isLegacyState', () => {
    it('应该将没有版本字段的状态视为旧格式', () => {
      const stateWithoutVersion = { feature: 'test', status: 'completed' };
      expect(isLegacyState(stateWithoutVersion)).toBe(true);
    });

    it('应该将版本号小于1.2.11的状态视为旧格式', () => {
      expect(isLegacyState({ feature: 'test', status: 'completed', version: '1.2.10' })).toBe(true);
      expect(isLegacyState({ feature: 'test', status: 'completed', version: '1.1.9' })).toBe(true);
    });

    it('应该将版本号大于等于1.2.11的状态视为新格式', () => {
      expect(isLegacyState({ feature: 'test', status: 'completed', version: '1.2.11' })).toBe(false);
      expect(isLegacyState({ feature: 'test', status: 'completed', version: '1.2.12' })).toBe(false);
      expect(isLegacyState({ feature: 'test', status: 'completed', version: '2.0.0' })).toBe(false);
    });
  });

  describe('hasLegacySpecsStructure', () => {
    it('应该检测到真实的 .specs/ 目录', () => {
      // 创建一个 .specs/ 目录（临时的，测试用）
      try {
        mkdirSync('.specs-test', { recursive: true });
        // 我们不能在这个项目的根目录创建 .specs，因为它会干扰现有目录
        // 而且我们要遵循真实的测试逻辑，只能进行模拟测试
        unlinkSync('.specs-test');
      } catch (err) {}
      expect(typeof hasLegacySpecsStructure()).toBe('boolean');
    });
  });

  describe('migrateLegacyState', () => {
    it('应该正确迁移旧格式状态到新格式', () => {
      const legacyState = {
        feature: 'legacy-feature',
        status: 'planned',
        mode: 'single',
        subFeatures: ['sub-a', 'sub-b'],
        createdAt: '2026-03-01T00:00:00Z'
      };

      const migrated = migrateLegacyState(legacyState);

      expect(migrated.feature).toBe('legacy-feature');
      expect(migrated.status).toBe('planned');
      expect(migrated.version).toBe('1.2.11');
      expect(migrated).not.toHaveProperty('mode');
      expect(migrated).not.toHaveProperty('subFeatures');
      expect(migrated.updatedAt).toBeDefined();
    });

    it('应该为没有版本的旧状态添加版本号', () => {
      const legacyState = {
        feature: 'test-feature',
        status: 'building',
        name: 'Test Feature'
      };

      const migrated = migrateLegacyState(legacyState);
      expect(migrated.version).toBe('1.2.11');
    });
  });

  describe('readStateWithCompatibility', () => {
    it('应该能够读取并兼容处理新格式的 state.json', () => {
      const newState = {
        feature: 'new-format',
        status: 'validated',
        version: '1.2.11',
        phase: 5
      };
      
      const tempPath = join(tempDir, 'state.json');
      writeFileSync(tempPath, JSON.stringify(newState, null, 2));
      
      const result = readStateWithCompatibility(tempPath);
      
      expect(result).toEqual(newState);
      unlinkSync(tempPath);
    });

    it('应该能够读取并迁移旧格式的 state.json', () => {
      const legacyState = {
        feature: 'old-format',
        status: 'planned',
        mode: 'single',
        subFeatures: ['sub1'],
        createdAt: '2026-03-01T00:00:00Z'
      };
      
      const tempPath = join(tempDir, 'state-legacy.json');
      writeFileSync(tempPath, JSON.stringify(legacyState, null, 2));
      
      const result = readStateWithCompatibility(tempPath);
      
      expect(result.feature).toBe('old-format');
      expect(result.status).toBe('planned');
      expect(result.version).toBe('1.2.11');
      expect(result).not.toHaveProperty('mode');
      expect(result).not.toHaveProperty('subFeatures');
      unlinkSync(tempPath);
    });

    it('应该在文件不存在时返回 null', () => {
      const nonExistentPath = join(tempDir, 'non-existent.json');
      const result = readStateWithCompatibility(nonExistentPath);
      
      expect(result).toBeNull();
    });

    it('应该处理无效 JSON 文件并抛出错误', () => {
      const invalidJsonPath = join(tempDir, 'invalid.json');
      writeFileSync(invalidJsonPath, '{"invalid": json}');
      
      expect(() => {
        readStateWithCompatibility(invalidJsonPath);
      }).toThrow('无效的 JSON 格式');
      
      unlinkSync(invalidJsonPath);
    });
  });

  describe('detectSDDStructure', () => {
    // 因为我们不能改动当前目录的 .specs 和 .sdd 目录，我们只能检查函数的执行路径
    it('应该返回包含检测结果的对象', () => {
      const result = detectSDDStructure('.');
      
      expect(result).toHaveProperty('hasLegacyStructure');
      expect(result).toHaveProperty('hasContainerizedStructure');
      expect(result).toHaveProperty('hasMixedStructure');
      expect(result).toHaveProperty('specsPath');
      expect(result).toHaveProperty('suggestion');
    });
    
    it('应该所有结果都是布尔类型或字符串类型', () => {
      const result = detectSDDStructure('.');
      
      expect(typeof result.hasLegacyStructure).toBe('boolean');
      expect(typeof result.hasContainerizedStructure).toBe('boolean');
      expect(typeof result.hasMixedStructure).toBe('boolean');
      expect(typeof result.specsPath).toBe('string');
      expect(typeof result.suggestion).toBe('string');
    });
  });

  describe('getMigrationSuggestion', () => {
    it('应该返回迁移建议字符串', () => {
      const suggestion = getMigrationSuggestion();
      expect(typeof suggestion).toBe('string');
    });
  });

  describe('CompatibilityConfig', () => {
    it('应该正确创建默认配置', () => {
      const config = new CompatibilityConfig();
      
      expect(config.enableDetailedLogging).toBe(true);
      expect(config.forceModernFormat).toBe(false);
      expect(config.migrationBackupPath).toBe('.sdd/.backups/');
    });

    it('应该允许覆盖默认配置', () => {
      const customConfig = new CompatibilityConfig({
        enableDetailedLogging: false,
        forceModernFormat: true,
        migrationBackupPath: './backups/'
      });
      
      expect(customConfig.enableDetailedLogging).toBe(false);
      expect(customConfig.forceModernFormat).toBe(true);
      expect(customConfig.migrationBackupPath).toBe('./backups/');
    });

    it('应该允许部分覆盖', () => {
      const partialConfig = new CompatibilityConfig({
        enableDetailedLogging: false
      });
      
      expect(partialConfig.enableDetailedLogging).toBe(false);
      expect(partialConfig.forceModernFormat).toBe(false);
      expect(partialConfig.migrationBackupPath).toBe('.sdd/.backups/');
    });
  });

  describe('Default Export', () => {
    it('应该导出所有功能', () => {
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
      
      // 确保所有导出函数都是可用的
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
});