// decision-proxy 单元测试（方案 D 核心：订阅 + 识别 + 决策 + 代答 四步链路）
// 覆盖验收标准：
//   - sessionID 匹配逻辑（仅 sddu-auto 调度的子会话生效，非 sddu-auto 会话提问不受影响）
//   - 决策逻辑信息不足时仍返回确定答案（硬决策，NFR-003）
//   - 代答调用 client.v2.session.question.reply（不触发 client.question / HTTP 兜底）

import {
  SessionRegistry,
  DecisionEngine,
  createDecisionProxy,
  DecisionQuestion,
} from '../../../adapters/opencode/decision-proxy';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('SessionRegistry（识别）', () => {
  let registry: SessionRegistry;

  beforeEach(() => {
    registry = new SessionRegistry();
  });

  test('markAutoSession 幂等标记 sddu-auto 主会话', () => {
    expect(registry.markAutoSession('ses-auto')).toBe(true);
    expect(registry.markAutoSession('ses-auto')).toBe(false);
    expect(registry.isAutoSession('ses-auto')).toBe(true);
  });

  test('observeSessionCreated：agent=sddu-auto 标记主会话', () => {
    registry.observeSessionCreated({ sessionID: 'ses-auto', agent: 'sddu-auto' });
    expect(registry.isAutoSession('ses-auto')).toBe(true);
    expect(registry.isInterceptTarget('ses-auto')).toBe(false); // 主会话自身不拦截
  });

  test('observeSessionCreated：parentID 关联子会话 → 拦截目标', () => {
    registry.markAutoSession('ses-auto');
    registry.observeSessionCreated({
      sessionID: 'ses-build',
      parentID: 'ses-auto',
      agent: 'sddu-build',
    });

    expect(registry.isInterceptTarget('ses-build')).toBe(true);
    expect(registry.getAutoParent('ses-build')).toBe('ses-auto');
  });

  test('observeSessionCreated：孙会话（子会话的 parentID）传递登记', () => {
    registry.markAutoSession('ses-auto');
    registry.observeSessionCreated({ sessionID: 'ses-build', parentID: 'ses-auto' });
    registry.observeSessionCreated({ sessionID: 'ses-grand', parentID: 'ses-build' });

    expect(registry.isInterceptTarget('ses-grand')).toBe(true);
    expect(registry.getAutoParent('ses-grand')).toBe('ses-auto');
  });

  test('非 sddu-auto 会话的提问不被拦截', () => {
    // 普通 sddu / sddu-fast 的会话无 parentID 关联，绝不拦截
    registry.observeSessionCreated({ sessionID: 'ses-ordinary', agent: 'sddu' });
    registry.observeSessionCreated({ sessionID: 'ses-fast', agent: 'sddu-fast' });

    expect(registry.isInterceptTarget('ses-ordinary')).toBe(false);
    expect(registry.isInterceptTarget('ses-fast')).toBe(false);
    expect(registry.isInterceptTarget('ses-unknown')).toBe(false);
  });

  test('registerChild 仅接受已知父会话，拒绝误拦截', () => {
    registry.markAutoSession('ses-auto');
    expect(registry.registerChild('ses-auto', 'ses-child')).toBe(true);
    expect(registry.isInterceptTarget('ses-child')).toBe(true);

    // 未知父会话（非 auto）→ 拒绝登记
    expect(registry.registerChild('ses-unknown-parent', 'ses-evil')).toBe(false);
    expect(registry.isInterceptTarget('ses-evil')).toBe(false);
  });

  test('hasAutoSessions 反映主会话存在性', () => {
    expect(registry.hasAutoSessions()).toBe(false);
    registry.markAutoSession('ses-auto');
    expect(registry.hasAutoSessions()).toBe(true);
  });
});

