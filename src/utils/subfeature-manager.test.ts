import * as fs from 'fs/promises';
import * as path from 'path';
import {
  detectFeatureMode,
  createSubFeature,
  generateSubFeatureIndex,
  scanSubFeatures,
  validateSubFeatureCompleteness,
  SubFeatureMeta
} from './subfeature-manager';
import * as treeScanner from '../state/tree-scanner';
import { FeatureTreeNode } from '../state/tree-scanner';

// Helper to build mock tree nodes
// Prefixes featureDir with 'specs-tree-' so it is recognized by the tree scanner
function specsFeatureDir(baseDir: string, name: string): string {
  return path.join(baseDir, `specs-tree-${name}`);
}

function buildMockTree(featureDir: string, childDirs: string[], childFeatureNames: string[]) {
  const featureName = path.basename(featureDir).replace(/^specs-tree-/, '');
  const childNodes: FeatureTreeNode[] = childDirs.map((childDir, i) => ({
    id: path.basename(childDir),
    path: childDir,
    featureName: childFeatureNames[i] || path.basename(childDir).replace(/^specs-tree-/, ''),
    level: 1,
    children: [],
    parent: featureDir,
  }));

  const featureNode: FeatureTreeNode = {
    id: `specs-tree-${featureName}`,
    path: featureDir,
    featureName,
    level: 0,
    children: childNodes,
  };

  return {
    nodes: [featureNode],
    flatMap: new Map<string, FeatureTreeNode>([[featureDir, featureNode]]),
  };
}

const tempBaseDir = path.join(__dirname, '../../temp-test');
const featureDir = specsFeatureDir(tempBaseDir, 'test-feature');

