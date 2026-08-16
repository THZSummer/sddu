// OpenCode 平台适配 — 决策代理层（ADR-018 方案 E：协议层拦截 + 插件内同步决策会话代答）
// 按 ADR-018 v4.2 落地五步完整链路：
//   ① 订阅 question.asked 事件（插件 event hook）
//   ② 识别「sddu-auto 调度的子会话提问」（SessionRegistry 维护 主会话→子会话 映射，识别机制不变）
//   ③ 建/复用独立「决策会话」（client.session.create，agent=sddu-auto，注入种子上下文）
//      → client.session.prompt 同步等 sddu-auto LLM 真思考（决策会话 idle、无死锁）
//   ④ 解析答案 → 调用 reply(requestID, answers) 代答，问题全程不到达终端用户（FR-006）
//   ⑤ 30s 超时兜底：决策会话未响应则降级 DecisionEngine 规则匹配（NFR-003 不阻塞不反问）
// 只拦截 sddu-auto 调度的子会话，不干扰普通 sddu/sddu-fast 的既有提问行为（NG-004）。
//
// 规则：本模块自包含（不依赖业务域 / state / shared），可 import @opencode-ai/plugin。
// 依赖注入：client / directory / serverUrl 由 plugin.ts 传入（ADR-021：依赖传递替代全局单例）。
//
// 类型说明（对齐 TASK-001 / TASK-008 spike 结论）：
// - 运行时（1.18.18）把全部 server 事件以 {id, type, properties} 形状派发给插件 event hook，
//   question.asked 也在其中，其 properties 含 {id(requestID), sessionID, questions, tool?}。
// - 根 node_modules 的 @opencode-ai/sdk 为 1.16.2（v2 子路径损坏），故本模块采用
//   「本地最小类型声明 + 运行时 client 动态访问」的方式，避免升级依赖带来的破坏风险。
// - 运行实证（2026-08-16）发现：opencode 1.18.18 运行时注入插件的 client 为 v1 形态
//   （成员 global/project/session/app/…，无 v2 / 无顶层 question 访问器），故代答通道 1/2
//   的 client 访问器在真实运行时均缺失、被可选链短路跳过；真正可用的代答通道是
//   HTTP 全局端点 POST /question/{requestID}/reply（serve 模式，通道 3）。本模块保留
//   通道 1/2 作为「若未来运行时 client 升级为 v2 则优先走进程内通道」的兼容探测，
//   HTTP 全局端点作为可靠兜底。
// - TASK-008 spike 实证（spike-decision-session.md）固定方案 E 契约：插件 v1 client 的
//   `session.create({body:{agent,title}})`（agent 运行时接受并存储）返回 {data:Session}；
//   `session.prompt({path:{id},body:{agent:'sddu-auto',parts:[{type:'text',text}]}})` 同步等待
//   LLM 完整思考（≈10.5s、idle 无死锁、会话复用无死锁），返回 {data:{info,parts}}，答案文本
//   在 type==="text" 的 part 中；决策会话权限 read✅/edit❌/bash❌ 由 prompt 的 body.agent 决定。

// ============ 本地最小类型声明（对齐 v2 SDK EventQuestionAsked / Question 服务） ============

export interface DecisionQuestionOption {
  label: string;
  description?: string;
}

export interface DecisionQuestion {
  /** 完整问题描述 */
  question: string;
  /** 极短标签（≤30 字符） */
  header: string;
  options?: Array<DecisionQuestionOption>;
  multiple?: boolean;
  /** 是否允许自由文本回答 */
  custom?: boolean;
}

/** question.asked 事件的 properties（对齐 v2 SDK EventQuestionAsked.properties） */
export interface QuestionAskedProperties {
  /** requestID，reply 代答时使用 */
  id: string;
  sessionID: string;
  questions: Array<DecisionQuestion>;
  tool?: { messageID: string; callID: string };
}

/** 运行时派发给插件 event hook 的事件外壳（{id, type, properties}） */
export interface OpenCodeEvent {
  id?: string;
  type?: string;
  properties?: Record<string, unknown>;
}

// ============ 方案 E：决策会话相关类型（对齐 TASK-008 spike 契约） ============

/** 决策来源标注：sddu-auto 决策会话（LLM 真思考） vs 超时兜底（规则匹配） */
export type DecisionSource = 'sddu-auto 决策会话' | '超时兜底';