describe('DecisionEngine（决策）', () => {
  test('有选项：信息不足时硬决策选首个选项', () => {
    const engine = new DecisionEngine({ projectDirectory: '/tmp/proj' });
    const q: DecisionQuestion = {
      question: '选择技术方案',
      header: '技术方案',
      options: [{ label: '方案A' }, { label: '方案B' }],
    };
    expect(engine.decide(q)).toEqual(['方案A']);
  });

  test('有选项：上下文关键词匹配优先于首个选项', () => {
    const engine = new DecisionEngine({
      projectDirectory: '/tmp/proj',
      launchIntent: '需要一个基于 React 的前端项目',
      featureName: 'react-app',
    });
    const q: DecisionQuestion = {
      question: '技术栈',
      header: '技术栈',
      options: [{ label: 'Vue' }, { label: 'React' }],
    };
    expect(engine.decide(q)).toEqual(['React']);
  });

  test('单字符标签不做关键词匹配，确定性回退首个选项（防路径随机字符误匹配）', () => {
    // 根因回归：projectDirectory 文件系统路径（如 /home/usb/wks/sddu 含 'b'/'s'/'d'）
    // 会与单字符标签（'A'/'B'）误匹配，破坏「信息不足选首个选项」的确定性（NFR-003）。
    const engine = new DecisionEngine({
      projectDirectory: '/home/usb/wks/sddu',
      launchIntent: 'B', // 诉求里甚至明确含 'B'
    });
    const q: DecisionQuestion = {
      question: '选哪个？',
      header: '方案',
      options: [{ label: 'A' }, { label: 'B' }],
    };
    // 单字符标签跳过关键词匹配 → 回退首个选项 'A'
    expect(engine.decide(q)).toEqual(['A']);
  });

  test('多字符标签仍按关键词匹配（单字符修复不削弱正常匹配）', () => {
    const engine = new DecisionEngine({
      projectDirectory: '/tmp/proj',
      launchIntent: '需要一个基于 React 的前端项目',
      featureName: 'react-app',
    });
    const q: DecisionQuestion = {
      question: '技术栈',
      header: '技术栈',
      options: [{ label: 'Vue' }, { label: 'React' }],
    };
    expect(engine.decide(q)).toEqual(['React']);
  });

  test('无选项（自由文本）：返回上下文锚定的确定性答案', () => {
    const engine = new DecisionEngine({
      projectDirectory: '/tmp/proj',
      launchIntent: '做用户登录 API',
    });
    const q: DecisionQuestion = {
      question: '数据库选型？',
      header: '数据库',
    };
    const answer = engine.decide(q);
    expect(answer).toHaveLength(1);
    expect(answer[0]).toContain('sddu-auto 自主决策');
    expect(answer[0]).toContain('用户登录 API');
  });

  test('信息完全不足（无诉求无 Feature）仍返回非空确定答案', () => {
    const engine = new DecisionEngine({ projectDirectory: '/tmp/proj' });
    const q: DecisionQuestion = { question: '怎么做？', header: '方案' };
    const answer = engine.decide(q);
    expect(answer.length).toBeGreaterThan(0);
    expect(answer[0].length).toBeGreaterThan(0);
  });

  test('decideAll 对多问题逐一硬决策', () => {
    const engine = new DecisionEngine({ projectDirectory: '/tmp/proj' });
    const qs: DecisionQuestion[] = [
      { question: 'a', header: 'a', options: [{ label: 'x' }, { label: 'y' }] },
      { question: 'b', header: 'b' },
    ];
    const answers = engine.decideAll(qs);
    expect(answers).toHaveLength(2);
    expect(answers[0]).toEqual(['x']);
    expect(answers[1].length).toBeGreaterThan(0);
  });
});

