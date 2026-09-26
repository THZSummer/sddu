#!/usr/bin/env node
'use strict';

/**
 * serve-api.cjs - opencode serve HTTP API 封装脚本（v1/v2 双代兼容版）
 *
 * 零依赖，使用 Node.js 内置模块。
 * 封装 serve 的会话管理、消息发送、轮询、进程管理。
 * LLM 调用本脚本，不需要手动构造 curl 命令。
 *
 * v1/v2 兼容策略（v4.0+）：
 *   - 启动时通过 /doc OpenAPI 规范做运行时端点自探测（getSurface）
 *   - 完成检测：优先 v2 wait 端点（精确等待 idle），回退 v1 消息数轮询
 *   - 中止：优先 v2 interrupt，回退 v1 abort
 *   - 响应解析三态兼容：裸值（v1）/ {data:...} 包裹（v2）/ 204 无体
 *
 * 用法：
 *   node serve-api.cjs run --message "..." [--agent sddu] [--dir .] [--port 4096] [--timeout 600]
 *   node serve-api.cjs start [--port 4096] [--hostname 127.0.0.1] [--dir .]
 *   node serve-api.cjs send --port 4096 --message "..." [--agent sddu] [--timeout 600]
 *   node serve-api.cjs stop --port 4096
 *   node serve-api.cjs ps [--port 4096]
 *   node serve-api.cjs sessions --port 4096 [--agent <name>] [--grep <kw>] [--limit 5] [--full]
 *   node serve-api.cjs rm --port 4096 --session <sid>
 *   node serve-api.cjs detect --port 4096
 *   node serve-api.cjs wait --port 4096 --session <sid> [--timeout 600]
 *   node serve-api.cjs skills --port 4096 [--grep <kw>]
 *   node serve-api.cjs stats --port 4096
 *   node serve-api.cjs revert --port 4096 --session <sid> --action stage|commit|clear [--message <mid>]
 *   node serve-api.cjs fork --port 4096 --session <sid> [--message <mid>]
 *   node serve-api.cjs compact --port 4096 --session <sid>
 *   node serve-api.cjs diff --port 4096 --session <sid>
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const { parseArgs } = require('util');

// ─── 参数解析 ───

function parseCliArgs(args) {
  const { values } = parseArgs({
    args,
    options: {
      port:      { type: 'string' },
      hostname:  { type: 'string' },
      dir:       { type: 'string' },
      message:   { type: 'string' },
      agent:     { type: 'string' },
      timeout:   { type: 'string' },
      interval:  { type: 'string' },
      session:   { type: 'string' },
      grep:      { type: 'string' },
      limit:     { type: 'string' },
      full:      { type: 'boolean' },
      allow:     { type: 'string', multiple: true },
      action:    { type: 'string' },
    },
    strict: false,
  });
  return values;
}

function requireOpts(opts, keys) {
  const missing = keys.filter(k => opts[k] === undefined);
  if (missing.length > 0) {
    output({ error: '缺少必填参数 ' + missing.map(k => '--' + k).join(', ') });
    process.exit(1);
  }
}

function getUrl(opts) {
  const port = opts.port || '4096';
  const hostname = opts.hostname || '127.0.0.1';
  return `http://${hostname}:${port}`;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function elapsed(start) {
  return ((Date.now() - start) / 1000).toFixed(1) + 's';
}

function output(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

// ─── v1/v2 响应解包（三态兼容：裸值 / {data:...} / 204 无体） ───

// v2 多数端点将负载包裹在 {data: ...}（部分还带 location/cursor）。
// v1 返回裸值。此函数统一取 .data（存在则解包），否则原样返回。
function unwrap(r) {
  if (r && typeof r === 'object' && !Array.isArray(r) && 'data' in r) {
    return r.data;
  }
  return r;
}

// 204 无体时 httpGet/httpPost 解析为 { raw: '' }，视为成功无体
function isNoBody(r) {
  return r && typeof r === 'object' && typeof r.raw === 'string' && r.raw.trim() === '';
}

// 从会话创建响应提取 id（v1 裸对象顶层 id / v2 {data:{id}}）
function extractSessionId(resp) {
  const s = (resp && resp.id) ? resp : unwrap(resp);
  return (s && typeof s === 'object' && s.id) ? s.id : null;
}

// ─── API 面运行时自探测 ───
// 通过 /doc OpenAPI 规范检测当前服务器暴露的 v1 / v2 端点集合。
// /doc 不可用时按「v1 全量存在」的保守假设降级。

let surfaceCache = null;

async function getSurface(url) {
  if (surfaceCache) return surfaceCache;

  const paths = new Set();
  let docAvailable = false;
  // /doc 首次命中时服务端需生成完整 OpenAPI 规范（可达数百 KB），可能超过 10s——15s 超时 + 1 次重试
  const fetchDoc = async () => {
    const doc = await httpGet(`${url}/doc`, 15000);
    return (doc && doc.paths && typeof doc.paths === 'object') ? doc : null;
  };
  try {
    let doc = await fetchDoc();
    if (!doc) doc = await fetchDoc(); // 重试一次（首次可能仍在生成）
    if (doc) {
      Object.keys(doc.paths).forEach(p => paths.add(p));
      docAvailable = paths.size > 0;
    }
  } catch { /* /doc 不可用，降级为保守假设 */ }

  const has = (p) => paths.has(p);
  const surface = {
    docAvailable,
    v1: {
      health:      docAvailable ? has('/global/health') : true,
      session:     docAvailable ? has('/session') : true,
      message:     docAvailable ? has('/session/{sessionID}/message') : true,
      promptAsync: docAvailable ? has('/session/{sessionID}/prompt_async') : true,
      abort:       docAvailable ? has('/session/{sessionID}/abort') : true,
      diff:        docAvailable ? has('/session/{sessionID}/diff') : false,
    },
    v2: {
      info:          has('/api/info'),
      health:        has('/api/health'),
      session:       has('/api/session'),
      message:       has('/api/session/{sessionID}/message'),
      context:       has('/api/session/{sessionID}/context'),
      prompt:        has('/api/session/{sessionID}/prompt'),
      wait:          has('/api/session/{sessionID}/wait'),
      interrupt:     has('/api/session/{sessionID}/interrupt'),
      compact:       has('/api/session/{sessionID}/compact'),
      fork:          has('/api/session/{sessionID}/fork'),
      revertStage:   has('/api/session/{sessionID}/revert/stage'),
      revertCommit:  has('/api/session/{sessionID}/revert/commit'),
      revertClearPost:   has('/api/session/{sessionID}/revert/clear'),
      revertClearDelete: has('/api/session/{sessionID}/revert'),
      diff:          has('/api/session/{sessionID}/diff'),
      skills:        has('/api/skill'),
      stats:         has('/api/experimental/session/stats'),
    },
  };
  surfaceCache = surface;
  return surface;
}