/** 决策会话思考超时（NFR-003：不阻塞不反问），默认 30s */
export const DECISION_TIMEOUT_MS = 30_000;

/** 决策会话文本 part 输入（对齐 SessionPromptData.body.parts[TextPartInput]） */
export interface DecisionTextPart {
  type: 'text';
  text: string;
}

/** 决策会话 prompt 返回的 part（对齐 AssistantMessage.parts） */
export interface DecisionSessionPart {
  type?: string;
  text?: string;
}

/** 决策会话 prompt 返回结构（hey-api {data, error} 形状，取 .data） */
export interface DecisionPromptResult {
  data?: {
    info?: unknown;
    parts?: Array<DecisionSessionPart>;
  };
}

// ============ ① 识别：SessionRegistry（sddu-auto 调度子会话映射） ============

export interface SessionCreatedInfo {
  sessionID?: string;
  parentID?: string;
  agent?: string;
}

/**
 * 维护「sddu-auto 主会话 → 子会话」映射，用于精确识别「哪些 question.asked 需要代答」。
 *
 * - autoRoots   ：sddu-auto 主会话集合（其自身提问不拦截，见 FR-003 启动阶段唯一人机交互点）。
 * - descendants ：sddu-auto 调度出的子会话（含孙会话）集合，这些会话的提问必须代答。
 * - childToAuto ：子会话 → 最近的 sddu-auto 祖先（用于日志追溯与上下文注入）。
 */
export class SessionRegistry {
  private autoRoots = new Set<string>();
  private descendants = new Set<string>();
  private childToAuto = new Map<string, string>();

  /** 标记一个会话为 sddu-auto 主会话（幂等） */
  markAutoSession(sessionID: string): boolean {
    if (!sessionID) return false;
    const first = !this.autoRoots.has(sessionID);
    this.autoRoots.add(sessionID);
    return first;
  }

  isAutoSession(sessionID: string): boolean {
    return this.autoRoots.has(sessionID);
  }

  /**
   * 依据 session.created 事件登记会话归属：
   * - agent === "sddu-auto" → 标记为主会话；
   * - parentID 是已知 auto 主会话或其子孙 → 登记为拦截目标子会话。
   */
  observeSessionCreated(info: SessionCreatedInfo): void {
    const { sessionID, parentID, agent } = info ?? {};
    if (!sessionID) return;

    if (agent === 'sddu-auto') {
      this.markAutoSession(sessionID);
      return;
    }

    if (!parentID) return;
    if (this.autoRoots.has(parentID) || this.descendants.has(parentID)) {
      this.descendants.add(sessionID);
      const autoParent = this.autoRoots.has(parentID)
        ? parentID
        : this.childToAuto.get(parentID);
      if (autoParent) this.childToAuto.set(sessionID, autoParent);
    }
  }

  /**
   * 显式登记父子关系（供未来 task 工具返回 sessionID 时直接注册）。
   * 仅在父会话是 auto 主会话或其子孙时接受登记，防止误拦截。
   */
  registerChild(parentSessionID: string, childSessionID: string): boolean {
    if (!parentSessionID || !childSessionID) return false;
    const isKnownParent =
      this.autoRoots.has(parentSessionID) || this.descendants.has(parentSessionID);
    if (!isKnownParent) return false;

    this.descendants.add(childSessionID);
    const autoParent = this.autoRoots.has(parentSessionID)
      ? parentSessionID
      : this.childToAuto.get(parentSessionID);
    if (autoParent) this.childToAuto.set(childSessionID, autoParent);
    return true;
  }

  /** 该会话的提问是否应由 sddu-auto 代答（仅子会话，不含 auto 主会话自身） */
  isInterceptTarget(sessionID: string): boolean {
    return !!sessionID && this.descendants.has(sessionID);
  }

  /** 返回子会话对应的 sddu-auto 祖先（若存在） */
  getAutoParent(childSessionID: string): string | undefined {
    return this.childToAuto.get(childSessionID);
  }

  /** 是否存在已登记的 sddu-auto 主会话（供判断是否需要走父链解析兜底） */
  hasAutoSessions(): boolean {
    return this.autoRoots.size > 0;
  }

  /** 内省快照（日志 / 测试用） */
  snapshot() {
    return {
      autoRoots: Array.from(this.autoRoots),
      descendants: Array.from(this.descendants),
      childToAuto: Object.fromEntries(this.childToAuto),
    };
  }

