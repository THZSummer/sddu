// Import modules after setting up mocks
import { getSDDWorkspace, getSpecsDir } from '../../../src/utils/workspace';

// We need to mock before importing
const originalEnv = process.env;
const existsSyncMock = jest.fn();

jest.mock('fs', () => ({
  existsSync: (path: unknown) => existsSyncMock(path),
}));

describe('F-250: Workspace Utility Functions - Unit Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    // Copy the original env object
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getSDDWorkspace', () => {
    it('should return SDD_WORKSPACE environment variable if set', () => {
      process.env.SDD_WORKSPACE = '/custom/workspace';
      
      const result = getSDDWorkspace();
      
      expect(result).toBe('/custom/workspace');
      // existsSync should NOT be called when env var is set
      expect(existsSyncMock).not.toHaveBeenCalled();
    });

    it('should return ".sdd" if .sdd directory exists', () => {
      existsSyncMock.mockImplementation((path: any) => path === '.sdd');
      
      const result = getSDDWorkspace();
      
      expect(result).toBe('.sdd');
    });

    it('should return "." if .specs directory exists but .sdd does not', () => {
      existsSyncMock.mockImplementation((path: any) => path === '.specs');
      
      const result = getSDDWorkspace();
      
      expect(result).toBe('.');
      expect(existsSyncMock).toHaveBeenCalledWith('.sdd');
      expect(existsSyncMock).toHaveBeenCalledWith('.specs');
    });

    it('should throw error if neither .sdd nor .specs directory exists', () => {
      existsSyncMock.mockReturnValue(false);
      
      expect(() => getSDDWorkspace()).toThrow('未找到 SDD 工作空间：请确保存在 .sdd/ 或 .specs/ 目录');
    });

    it('should prioritize .sdd over .specs when both exist', () => {
      existsSyncMock.mockReturnValue(true);
      
      const result = getSDDWorkspace();
      
      expect(result).toBe('.sdd');
    });
  });

  describe('getSpecsDir', () => {
    it('should return ".sdd/.specs" when workspace is ".sdd"', () => {
      existsSyncMock.mockImplementation((path: any) => path === '.sdd');
      
      const result = getSpecsDir();
      
      expect(result).toBe('.sdd/.specs');
    });

    it('should return ".specs" when workspace is "."', () => {
      existsSyncMock.mockImplementation((path: any) => path === '.specs');
      
      const result = getSpecsDir();
      
      expect(result).toBe('.specs');
    });

    it('should handle workspace from environment variable correctly', () => {
      process.env.SDD_WORKSPACE = '/custom/path';
      existsSyncMock.mockImplementation((path: any) => false);  // Mock .sdd and .specs as non-existent
      
      const result = getSpecsDir();
      
      expect(result).toBe('/custom/path/.specs');
    });

    it('should handle nested custom workspace from environment variable', () => {
      process.env.SDD_WORKSPACE = '/deeply/nested/custom/workspace';
      existsSyncMock.mockImplementation((path: any) => false);  // Mock directories as non-existent
      
      const result = getSpecsDir();
      
      expect(result).toBe('/deeply/nested/custom/workspace/.specs');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty SDD_WORKSPACE environment variable', () => {
      process.env.SDD_WORKSPACE = '';
      existsSyncMock.mockImplementation((path: any) => path === '.sdd');
      
      const result = getSDDWorkspace();
      
      expect(result).toBe('.sdd');
    });

    it('should throw appropriate error message', () => {
      existsSyncMock.mockReturnValue(false);
      
      expect(() => getSDDWorkspace()).toThrow(/未找到 SDD 工作空间|不存在 .sdd\/ 或 .specs\/ 目录/i);
    });
  });
});