describe('SubfeatureManager', () => {
  beforeEach(async () => {
    await fs.rm(tempBaseDir, { recursive: true, force: true });
    await fs.mkdir(featureDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempBaseDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  describe('detectFeatureMode', () => {
    beforeEach(() => {
      // Default: scanTreeStructure returns empty tree (no matching nodes)
      jest.spyOn(treeScanner, 'scanTreeStructure').mockResolvedValue({ nodes: [], flatMap: new Map() });
    });

    it('应该检测单模块模式', async () => {
      const mode = await detectFeatureMode(featureDir);
      expect(mode).toBe('single');
    });

    it('应该检测多子 Feature 模式', async () => {
      // Create a specs-tree-* subdirectory to trigger multi-mode detection
      await fs.mkdir(path.join(featureDir, 'specs-tree-sub-feature-1'), { recursive: true });

      const mode = await detectFeatureMode(featureDir);
      expect(mode).toBe('multi');
    });

    it('当 sub-features 目录为空时，仍检测为单模块模式', async () => {
      // Create old-style empty sub-features directory (backward compat check)
      const subFeaturesDir = path.join(featureDir, 'sub-features');
      await fs.mkdir(subFeaturesDir, { recursive: true });

      const mode = await detectFeatureMode(featureDir);
      expect(mode).toBe('single');
    });
  });

  describe('createSubFeature', () => {
    it('应该创建子 Feature 目录和文件', async () => {
      const subFeatureId = 'test-sub-feature';
      const name = 'Test Sub Feature';

      const resultPath = await createSubFeature(featureDir, subFeatureId, name);
      const expectedPath = path.join(featureDir, `specs-tree-${subFeatureId}`);

      expect(resultPath).toBe(expectedPath);

      // Verify directory exists
      expect(await fs.stat(resultPath).then(stat => stat.isDirectory())).toBe(true);

      // Verify required files exist
      const specPath = path.join(resultPath, 'spec.md');
      const readmePath = path.join(resultPath, 'README.md');
      const statePath = path.join(resultPath, 'state.json');

      expect(await pathExists(specPath)).toBe(true);
      expect(await pathExists(readmePath)).toBe(true);
      expect(await pathExists(statePath)).toBe(true);

      // Verify spec.md content
      const specContent = await fs.readFile(specPath, 'utf8');
      expect(specContent).toContain(`# Sub Feature: ${name}`);

      // Verify README.md content
      const readmeContent = await fs.readFile(readmePath, 'utf8');
      expect(readmeContent).toContain(name);

      // Verify state.json content with v3.0.0 defaults
      const stateContent = await fs.readFile(statePath, 'utf8');
      const stateData = JSON.parse(stateContent);
      expect(stateData.feature).toBe(subFeatureId);
      expect(stateData.name).toBe(name);
      expect(stateData.status).toBe('tracked');
      expect(stateData.phase).toBe('registered');
      expect(stateData.version).toBe('v3.0.0');
    });

    it('应该在创建时设置正确的目录结构', async () => {
      const subFeatureId = 'nested-test';
      const name = 'Nested Test';

      await createSubFeature(featureDir, subFeatureId, name);

      const expectedSubFeatureDir = path.join(featureDir, `specs-tree-${subFeatureId}`);

      // The specs-tree-* directory should exist directly under the parent feature
      expect(await pathExists(expectedSubFeatureDir)).toBe(true);
    });
  });

  describe('generateSubFeatureIndex', () => {
    it('在单模块模式下应该返回空字符串', async () => {
      jest.spyOn(treeScanner, 'scanTreeStructure').mockResolvedValue({ nodes: [], flatMap: new Map() });

      const index = await generateSubFeatureIndex(featureDir);
      expect(index).toBe('');
    });

    it('在多子 Feature 模式下应该生成正确的索引表', async () => {
      const subFeatureId = 'my-sub-feature';
      const name = 'My Sub Feature';
      const subDir = path.join(featureDir, `specs-tree-${subFeatureId}`);

      // Create the subfeature (writes spec.md, state.json etc.)
      await createSubFeature(featureDir, subFeatureId, name);

      // Mock scanTreeStructure to return the correct tree
      const mockTree = buildMockTree(featureDir, [subDir], [subFeatureId]);
      jest.spyOn(treeScanner, 'scanTreeStructure').mockResolvedValue(mockTree);

      const index = await generateSubFeatureIndex(featureDir);

      expect(index).toContain('| Sub Feature ID | Sub Feature Name | Directory Path | Status | Assignee | Blockers |');
      expect(index).toContain(`| ${subFeatureId} | ${name} | ${subDir} | tracked | - | - |`);
    });

    it('对多个子 Feature 应该生成完整索引', async () => {
      const subDir1 = path.join(featureDir, 'specs-tree-sf-1');
      const subDir2 = path.join(featureDir, 'specs-tree-sf-2');

      await createSubFeature(featureDir, 'sf-1', 'Sub Feature 1');
      await createSubFeature(featureDir, 'sf-2', 'Sub Feature 2');

      const mockTree = buildMockTree(
        featureDir,
        [subDir1, subDir2],
        ['sf-1', 'sf-2']
      );
      jest.spyOn(treeScanner, 'scanTreeStructure').mockResolvedValue(mockTree);

      const index = await generateSubFeatureIndex(featureDir);

      expect(index).toContain('sf-1');
      expect(index).toContain('sf-2');
      expect(index).toContain('Sub Feature 1');
      expect(index).toContain('Sub Feature 2');
    });

    it('当某子 Feature 的 spec 文件缺失时，应该使用默认值', async () => {
      const brokenDir = path.join(featureDir, 'specs-tree-broken-sub-feature');
      await fs.mkdir(brokenDir, { recursive: true });
      // No spec.md — deliberately missing

      const mockTree = buildMockTree(
        featureDir,
        [brokenDir],
        ['broken-sub-feature']
      );
      jest.spyOn(treeScanner, 'scanTreeStructure').mockResolvedValue(mockTree);

      const index = await generateSubFeatureIndex(featureDir);

      expect(index).toContain('broken-sub-feature');
    });
  });

  describe('scanSubFeatures', () => {
    it('当是单模块模式时应返回空数组', async () => {
      // No specs-tree-* children = single mode
      jest.spyOn(treeScanner, 'scanTreeStructure').mockResolvedValue({ nodes: [], flatMap: new Map() });

      const result = await scanSubFeatures(featureDir);
      expect(result).toEqual([]);
    });

    it('应该找到并返回所有子 Feature', async () => {
      const subDir1 = path.join(featureDir, 'specs-tree-first-sub');
      const subDir2 = path.join(featureDir, 'specs-tree-second-sub');

      await createSubFeature(featureDir, 'first-sub', 'First Sub');
      await createSubFeature(featureDir, 'second-sub', 'Second Sub');

      const mockTree = buildMockTree(
        featureDir,
        [subDir1, subDir2],
        ['first-sub', 'second-sub']
      );
      jest.spyOn(treeScanner, 'scanTreeStructure').mockResolvedValue(mockTree);

      const subFeatures = await scanSubFeatures(featureDir);

      expect(subFeatures).toHaveLength(2);
      expect(subFeatures.some(sf => sf.id === 'first-sub')).toBe(true);
      expect(subFeatures.some(sf => sf.id === 'second-sub')).toBe(true);
    });

    it('应该正确提取子 Feature 的状态信息', async () => {
      const subDir = path.join(featureDir, 'specs-tree-state-test');

      await createSubFeature(featureDir, 'state-test', 'State Test');

      // Update the state.json file (not .state.json in v3.0.0)
      const stateFilePath = path.join(subDir, 'state.json');
      const stateData = JSON.parse(await fs.readFile(stateFilePath, 'utf8'));
      stateData.status = 'implemented';
      stateData.assignee = 'test-user';
      await fs.writeFile(stateFilePath, JSON.stringify(stateData, null, 2));

      const mockTree = buildMockTree(
        featureDir,
        [subDir],
        ['state-test']
      );
      jest.spyOn(treeScanner, 'scanTreeStructure').mockResolvedValue(mockTree);

      const subFeatures = await scanSubFeatures(featureDir);
      const targetSubFeature = subFeatures.find(sf => sf.id === 'state-test');

      expect(targetSubFeature).toBeDefined();
      if (targetSubFeature) {
        expect(targetSubFeature.status).toBe('implemented');
        expect(targetSubFeature.assignee).toBe('test-user');
      }
    });
  });

  describe('validateSubFeatureCompleteness', () => {
    let subDirPath: string;
    let testSubFeature: SubFeatureMeta;

    beforeEach(() => {
      // Use absolute path so existsSync resolves correctly regardless of process.cwd()
      subDirPath = path.join(tempBaseDir, 'sub-features', 'test-validation');
      testSubFeature = {
        id: 'test-validation',
        name: 'Test Validation',
        status: 'specified',
        dir: subDirPath,
      };
    });

    it('对于完整的子 Feature，验证应该通过', async () => {
      await fs.mkdir(subDirPath, { recursive: true });

      // Create all required files (state.json not .state.json in v3.0.0)
      await fs.writeFile(path.join(subDirPath, 'spec.md'), '# Test Spec');
      await fs.writeFile(path.join(subDirPath, 'plan.md'), '# Test Plan');
      await fs.writeFile(path.join(subDirPath, 'tasks.md'), '# Test Tasks');
      await fs.writeFile(path.join(subDirPath, 'README.md'), '# Test Readme');
      await fs.writeFile(path.join(subDirPath, 'state.json'), '{}');

      const validation = validateSubFeatureCompleteness(testSubFeature);
      expect(validation.valid).toBe(true);
      expect(validation.missing).toEqual([]);
    });

    it('对于缺少文件的子 Feature，验证应失败并显示缺失的文件', async () => {
      await fs.mkdir(subDirPath, { recursive: true });

      // Only create spec.md, README.md, state.json — missing plan.md and tasks.md
      await fs.writeFile(path.join(subDirPath, 'spec.md'), '# Test Spec');
      await fs.writeFile(path.join(subDirPath, 'README.md'), '# Test Readme');
      await fs.writeFile(path.join(subDirPath, 'state.json'), '{}');

      const validation = validateSubFeatureCompleteness(testSubFeature);
      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('plan.md');
      expect(validation.missing).toContain('tasks.md');
    });
  });
});

// Helper function
async function pathExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch (error) {
    return false;
  }
}