  /** 清空全部映射（dispose） */
  clear(): void {
    this.autoRoots.clear();
    this.descendants.clear();
    this.childToAuto.clear();
  }
}

// ============ ② 决策：DecisionContext + DecisionEngine（硬决策） ============

export interface DecisionContext {
  /** 项目目录（项目上下文） */
  projectDirectory: string;
  /** 启动诉求（sddu-auto 启动阶段采集，注入决策） */
  launchIntent?: string;
  /** 当前 Feature 名 */
  featureName?: string;
}

/**
 * 决策引擎：对子会话提问做确定性硬决策。
 * - 有选项：优先选与上下文关键词匹配的选项，否则选首个选项；
 * - 无选项（自由文本）：返回上下文锚定的确定性答案。
 * 保证：信息不足时仍返回确定答案，绝不返回空 / 抛错 / 反问（NFR-003、EC-002）。
 */
export class DecisionEngine {
  constructor(private readonly context: DecisionContext) {}

  /** 更新决策上下文（如懒加载启动诉求后注入） */
  updateContext(patch: Partial<DecisionContext>): void {
    Object.assign(this.context, patch);
  }

  /** 读取当前决策上下文快照（供决策追溯落盘等场景使用） */
  getContext(): DecisionContext {
    return { ...this.context };
  }

  decide(question: DecisionQuestion): string[] {
    const options = (question.options ?? []).filter((o) => o && o.label);
    if (options.length > 0) {
      const matched = this.matchOption(options);
      return [matched ?? options[0].label];
    }
    return [this.customDecision(question)];
  }

  decideAll(questions: Array<DecisionQuestion>): string[][] {
    return (questions ?? []).map((q) => this.decide(q));
  }