describe('DecisionProxy（订阅 + 识别 + 决策 + 代答 四步编排）', () => {
  function makeClient(replySpy = jest.fn()) {
    return {
      app: { log: jest.fn().mockResolvedValue(undefined) },
      v2: {
        session: {
          question: { reply: replySpy },
        },
      },
    };
  }

  test('question.asked 来自拦截目标子会话 → 决策并代答', async () => {
    const replySpy = jest.fn().mockResolvedValue(undefined);
    const proxy = createDecisionProxy({
      client: makeClient(replySpy),
      directory: '/tmp/proj',
      launchIntent: '做登录功能',
    });

    // 建立 auto 主会话 + 子会话映射
    proxy.registry.markAutoSession('ses-auto');
    proxy.registry.registerChild('ses-auto', 'ses-build');

    await proxy.event({
      event: {
        id: 'evt-1',
        type: 'question.asked',
        properties: {
          id: 'req-1',
          sessionID: 'ses-build',
          questions: [
            {
              question: '用哪个框架？',
              header: '框架',
              options: [{ label: 'React' }, { label: 'Vue' }],
            },
          ],
        },
      },
    });

    expect(replySpy).toHaveBeenCalledTimes(1);
    const call = replySpy.mock.calls[0][0];
    expect(call.sessionID).toBe('ses-build');
    expect(call.requestID).toBe('req-1');
    expect(call.questionV2Reply.answers).toEqual([['React']]);
  });

  test('question.asked 来自非 sddu-auto 会话 → 不干预（不代答）', async () => {
    const replySpy = jest.fn().mockResolvedValue(undefined);
    const proxy = createDecisionProxy({
      client: makeClient(replySpy),
      directory: '/tmp/proj',
    });

    await proxy.event({
      event: {
        type: 'question.asked',
        properties: {
          id: 'req-2',
          sessionID: 'ses-ordinary',
          questions: [{ question: '确认？', header: '确认' }],
        },
      },
    });

    expect(replySpy).not.toHaveBeenCalled();
  });

  test('session.created 事件驱动父子映射登记', async () => {
    const proxy = createDecisionProxy({
      client: makeClient(),
      directory: '/tmp/proj',
    });

    await proxy.event({
      event: {
        type: 'session.created',
        properties: { sessionID: 'ses-auto', info: { agent: 'sddu-auto' } },
      },
    });
    await proxy.event({
      event: {
        type: 'session.created',
        properties: {
          sessionID: 'ses-build',
          info: { parentID: 'ses-auto', agent: 'sddu-build' },
        },
      },
    });

    expect(proxy.registry.isAutoSession('ses-auto')).toBe(true);
    expect(proxy.registry.isInterceptTarget('ses-build')).toBe(true);
  });

  test('chat.message agent=sddu-auto 兜底标记主会话', async () => {
    const proxy = createDecisionProxy({
      client: makeClient(),
      directory: '/tmp/proj',
    });

    await proxy.chatMessage({ sessionID: 'ses-auto', agent: 'sddu-auto' });
    expect(proxy.registry.isAutoSession('ses-auto')).toBe(true);

    // 非 sddu-auto 不标记
    await proxy.chatMessage({ sessionID: 'ses-other', agent: 'sddu' });
    expect(proxy.registry.isAutoSession('ses-other')).toBe(false);
  });

  test('忽略未知事件类型，不抛错', async () => {
    const proxy = createDecisionProxy({
      client: makeClient(),
      directory: '/tmp/proj',
    });
    await expect(
      proxy.event({ event: { type: 'file.edited', properties: {} } }),
    ).resolves.toBeUndefined();
    await expect(proxy.event({ event: undefined })).resolves.toBeUndefined();
  });

  test('dispose 清空映射', async () => {
    const proxy = createDecisionProxy({
      client: makeClient(),
      directory: '/tmp/proj',
    });
    proxy.registry.markAutoSession('ses-auto');
    proxy.registry.registerChild('ses-auto', 'ses-build');

    await proxy.dispose();
    expect(proxy.registry.hasAutoSessions()).toBe(false);
    expect(proxy.registry.isInterceptTarget('ses-build')).toBe(false);
  });
});