// 健康检查：v1 /global/health → v2 /api/health → v2 /api/info
async function healthCheck(url, surface) {
  if (surface.v1.health) {
    try { return await httpGet(`${url}/global/health`, 5000); } catch { /* 尝试下一种 */ }
  }
  if (surface.v2.health) {
    try { return await httpGet(`${url}/api/health`, 5000); } catch { /* 尝试下一种 */ }
  }
  if (surface.v2.info) {
    return await httpGet(`${url}/api/info`, 5000);
  }
  throw new Error('无可用的健康检查端点');
}

// ─── 会话与消息（v1/v2 双路） ───

// 解析 --allow "action:resource" 规则为 permissions 规则数组
function parseAllowRules(allowArr) {
  if (!allowArr || allowArr.length === 0) return null;
  const rules = [];
  for (const item of allowArr) {
    const idx = item.indexOf(':');
    if (idx <= 0) {
      output({ error: `--allow 格式应为 "action:resource"，收到 "${item}"` });
      process.exit(1);
    }
    rules.push({ action: item.slice(0, idx), resource: item.slice(idx + 1), effect: 'allow' });
  }
  return rules;
}

// 创建会话。代别选择：v2 prompt 可用时优先 v2 链路（保证 revert/compact/v2 视图一致性），否则 v1。
// 传入 allowRules 且服务端支持时附加 permissions（尝试数组与 {rules:[...]} 两种形态）。
async function createSession(url, surface, opts = {}) {
  const title = opts.title || 'serve-api-task';
  const allowRules = opts.allowRules || null;
  const agent = opts.agent || null;
  const preferV2 = surface.v2.session && surface.v2.prompt;

  const tryCreate = async (path, body) => {
    const resp = await httpPost(`${url}${path}`, body, 15000);
    const id = extractSessionId(resp);
    return { resp, id };
  };

  // v2 创建：按序尝试 [全量附加字段] -> [rules 对象形态] -> [无附加字段]；仅 400（形态不符）时降级
  if (preferV2) {
    const full = {};
    if (agent) full.agent = agent;
    if (allowRules) full.permissions = allowRules; // 形态 A：规则数组（1.18.32 实测接受）
    const wrapped = { ...full };
    if (allowRules) wrapped.permissions = { rules: allowRules }; // 形态 B：{rules:[...]}
    const attempts = [full, wrapped, {}];
    const seen = new Set();
    for (const extra of attempts) {
      const key = JSON.stringify(extra);
      if (seen.has(key)) continue; // 跳过重复形态（如无任何附加字段时 full===wrapped==={}）
      seen.add(key);
      try {
        const r = await tryCreate('/api/session', { title, ...extra });
        if (r.id) {
          let via = 'v2:/api/session';
          if (extra.permissions) via += Array.isArray(extra.permissions) ? '+rules(array)' : '+rules(object)';
          if (extra.agent) via += '+agent';
          const dropped = Object.keys(full).filter(k => !(k in extra));
          if (dropped.length) process.stderr.write(`警告: 以下字段被服务端拒绝已降级忽略: ${dropped.join(', ')}\n`);
          return { sessionId: r.id, via };
        }
      } catch (e) {
        if (e.statusCode !== 400) throw e; // 非 400 直接抛出
      }
    }
    process.stderr.write('警告: v2 创建会话失败，回退 v1 /session\n');
  }

  if (surface.v1.session) {
    const r = await tryCreate('/session', { title });
    if (r.id) return { sessionId: r.id, via: 'v1:/session' };
  }

  if (surface.v2.session) {
    const r = await tryCreate('/api/session', { title });
    if (r.id) return { sessionId: r.id, via: 'v2:/api/session' };
  }

  output({ error: '创建会话失败：v1 /session 与 v2 /api/session 均不可用或未返回 id' });
  process.exit(1);
}

