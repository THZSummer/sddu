import {
  generateMainSpec,
  generateSubFeatureSpec,
  generateFeatureReadmeTemplate,
  generateSubFeatureReadmeTemplate,
  generateExample,
  FeatureTemplate,
  SubFeatureTemplate
} from './subfeature-templates';

// Mock the date used in templates
jest.mock('path');

describe('子 Feature 目录结构模板生成器测试', () => {
  describe('generateMainSpec', () => {
    test('应该生成一个包含子 Feature 索引表的主 spec', () => {
      const template: FeatureTemplate = {
        featureId: 'feature-1',
        featureName: '测试功能',
        description: '测试功能描述',
        subFeatures: [
          {
            id: 'sub-1',
            name: '子功能1',
            description: '描述子功能1',
            assignee: '张三',
            dependencies: ['sub-2']
          },
          {
            id: 'sub-2',
            name: '子功能2',
            description: '描述子功能2',
            assignee: '李四'
          }
        ]
      };

      const result = generateMainSpec(template);

      expect(result).toContain('# SDD 多子 Feature 规格文档');
      expect(result).toContain('**Feature ID** | feature-1');
      expect(result).toContain('**Feature 名称** | 测试功能');
      expect(result).toContain('| sub-1 | 子功能1 | sub-features/sub-1 | tasked | 张三 | sub-2 |');
      expect(result).toContain('| sub-2 | 子功能2 | sub-features/sub-2 | tasked | 李四 | - |');
    });

    test('应该处理没有子 Feature 的情况', () => {
      const template: FeatureTemplate = {
        featureId: 'feature-1',
        featureName: '测试功能',
        description: '测试功能描述'
      };

      const result = generateMainSpec(template);
      
      // 在没有子 features 时，仍然应该是一个有效的 spec
      expect(result).toContain('# SDD 多子 Feature 规格文档');
      expect(result).toContain('测试功能描述');
    });

    test('应该处理空依赖数组', () => {
      const template: FeatureTemplate = {
        featureId: 'feature-1',
        featureName: '测试功能',
        subFeatures: [
          {
            id: 'sub-1',
            name: '子功能1',
            dependencies: []
          }
        ]
      };

      const result = generateMainSpec(template);
      expect(result).toContain('| sub-1 | 子功能1 | sub-features/sub-1 | tasked | - | - |');
    });
  });

  describe('generateSubFeatureSpec', () => {
    test('应该生成子 Feature 规格文档', () => {
      const template: SubFeatureTemplate = {
        id: 'sub-1',
        name: '子功能1',
        description: '子功能1的描述',
        assignee: '张三',
        dependencies: ['sub-2']
      };

      const result = generateSubFeatureSpec(template);

      expect(result).toContain('# SDD 子 Feature 规格文档');
      expect(result).toContain('**子 Feature ID** | sub-1');
      expect(result).toContain('**子 Feature 名称** | 子功能1');
      expect(result).toContain('子功能1的描述');
      expect(result).toContain('- 依赖于: sub-2');
      expect(result).toContain('张三');
    });

    test('应该处理没有依赖的情况', () => {
      const template: SubFeatureTemplate = {
        id: 'sub-1',
        name: '子功能1',
        description: '子功能1的描述',
      };

      const result = generateSubFeatureSpec(template);

      expect(result).toContain('- 依赖于: 无');
    });

    test('应该处理没有负责人的情况', () => {
      const template: SubFeatureTemplate = {
        id: 'sub-1',
        name: '子功能1',
        description: '子功能1的描述',
        dependencies: []
      };

      const result = generateSubFeatureSpec(template);

      expect(result).toContain('负责人: ');
    });
  });

  describe('generateFeatureReadmeTemplate', () => {
    test('应该生成包含导航的 Feature README', () => {
      const template: FeatureTemplate = {
        featureId: 'feature-1',
        featureName: '测试功能',
        description: '测试功能描述',
        subFeatures: [
          {
            id: 'sub-1',
            name: '子功能1'
          },
          {
            id: 'sub-2',
            name: '子功能2'
          }
        ]
      };

      const result = generateFeatureReadmeTemplate(template);

      expect(result).toContain('# Feature: 测试功能');
      expect(result).toContain('测试功能描述');
      expect(result).toContain('├─ spec.md');
      expect(result).toContain('├─ plan.md');
      expect(result).toContain('├─ tasks.md');
      expect(result).toContain('└─ sub-features/');
      expect(result).toContain('### 1. [子功能1]');
      expect(result).toContain('### 2. [子功能2]');
    });

    test('应该处理没有子 Feature 的情况', () => {
      const template: FeatureTemplate = {
        featureId: 'feature-1',
        featureName: '测试功能',
        description: '测试功能描述'
      };

      const result = generateFeatureReadmeTemplate(template);

      expect(result).toContain('# Feature: 测试功能');
      expect(result).toContain('测试功能描述');
      expect(result).toContain('尚未定义任何子 Feature');
    });
  });

  describe('generateSubFeatureReadmeTemplate', () => {
    test('应该生成子 Feature README 模板', () => {
      const template: SubFeatureTemplate = {
        id: 'sub-1',
        name: '子功能1',
        description: '描述子功能1',
        assignee: '张三',
        dependencies: ['sub-2']
      };

      const result = generateSubFeatureReadmeTemplate(template);

      expect(result).toContain('# Sub Feature: 子功能1');
      expect(result).toContain('**ID**: `sub-1`');
      expect(result).toContain('张三');
      expect(result).toContain('**依赖**: sub-2');
      expect(result).toContain('描述子功能1');
    });

    test('应该处理没有依赖的情况', () => {
      const template: SubFeatureTemplate = {
        id: 'sub-1',
        name: '子功能1',
        description: '描述子功能1',
        assignee: '李四'
      };

      const result = generateSubFeatureReadmeTemplate(template);

      expect(result).toContain('**依赖**: 无依赖');
      expect(result).toContain('李四');
    });
  });

  test('generateExample should return complete example', () => {
    const result = generateExample();

    expect(result).toContain('# 多子 Feature 模板示例');
    expect(result).toContain('认证系统重构');
    expect(result).toContain('用户管理重构');
    expect(result).toContain('用户模型设计');
    expect(result).toContain('/specs-tree-root/');
    expect(result).toContain('sub-features/');
  });
});