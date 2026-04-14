import * as fs from 'fs';
import * as path from 'path';
import { scanTreeStructure, FeatureTreeNode, isParentFeature } from './tree-scanner';

// Mock the file system for testing
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  existsSync: jest.fn(),
}));

describe('TreeScanner', () => {
  const fsMock = jest.mocked(fs);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scanTreeStructure', () => {
    it('should return empty result when directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await scanTreeStructure('/non-existent-dir');
      
      expect(result.nodes).toHaveLength(0);
      expect(result.flatMap.size).toBe(0);
    });

    it('should find top level specs-tree features', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(['specs-tree-auth', 'specs-tree-user']);
      (fs.statSync as jest.Mock).mockImplementation((pathStr: string) => {
        if (pathStr.includes('auth') || pathStr.includes('user')) {
          return { isDirectory: () => true } as fs.Stats;
        }
        throw new Error('path not found');
      });

      const result = await scanTreeStructure('/test-project');

      expect(result.nodes.length).toBe(2);
      expect(result.flatMap.size).toBe(2);
      expect(result.nodes.some(node => node.featureName === 'auth')).toBe(true);
      expect(result.nodes.some(node => node.featureName === 'user')).toBe(true);
    });

    it('should find nested specs-tree features', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      // First call for root directory - returns parent with child feature
      (fs.readdirSync as jest.Mock).mockImplementation((dirPath: string) => {
        if (dirPath === '/test-project') {
          return ['specs-tree-parent'];
        } else if (dirPath.includes('specs-tree-parent')) {
          return ['specs-tree-subfeature', 'other-file.txt'];
        }
        return [];
      });
      (fs.statSync as jest.Mock).mockImplementation((pathStr: string) => {
        if (pathStr.includes('parent') || pathStr.includes('subfeature')) {
          return { isDirectory: () => true } as fs.Stats;
        }
        return { isDirectory: () => false } as fs.Stats;
      });

      const result = await scanTreeStructure('/test-project');

      expect(result.nodes.length).toBe(2); // parent + subfeature
      expect(result.flatMap.size).toBe(2);
      const parent = result.nodes.find(node => node.featureName === 'parent');
      expect(parent).toBeDefined();
      expect(parent!.children.length).toBe(1);
      expect(parent!.children[0].featureName).toBe('subfeature');
    });

    it('should create flatMap with correct path lookups', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(['specs-tree-test']);
      (fs.statSync as jest.Mock).mockImplementation((_) => ({ isDirectory: () => true } as fs.Stats));

      const result = await scanTreeStructure('/test-project');

      expect(result.flatMap.size).toBe(1);
      const node = result.flatMap.get(path.relative(process.cwd(), '/test-project/specs-tree-test'));
      expect(node).toBeDefined();
      expect(node?.featureName).toBe('test');
    });

    it('should ignore .sddu and hidden directories', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        'specs-tree-valid',
        '.sddu-metadata',
        '.hidden-folder',
        'specs-tree-hidden'
      ]);
      (fs.statSync as jest.Mock).mockImplementation((_) => ({ isDirectory: () => true } as fs.Stats));

      const result = await scanTreeStructure('/test-project');

      expect(result.nodes.length).toBe(2);
      expect(result.nodes.some(node => node.featureName === 'valid')).toBe(true);
      expect(result.nodes.some(node => node.featureName === 'hidden')).toBe(true);
      // There should be no .sddu or .whatever in the results
    });

    it('should handle mixed directory structures appropriately', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        'specs-tree-regular',
        'package.json',
        'node_modules'
      ]);
      (fs.statSync as jest.Mock).mockImplementation((_) => ({ isDirectory: () => true } as fs.Stats));

      const result = await scanTreeStructure('/test-project');

      expect(result.nodes.length).toBe(1); // Only the specs-tree-regular should be processed
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