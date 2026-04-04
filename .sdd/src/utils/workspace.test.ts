import { existsSync } from 'fs';
import { getSDDWorkspace, getSpecsDir } from './workspace';

// Mock the existsSync function
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

const mockExistsSync = (existsSync as jest.MockedFunction<typeof existsSync>);

describe('workspace utilities', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    Object.keys(process.env).forEach(key => delete process.env[key]);
  });

  afterEach(() => {
    // Restore environment
    Object.keys(process.env).forEach(key => delete process.env[key]);
    Object.assign(process.env, originalEnv);
  });

  describe('getSDDWorkspace', () => {
    it('should return SDD_WORKSPACE environment variable if set', () => {
      process.env.SDD_WORKSPACE = '/custom/workspace';
      
      const result = getSDDWorkspace();
      
      expect(result).toBe('/custom/workspace');
      // existsSync should NOT be called when env var is set
      expect(mockExistsSync).not.toHaveBeenCalled();
    });

    it('should return ".sdd" if .sdd directory exists', () => {
      // Make existsSync return true only for .sdd
      mockExistsSync.mockImplementation((path: any) => path === '.sdd');
      
      const result = getSDDWorkspace();
      
      expect(result).toBe('.sdd');
      expect(mockExistsSync).toHaveBeenCalledWith('.sdd');
    });

    it('should return "." if .specs directory exists but .sdd does not', () => {
      // Make existsSync return true only for .specs
      mockExistsSync.mockImplementation((path: any) => path === '.specs');
      
      const result = getSDDWorkspace();
      
      expect(result).toBe('.');
      expect(mockExistsSync).toHaveBeenCalledWith('.sdd');
      expect(mockExistsSync).toHaveBeenCalledWith('.specs');
    });

    it('should throw error if neither .sdd nor .specs directory exists', () => {
      // Make existsSync return false for both
      mockExistsSync.mockReturnValue(false);
      
      expect(() => getSDDWorkspace()).toThrow('未找到 SDD 工作空间：请确保存在 .sdd/ 或 .specs/ 目录');
      expect(mockExistsSync).toHaveBeenCalledWith('.sdd');
      expect(mockExistsSync).toHaveBeenCalledWith('.specs');
    });
  });

  describe('getSpecsDir', () => {
    it('should return ".sdd/.specs" when workspace is ".sdd"', () => {
      mockExistsSync.mockImplementation((path: any) => path === '.sdd');
      
      const result = getSpecsDir();
      
      expect(result).toBe('.sdd/.specs');
      expect(mockExistsSync).toHaveBeenCalledWith('.sdd');
    });

    it('should return ".specs" when workspace is "."', () => {
      mockExistsSync.mockImplementation((path: any) => path === '.specs');
      
      const result = getSpecsDir();
      
      expect(result).toBe('.specs');
      expect(mockExistsSync).toHaveBeenCalledWith('.sdd');
      expect(mockExistsSync).toHaveBeenCalledWith('.specs');
    });

    it('should respect custom workspace from environment variable', () => {
      process.env.SDD_WORKSPACE = '/custom/workspace';
      
      const result = getSpecsDir();
      
      expect(result).toBe('/custom/workspace/.specs');
    });
  });
});