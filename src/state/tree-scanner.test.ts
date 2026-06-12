import * as path from 'path';
import { scanTreeStructure, FeatureTreeNode, isParentFeature } from './tree-scanner';

// Mock fs/promises - MUST be before other imports to be hoisted by jest
jest.mock('fs/promises', () => ({
  readdir: jest.fn().mockResolvedValue([]),
  stat: jest.fn().mockResolvedValue({ isDirectory: () => true }),
  access: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  rm: jest.fn(),
  constants: {},
}));

// Mock the constants import from 'fs'
jest.mock('fs', () => ({
  constants: { F_OK: 0 },
}));

// Import after mocks are set up - jest.mock is hoisted so mocks activate first
import * as fsPromises from 'fs/promises';

describe('TreeScanner', () => {
  const mockReadDir = fsPromises.readdir as jest.Mock;
  const mockStat = fsPromises.stat as jest.Mock;
  const mockAccess = fsPromises.access as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scanTreeStructure', () => {
    it('should return empty result when directory does not exist', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const result = await scanTreeStructure('/non-existent-dir');
      
      expect(result.nodes).toHaveLength(0);
      expect(result.flatMap.size).toBe(0);
    });

    it('should find top level specs-tree features', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReadDir.mockResolvedValue(['specs-tree-auth', 'specs-tree-user']);
      mockStat.mockImplementation((pathStr: string) => {
        if (pathStr.includes('auth') || pathStr.includes('user')) {
          return Promise.resolve({ isDirectory: () => true });
        }
        return Promise.reject(new Error('path not found'));
      });

      const result = await scanTreeStructure('/test-project');

      expect(result.nodes.length).toBe(2);
      expect(result.flatMap.size).toBe(2);
      expect(result.nodes.some(node => node.featureName === 'auth')).toBe(true);
      expect(result.nodes.some(node => node.featureName === 'user')).toBe(true);
    });

    it('should find nested specs-tree features', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReadDir.mockImplementation((dirPath: string) => {
        if (dirPath === '/test-project') {
          return Promise.resolve(['specs-tree-parent']);
        } else if (dirPath.includes('specs-tree-parent')) {
          return Promise.resolve(['specs-tree-subfeature', 'other-file.txt']);
        }
        return Promise.resolve([]);
      });
      mockStat.mockImplementation((pathStr: string) => {
        if (pathStr.includes('parent') || pathStr.includes('subfeature')) {
          return Promise.resolve({ isDirectory: () => true });
        }
        return Promise.resolve({ isDirectory: () => false });
      });

      const result = await scanTreeStructure('/test-project');

      expect(result.nodes.length).toBe(2);
      expect(result.flatMap.size).toBe(2);
      const parent = result.nodes.find(node => node.featureName === 'parent');
      expect(parent).toBeDefined();
      expect(parent!.children.length).toBe(1);
      expect(parent!.children[0].featureName).toBe('subfeature');
    });

    it('should create flatMap with correct path lookups', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReadDir.mockResolvedValue(['specs-tree-test']);
      mockStat.mockResolvedValue({ isDirectory: () => true });

      const result = await scanTreeStructure('/test-project');

      expect(result.flatMap.size).toBe(1);
      const node = result.flatMap.get(path.relative(process.cwd(), '/test-project/specs-tree-test'));
      expect(node).toBeDefined();
      expect(node?.featureName).toBe('test');
    });

    it('should ignore .sddu and hidden directories', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReadDir.mockResolvedValue([
        'specs-tree-valid',
        '.sddu-metadata',
        '.hidden-folder',
        'specs-tree-hidden'
      ]);
      mockStat.mockResolvedValue({ isDirectory: () => true });

      const result = await scanTreeStructure('/test-project');

      expect(result.nodes.length).toBe(2);
      expect(result.nodes.some(node => node.featureName === 'valid')).toBe(true);
      expect(result.nodes.some(node => node.featureName === 'hidden')).toBe(true);
    });

    it('should handle mixed directory structures appropriately', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReadDir.mockResolvedValue([
        'specs-tree-regular',
        'package.json',
        'node_modules'
      ]);
      mockStat.mockImplementation((pathStr: string) => {
        if (pathStr.includes('specs-tree-regular')) {
          return Promise.resolve({ isDirectory: () => true });
        }
        return Promise.resolve({ isDirectory: () => false });
      });

      const result = await scanTreeStructure('/test-project');

      expect(result.nodes.length).toBe(1);
      expect(result.nodes[0].featureName).toBe('regular');
    });
  });

  describe('isParentFeature', () => {
    it('should return true for nodes with children', () => {
      const nodeWithChildren: FeatureTreeNode = {
        id: 'test',
        path: '/test/path',
        featureName: 'test',
        level: 0,
        children: [{ 
          id: 'child', 
          path: '/test/path/child', 
          featureName: 'child', 
          level: 1, 
          children: [] 
        }],
        parent: undefined
      };

      expect(isParentFeature(nodeWithChildren)).toBe(true);
    });

    it('should return false for leaf nodes with no children', () => {
      const leafNode: FeatureTreeNode = {
        id: 'test',
        path: '/test/path',
        featureName: 'test',
        level: 0,
        children: [],
        parent: undefined
      };

      expect(isParentFeature(leafNode)).toBe(false);
    });
  });
});
