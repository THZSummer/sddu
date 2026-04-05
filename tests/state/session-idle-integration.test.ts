import * as fs from 'fs/promises';
import * as path from 'path';
import { SDDPlugin } from '../src/index';

// Mock client to simulate OpenCode client
const mockClient = {
  app: {
    log: async (logData) => {
      // 简单记录日志但不做实际处理
      console.debug('MockLog:', logData.body);
    }
  }
};

describe('SDD Plugin Session Events Integration', () => {
  const testBaseDir = 'tests-session-events';
  const testSpecDir = path.join(testBaseDir, 'specs-tree-root');

  beforeEach(async () => {
    // 清理测试环境
    try {
      await fs.rm(testBaseDir, { recursive: true, force: true });
    } catch {}
    
    await fs.mkdir(testSpecDir, { recursive: true });
  });

  afterEach(async () => {
    // 清理测试环境
    await fs.rm(testBaseDir, { recursive: true, force: true });
  });

  test('should register event handlers properly for session events', async () => {
    const pluginEventHandlers = await SDDPlugin({ 
      project: { name: 'test-project' },
      client: mockClient,
      $: {},
      directory: testBaseDir,
      worktree: {}
    });
    
    // 检查所需事件是否被处理
    expect('session.created' in pluginEventHandlers).toBeTruthy();
    expect('session.idle' in pluginEventHandlers).toBeTruthy();
    expect('file.edited' in pluginEventHandlers).toBeTruthy();
    expect('session.end' in pluginEventHandlers).toBeTruthy();
    
    // 验证 session.idle 处理器存在
    expect(typeof pluginEventHandlers['session.idle']).toBe('function');
    expect(typeof pluginEventHandlers['file.edited']).toBe('function');
    expect(typeof pluginEventHandlers['session.created']).toBe('function');
    expect(typeof pluginEventHandlers['session.end']).toBe('function');
  });

  test('should respond to session.idle events', async () => {
    const pluginEventHandlers = await SDDPlugin({ 
      project: { name: 'test-project' },
      client: mockClient,
      $: {},
      directory: testBaseDir,
      worktree: {}
    });
    
    // 创建测试 feature
    const featureDir = path.join(testSpecDir, 'test-session-idle');
    await fs.mkdir(featureDir, { recursive: true });
    await fs.writeFile(path.join(featureDir, 'spec.md'), '# Test Spec\nContent here');
    
    // 模拟 session idle
    const result = await pluginEventHandlers['session.idle']({ timestamp: new Date().toISOString() });
    
    // 验证不会出错
    expect(result).toBeUndefined(); // Handler returns nothing normally
  });

  test('should respond to file.edited events', async () => {
    const pluginEventHandlers = await SDDPlugin({ 
      project: { name: 'test-project' },
      client: mockClient,
      $: {},
      directory: testBaseDir,
      worktree: {}
    });
    
    // 模拟 spec 文件编辑事件
    const fileEditEvent = { filePath: `${testBaseDir}/specs-tree-root/test-feature/spec.md` };
    const result = await pluginEventHandlers['file.edited'](fileEditEvent);
    
    // 验证不会出错
    expect(result).toBeUndefined(); // Handler returns nothing normally
  });

  test('should create features on session creation', async () => {
    const pluginEventHandlers = await SDDPlugin({ 
      project: { name: 'test-project' },
      client: mockClient,
      $: {},
      directory: testBaseDir,
      worktree: {}
    });
    
    const result = await pluginEventHandlers['session.created']({ sessionId: 'test-session' });
    
    // 验证不会出错
    expect(result).toBeUndefined(); // Handler returns nothing normally
  });
});