describe('DecisionProxy — contextFile 懒加载（refreshLaunchIntent）', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'sddu-proxy-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  function makeClient(replySpy = jest.fn()) {
    return {
      app: { log: jest.fn().mockResolvedValue(undefined) },
      v2: {
        session: {
          question: { reply: replySpy },
        },
      },
    };
  }

  test('contextFile 存在 → 懒加载 launchIntent，关键词匹配生效', async () => {
    const contextFile = join(tmpDir, 'auto-context.json');
    await writeFile(
      contextFile,
      JSON.stringify({
        launchIntent: '需要一个基于 Next.js 的博客项目',
        featureName: 'specs-tree-blog',
      }),
      'utf8',
    );

    const replySpy = jest.fn().mockResolvedValue(undefined);
    const proxy = createDecisionProxy({
      client: makeClient(replySpy),
      directory: tmpDir,
      contextFile,
    });

    proxy.registry.markAutoSession('ses-auto');
    proxy.registry.registerChild('ses-auto', 'ses-build');

    await proxy.event({
      event: {
        type: 'question.asked',
        properties: {
          id: 'req-ctx',
          sessionID: 'ses-build',
          questions: [
            {
              question: '技术栈？',
              header: '技术栈',
              options: [{ label: 'Vue' }, { label: 'Next.js' }],
            },
          ],
        },
      },
    });

    expect(replySpy).toHaveBeenCalledTimes(1);
    // 懒加载的 launchIntent 含 "Next.js" → 关键词匹配替代「选首个（Vue）」
    expect(replySpy.mock.calls[0][0].questionV2Reply.answers).toEqual([['Next.js']]);
  });

  test('contextFile 缺失 → 不抛错，退回首个选项', async () => {
    const replySpy = jest.fn().mockResolvedValue(undefined);
    const proxy = createDecisionProxy({
      client: makeClient(replySpy),
      directory: tmpDir,
      contextFile: join(tmpDir, 'not-exist.json'),
    });

    proxy.registry.markAutoSession('ses-auto');
    proxy.registry.registerChild('ses-auto', 'ses-build');

    await proxy.event({
      event: {
        type: 'question.asked',
        properties: {
          id: 'req-ctx2',
          sessionID: 'ses-build',
          questions: [
            {
              question: '选哪个？',
              header: '方案',
              options: [{ label: 'A' }, { label: 'B' }],
            },
          ],
        },
      },
    });

    expect(replySpy).toHaveBeenCalledTimes(1);
    expect(replySpy.mock.calls[0][0].questionV2Reply.answers).toEqual([['A']]);
  });

  test('contextFile 含 featureName → 决策追溯落盘 auto-decisions.md', async () => {
    const contextFile = join(tmpDir, 'auto-context.json');
    await writeFile(
      contextFile,
      JSON.stringify({
        launchIntent: '做一个用户登录功能',
        featureName: 'specs-tree-login',
      }),
      'utf8',
    );

    const replySpy = jest.fn().mockResolvedValue(undefined);
    const proxy = createDecisionProxy({
      client: makeClient(replySpy),
      directory: tmpDir,
      contextFile,
    });

    proxy.registry.markAutoSession('ses-auto');
    proxy.registry.registerChild('ses-auto', 'ses-build');

    await proxy.event({
      event: {
        type: 'question.asked',
        properties: {
          id: 'req-trace',
          sessionID: 'ses-build',
          questions: [
            {
              question: '数据库选型？',
              header: '数据库',
              options: [{ label: 'MySQL' }, { label: 'SQLite' }],
            },
          ],
        },
      },
    });

    const decisionsFile = join(
      tmpDir,
      '.sddu',
      'specs-tree-root',
      'specs-tree-login',
      'auto-decisions.md',
    );
    const content = await readFile(decisionsFile, 'utf8');
    expect(content).toContain('数据库');
    expect(content).toContain('MySQL');
    expect(content).toContain('decision-proxy 协议层自动追加');
  });
});