  private keywordHaystack(): string {
    return [
      this.context.launchIntent,
      this.context.featureName,
      this.context.projectDirectory,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private matchOption(options: Array<DecisionQuestionOption>): string | undefined {
    const haystack = this.keywordHaystack();
    if (!haystack.trim()) return undefined;
    for (const opt of options) {
      const label = (opt.label ?? '').toLowerCase();
      // 单字符标签（如 'A'/'B'）不做关键词匹配：projectDirectory 等文件系统路径
      // 会引入随机单字符，`haystack.includes('b')` 之类的误匹配破坏 NFR-003
      // 「信息不足选首个选项」的确定性，故仅对多字符标签（length ≥ 2）匹配。
      if (label.length < 2) continue;
      if (haystack.includes(label)) return opt.label;
    }
    return undefined;
  }

  private customDecision(question: DecisionQuestion): string {
    const intent = (this.context.launchIntent ?? '').trim();
    const anchor = intent
      ? `基于启动诉求「${intent}」`
      : '基于当前项目上下文';
    return `${anchor}，sddu-auto 自主决策：对「${question.header ?? question.question}」采用保守默认方案继续推进。`;
  }
}

// ============ ②.5 方案 E：决策会话 LLM 真思考（建会话 + prompt + 解析 + 超时兜底） ============
// 纯函数（不依赖 client / 不 IO），便于单元测试。方案 E 把「决策」从规则匹配升级为
// sddu-auto 决策会话的 LLM 真思考；DecisionEngine 规则匹配降级为 30s 超时兜底（NFR-003）。

/** 构造注入决策会话的种子上下文（启动诉求 + Feature + 项目上下文 + 上游产物提示） */
export function buildSeedContext(context: DecisionContext): string {
  const lines: string[] = [];
  if (context.launchIntent) lines.push(`启动诉求：${context.launchIntent}`);
  if (context.featureName) lines.push(`当前 Feature：${context.featureName}`);
  if (context.projectDirectory) lines.push(`项目目录：${context.projectDirectory}`);
  lines.push(
    '上游产物：spec.md / plan.md / tasks.md 位于项目 .sddu/specs-tree-root/<feature>/ 下，可读取以了解已定论的需求、方案与任务。',
  );
  return lines.join('\n');
}

/** 构造单题决策 prompt（种子上下文 + 问题全文 + 选项），供 session.prompt 的 text part 使用 */
export function buildDecisionPrompt(
  context: DecisionContext,
  question: DecisionQuestion,
): string {
  const seed = buildSeedContext(context);
  const options = (question.options ?? []).filter((o) => o && o.label);
  const header = question.header ? `标题：${question.header}` : '';
  const body = question.question ? `问题：${question.question}` : '';
  const optLines = options.map((o) => {
    const desc = o.description ? `（${o.description}）` : '';
    return `- ${o.label}${desc}`;
  });
  const optBlock =
    options.length > 0 ? `可选答案（label）：\n${optLines.join('\n')}` : '';
  const modeHint = question.multiple
    ? '本题为多选题，请给出所有选中项的 label（多个用顿号「、」分隔）。'
    : '本题为单选题，请给出唯一选中项的 label。';
  const freeHint =
    options.length > 0
      ? '请只回复选项的 label，不要解释、不要反问。'
      : '请直接给出确定的自由文本答案，不要反问。';

  return [
    '你是 sddu-auto 决策会话，负责为子 Agent 发起的提问做确定性自主决策。',
    '基于以下种子上下文做出决策，绝不反问、绝不空答。',
    '',
    '【种子上下文】',
    seed,
    '',
    '【待决策问题】',
    ...[header, body].filter(Boolean),
    optBlock,
    modeHint,
    freeHint,
  ]
    .filter(Boolean)
    .join('\n');
}

/** 从决策会话 prompt 返回结构中提取答案文本（仅 type==="text" 的 part 拼接） */
export function extractAnswerText(
  result: DecisionPromptResult | undefined | null,
): string {
  const parts = result?.data?.parts ?? [];
  return parts
    .filter((p) => p?.type === 'text')
    .map((p) => p?.text ?? '')
    .join('\n')
    .trim();
}

/**
 * 从决策会话 LLM 回答文本解析答案（对齐 ADR-018 要素③）：
 * - 有选项（单选）：命中文本中的 label → 返回该 label；无命中 → 保守回退首个选项；
 * - 有选项（多选）：命中多个 label → 返回 label 数组；无命中 → 回退首个选项；
 * - 无选项（自由文本）：返回 trimmed 文本；空文本 → 保守默认答案。
 * 保证：始终返回非空确定答案（NFR-003 不阻塞不反问）。
 */
export function parseDecisionAnswer(
  text: string,
  question: DecisionQuestion,
): string[] {
  const options = (question.options ?? []).filter((o) => o && o.label);
  const trimmed = (text ?? '').trim();

  if (options.length === 0) {
    if (trimmed) return [trimmed];
    const header = question?.header ?? question?.question ?? '当前决策点';
    return [`sddu-auto 自主决策：对「${header}」采用保守默认方案继续推进。`];
  }

  const matched = options.filter((o) => labelInText(trimmed, o.label));
  if (matched.length === 0) return [options[0].label];
  if (question.multiple) return matched.map((o) => o.label);
  return [matched[0].label];
}

/** label 是否出现在回答文本中（单字符 label 用词边界匹配，防路径随机字符误命中） */
function labelInText(text: string, label: string): boolean {
  const hay = text.toLowerCase();
  const lab = (label ?? '').toLowerCase();
  if (!lab) return false;
  if (lab.length < 2) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(lab)}([^a-z0-9]|$)`, 'i').test(
      text,
    );
  }
  return hay.includes(lab);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 给 Promise 加超时（NFR-003：决策会话思考设 30s 上限，超时降级规则匹配）。
 * 超时后原 Promise 的后续 reject 会被吞掉（避免 unhandledRejection 干扰 event hook）。
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  reason = `decision session timeout after ${ms}ms`,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(reason)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

// ============ ③ 代答 + ④ 编排：DecisionProxy ============

export type DecisionLogFn = (
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  extra?: Record<string, unknown>,
) => Promise<void> | void;

export interface DecisionProxyDeps {
  /** 运行时注入的 OpencodeClient（1.17.4 / 1.18.18，带 v2.session.question 等访问器） */
  client: unknown;
  directory: string;
  /** 备选 HTTP API 通道基址（serve 模式），可由 PluginInput.serverUrl 传入 */
  serverUrl?: string | URL;
  /** 启动诉求（启动阶段采集，直接注入；若未传则由 contextFile 懒加载） */
  launchIntent?: string;
  featureName?: string;
  /** 启动诉求文件（sddu-auto 启动阶段写入，决策时代理层懒加载） */
  contextFile?: string;
  /** 决策会话思考超时毫秒（默认 DECISION_TIMEOUT_MS=30s；测试可注入更短值） */
  decisionTimeoutMs?: number;
  log?: DecisionLogFn;
}

export interface DecisionProxy {
  /** 插件 event hook 入口：过滤 session.created（登记映射）+ question.asked（识别→决策→代答） */
  event(input: { event: unknown }): Promise<void>;
  /** 插件 chat.message hook 入口：agent === "sddu-auto" 时标记主会话（兜底） */
  chatMessage(input: { sessionID: string; agent?: string }): Promise<void>;
  /** 清理（释放内存态映射） */
  dispose(): Promise<void>;
  readonly registry: SessionRegistry;
}

export function createDecisionProxy(deps: DecisionProxyDeps): DecisionProxy {
  const registry = new SessionRegistry();
  const engine = new DecisionEngine({
    projectDirectory: deps.directory,
    launchIntent: deps.launchIntent,
    featureName: deps.featureName,
  });

  const log: DecisionLogFn =
    deps.log ??
    (async (level, message, extra) => {
      try {
        const client = deps.client as any;
        await client?.app?.log?.({
          body: {
            service: 'sddu-decision-proxy',
            level,
            message,
            extra,
          },
        });
      } catch {
        // 日志失败不阻塞代答（可靠性优先）
      }
    });

  async function refreshLaunchIntent(): Promise<void> {
    const file = deps.contextFile;
    if (!file) return;
    try {
      const fs = await import('node:fs/promises');
      const raw = await fs.readFile(file, 'utf8');
      const parsed = JSON.parse(raw) as {
        launchIntent?: string;
        featureName?: string;
      };
      if (parsed?.launchIntent) {
        engine.updateContext({ launchIntent: parsed.launchIntent });
      }
      if (parsed?.featureName) {
        engine.updateContext({ featureName: parsed.featureName });
      }
    } catch {
      // 上下文文件缺失 / 损坏 → 维持既有上下文，不影响硬决策
    }
  }

  // ============ 方案 E：决策会话（建/复用 + prompt 思考 + 30s 超时兜底） ============
  // 决策会话是独立 session（agent=sddu-auto），与主会话阻塞等待 task 的解耦，idle 无死锁
  // （TASK-008 spike 实证）。首次创建后缓存 sessionID，后续决策点复用同一长生命周期会话。

  const decisionTimeoutMs = deps.decisionTimeoutMs ?? DECISION_TIMEOUT_MS;
  let decisionSessionID: string | undefined;

  /** 读取运行时注入 client 的 session 命名空间（v1 形态；缺失返回 undefined） */
  function sessionApi(): any {
    const client = deps.client as any;
    return client?.session ?? undefined;
  }

  /**
   * 建/复用决策会话：首次创建（agent=sddu-auto，title 标注），后续复用缓存 sessionID。
   * 返回 sessionID；client 无 session 能力或创建失败则抛错（由 decideViaSession 降级兜底）。
   */
  async function ensureDecisionSession(): Promise<string> {
    if (decisionSessionID) return decisionSessionID;
    const s = sessionApi();
    if (!s?.create) {
      throw new Error('decision-proxy: client.session.create unavailable');
    }
    const created = await s.create({
      body: { agent: 'sddu-auto', title: 'sddu-auto 决策会话' },
    });
    const id = created?.data?.id;
    if (!id) throw new Error('decision-proxy: session.create returned no id');
    decisionSessionID = id;
    await log('info', 'decision-proxy: decision session created', {
      decisionSessionID: id,
    });
    return id;
  }

  /** 对单题做一次 LLM 真思考（同步等待，30s 超时）。失败/超时抛错，由 decideViaSession 统一降级。 */
  async function promptOne(question: DecisionQuestion): Promise<string[]> {
    const s = sessionApi();
    if (!s?.prompt) {
      throw new Error('decision-proxy: client.session.prompt unavailable');
    }
    const sessionID = await ensureDecisionSession();
    const promptText = buildDecisionPrompt(engine.getContext(), question);
    const result = await withTimeout(
      s.prompt({
        path: { id: sessionID },
        body: {
          agent: 'sddu-auto',
          parts: [{ type: 'text', text: promptText }],
        },
      }),
      decisionTimeoutMs,
    );
    const text = extractAnswerText(result as DecisionPromptResult);
    if (!text) {
      throw new Error('decision-proxy: decision session returned no text');
    }
    return parseDecisionAnswer(text, question);
  }

  /**
   * 方案 E 决策主链路：对全部问题逐题 prompt 思考。
   * - 成功 → { answers, source: 'sddu-auto 决策会话' }
   * - 任一题失败 / 超时（client 无 session 能力 / create 失败 / prompt 超时 / 无文本）→
   *   整体降级 DecisionEngine 规则匹配，source = '超时兜底'（NFR-003 不阻塞不反问）。
   */
  async function decideViaSession(
    questions: Array<DecisionQuestion>,
  ): Promise<{ answers: string[][]; source: DecisionSource }> {
    const s = sessionApi();
    if (!s?.create || !s?.prompt) {
      return { answers: engine.decideAll(questions), source: '超时兜底' };
    }
    try {
      const answers: string[][] = [];
      for (const q of questions) {
        answers.push(await promptOne(q));
      }
      return { answers, source: 'sddu-auto 决策会话' };
    } catch (err) {
      await log('warn', 'decision-proxy: decision session failed, degrading to rule engine', {
        error: String(err),
      });
      // 超时后原会话可能仍在思考（busy），重置缓存，下次决策点重建干净会话
      decisionSessionID = undefined;
      return { answers: engine.decideAll(questions), source: '超时兜底' };
    }
  }

  /**
   * 决策追溯落盘（ADR-020）：将「被拦截提问 + 决策结果」追加写入
   * `<featureName>/auto-decisions.md`。
   *
   * 生产者 = decision-proxy（协议层），因为代答发生在协议层、主 Agent（sddu-auto）
   * 收不到被拦截的提问，无法自行记录（review 改进项 2 的架构结论）。
   * 全部 IO 用 try-catch 隔离：追溯失败绝不阻塞代答（可靠性优先）。
   */
  async function appendDecisions(
    sessionID: string,
    questions: Array<DecisionQuestion>,
    answers: string[][],
    source: DecisionSource,
  ): Promise<void> {
    const { featureName, launchIntent } = engine.getContext();
    if (!featureName) {
      // 无 Feature 目录名（auto-context.json 未写入或未含 featureName）→ 跳过追溯
      await log('debug', 'decision-proxy: skip decision trace (no featureName)', {
        sessionID,
      });
      return;
    }

    try {
      const path = await import('node:path');
      const fs = await import('node:fs/promises');
      const featureDir = path.join(
        deps.directory,
        '.sddu',
        'specs-tree-root',
        featureName,
      );
      await fs.mkdir(featureDir, { recursive: true });
      const file = path.join(featureDir, 'auto-decisions.md');

      const lines: string[] = [];
      questions.forEach((q, i) => {
        const answer = (answers[i] ?? []).join(' / ') || '(空)';
        const header = q?.header ?? q?.question ?? '(未命名决策点)';
        lines.push(`- **决策点**：${header} — ${q?.question ?? ''}`);
        lines.push(`  - **采纳的决策**：${answer}`);
        lines.push(`  - **决策来源**：${source}`);
        lines.push(
          `  - **决策依据**：启动诉求「${launchIntent ?? '未采集'}」+ 项目上下文`,
        );
        lines.push(
          `  - **是否硬决策**：${source === 'sddu-auto 决策会话' ? 'LLM 真思考（sddu-auto 决策会话）' : '✅ 超时兜底（规则匹配：选首项 / 保守默认）'}`,
        );
      });
      const entry =
        `\n### ${new Date().toISOString()}（decision-proxy 协议层自动追加，会话 ${sessionID}）\n` +
        lines.join('\n') +
        '\n';
      await fs.appendFile(file, entry, 'utf8');
    } catch (err) {
      await log('warn', 'decision-proxy: failed to persist auto-decisions.md', {
        sessionID,
        error: String(err),
      });
    }
  }

  async function replyQuestion(
    sessionID: string,
    requestID: string,
    answers: string[][],
  ): Promise<void> {
    const client = deps.client as any;

    // 通道 1：client.v2.session.question.reply（会话级，运行时 1.17.4 / 1.18.18）
    if (client?.v2?.session?.question?.reply) {
      try {
        await client.v2.session.question.reply({
          sessionID,
          requestID,
          questionV2Reply: { answers },
        });
        return;
      } catch (err) {
        await log('warn', 'decision-proxy: v2 session reply failed, degrading', {
          sessionID,
          requestID,
          error: String(err),
        });
      }
    }

    // 通道 2：client.question.reply（全局）
    if (client?.question?.reply) {
      try {
        await client.question.reply({ requestID, answers });
        return;
      } catch (err) {
        await log('warn', 'decision-proxy: global reply failed, degrading', {
          sessionID,
          requestID,
          error: String(err),
        });
      }
    }

    // 通道 3：HTTP API POST /question/{requestID}/reply（全局，serve 模式）
    // 实测结论（2026-08-16 运行实证）：session 级端点
    //   POST /api/session/{sessionID}/question/{requestID}/reply
    // 对子会话提问返回 404 QuestionNotFoundError（子会话提问的 requestID 未挂在该
    // 会话作用域下），而全局端点 POST /question/{requestID}/reply（body {answers}）
    // 能正确解除 pending 并让子 Agent 拿到答案继续。故 HTTP 兜底改用全局端点。
    // 异常在此捕获并记录日志，绝不冒泡中断 event hook（NFR-003 不阻塞）
    if (deps.serverUrl) {
      try {
        await httpReplyQuestion(deps.serverUrl, requestID, answers);
        return;
      } catch (err) {
        await log('error', 'decision-proxy: HTTP reply failed', {
          sessionID,
          requestID,
          error: String(err),
        });
        return;
      }
    }

    await log('warn', 'decision-proxy: no reply channel available', {
      sessionID,
      requestID,
    });
  }

  async function handleQuestionAsked(props: QuestionAskedProperties): Promise<void> {
    if (!props || typeof props.sessionID !== 'string' || typeof props.id !== 'string') {
      return;
    }

    // ② 识别：仅拦截 sddu-auto 调度的子会话提问，其余（普通 sddu/sddu-fast）透传不干预
    if (!registry.isInterceptTarget(props.sessionID)) {
      return;
    }

    // ③ 决策：注入启动诉求（懒加载）+ 项目上下文，方案 E 主链路（决策会话 LLM 真思考，
    //    30s 超时兜底降级规则匹配）
    await refreshLaunchIntent();
    const questions = props.questions ?? [];
    const { answers, source } = await decideViaSession(questions);

    await log('info', 'decision-proxy intercepting question', {
      sessionID: props.sessionID,
      requestID: props.id,
      autoParent: registry.getAutoParent(props.sessionID),
      headers: questions.map((q) => q.header),
      answers,
      decisionSource: source,
    });

    // ③.5 决策追溯落盘（ADR-020：生产者 = decision-proxy，协议层代答的主 Agent 不可见）
    await appendDecisions(props.sessionID, questions, answers, source);

    // ④ 代答：问题全程不到达终端用户（FR-006）
    await replyQuestion(props.sessionID, props.id, answers);
  }

  return {
    registry,

    async event(input: { event: unknown }): Promise<void> {
      const ev = input?.event as OpenCodeEvent | undefined;
      if (!ev || typeof ev.type !== 'string') return;

      switch (ev.type) {
        case 'session.created': {
          const p = (ev.properties ?? {}) as {
            sessionID?: string;
            info?: { parentID?: string; agent?: string };
          };
          registry.observeSessionCreated({
            sessionID: p.sessionID,
            parentID: p.info?.parentID,
            agent: p.info?.agent,
          });
          return;
        }
        case 'question.asked': {
          await handleQuestionAsked(ev.properties as unknown as QuestionAskedProperties);
          return;
        }
        default:
          return;
      }
    },

    async chatMessage(input: { sessionID: string; agent?: string }): Promise<void> {
      // 兜底：chat.message 携带 agent，可靠识别 sddu-auto 主会话
      if (input?.agent === 'sddu-auto' && input?.sessionID) {
        registry.markAutoSession(input.sessionID);
      }
    },

    async dispose(): Promise<void> {
      decisionSessionID = undefined;
      registry.clear();
    },
  };
}

async function httpReplyQuestion(
  serverUrl: string | URL,
  requestID: string,
  answers: string[][],
): Promise<void> {
  const base = typeof serverUrl === 'string' ? serverUrl : serverUrl.toString();
  const url = `${base.replace(/\/+$/, '')}/question/${encodeURIComponent(
    requestID,
  )}/reply`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) {
    throw new Error(
      `decision-proxy HTTP reply failed: ${res.status} ${res.statusText}`,
    );
  }
}