// 请求体多形态尝试：按序尝试 variants，仅 400（字段形态不符）时尝试下一个，其他错误直接抛出
async function tryBodyVariants(url, path, variants) {
  let lastErr;
  for (const body of variants) {
    try {
      return await httpPost(`${url}${path}`, body, 30000);
    } catch (e) {
      lastErr = e;
      if (e.statusCode !== 400) throw e; // 非 400（如 404/409/503）直接抛出
    }
  }
  throw lastErr;
}

// 发送消息：v2 prompt 优先（text / prompt.text 双形态，agent 经由创建时指定），
// v1 prompt_async 兜底（parts 格式，agent 内嵌）
async function sendPrompt(url, surface, sessionId, message, agent) {
  if (surface.v2.prompt) {
    const variants = [{ text: message }, { prompt: { text: message } }];
    try {
      const resp = await tryBodyVariants(url, `/api/session/${sessionId}/prompt`, variants);
      return { via: 'v2:prompt', resp };
    } catch (e) {
      process.stderr.write(`警告: v2 prompt 失败（${e.message.slice(0, 120)}），回退 v1 prompt_async\n`);
    }
  }
  if (surface.v1.promptAsync) {
    const msgBody = { parts: [{ type: 'text', text: message }] };
    if (agent) msgBody.agent = agent;
    await httpPost(`${url}/session/${sessionId}/prompt_async`, msgBody);
    return { via: 'v1:prompt_async' };
  }
  throw new Error('无可用的消息发送端点（prompt / prompt_async 均缺失）');
}

// 拉取消息列表（代别感知）：优先匹配 gen 对应视图，为空时尝试另一代视图。
// v1 裸数组 {info,parts}；v2 {data,cursor} 联合类型消息。
async function fetchMessages(url, surface, sessionId, gen, timeoutMs) {
  const order = gen === 'v2'
    ? ['v2', 'v1']
    : ['v1', 'v2'];
  let lastErr = null;
  for (const g of order) {
    if (g === 'v1' && surface.v1.message) {
      try {
        const r = await httpGet(`${url}/session/${sessionId}/message`, timeoutMs || 30000);
        if (Array.isArray(r) && r.length > 0) return r;
        if (Array.isArray(r)) { lastErr = null; continue; } // v1 视图为空，尝试 v2
        return r;
      } catch (e) { lastErr = e; }
    }
    if (g === 'v2' && surface.v2.message) {
      try {
        const r = await httpGet(`${url}/api/session/${sessionId}/message?order=asc`, timeoutMs || 30000);
        let arr = Array.isArray(r) ? r : (unwrap(r) || []);
        if (Array.isArray(arr) && arr.length > 0) {
          // v2 视图默认可能倒序（最新在前），按 time.created 客户端排序归一化
          const ts = (m) => (m.time && m.time.created) || (m.info && m.info.time && m.info.time.created) || 0;
          arr = [...arr].sort((a, b) => ts(a) - ts(b));
          return arr;
        }
      } catch (e) { lastErr = e; }
    }
  }
  if (lastErr) throw lastErr;
  return [];
}

// ─── 任务完成检测 ───
// 优先 v2 wait（精确等待 agent loop idle），回退 v1 消息数轮询（连续 2 次不变视为完成）。

async function checkDone(url, surface, sessionId, gen, lastMsgCount) {
  const messages = await fetchMessages(url, surface, sessionId, gen);
  const count = Array.isArray(messages) ? messages.length : 1;
  const done = count > 1 && count === lastMsgCount;
  return { done, count, messages };
}

function msgRole(m) {
  if (!m) return '';
  // v2 消息：顶层 role/type；v1 消息：{info:{role}, parts}
  return (m.role || m.type || (m.info && (m.info.role || m.info.type)) || '');
}

// ─── HTTP 工具函数 ───