describe('DecisionProxy — HTTP 兜底与三级降级顺序（httpReplyQuestion）', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  // 无 v2 通道的 client（可选带全局 question.reply）
  function makeClientNoV2(globalReply?: jest.Mock) {
    const client: any = { app: { log: jest.fn().mockResolvedValue(undefined) } };
    if (globalReply) client.question = { reply: globalReply };
    return client;
  }

  function buildProxy(client: any, extra: Record<string, unknown> = {}) {
    return createDecisionProxy({
      client,
      directory: '/tmp/proj',
      ...extra,
    } as any);
  }

  test('降级顺序：v2 缺失、全局 question.reply 存在 → 走全局通道', async () => {
    const globalReply = jest.fn().mockResolvedValue(undefined);
    const proxy = buildProxy(makeClientNoV2(globalReply));
    proxy.registry.markAutoSession('ses-auto');
    proxy.registry.registerChild('ses-auto', 'ses-build');

    await proxy.event({
      event: {
        type: 'question.asked',
        properties: {
          id: 'req-g',
          sessionID: 'ses-build',
          questions: [{ question: 'q', header: 'h', options: [{ label: 'X' }] }],
        },
      },
    });

    expect(globalReply).toHaveBeenCalledTimes(1);
    expect(globalReply.mock.calls[0][0].requestID).toBe('req-g');
    expect(globalReply.mock.calls[0][0].answers).toEqual([['X']]);
  });

  test('降级顺序：v2 与全局均缺失、serverUrl 存在 → 走 HTTP 全局兜底（成功）', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true } as any);
    global.fetch = fetchSpy as any;

    const proxy = buildProxy(makeClientNoV2(), {
      serverUrl: 'http://localhost:9999',
    });
    proxy.registry.markAutoSession('ses-auto');
    proxy.registry.registerChild('ses-auto', 'ses-build');

    await proxy.event({
      event: {
        type: 'question.asked',
        properties: {
          id: 'req-http',
          sessionID: 'ses-build',
          questions: [{ question: 'q', header: 'h', options: [{ label: 'X' }] }],
        },
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = fetchSpy.mock.calls[0][0] as string;
    // 全局端点：POST /question/{requestID}/reply（不再用 session 级端点，其 404）
    expect(url).toContain('/question/req-http/reply');
    expect(url).not.toContain('/api/session/');
    const init = fetchSpy.mock.calls[0][1] as any;
    expect(JSON.parse(init.body)).toEqual({ answers: [['X']] });
  });

  test('HTTP 兜底 res.ok=false → 捕获异常不冒泡，event 正常 resolve', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as any);
    global.fetch = fetchSpy as any;

    const logSpy = jest.fn().mockResolvedValue(undefined);
    const proxy = buildProxy(makeClientNoV2(), {
      serverUrl: 'http://localhost:9999',
      log: logSpy,
    });
    proxy.registry.markAutoSession('ses-auto');
    proxy.registry.registerChild('ses-auto', 'ses-build');

    await expect(
      proxy.event({
        event: {
          type: 'question.asked',
          properties: {
            id: 'req-http-fail',
            sessionID: 'ses-build',
            questions: [{ question: 'q', header: 'h', options: [{ label: 'X' }] }],
          },
        },
      }),
    ).resolves.toBeUndefined();

    const errorCalls = logSpy.mock.calls.filter((c) => c[0] === 'error');
    expect(errorCalls.length).toBeGreaterThan(0);
    expect(String(errorCalls[0][1])).toContain('HTTP reply failed');
  });

  test('三级通道均不可用 → 仅告警不抛错', async () => {
    const logSpy = jest.fn().mockResolvedValue(undefined);
    const proxy = buildProxy(makeClientNoV2(), { log: logSpy });
    proxy.registry.markAutoSession('ses-auto');
    proxy.registry.registerChild('ses-auto', 'ses-build');

    await expect(
      proxy.event({
        event: {
          type: 'question.asked',
          properties: {
            id: 'req-none',
            sessionID: 'ses-build',
            questions: [{ question: 'q', header: 'h' }],
          },
        },
      }),
    ).resolves.toBeUndefined();

    const warnCalls = logSpy.mock.calls.filter((c) => c[0] === 'warn');
    expect(warnCalls.some((c) => String(c[1]).includes('no reply channel'))).toBe(true);
  });
});
