// decision-proxy 单元测试（ADR-018 方案 E：拦截 + 识别 + 决策会话代答 + 30s 超时兜底）
// 覆盖验收标准：
//   - sessionID 匹配逻辑（仅 sddu-auto 调度的子会话生效，非 sddu-auto 会话提问不受影响）
//   - 方案 E 主链路：建/复用决策会话 + prompt LLM 真思考 + 答案解析（单/多选/自由文本）
//   - 30s 超时兜底：决策会话失败/超时降级 DecisionEngine 规则匹配（NFR-003 不阻塞）
//   - 决策来源标注（sddu-auto 决策会话 vs 超时兜底）
//   - 代答调用 client.v2.session.question.reply（不触发 client.question / HTTP 兜底）

import {
  SessionRegistry,
  DecisionEngine,
  createDecisionProxy,
  DecisionQuestion,
  buildSeedContext,
  buildDecisionPrompt,
  extractAnswerText,
  parseDecisionAnswer,
  withTimeout,
  DECISION_TIMEOUT_MS,
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

describe('方案 E 纯函数（答案解析 / 种子上下文 / prompt 构造 / 超时）', () => {
  test('parseDecisionAnswer：单选命中 label → 返回该 label', () => {
    const q: DecisionQuestion = {
      question: '技术栈',
      header: '技术栈',
      options: [{ label: 'Vue' }, { label: 'React' }],
    };
    expect(parseDecisionAnswer('我选择 React', q)).toEqual(['React']);
  });

  test('parseDecisionAnswer：单选无命中 → 保守回退首个选项', () => {
    const q: DecisionQuestion = {
      question: '技术栈',
      header: '技术栈',
      options: [{ label: '方案A' }, { label: '方案B' }],
    };
    expect(parseDecisionAnswer('随便说点什么', q)).toEqual(['方案A']);
  });

  test('parseDecisionAnswer：多选命中多个 label → 返回 label 数组', () => {
    const q: DecisionQuestion = {
      question: '选特性',
      header: '特性',
      multiple: true,
      options: [{ label: '登录' }, { label: '注册' }, { label: '支付' }],
    };
    expect(parseDecisionAnswer('登录、支付', q)).toEqual(['登录', '支付']);
  });

  test('parseDecisionAnswer：多选无命中 → 回退首个选项', () => {
    const q: DecisionQuestion = {
      question: '选特性',
      header: '特性',
      multiple: true,
      options: [{ label: '登录' }, { label: '注册' }],
    };
    expect(parseDecisionAnswer('没有想法', q)).toEqual(['登录']);
  });

  test('parseDecisionAnswer：自由文本 → 返回 trimmed 文本', () => {
    const q: DecisionQuestion = { question: '数据库选型？', header: '数据库' };
    expect(parseDecisionAnswer('  使用 SQLite  \n', q)).toEqual(['使用 SQLite']);
  });

  test('parseDecisionAnswer：自由文本为空 → 保守默认答案', () => {
    const q: DecisionQuestion = { question: '怎么做？', header: '方案' };
    const answer = parseDecisionAnswer('   ', q);
    expect(answer).toHaveLength(1);
    expect(answer[0]).toContain('sddu-auto 自主决策');
    expect(answer[0]).toContain('方案');
  });

  test('parseDecisionAnswer：单字符 label 词边界匹配（防路径随机字符误命中）', () => {
    const q: DecisionQuestion = {
      question: '选哪个？',
      header: '方案',
      options: [{ label: 'A' }, { label: 'B' }],
    };
    // 文本含 'A' 作为独立词 → 命中 'A'
    expect(parseDecisionAnswer('选 A', q)).toEqual(['A']);
    // 文本不含独立 'A'/'B' → 回退首个选项 'A'
    expect(parseDecisionAnswer('随便', q)).toEqual(['A']);
  });

  test('buildSeedContext 含启动诉求 / Feature / 项目目录 / 上游产物提示', () => {
    const ctx = {
      projectDirectory: '/tmp/proj',
      launchIntent: '做登录 API',
      featureName: 'specs-tree-login',
    };
    const seed = buildSeedContext(ctx);
    expect(seed).toContain('做登录 API');
    expect(seed).toContain('specs-tree-login');
    expect(seed).toContain('/tmp/proj');
    expect(seed).toContain('spec.md');
  });

  test('buildDecisionPrompt 含种子上下文 + 问题 + 选项 + 单选提示', () => {
    const ctx = { projectDirectory: '/tmp/proj', launchIntent: '做登录' };
    const q: DecisionQuestion = {
      question: '技术栈',
      header: '技术栈',
      options: [{ label: 'Vue' }, { label: 'React' }],
    };
    const prompt = buildDecisionPrompt(ctx, q);
    expect(prompt).toContain('做登录');
    expect(prompt).toContain('技术栈');
    expect(prompt).toContain('Vue');
    expect(prompt).toContain('React');
    expect(prompt).toContain('单选题');
  });

  test('extractAnswerText 仅提取 type==="text" 的 part 拼接', () => {
    const result = {
      data: {
        info: { role: 'assistant' },
        parts: [
          { type: 'step-start' },
          { type: 'reasoning', text: '思考过程' },
          { type: 'text', text: '答案A' },
          { type: 'text', text: '答案B' },
          { type: 'step-finish' },
        ],
      },
    };
    expect(extractAnswerText(result)).toBe('答案A\n答案B');
    expect(extractAnswerText(null)).toBe('');
    expect(extractAnswerText(undefined)).toBe('');
  });

  test('withTimeout：原 Promise 按时 resolve → 正常返回', async () => {
    const value = await withTimeout(Promise.resolve('ok'), 1000);
    expect(value).toBe('ok');
  });

  test('withTimeout：超时 → reject 且不影响原 Promise 后续状态', async () => {
    // 原 Promise 永不 resolve（模拟决策会话卡死）
    const never = new Promise<string>(() => {});
    await expect(withTimeout(never, 20, 'boom')).rejects.toThrow('boom');
  });

  test('DECISION_TIMEOUT_MS 默认 30s（NFR-003 上限）', () => {
    expect(DECISION_TIMEOUT_MS).toBe(30_000);
  });
});

describe('DecisionProxy — 方案 E 决策会话代答 + 超时兜底', () => {
  function makeSessionClient(opts: {
    create?: jest.Mock;
    prompt?: jest.Mock;
    reply?: jest.Mock;
  }) {
    const create =
      opts.create ??
      jest.fn().mockResolvedValue({ data: { id: 'ses-decision' } });
    const prompt = opts.prompt ?? jest.fn();
    return {
      app: { log: jest.fn().mockResolvedValue(undefined) },
      session: { create, prompt },
      v2: {
        session: {
          question: { reply: opts.reply ?? jest.fn().mockResolvedValue(undefined) },
        },
      },
    };
  }

  test('主链路：建决策会话 + prompt LLM 思考 → 代答答案来自 LLM 且来源标注为决策会话', async () => {
    const createSpy = jest.fn().mockResolvedValue({ data: { id: 'ses-decision' } });
    const promptSpy = jest.fn().mockResolvedValue({
      data: {
        info: { role: 'assistant', agent: 'sddu-auto' },
        parts: [{ type: 'text', text: '我选择 React' }],
      },
    });
    const replySpy = jest.fn().mockResolvedValue(undefined);
    const proxy = createDecisionProxy({
      client: makeSessionClient({ create: createSpy, prompt: promptSpy, reply: replySpy }),
      directory: '/tmp/proj',
      launchIntent: '做前端项目',
      featureName: 'specs-tree-frontend',
    });

    proxy.registry.markAutoSession('ses-auto');
    proxy.registry.registerChild('ses-auto', 'ses-build');

    await proxy.event({
      event: {
        type: 'question.asked',
        properties: {
          id: 'req-e',
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

    // ① 建会话：agent=sddu-auto，title 标注
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy.mock.calls[0][0].body.agent).toBe('sddu-auto');
    expect(createSpy.mock.calls[0][0].body.title).toContain('决策会话');

    // ② prompt：path.id=决策会话ID，body.agent=sddu-auto（权威权限），parts 为 text
    expect(promptSpy).toHaveBeenCalledTimes(1);
    const promptCall = promptSpy.mock.calls[0][0];
    expect(promptCall.path.id).toBe('ses-decision');
    expect(promptCall.body.agent).toBe('sddu-auto');
    expect(promptCall.body.parts).toHaveLength(1);
    expect(promptCall.body.parts[0].type).toBe('text');
    expect(promptCall.body.parts[0].text).toContain('React');

    // ③ 代答：答案来自 LLM 思考（React），非规则匹配首个选项
    expect(replySpy).toHaveBeenCalledTimes(1);
    expect(replySpy.mock.calls[0][0].questionV2Reply.answers).toEqual([['React']]);
  });

  test('决策会话复用：二次决策点复用同一 sessionID，不再 create', async () => {
    const createSpy = jest.fn().mockResolvedValue({ data: { id: 'ses-decision' } });
    const promptSpy = jest.fn().mockResolvedValue({
      data: { parts: [{ type: 'text', text: 'React' }] },
    });
    const replySpy = jest.fn().mockResolvedValue(undefined);
    const proxy = createDecisionProxy({
      client: makeSessionClient({ create: createSpy, prompt: promptSpy, reply: replySpy }),
      directory: '/tmp/proj',
      launchIntent: '做前端',
    });

    proxy.registry.markAutoSession('ses-auto');
    proxy.registry.registerChild('ses-auto', 'ses-build');

    const q = {
      question: '框架',
      header: '框架',
      options: [{ label: 'React' }, { label: 'Vue' }],
    };
    await proxy.event({
      event: { type: 'question.asked', properties: { id: 'r1', sessionID: 'ses-build', questions: [q] } },
    });
    await proxy.event({
      event: { type: 'question.asked', properties: { id: 'r2', sessionID: 'ses-build', questions: [q] } },
    });

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(promptSpy).toHaveBeenCalledTimes(2);
    // 两次 prompt 均指向同一决策会话
    expect(promptSpy.mock.calls[0][0].path.id).toBe('ses-decision');
    expect(promptSpy.mock.calls[1][0].path.id).toBe('ses-decision');
  });

  test('超时兜底：prompt 卡死超时 → 降级规则匹配且不阻塞，来源标注超时兜底', async () => {
    const createSpy = jest.fn().mockResolvedValue({ data: { id: 'ses-decision' } });
    // prompt 永不 resolve，触发超时
    const promptSpy = jest.fn().mockImplementation(() => new Promise(() => {}));
    const replySpy = jest.fn().mockResolvedValue(undefined);
    const proxy = createDecisionProxy({
      client: makeSessionClient({ create: createSpy, prompt: promptSpy, reply: replySpy }),
      directory: '/tmp/proj',
      launchIntent: '需要一个基于 Next.js 的前端项目',
      decisionTimeoutMs: 30,
    });

    proxy.registry.markAutoSession('ses-auto');
    proxy.registry.registerChild('ses-auto', 'ses-build');

    await expect(
      proxy.event({
        event: {
          type: 'question.asked',
          properties: {
            id: 'req-timeout',
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
      }),
    ).resolves.toBeUndefined();

    // 降级规则匹配：launchIntent 含 "Next.js" → 规则匹配 Next.js（非决策会话 LLM）
    expect(replySpy).toHaveBeenCalledTimes(1);
    expect(replySpy.mock.calls[0][0].questionV2Reply.answers).toEqual([['Next.js']]);
  });

  test('超时后重置决策会话缓存，下次决策点重建新会话', async () => {
    let sessionCounter = 0;
    const createSpy = jest.fn().mockImplementation(() =>
      Promise.resolve({ data: { id: `ses-decision-${++sessionCounter}` } }),
    );
    const promptSpy = jest.fn();
    const replySpy = jest.fn().mockResolvedValue(undefined);

    // 第一次 prompt 卡死 → 超时；之后 prompt 正常返回
    promptSpy
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockResolvedValue({ data: { parts: [{ type: 'text', text: 'React' }] } });

    const proxy = createDecisionProxy({
      client: makeSessionClient({ create: createSpy, prompt: promptSpy, reply: replySpy }),
      directory: '/tmp/proj',
      launchIntent: '做前端',
      decisionTimeoutMs: 30,
    });
    proxy.registry.markAutoSession('ses-auto');
    proxy.registry.registerChild('ses-auto', 'ses-build');

    const q = {
      question: '框架',
      header: '框架',
      options: [{ label: 'React' }, { label: 'Vue' }],
    };
    await proxy.event({
      event: { type: 'question.asked', properties: { id: 'r1', sessionID: 'ses-build', questions: [q] } },
    });
    await proxy.event({
      event: { type: 'question.asked', properties: { id: 'r2', sessionID: 'ses-build', questions: [q] } },
    });

    // 超时后缓存重置 → 第二次重建新会话（sessionCounter=2）
    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(promptSpy.mock.calls[1][0].path.id).toBe('ses-decision-2');
  });

  test('client 无 session 能力 → 直接规则匹配兜底（来源超时兜底，行为同方案 D）', async () => {
    const replySpy = jest.fn().mockResolvedValue(undefined);
    // 无 session 命名空间的 client（仅 v2 代答通道）
    const client = {
      app: { log: jest.fn().mockResolvedValue(undefined) },
      v2: { session: { question: { reply: replySpy } } },
    };
    const proxy = createDecisionProxy({
      client,
      directory: '/tmp/proj',
      launchIntent: '做登录',
    });
    proxy.registry.markAutoSession('ses-auto');
    proxy.registry.registerChild('ses-auto', 'ses-build');

    await proxy.event({
      event: {
        type: 'question.asked',
        properties: {
          id: 'req-nosession',
          sessionID: 'ses-build',
          questions: [
            { question: '技术栈？', header: '技术栈', options: [{ label: 'React' }, { label: 'Vue' }] },
          ],
        },
      },
    });

    expect(replySpy).toHaveBeenCalledTimes(1);
    expect(replySpy.mock.calls[0][0].questionV2Reply.answers).toEqual([['React']]);
  });

  test('决策来源落盘：sddu-auto 决策会话 vs 超时兜底', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'sddu-proxy-e-'));
    try {
      const contextFile = join(tmpDir, 'auto-context.json');
      await writeFile(
        contextFile,
        JSON.stringify({ launchIntent: '做前端项目', featureName: 'specs-tree-frontend' }),
        'utf8',
      );

      const createSpy = jest.fn().mockResolvedValue({ data: { id: 'ses-decision' } });
      const promptSpy = jest.fn().mockResolvedValue({
        data: { parts: [{ type: 'text', text: '我选择 React' }] },
      });
      const replySpy = jest.fn().mockResolvedValue(undefined);
      const proxy = createDecisionProxy({
        client: makeSessionClient({ create: createSpy, prompt: promptSpy, reply: replySpy }),
        directory: tmpDir,
        contextFile,
      });
      proxy.registry.markAutoSession('ses-auto');
      proxy.registry.registerChild('ses-auto', 'ses-build');

      await proxy.event({
        event: {
          type: 'question.asked',
          properties: {
            id: 'req-src',
            sessionID: 'ses-build',
            questions: [
              {
                question: '框架？',
                header: '框架',
                options: [{ label: 'React' }, { label: 'Vue' }],
              },
            ],
          },
        },
      });

      const decisionsFile = join(
        tmpDir,
        '.sddu',
        'specs-tree-root',
        'specs-tree-frontend',
        'auto-decisions.md',
      );
      const content = await readFile(decisionsFile, 'utf8');
      expect(content).toContain('决策来源');
      expect(content).toContain('sddu-auto 决策会话');
      expect(content).toContain('LLM 真思考');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('决策来源落盘：超时兜底 → 标注超时兜底', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'sddu-proxy-e-'));
    try {
      const contextFile = join(tmpDir, 'auto-context.json');
      await writeFile(
        contextFile,
        JSON.stringify({ launchIntent: '做前端', featureName: 'specs-tree-frontend' }),
        'utf8',
      );

      const createSpy = jest.fn().mockResolvedValue({ data: { id: 'ses-decision' } });
      const promptSpy = jest.fn().mockImplementation(() => new Promise(() => {}));
      const replySpy = jest.fn().mockResolvedValue(undefined);
      const proxy = createDecisionProxy({
        client: makeSessionClient({ create: createSpy, prompt: promptSpy, reply: replySpy }),
        directory: tmpDir,
        contextFile,
        decisionTimeoutMs: 30,
      });
      proxy.registry.markAutoSession('ses-auto');
      proxy.registry.registerChild('ses-auto', 'ses-build');

      await proxy.event({
        event: {
          type: 'question.asked',
          properties: {
            id: 'req-src2',
            sessionID: 'ses-build',
            questions: [
              {
                question: '框架？',
                header: '框架',
                options: [{ label: 'React' }, { label: 'Vue' }],
              },
            ],
          },
        },
      });

      const decisionsFile = join(
        tmpDir,
        '.sddu',
        'specs-tree-root',
        'specs-tree-frontend',
        'auto-decisions.md',
      );
      const content = await readFile(decisionsFile, 'utf8');
      expect(content).toContain('决策来源');
      expect(content).toContain('超时兜底');
      expect(content).toContain('规则匹配');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