function httpRequest(method, url, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = body === undefined ? null : JSON.stringify(body);
    const headers = { 'Content-Type': 'application/json' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method,
      headers,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          const e = new Error(`HTTP ${res.statusCode} ${method} ${u.pathname}: ${data.slice(0, 200)}`);
          e.statusCode = res.statusCode;
          reject(e);
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch { resolve({ raw: data }); }
      });
    });
    req.on('error', (e) => { e._url = url; reject(e); });
    req.setTimeout(timeoutMs || 10000, () => { req.destroy(new Error('HTTP timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

function httpGet(url, timeoutMs) {
  return httpRequest('GET', url, undefined, timeoutMs);
}

function httpPost(url, body, timeoutMs) {
  return httpRequest('POST', url, body === undefined ? {} : body, timeoutMs);
}

function httpDelete(url, timeoutMs) {
  return httpRequest('DELETE', url, undefined, timeoutMs);
}

// ─── 子命令：start ───

async function cmdStart(opts) {
  const port = parseInt(opts.port || '4096');
  const hostname = opts.hostname || '127.0.0.1';
  const dir = opts.dir || '.';

  // 启动 serve 进程（detached，父进程退出后存活）
  const child = spawn('opencode', ['serve', '--port', String(port), '--hostname', hostname], {
    cwd: dir,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  const pid = child.pid;
  const url = `http://${hostname}:${port}`;

  // 等待健康检查通过（最多 45 秒——冷启动可能超过 10s）
  for (let i = 0; i < 45; i++) {
    await sleep(1000);
    try {
      const surface = await getSurface(url);
      const health = await healthCheck(url, surface);
      if (health) {
        output({ url, port, pid, status: 'running', version: health.version || 'unknown' });
        return;
      }
    } catch { /* 还没启动 */ }
  }

  output({ error: `serve 启动超时，端口 ${port} 无响应`, pid });
  process.exit(1);
}

// ─── 子命令：send（阻塞直到完成） ───

async function cmdSend(opts) {
  const url = getUrl(opts);
  const message = opts.message;
  const agent = opts.agent;
  const timeoutSec = parseInt(opts.timeout || '600');
  const intervalSec = parseInt(opts.interval || '5');

  requireOpts(opts, ['port', 'message']);

  const start = Date.now();
  const surface = await getSurface(url);
  const allowRules = parseAllowRules(opts.allow);

  // 1. 创建会话
  const { sessionId, via } = await createSession(url, surface, { allowRules });

  // 2. 发送消息
  const promptVia = await sendPrompt(url, surface, sessionId, message, agent);

  // 3. 等待完成：wait 优先，轮询回退
  const r = await waitForCompletion(url, surface, sessionId, promptVia.via.startsWith('v2') ? 'v2' : 'v1', timeoutSec, intervalSec, start);
  if (!r.done) {
    output({ error: '任务超时', sessionId, duration: elapsed(start) });
    process.exit(1);
  }

  output({ sessionId, status: 'completed', via: { create: via, prompt: promptVia.via, completion: r.via }, messages: r.messages, duration: elapsed(start) });
}

// 统一的完成等待逻辑：v2 wait 优先，回退消息数轮询
async function waitForCompletion(url, surface, sessionId, gen, timeoutSec, intervalSec, start) {
  // 路径 A：v2 wait 端点（阻塞至 agent loop idle，精确）
  if (surface.v2.wait) {
    try {
      await httpPost(`${url}/api/session/${sessionId}/wait`, {}, timeoutSec * 1000 + 30000);
      let messages = [];
      try { messages = await fetchMessages(url, surface, sessionId, gen); } catch { /* 结果拉取失败不视为任务失败 */ }
      return { done: true, via: 'v2:wait', messages };
    } catch (e) {
      process.stderr.write(`[${elapsed(start)}] wait 调用失败（${e.message}），回退轮询\n`);
    }
  }

  // 路径 B：消息数轮询（连续 2 次不变视为完成）
  let done = false;
  let lastMsgCount = 0;
  let messages = [];
  while (!done && (Date.now() - start) < timeoutSec * 1000) {
    await sleep(intervalSec * 1000);
    try {
      const r = await checkDone(url, surface, sessionId, gen, lastMsgCount);
      done = r.done;
      lastMsgCount = r.count;
      messages = r.messages;
      process.stderr.write(`[${elapsed(start)}] messages: ${r.count}${done ? ' (done)' : ''}\n`);
    } catch (e) {
      process.stderr.write(`[${elapsed(start)}] poll error: ${e.message}\n`);
    }
  }
  return { done, via: 'poll:msg-count', messages };
}

// ─── 子命令：stop ───

// 获取占用指定端口的进程 PID（lsof 优先，回退 fuser）
function portPids(port) {
  try {
    const out = execSync(`lsof -ti:${port} 2>/dev/null`).toString().trim();
    if (out) return out.split('\n');
  } catch { /* lsof 无输出或不存在 */ }
  try {
    const out = execSync(`fuser ${port}/tcp 2>/dev/null`).toString().trim();
    if (out) return out.split(/\s+/).filter(Boolean);
  } catch { /* fuser 无输出或不存在 */ }
  return [];
}

function cmdStop(opts) {
  const port = opts.port;
  requireOpts(opts, ['port']);

  const pids = portPids(port);
  if (pids.length === 0) {
    output({ killed: false, port: parseInt(port), reason: '端口无进程' });
    return;
  }

  // 1. SIGTERM 优雅停止
  for (const p of pids) {
    try { process.kill(parseInt(p), 'SIGTERM'); } catch {}
  }
  try { execSync('sleep 1'); } catch {}

  // 2. 残留检测 + kill -9 兜底
  let forced = false;
  const remain = portPids(port);
  if (remain.length > 0) {
    for (const p of remain) {
      try { process.kill(parseInt(p), 'SIGKILL'); } catch {}
    }
    forced = true;
    try { execSync('sleep 0.5'); } catch {}
  }

  // 3. 最终确认（真实状态，避免误报）
  const after = portPids(port);
  if (after.length === 0) {
    output({ killed: true, port: parseInt(port), pids: pids.map(Number), forced });
  } else {
    output({ killed: false, port: parseInt(port), pids: after.map(Number), reason: '仍有进程残留，请手动检查' });
    process.exit(1);
  }
}

// ─── 子命令：sessions（列出会话） ───

async function cmdSessions(opts) {
  const url = getUrl(opts);
  requireOpts(opts, ['port']);

  const surface = await getSurface(url);
  let list;
  if (surface.v1.session) {
    list = await httpGet(`${url}/session`, 15000);
  } else if (surface.v2.session) {
    const r = await httpGet(`${url}/api/session?limit=100`, 15000);
    list = Array.isArray(r) ? r : (unwrap(r) || []);
  } else {
    output({ error: '无可用的会话列表端点' });
    process.exit(1);
  }
  if (!Array.isArray(list)) list = [];

  // 1. agent 过滤
  if (opts.agent) {
    list = list.filter(s => s.agent === opts.agent);
  }

  // 2. grep 过滤 title
  if (opts.grep) {
    const kw = String(opts.grep).toLowerCase();
    list = list.filter(s => String(s.title || '').toLowerCase().includes(kw));
  }

  // 3. 按 time 降序排序（无效 time 放最后）
  //    time 可能是对象 {created,updated} 或字符串，兼容处理
  const getTs = (t) => {
    if (typeof t === 'object' && t) return t.updated || t.created || 0;
    return new Date(t).getTime() || 0;
  };
  list.sort((a, b) => getTs(b.time) - getTs(a.time));

  // 4. limit 切片（limit=0 不限返回全部；默认 5）
  const limit = opts.limit !== undefined ? parseInt(opts.limit) : 5;
  if (limit > 0) list = list.slice(0, limit);

  // 5. 输出：full 返回完整；默认摘要（id/title/agent/time）
  if (opts.full) {
    output(list);
  } else {
    output(list.map(s => ({
      id: String(s.id || '').slice(0, 12),
      title: s.title,
      agent: s.agent,
      time: s.time,
    })));
  }
}

// ─── 子命令：rm（删除会话，不可逆） ───

async function cmdRm(opts) {
  const url = getUrl(opts);
  const sessionId = opts.session;
  requireOpts(opts, ['port', 'session']);

  const surface = await getSurface(url);
  let via;
  if (surface.v1.session) {
    await httpDelete(`${url}/session/${sessionId}`, 15000); // v1: 200 true
    via = 'v1:/session/{id}';
  } else {
    await httpDelete(`${url}/api/session/${sessionId}`, 15000); // v2: 204 无体
    via = 'v2:/api/session/{id}';
  }
  output({ deleted: true, sessionId, via });
}

// ─── 子命令：ps（进程巡检） ───

async function cmdPs(opts) {
  const psOutput = execSync('ps -eo pid,etime,command', { encoding: 'utf8' });
  const lines = psOutput.split('\n').filter(line => /[o]pencode\s+serve/.test(line));

  const processes = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 解析：PID（行首数字）、etime（第二列非空）、command（剩余）
    const m = trimmed.match(/^(\d+)\s+(\S+)\s+(.+)$/);
    if (!m) continue;

    const pid = m[1];
    const etime = m[2];
    const command = m[3];

    // 从 command 提取参数
    const portMatch = command.match(/--port\s+(\d+)/);
    const hostMatch = command.match(/--hostname\s+(\S+)/);
    const dirMatch  = command.match(/--(?:dir|cwd)\s+(\S+)/);

    const port     = portMatch ? parseInt(portMatch[1]) : 4096;
    const hostname = hostMatch ? hostMatch[1] : '127.0.0.1';
    const dir      = dirMatch  ? dirMatch[1]  : null;

    // 可选按端口过滤
    if (opts.port && String(port) !== String(opts.port)) continue;

    processes.push({ pid, etime, port, hostname, dir });
  }

  // 对每个进程做健康探测（依次尝试 v1/v2 健康端点）
  const results = [];
  for (const proc of processes) {
    const url = `http://${proc.hostname}:${proc.port}`;
    let health  = 'down';
    let version = null;

    try {
      const surface = await getSurface(url);
      const h = await healthCheck(url, surface);
      if (h) {
        health  = 'alive';
        version = (h && h.version) ? h.version : 'unknown';
      }
    } catch { /* 探测失败视为 down */ }

    results.push({
      pid:      proc.pid,
      etime:    proc.etime,
      port:     proc.port,
      hostname: proc.hostname,
      dir:      proc.dir,
      health,
      version,
    });
  }

  output(results);
}

// ─── 子命令：submit（非阻塞提交） ───

async function cmdSubmit(opts) {
  const url = getUrl(opts);
  const message = opts.message;
  const agent = opts.agent;
  requireOpts(opts, ['message']);

  const surface = await getSurface(url);
  const allowRules = parseAllowRules(opts.allow);

  // 创建会话 + 发送消息，不等结果
  const { sessionId, via } = await createSession(url, surface, { allowRules });
  const promptVia = await sendPrompt(url, surface, sessionId, message, agent);

  output({ sessionId, status: 'submitted', url, via: { create: via, prompt: promptVia.via } });
}

// ─── 子命令：status（查状态） ───

async function cmdStatus(opts) {
  const url = getUrl(opts);
  const sessionId = opts.session;
  requireOpts(opts, ['port']);

  const surface = await getSurface(url);

  // 检查服务器健康
  let health;
  try {
    health = await healthCheck(url, surface);
  } catch {
    output({ server: 'down', url });
    return;
  }

  // 指定 session 时查询会话详情
  if (sessionId) {
    try {
      const messages = await fetchMessages(url, surface, sessionId, undefined, 30000);
      const msgCount = Array.isArray(messages) ? messages.length : 1;
      // 通过消息数判断：>1 条消息且最后一条非 user 则认为完成
      const lastMsg = Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1] : null;
      const done = msgCount > 1 && msgRole(lastMsg) !== 'user';
      output({
        server: 'running',
        sessionId,
        status: done ? 'completed' : 'running',
        messageCount: msgCount,
      });
    } catch (e) {
      output({ server: 'running', sessionId, error: e.message });
    }
    return;
  }

  // 只报告服务器状态
  output({ server: 'running', url, version: health.version || 'unknown' });
}

// ─── 子命令：result（取结果） ───

async function cmdResult(opts) {
  const url = getUrl(opts);
  const sessionId = opts.session;
  requireOpts(opts, ['port', 'session']);

  const surface = await getSurface(url);
  const messages = await fetchMessages(url, surface, sessionId, undefined, 30000);
  const msgCount = Array.isArray(messages) ? messages.length : 1;
  const lastMsg = Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1] : null;
  const done = msgCount > 1 && msgRole(lastMsg) !== 'user';

  output({ sessionId, status: done ? 'completed' : 'running', messages });
}

// ─── 子命令：abort（中止会话：v2 interrupt 优先，v1 abort 回退） ───

async function cmdAbort(opts) {
  const url = getUrl(opts);
  const sessionId = opts.session;
  requireOpts(opts, ['port', 'session']);

  const surface = await getSurface(url);
  let via, response, interrupted;

  if (surface.v2.interrupt) {
    response = await httpPost(`${url}/api/session/${sessionId}/interrupt`, {}, 15000);
    via = 'v2:interrupt';
    if (isNoBody(response)) {
      interrupted = true; // 204 无体，视为成功
    } else if (response && typeof response === 'object' && response.interrupted !== undefined) {
      interrupted = Boolean(response.interrupted);
    } else {
      interrupted = true;
    }
  } else if (surface.v1.abort) {
    response = await httpPost(`${url}/session/${sessionId}/abort`, {}, 15000);
    via = 'v1:abort';
    interrupted = response === true || response === 'true';
  } else {
    output({ error: '无可用的中止端点（interrupt / abort 均缺失）' });
    process.exit(1);
  }

  output({ aborted: interrupted, sessionId, via, response });
}

// ─── 子命令：run（start + send + stop 一条龙） ───

async function cmdRun(opts) {
  const message = opts.message;
  requireOpts(opts, ['message']);

  const agent = opts.agent;
  const dir = opts.dir || '.';
  const port = parseInt(opts.port || '4096');
  const timeoutSec = parseInt(opts.timeout || '600');
  const start = Date.now();

  // 1. 启动 serve
  const child = spawn('opencode', ['serve', '--port', String(port), '--hostname', '127.0.0.1'], {
    cwd: dir,
    detached: false,
    stdio: 'ignore',
  });

  const url = `http://127.0.0.1:${port}`;

  // 等待健康检查
  let ready = false;
  for (let i = 0; i < 45; i++) {
    await sleep(1000);
    try {
      const surface = await getSurface(url);
      await healthCheck(url, surface);
      ready = true;
      break;
    } catch {}
  }

  if (!ready) {
    try { child.kill('SIGKILL'); } catch {}
    output({ error: 'serve 启动超时' });
    process.exit(1);
  }

  // 2. 创建会话 + 发送消息 + 等待完成
  try {
    const surface = await getSurface(url);
    const allowRules = parseAllowRules(opts.allow);
    const { sessionId, via } = await createSession(url, surface, { allowRules });
    const promptVia = await sendPrompt(url, surface, sessionId, message, agent);

    const r = await waitForCompletion(url, surface, sessionId, promptVia.via.startsWith('v2') ? 'v2' : 'v1', timeoutSec, 5, start);

    output({
      sessionId,
      status: r.done ? 'completed' : 'timeout',
      via: { create: via, prompt: promptVia.via, completion: r.via },
      messages: r.messages,
      duration: elapsed(start),
      port,
    });
  } finally {
    // 3. 停止 serve
    try { child.kill('SIGTERM'); } catch {}
  }
}

// ─── 子命令：detect（API 面自探测） ───

async function cmdDetect(opts) {
  const url = getUrl(opts);
  requireOpts(opts, ['port']);

  const surface = await getSurface(url);
  let version = null;
  try {
    const h = await healthCheck(url, surface);
    version = (h && h.version) ? h.version : 'unknown';
  } catch { /* 健康检查失败仍输出面信息 */ }

  output({ url, version, apiSurface: surface });
}

// ─── 子命令：wait（阻塞等待会话 idle） ───

async function cmdWait(opts) {
  const url = getUrl(opts);
  const sessionId = opts.session;
  const timeoutSec = parseInt(opts.timeout || '600');
  requireOpts(opts, ['port', 'session']);

  const surface = await getSurface(url);
  if (!surface.v2.wait) {
    output({ error: '当前服务器无 v2 wait 端点（/api/session/{id}/wait），请用 status 轮询代替', apiSurface: { v2wait: false } });
    process.exit(1);
  }
  const start = Date.now();
  await httpPost(`${url}/api/session/${sessionId}/wait`, {}, timeoutSec * 1000 + 30000);
  output({ sessionId, waited: true, duration: elapsed(start) });
}

// ─── 子命令：skills（v2 skill.list） ───

async function cmdSkills(opts) {
  const url = getUrl(opts);
  requireOpts(opts, ['port']);

  const surface = await getSurface(url);
  if (!surface.v2.skills) {
    output({ error: '当前服务器无 /api/skill 端点（v2 skill.list）' });
    process.exit(1);
  }

  const r = await httpGet(`${url}/api/skill`, 15000);
  let list = Array.isArray(r) ? r : (unwrap(r) || []);
  if (!Array.isArray(list)) list = [];

  if (opts.grep) {
    const kw = String(opts.grep).toLowerCase();
    list = list.filter(s =>
      String(s.id || '').toLowerCase().includes(kw) ||
      String(s.name || '').toLowerCase().includes(kw) ||
      String(s.description || '').toLowerCase().includes(kw)
    );
  }

  output({
    count: list.length,
    skills: list.map(s => ({
      id: s.id || s.name,
      name: s.name,
      description: s.description ? String(s.description).slice(0, 120) : undefined,
      autoinvoke: s.autoinvoke,
      path: s.path,
    })),
  });
}

// ─── 子命令：stats（v2 会话统计） ───

async function cmdStats(opts) {
  const url = getUrl(opts);
  requireOpts(opts, ['port']);

  const surface = await getSurface(url);
  if (!surface.v2.stats) {
    output({ error: '当前服务器无 /api/experimental/session/stats 端点' });
    process.exit(1);
  }
  const r = await httpGet(`${url}/api/experimental/session/stats`, 30000);
  output(unwrap(r) ?? r);
}

// ─── 子命令：revert（检查点 stage/commit/clear） ───
async function cmdRevert(opts) {
  const url = getUrl(opts);
  const sessionId = opts.session;
  const action = opts.action || 'stage';
  const message = opts.message;
  requireOpts(opts, ['port', 'session']);

  if (!['stage', 'commit', 'clear'].includes(action)) {
    output({ error: `--action 仅支持 stage|commit|clear，收到 "${action}"` });
    process.exit(1);
  }

  const surface = await getSurface(url);
  let response, via;

  if (action === 'stage') {
    if (!surface.v2.revertStage) { output({ error: '当前服务器无 revert/stage 端点' }); process.exit(1); }
    let mid = message;
    // 未指定消息时，自动取 v2 消息视图中最后一条用户消息（revert 要求 v2 视图的 msg_ id）
    if (!mid && surface.v2.message) {
      try {
        const r = await httpGet(`${url}/api/session/${sessionId}/message`, 15000);
        const msgs = Array.isArray(r) ? r : (unwrap(r) || []);
        const lastUser = [...msgs].reverse().find(m => msgRole(m) === 'user' && m.id);
        mid = lastUser ? lastUser.id : null;
        if (mid) process.stderr.write(`自动选中用户消息: ${mid}\n`);
      } catch { /* 拉取失败则不带消息尝试 */ }
    }
    const variants = mid
      ? [{ before: mid }, { messageID: mid }]
      : [{}];
    response = await tryBodyVariants(url, `/api/session/${sessionId}/revert/stage`, variants);
    via = 'v2:revert/stage';
  } else if (action === 'commit') {
    if (!surface.v2.revertCommit) { output({ error: '当前服务器无 revert/commit 端点' }); process.exit(1); }
    response = await httpPost(`${url}/api/session/${sessionId}/revert/commit`, {}, 30000);
    via = 'v2:revert/commit';
  } else { // clear
    if (surface.v2.revertClearPost) {
      response = await httpPost(`${url}/api/session/${sessionId}/revert/clear`, {}, 30000);
      via = 'v2:revert/clear(post)';
    } else if (surface.v2.revertClearDelete) {
      response = await httpDelete(`${url}/api/session/${sessionId}/revert`, 30000);
      via = 'v2:revert(delete)';
    } else {
      output({ error: '当前服务器无 revert/clear 端点' });
      process.exit(1);
    }
  }

  output({
    sessionId,
    action,
    via,
    result: isNoBody(response) ? 'ok(no-content)' : (response ?? 'ok'),
  });
}

// ─── 子命令：fork（从某消息分叉会话） ───

async function cmdFork(opts) {
  const url = getUrl(opts);
  const sessionId = opts.session;
  const message = opts.message;
  requireOpts(opts, ['port', 'session']);

  const surface = await getSurface(url);
  if (!surface.v2.fork) {
    output({ error: '当前服务器无 /api/session/{id}/fork 端点。v1 可用 opencode run --fork 会话级替代' });
    process.exit(1);
  }

  const variants = message
    ? [{ before: message }, { messageID: message }]
    : [{}];
  const response = await tryBodyVariants(url, `/api/session/${sessionId}/fork`, variants);
  const newId = extractSessionId(response);

  output({ parentSessionId: sessionId, forkedSessionId: newId, via: 'v2:fork', response: newId ? undefined : response });
}

// ─── 子命令：compact（压缩会话上下文，会触发模型摘要调用） ───

async function cmdCompact(opts) {
  const url = getUrl(opts);
  const sessionId = opts.session;
  requireOpts(opts, ['port', 'session']);

  const surface = await getSurface(url);
  if (!surface.v2.compact) {
    output({ error: '当前服务器无 /api/session/{id}/compact 端点' });
    process.exit(1);
  }

  const response = await httpPost(`${url}/api/session/${sessionId}/compact`, {}, 60000);
  output({ sessionId, compacted: true, via: 'v2:compact', result: isNoBody(response) ? 'ok(no-content)' : (response ?? 'ok') });
}

// ─── 子命令：diff（会话产生的文件变更） ───

async function cmdDiff(opts) {
  const url = getUrl(opts);
  const sessionId = opts.session;
  requireOpts(opts, ['port', 'session']);

  const surface = await getSurface(url);
  if (surface.v1.diff) {
    const r = await httpGet(`${url}/session/${sessionId}/diff`, 30000);
    output({ sessionId, via: 'v1:/session/{id}/diff', diff: r });
  } else if (surface.v2.diff) {
    const r = await httpGet(`${url}/api/session/${sessionId}/diff`, 30000);
    output({ sessionId, via: 'v2:/api/session/{id}/diff', diff: unwrap(r) ?? r });
  } else {
    output({ error: '当前服务器无会话 diff 端点' });
    process.exit(1);
  }
}

// ─── 主入口 ───

// 全局未捕获 Promise 拒绝处理器 — 将 serve 连接错误转为友好 JSON 输出
process.on('unhandledRejection', (err) => {
  const url = err._url || '';
  const code = err.code || '';

  if (code === 'ECONNREFUSED' || code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
    output({
      error: '无法连接到 serve 服务器',
      url,
      code,
      hint: '请确认 serve 已启动，可用 ps 命令巡检或 start 命令启动',
    });
  } else {
    output({
      error: err.message || String(err),
      url,
    });
  }

  process.exit(1);
});

const args = process.argv.slice(2);
const cmd = args[0];
const opts = parseCliArgs(args.slice(1));

switch (cmd) {
  case 'start':
    cmdStart(opts);
    break;
  case 'submit':
    cmdSubmit(opts);
    break;
  case 'send':
    cmdSend(opts);
    break;
  case 'status':
    cmdStatus(opts);
    break;
  case 'result':
    cmdResult(opts);
    break;
  case 'abort':
    cmdAbort(opts);
    break;
  case 'stop':
    cmdStop(opts);
    break;
  case 'run':
    cmdRun(opts);
    break;
  case 'ps':
    cmdPs(opts);
    break;
  case 'sessions':
    cmdSessions(opts);
    break;
  case 'rm':
    cmdRm(opts);
    break;
  case 'detect':
    cmdDetect(opts);
    break;
  case 'wait':
    cmdWait(opts);
    break;
  case 'skills':
    cmdSkills(opts);
    break;
  case 'stats':
    cmdStats(opts);
    break;
  case 'revert':
    cmdRevert(opts);
    break;
  case 'fork':
    cmdFork(opts);
    break;
  case 'compact':
    cmdCompact(opts);
    break;
  case 'diff':
    cmdDiff(opts);
    break;
  default:
    process.stderr.write(`Usage: node serve-api.cjs <command> [options]

 阻塞模式：
   run    --message "..." [--agent sddu] [--dir .] [--port 4096] [--timeout 600] [--allow "edit:src/**"]
          一条龙：启动 serve -> 提交 -> 等待（v2 wait 优先/轮询回退） -> 取结果 -> 关闭

   send   --port 4096 --message "..." [--agent sddu] [--timeout 600] [--allow "action:resource"]
          向已运行的 serve 提交任务，阻塞直到完成

 非阻塞模式：
   start  [--port 4096] [--hostname 127.0.0.1] [--dir .]
          启动 serve，返回端口 + PID

   submit --port 4096 --message "..." [--agent sddu] [--allow "action:resource"]
          提交任务，立即返回 sessionId，不等待完成

   status --port 4096 [--session <sid>]
          查 serve 健康状态；指定 --session 时查会话进度

   result --port 4096 --session <sid>
          取已完成的会话消息

   wait   --port 4096 --session <sid> [--timeout 600]
           阻塞等待会话 idle（v2 wait 端点，精确完成检测）

   abort  --port 4096 --session <sid]
           中止运行中的会话（v2 interrupt 优先，v1 abort 回退）

   stop   --port 4096
           按端口查找并杀掉 serve 进程

 巡检/管理：
   ps     [--port 4096]
           列出所有运行中的 serve 进程加健康探测

   sessions --port 4096 [--agent <name>] [--grep <kw>] [--limit 5] [--full]
           列出会话（默认摘要最近5条，数据全局共享）

   rm     --port 4096 --session <sid>
           删除指定会话（不可逆）

 v2 能力（依赖服务端 /api 面，detect 可探测可用性）：
   detect --port 4096
           探测服务器 API 面（v1/v2 端点可用性清单）

   skills --port 4096 [--grep <kw>]
           列出服务器注册的 Skills

   stats  --port 4096
           会话统计（用量/工具可靠性，实验性端点）

   revert --port 4096 --session <sid> --action stage|commit|clear [--message <mid>]
           检查点回滚：stage 暂存 -> commit 提交 / clear 取消

   fork   --port 4096 --session <sid> [--message <mid>]
           从某消息分叉新会话（不指定消息则复制全部历史）

   compact --port 4096 --session <sid>
           压缩会话上下文（触发模型摘要调用，配合长会话续接）

   diff   --port 4096 --session <sid]
           会话产生的文件变更

 通用说明：
   --allow 可重复多次，格式 "action:resource"（如 "edit:src/**"、"shell:git status *"），
   生成 v2 permissions 规则集做无值守精准预授权（v1 服务器自动忽略）。
   响应解析三态兼容：v1 裸值 / v2 {data:...} 包裹 / 204 无体。
  `);
    process.exit(1);
}
