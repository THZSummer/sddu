#!/usr/bin/env node
'use strict';

/**
 * serve-api.cjs - opencode serve HTTP API 封装脚本（v2-only 版）
 *
 * 零依赖，使用 Node.js 内置模块。
 * 封装 serve 的会话管理、消息发送、轮询、进程管理。
 * LLM 调用本脚本，不需要手动构造 curl 命令。
 *
 * v2-only 策略（v5.0+）：
 *   - 只使用 opencode v2 API（/api/*），不再兼容 v1 端点
 *   - 启动时通过 /doc OpenAPI 规范做运行时端点自探测（getSurface）并校验 v2 可用性
 *   - 完成检测：v2 wait 端点（精确等待 idle），不可用时回退 v2 消息数轮询
 *   - 中止：v2 interrupt
 *   - 响应解析：{data:...} 包裹（v2）/ 204 无体
 *   - 需要 v2 端点而服务器缺失时，明确报错引导升级 opencode
 *
 * 用法：
 *   node serve-api.cjs run --message "..." [--agent sddu] [--dir .] [--port 4096] [--timeout 600]
 *   node serve-api.cjs start [--port 4096] [--hostname 127.0.0.1]
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
const fs = require('fs');
const path = require('path');
const os = require('os');
const { program, InvalidArgumentError } = require('commander');
const http = require('http');
const { parseArgs } = require('util');

// ─── 参数解析 ───

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

// ─── v2 响应解包（{data:...} 包裹 / 204 无体） ───

// v2 多数端点将负载包裹在 {data: ...}（部分还带 location/cursor）。
// 此函数统一取 .data（存在则解包），否则原样返回。
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

// 从会话创建响应提取 id（v2 {data:{id}}）
function extractSessionId(resp) {
  const s = (resp && resp.id) ? resp : unwrap(resp);
  return (s && typeof s === 'object' && s.id) ? s.id : null;
}

// ─── API 面运行时自探测 ───
// 通过 /doc OpenAPI 规范检测当前服务器暴露的 v2 端点集合（v1 仅作 detect 诊断展示，命令不再使用）。
// /doc 不可用时 v2 端点视为未知（false），命令会明确报错引导排查。

let surfaceCache = null;

async function getSurface(url) {
  if (surfaceCache) return surfaceCache;

  const paths = new Set();
  let docAvailable = false;
  // /doc 首次命中时服务端需生成完整 OpenAPI 规范（可达数百 KB），可能超过 10s——15s 超时 + 1 次重试
  try {
    const doc = await httpGetRetry(`${url}/doc`, 30000, 2); // 首访需生成完整规范（可达数百 KB，实测 ~25s）
    if (doc && doc.paths && typeof doc.paths === 'object') {
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

// 健康检查（v2-only）：/api/health → /api/info
async function healthCheck(url, surface) {
  if (surface.v2.health) {
    try { return await httpGet(`${url}/api/health`, 5000); } catch { /* 尝试下一种 */ }
  }
  if (surface.v2.info) {
    return await httpGet(`${url}/api/info`, 5000);
  }
  throw new Error('无可用的 v2 健康检查端点（/api/health 或 /api/info）');
}

// ─── 会话与消息（v2） ───

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

// 创建会话（v2-only）。传入 allowRules 时附加 permissions（尝试数组与 {rules:[...]} 两种形态）。
// 传入 locationDir 时以 v2 location 指定会话项目目录（一 server 多项目）。
async function createSession(url, surface, opts = {}) {
  const title = opts.title || 'serve-api-task';
  const allowRules = opts.allowRules || null;
  const agent = opts.agent || null;
  const locationDir = opts.locationDir || null;

  if (!surface.v2.session) {
    output({ error: '当前服务器无 v2 会话端点（/api/session）。本工具仅支持 opencode v2 API，请升级 opencode' });
    process.exit(1);
  }

  const locationField = locationDir ? { location: { directory: path.resolve(locationDir) } } : {};

  const tryCreate = async (body) => {
    const resp = await httpPost(`${url}/api/session`, body, 15000);
    return { resp, id: extractSessionId(resp) };
  };

  // 按序尝试 [全量附加字段] -> [rules 对象形态] -> [无附加字段]；仅 400（形态不符）时降级
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
      const r = await tryCreate({ title, ...locationField, ...extra });
      if (r.id) {
        let via = 'v2:/api/session';
        if (extra.permissions) via += Array.isArray(extra.permissions) ? '+rules(array)' : '+rules(object)';
        if (extra.agent) via += '+agent';
        if (locationDir) via += '+location';
        const dropped = Object.keys(full).filter(k => !(k in extra));
        if (dropped.length) process.stderr.write(`警告: 以下字段被服务端拒绝已降级忽略: ${dropped.join(', ')}\n`);
        return { sessionId: r.id, via };
      }
    } catch (e) {
      if (e.statusCode !== 400) throw e; // 非 400 直接抛出
    }
  }

  output({ error: '创建会话失败：v2 /api/session 未返回 id' });
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

// 发送消息（v2-only）：/api/session/{id}/prompt（text / prompt.text 双形态，agent 经由创建时指定）
async function sendPrompt(url, surface, sessionId, message, agent) {
  if (!surface.v2.prompt) {
    throw new Error('当前服务器无 v2 消息发送端点（/api/session/{id}/prompt）。本工具仅支持 opencode v2 API');
  }
  const variants = [{ text: message }, { prompt: { text: message } }];
  const resp = await tryBodyVariants(url, `/api/session/${sessionId}/prompt`, variants);
  return { via: 'v2:prompt', resp };
}

// 拉取消息列表（v2-only）：/api/session/{id}/message
async function fetchMessages(url, surface, sessionId, _gen, timeoutMs) {
  if (!surface.v2.message) {
    throw new Error('当前服务器无 v2 消息端点（/api/session/{id}/message）。本工具仅支持 opencode v2 API');
  }
  const r = await httpGet(`${url}/api/session/${sessionId}/message?order=asc`, timeoutMs || 30000);
  const arr = Array.isArray(r) ? r : (unwrap(r) || []);
  if (!Array.isArray(arr)) return [];
  // v2 视图默认可能倒序（最新在前），按 time.created 客户端排序归一化
  const ts = (m) => (m.time && m.time.created) || (m.info && m.info.time && m.info.time.created) || 0;
  return [...arr].sort((a, b) => ts(a) - ts(b));
}

// ─── 任务完成检测 ───
// v2 wait（精确等待 agent loop idle），不可用时回退 v2 消息数轮询（连续 2 次不变视为完成）。

async function checkDone(url, surface, sessionId, gen, lastMsgCount) {
  const messages = await fetchMessages(url, surface, sessionId, gen);
  const count = Array.isArray(messages) ? messages.length : 1;
  const done = count > 1 && count === lastMsgCount;
  return { done, count, messages };
}

function msgRole(m) {
  if (!m) return '';
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

// GET 带重试：大端点（/doc、/api/skill、/session 列表）首访服务端惰性构建，可能瞬时超时
async function httpGetRetry(url, timeoutMs, retries = 2) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await httpGet(url, timeoutMs);
    } catch (e) {
      lastErr = e;
      if (i < retries) await sleep(1000 * (i + 1)); // 1s, 2s 退避
    }
  }
  throw lastErr;
}

function httpPost(url, body, timeoutMs) {
  return httpRequest('POST', url, body === undefined ? {} : body, timeoutMs);
}

function httpDelete(url, timeoutMs) {
  return httpRequest('DELETE', url, undefined, timeoutMs);
}

// DELETE 带重试：服务端预热期可能瞬时超时
async function httpDeleteRetry(url, timeoutMs, retries = 1) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await httpDelete(url, timeoutMs);
    } catch (e) {
      lastErr = e;
      if (i < retries) await sleep(1500);
    }
  }
  throw lastErr;
}

// ─── 子命令：start ───

async function cmdStart(opts) {
  const port = parseInt(opts.port || '4096');
  const hostname = opts.hostname || '127.0.0.1';
  const dir = os.homedir();

  const url = `http://${hostname}:${port}`;

  // 预检：端口已占用时绝不重复 spawn（幂等返回或明确报错）
  const existing = portPids(port);
  if (existing.length > 0) {
    const h = await probeHealthDirect(url, 3000);
    if (h) {
      output({ status: 'running', alreadyRunning: true, port, pids: existing.map(Number), url, version: (h && h.version) || 'unknown', hint: 'serve 已在运行；如需换新进程用 restart' });
      return;
    }
    output({ error: `端口 ${port} 已被占用且探测不健康（pids: ${existing.join(', ')}）。请先 stop 清理或换 --port`, port, pids: existing.map(Number) });
    process.exit(1);
  }

  // 启动 serve 进程（detached + 日志/PID 落盘）
  const { pid, logFile, pidFile } = spawnServeDetached(port, hostname, dir);

  // --no-wait：后台模式，立即返回（冷启动需 15-30s，稍后用 status/ps 确认）
  if (opts.wait === false) {
    output({ status: 'starting', url, port, pid, logFile, pidFile, hint: '后台启动中（冷启动约 15-30s），用 status --port 或 ps 确认就绪' });
    return;
  }

  // 等待健康检查通过（最多 45 秒——冷启动通常 15-30s）；逐段输出进度避免用户以为卡死
  for (let i = 0; i < 45; i++) {
    await sleep(1000);
    if (i === 0) process.stderr.write(`等待健康检查（最多 45s，冷启动通常 15-30s）...\n`);
    else if ((i + 1) % 3 === 0) process.stderr.write(`  [${i + 1}s] 仍在等待就绪...\n`);
    const health = await probeHealthDirect(url, 5000);
    if (health) {
      // 拿到带 version 的响应才算完全就绪；超 38s 仍无版本字段则兜底接受（避免版本差异导致死等）
      if (health.version || i >= 38) {
        output({ url, port, pid, status: 'running', version: (health && health.version) || 'unknown', logFile, pidFile });
        return;
      }
    }
  }

  output({ error: `serve 启动超时，端口 ${port} 无响应`, pid, logFile, hint: `查看日志: tail -f ${logFile}` });
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
  const { sessionId, via } = await createSession(url, surface, { allowRules, locationDir: opts.dir });

  // 2. 发送消息
  const promptVia = await sendPrompt(url, surface, sessionId, message, agent);

  // 3. 等待完成：v2 wait 优先，回退 v2 消息数轮询
  const r = await waitForCompletion(url, surface, sessionId, 'v2', timeoutSec, intervalSec, start);
  if (!r.done) {
    output({ error: '任务超时', sessionId, duration: elapsed(start) });
    process.exit(1);
  }

  output({ sessionId, status: 'completed', via: { create: via, prompt: promptVia.via, completion: r.via }, messages: r.messages, duration: elapsed(start) });
}

// 统一的完成等待逻辑：v2 wait 优先，不可用时回退 v2 消息数轮询
async function waitForCompletion(url, surface, sessionId, gen, timeoutSec, intervalSec, start) {
  // 路径 A：v2 wait 端点（阻塞至 agent loop idle，精确）
  if (surface.v2.wait) {
    try {
      await httpPost(`${url}/api/session/${sessionId}/wait`, {}, timeoutSec * 1000 + 30000);
      let messages = [];
      try { messages = await fetchMessages(url, surface, sessionId, gen); } catch { /* 结果拉取失败不视为任务失败 */ }
      return { done: true, via: 'v2:wait', messages };
    } catch (e) {
      process.stderr.write(`[${elapsed(start)}] v2 wait 调用失败（${e.message}），回退 v2 消息数轮询\n`);
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

// 全局扫 ps 找 opencode serve --port <port>（端口无监听时的兜底；不依赖 cwd/pidfile）
function servePidByPort(port) {
  try {
    const out = execSync('ps -eo pid,command', { encoding: 'utf8' });
    for (const line of out.split('\n')) {
      if (!/[o]pencode\s+serve/.test(line)) continue;
      if (new RegExp(`--port\\s+${port}(\\s|$)`).test(line)) {
        const m = line.trim().match(/^(\d+)/);
        if (m && m[1] !== String(process.pid)) return m[1];
      }
    }
  } catch { /* ignore */ }
  return null;
}

// 判断进程是否仍存活且确为 opencode serve（避免 PID 被复用误杀）
function isOpencodeServe(pid) {
  try {
    const out = execSync(`ps -p ${pid} -o command= 2>/dev/null`).toString().trim();
    return /opencode\s+serve/.test(out);
  } catch { return false; }
}

// 杀掉占用端口的进程（SIGTERM -> 1s -> SIGKILL 兜底），返回结果供 stop/restart 复用。
// 端口无监听时全局扫 ps 兜底（覆盖 start --no-wait 后立即 stop、serve 尚未绑定端口的竞态；不依赖 cwd）。
async function killByPort(port) {
  let pids = portPids(port);
  if (pids.length === 0) {
    const pid = servePidByPort(port);
    if (pid && isOpencodeServe(pid)) {
      pids = [String(pid)];
      process.stderr.write(`端口 ${port} 暂无监听进程，但 ps 扫到存活 serve（pid ${pid}），按 PID 清理\n`);
    }
  }
  if (pids.length === 0) return { hadProcess: false, killed: false, reason: '端口无进程' };

  for (const p of pids) {
    try { process.kill(parseInt(p), 'SIGTERM'); } catch {}
  }
  try { execSync('sleep 1'); } catch {}

  let forced = false;
  const remain = portPids(port);
  if (remain.length > 0) {
    for (const p of remain) {
      try { process.kill(parseInt(p), 'SIGKILL'); } catch {}
    }
    forced = true;
    try { execSync('sleep 0.5'); } catch {}
  }

  const after = portPids(port);
  if (after.length === 0) return { hadProcess: true, killed: true, pids: pids.map(Number), forced };
  return { hadProcess: true, killed: false, pids: after.map(Number), reason: '仍有进程残留，请手动检查' };
}

async function cmdStop(opts) {
  const port = opts.port;
  const r = await killByPort(port);
  if (!r.killed) {
    output({ killed: false, port: parseInt(port), reason: r.reason });
    process.exit(1);
  }
  output({ killed: true, port: parseInt(port), ...(r.hadProcess ? {} : { reason: '端口无进程' }), pids: r.pids, forced: r.forced });
}

// ─── serve 进程管理（start/restart/attach 公共） ───

// 直接健康探测（不依赖 /doc 自探测，冷启动更快）：试 v2 健康端点。
// 优先返回带 version 的响应（/api/health 在部分版本无 version 字段，仅作兜底）
async function probeHealthDirect(url, timeoutMs = 5000) {
  let fallback = null;
  for (const p of ['/api/health', '/api/info']) {
    try {
      const h = await httpGet(`${url}${p}`, timeoutMs);
      if (h && !isNoBody(h)) {
        if (h.version) return h;
        fallback = fallback || h;
      }
    } catch { /* 尝试下一个 */ }
  }
  return fallback;
}

// detached 启动 serve，日志/PID 落盘 <dir>/.opencode/logs/
function spawnServeDetached(port, hostname, dir) {
  const logDir = path.join(dir, '.opencode', 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `opencode-serve-${port}.log`);
  const pidFile = path.join(logDir, `opencode-serve-${port}.pid`);
  const logFd = fs.openSync(logFile, 'a');
  const child = spawn('opencode', ['serve', '--port', String(port), '--hostname', hostname], {
    cwd: dir,
    detached: true,
    stdio: ['ignore', logFd, logFd],
  });
  child.unref();
  fs.writeFileSync(pidFile, String(child.pid));
  return { pid: child.pid, logFile, pidFile };
}

// ─── 子命令：restart（杀旧 -> detached 重启 -> 健康检查；原 scripts/server/restart.cjs 融合） ───

async function cmdRestart(opts) {
  const port = parseInt(opts.port);
  const hostname = opts.hostname || '127.0.0.1';
  const dir = os.homedir();
  const url = `http://${hostname}:${port}`;
  const start = Date.now();

  // 1. 杀旧进程（无旧进程也继续，restart 兼容 start 语义）；残留杀不掉则中止
  const killed = await killByPort(port);
  process.stderr.write(`[${elapsed(start)}] 旧进程清理: ${JSON.stringify(killed)}\n`);
  if (killed.hadProcess && !killed.killed) {
    output({ error: `旧进程未能停止（${(killed.pids || []).join(', ')}），为避免同端口双进程已中止`, port, previousKilled: killed });
    process.exit(1);
  }

  // 2. detached 启动 + 日志/PID 落盘
  const { pid, logFile, pidFile } = spawnServeDetached(port, hostname, dir);
  process.stderr.write(`[${elapsed(start)}] 已启动 pid=${pid}，日志: ${logFile}\n`);

  // --no-wait：后台模式，立即返回
  if (opts.wait === false) {
    output({ status: 'starting', url, port, pid, logFile, pidFile, previousKilled: killed, hint: '后台启动中（冷启动约 15-30s），用 status --port 或 ps 确认就绪' });
    return;
  }

  // 3. 健康检查（最多 30 秒）；逐段输出进度避免用户以为卡死
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    if (i === 0) process.stderr.write(`[${elapsed(start)}] 等待健康检查（最多 30s，冷启动通常 15-30s）...\n`);
    else if ((i + 1) % 3 === 0) process.stderr.write(`  [${elapsed(start)}] 仍在等待就绪（第 ${i + 1}/30 次）...\n`);
    const h = await probeHealthDirect(url, 3000);
    if (h) {
      // 拿到带 version 的响应才算完全就绪；超 26s 仍无版本字段则兜底接受（实测 /api/health 完全就绪约 25s）
      if (h.version || i >= 26) {
        output({ status: 'running', url, port, pid, version: (h && h.version) || 'unknown', logFile, pidFile, previousKilled: killed, duration: elapsed(start) });
        return;
      }
    }
  }

  output({ error: `serve 启动超时（30s）`, port, pid, logFile, hint: `查看日志: tail -f ${logFile}` });
  process.exit(1);
}

// ─── 子命令：attach（TUI 附加到运行中的 serve；原 scripts/server/attach.cjs 融合） ───

async function cmdAttach(opts) {
  // 交互式命令：需 TTY（Agent 请改用 send/submit/result 等会话命令）
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    output({ error: 'attach 为交互式 TUI 命令，需要 TTY 终端。Agent 请通过 send/submit/result 使用会话' });
    process.exit(1);
  }

  const port = parseInt(opts.port);
  const hostname = opts.hostname || '127.0.0.1';
  const dir = path.resolve(opts.dir || '.');
  const url = `http://${hostname}:${port}`;

  const h = await probeHealthDirect(url, 3000);
  if (!h) {
    output({ error: `opencode serve 未运行（${url}），请先 start 或 restart`, url });
    process.exit(1);
  }

  // TUI 必须接管 stdio（本命令不输出 JSON，退出码透传 opencode attach）
  // 对齐官方逻辑：--dir 默认当前目录（不传时等价 opencode attach 在 cwd 运行）
  const child = spawn('opencode', ['attach', url, '--dir', dir], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 0));
}

// ─── 子命令：sessions（列出会话） ───

async function cmdSessions(opts) {
  const url = getUrl(opts);
  requireOpts(opts, ['port']);

  const surface = await getSurface(url);
  if (!surface.v2.session) {
    output({ error: '当前服务器无 v2 会话端点（/api/session）。本工具仅支持 opencode v2 API，请升级 opencode' });
    process.exit(1);
  }
  const r = await httpGetRetry(`${url}/api/session?limit=200`, 30000);
  let list = Array.isArray(r) ? r : (unwrap(r) || []);
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

  // 5. 输出：full 返回完整；默认摘要（id/title/agent/directory/time）
  if (opts.full) {
    output(list);
  } else {
    output(list.map(s => ({
      id: String(s.id || '').slice(0, 12),
      title: s.title,
      agent: s.agent,
      directory: (s.location && s.location.directory) || s.directory,
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
  if (!surface.v2.session) {
    output({ error: '当前服务器无 v2 会话端点（/api/session）。本工具仅支持 opencode v2 API，请升级 opencode' });
    process.exit(1);
  }
  await httpDeleteRetry(`${url}/api/session/${sessionId}`, 30000); // v2: 204 无体
  output({ deleted: true, sessionId, via: 'v2:/api/session/{id}' });
}

// ─── 子命令：ps（进程巡检） ───

async function cmdPs(opts) {
  const psOutput = execSync('ps -eo pid,etime,command', { encoding: 'utf8' });
  const lines = psOutput.split('\n').filter(line => /[o]pencode\s+serve/.test(line));

  // 从 /proc/<pid>/cwd 读真实工作目录（spawn 走 cwd 不带 --dir 参数，命令行解析不到）
  const procCwd = (pid) => {
    try { return fs.realpathSync(`/proc/${pid}/cwd`); } catch { return null; }
  };

  const processes = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const m = trimmed.match(/^(\d+)\s+(\S+)\s+(.+)$/);
    if (!m) continue;

    const pid = m[1];
    const etime = m[2];
    const command = m[3];

    const portMatch = command.match(/--port\s+(\d+)/);
    const hostMatch = command.match(/--hostname\s+(\S+)/);

    const port     = portMatch ? parseInt(portMatch[1]) : 4096;
    const hostname = hostMatch ? hostMatch[1] : '127.0.0.1';

    if (opts.port && String(port) !== String(opts.port)) continue;

    processes.push({ pid, etime, port, hostname, dir: procCwd(pid) });
  }

  // 健康探测按 (hostname, port) 只做一次，避免同端口多进程时结果张冠李戴
  const healthCache = new Map();
  const probe = async (hostname, port) => {
    const key = `${hostname}:${port}`;
    if (healthCache.has(key)) return healthCache.get(key);
    let r = { health: 'down', version: null };
    try {
      const h = await probeHealthDirect(`http://${hostname}:${port}`, 3000);
      if (h) r = { health: 'alive', version: (h && h.version) || 'unknown' };
    } catch { /* down */ }
    healthCache.set(key, r);
    return r;
  };

  // 同端口多进程 => conflict 标记（多见于 start 未预检的历史残留或手工误启）
  const portCount = new Map();
  for (const proc of processes) {
    const key = `${proc.hostname}:${proc.port}`;
    portCount.set(key, (portCount.get(key) || 0) + 1);
  }

  const results = [];
  for (const proc of processes) {
    const { health, version } = await probe(proc.hostname, proc.port);
    const conflict = portCount.get(`${proc.hostname}:${proc.port}`) > 1;
    results.push({
      pid: proc.pid,
      etime: proc.etime,
      port: proc.port,
      hostname: proc.hostname,
      dir: proc.dir,
      health,
      version,
      ...(conflict ? { conflict: true, hint: '同端口存在多个 serve 进程，健康结果为端口实际持有者；建议 stop 后 restart' } : {}),
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
  const { sessionId, via } = await createSession(url, surface, { allowRules, locationDir: opts.dir });
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

// ─── 子命令：abort（中止会话：v2 interrupt） ───

async function cmdAbort(opts) {
  const url = getUrl(opts);
  const sessionId = opts.session;
  requireOpts(opts, ['port', 'session']);

  const surface = await getSurface(url);
  if (!surface.v2.interrupt) {
    output({ error: '当前服务器无 v2 中止端点（/api/session/{id}/interrupt）。本工具仅支持 opencode v2 API，请升级 opencode' });
    process.exit(1);
  }

  const response = await httpPost(`${url}/api/session/${sessionId}/interrupt`, {}, 15000);
  let interrupted;
  if (isNoBody(response)) {
    interrupted = true; // 204 无体，视为成功
  } else if (response && typeof response === 'object' && response.interrupted !== undefined) {
    interrupted = Boolean(response.interrupted);
  } else {
    interrupted = true;
  }

  output({ aborted: interrupted, sessionId, via: 'v2:interrupt', response });
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
    const { sessionId, via } = await createSession(url, surface, { allowRules, locationDir: opts.dir });
    const promptVia = await sendPrompt(url, surface, sessionId, message, agent);

    const r = await waitForCompletion(url, surface, sessionId, 'v2', timeoutSec, 5, start);

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

  const r = await httpGetRetry(`${url}/api/skill`, 30000);
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
    output({ error: '当前服务器无 /api/session/{id}/fork 端点。本工具仅支持 opencode v2 API' });
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
  if (!surface.v2.diff) {
    output({ error: '当前服务器无 v2 会话 diff 端点（/api/session/{id}/diff）。本工具仅支持 opencode v2 API；diff 若仅 v1 提供则不可用' });
    process.exit(1);
  }
  const r = await httpGet(`${url}/api/session/${sessionId}/diff`, 30000);
  output({ sessionId, via: 'v2:/api/session/{id}/diff', diff: unwrap(r) ?? r });
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

// ─── Commander CLI 入口（标准 CLI 框架：每命令 --help / help <cmd>，用法错误 exit 2） ───

const intOpt = (label) => (v) => {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) throw new InvalidArgumentError(`${label}应为数字，收到 "${v}"`);
  return n;
};

const PORT    = ['-p, --port <port>', 'serve 端口', intOpt('port'), 4096];
const SESSION = (required = true) => ({ req: required, spec: ['--session <id>', '会话 ID（ses_ 前缀）'] });
const MSG = { req: true, spec: ['--message <text>', '任务消息内容'] };
const AGENT   = ['--agent <name>', '执行 Agent（如 build/sddu；opencode agent list 查看）'];
const ALLOW   = ['--allow <rules...>', '预授权规则 "action:resource"，可重复（如 --allow "edit:src/**" --allow "shell:git *"）'];
const MID     = ['--message <mid>', '目标消息 ID（msg_ 前缀，v2 视图）'];

function cmd(name, summary, opts = [], extra = {}, handler) {
  const c = program.command(name).description(summary);
  // exitOverride 不级联子命令：逐个挂载，把错误 throw 给 parseAsync 统一裁决退出码
  c.exitOverride((err) => { throw err; });
  for (const entry of opts) {
    const [flag, desc, ...rest] = Array.isArray(entry) ? entry : entry.spec;
    const isReq = !Array.isArray(entry) && entry.req === true;
    const parse = typeof rest[0] === 'function' ? rest[0] : undefined; // [flag, desc, parseFn, default] 或 [flag, desc, default]
    const def = parse ? rest[1] : rest[0];
    const add = isReq ? c.requiredOption.bind(c) : c.option.bind(c);
    if (parse) add(flag, desc, parse, def); else if (def !== undefined) add(flag, desc, def); else add(flag, desc);
  }
  // required 标记（SESSION(false) 等场景不强制）
  for (const o of extra.required || []) c.requiredOption(...o);
  if (extra.desc) c.addHelpText('after', '\n' + [].concat(extra.desc).map(l => l).join('\n'));
  if (extra.examples) c.addHelpText('after', '\n示例:\n' + extra.examples.map(e => '  ' + e).join('\n'));
  if (extra.notes) c.addHelpText('after', '\n说明:\n' + [].concat(extra.notes).map(n => '  ' + n).join('\n'));
  c.action(async (opts) => { await handler(opts); });
  return c;
}

// —— 阻塞模式 ——
cmd('run', '一条龙：启动 serve -> 提交 -> 等待完成 -> 取结果 -> 关闭',
  [MSG, AGENT, ['--dir <path>', '项目工作目录（默认当前目录，等价官方 opencode run 无 --dir）'], PORT,
   ['--timeout <seconds>', '超时（秒）', intOpt('timeout'), 600], ALLOW],
  { desc: '适合单次独立任务：自动拉起临时 serve、执行、返回全部消息后关闭。长流程（>30 分钟）建议 start + submit + status/result 组合。',
    examples: ['node serve-api.cjs run --message "审查 src/ 目录" --agent build',
               'node serve-api.cjs run --message "重构" --allow "edit:src/**" --allow "shell:git *" --timeout 900'] },
  cmdRun);

cmd('send', '向已运行的 serve 提交任务，阻塞直到完成',
  [MSG, AGENT, PORT, ['--dir <path>', '会话项目目录（v2 location，实现一 server 多项目；默认 serve 启动目录）'],
   ['--timeout <seconds>', '超时（秒）', intOpt('timeout'), 600],
   ['--interval <seconds>', '轮询间隔（秒）', intOpt('interval'), 5], ALLOW],
  { desc: '与 run 的区别：不启动/不关闭 serve，直接复用运行中的实例。完成检测 v2 wait 优先，自动回退 v2 消息数轮询。',
    notes: '--dir 指定会话所属项目目录（v2 location）；同一 serve 可并发服务多个项目的会话，各自解析自己的配置/模型',
    examples: ['node serve-api.cjs send --port 4096 --message "修复 lint 错误"',
               'node serve-api.cjs send --port 4096 --dir /home/usb/wks/gomoku --message "审查代码"'] },
  cmdSend);

// —— 非阻塞模式 ——
cmd('start', '启动 serve（detached 后台进程；工作目录为家目录 ~，日志/PID 落盘 ~/.opencode/logs/）',
  [PORT, ['--hostname <host>', '监听主机名', '127.0.0.1'], ['--no-wait', '后台模式：启动即返回，不等健康检查（冷启动约 15-30s）']],
  { desc: '在家目录 ~ 启动 serve（多项目场景用固定中立目录，避免 cwd 歧义；会话目录由 v2 location 独立指定）。端口已占用且健康时幂等返回 alreadyRunning，绝不重复 spawn；占用但不健康则报错引导 stop。',
    notes: '默认阻塞至健康就绪（适合自动化）；人用嫌慢可加 --no-wait。输出含 logFile/pidFile，排障 tail -f',
    examples: ['node serve-api.cjs start --port 4096',
               'node serve-api.cjs start --port 4096 --no-wait   # 立即返回，稍后 status 确认'] },
  cmdStart);

cmd('submit', '非阻塞提交：创建会话 + 发消息，立即返回 sessionId',
  [MSG, AGENT, PORT, ['--dir <path>', '会话项目目录（v2 location，实现一 server 多项目；默认 serve 启动目录）'], ALLOW],
  { desc: '提交即返回，随后用 status 查进度、result 取结果、abort 中止。适合 >30 分钟长任务。',
    notes: '--dir 指定会话所属项目目录（v2 location）；同一 serve 可并发服务多个项目的会话，各自解析自己的配置/模型',
    examples: ['node serve-api.cjs submit --port 4096 --message "多阶段任务" --agent sddu',
               'node serve-api.cjs submit --port 4096 --dir /home/usb/wks/gomoku --message "实现五子棋"'] },
  cmdSubmit);

cmd('status', '查 serve 健康状态；指定 --session 时查会话进度',
  [PORT, SESSION(false)],
  { examples: ['node serve-api.cjs status --port 4096 --session ses_xxx'] },
  cmdStatus);

cmd('result', '取会话全部消息（结果）',
  [PORT, SESSION()],
  { examples: ['node serve-api.cjs result --port 4096 --session ses_xxx'] },
  cmdResult);

cmd('wait', '阻塞等待会话 idle（v2 wait 端点，精确完成信号）',
  [PORT, SESSION(), ['--timeout <seconds>', '超时（秒）', intOpt('timeout'), 600]],
  { notes: '依赖服务端 /api/session/{id}/wait；不可用时明确报错，可用 status 轮询替代',
    examples: ['node serve-api.cjs wait --port 4096 --session ses_xxx --timeout 900'] },
  cmdWait);

cmd('abort', '中止运行中的会话（v2 interrupt）',
  [PORT, SESSION()],
  { examples: ['node serve-api.cjs abort --port 4096 --session ses_xxx'] },
  cmdAbort);

cmd('stop', '按端口杀掉 serve 进程（SIGTERM -> SIGKILL 兜底）',
  [PORT],
  { notes: '端口无监听时全局扫 ps 兜底（覆盖 start --no-wait 后立即 stop、serve 尚未绑定端口的竞态；不依赖 cwd）',
    examples: ['node serve-api.cjs stop --port 4096'] },
  cmdStop);

cmd('restart', '重启 serve：杀旧进程 -> detached 重启 -> 30s 健康检查（原 server/restart.cjs 融合）',
  [PORT, ['--hostname <host>', '监听主机名', '127.0.0.1'], ['--no-wait', '后台模式：杀旧+启动后立即返回，不等健康检查']],
  { desc: '在家目录 ~ 重启 serve（同 start；多项目场景固定中立目录）。端口无旧进程时等同于 start（restart 兼容冷启动）。日志/PID 落盘 ~/.opencode/logs/。',
    notes: ['原 scripts/server/ 脚本默认端口 14096，本 CLI 统一默认 4096——沿用旧端口请显式 --port 14096'],
    examples: ['node serve-api.cjs restart --port 4096'] },
  cmdRestart);

cmd('attach', 'TUI 附加到运行中的 serve（原 server/attach.cjs 融合）',
  [PORT, ['--hostname <host>', '监听主机名', '127.0.0.1'], ['--dir <path>', '要打开的项目目录（默认当前目录，等价官方 opencode attach）']],
  { desc: '健康检查通过后以 opencode attach 接管终端（交互式分屏）。',
    notes: ['交互式命令：需要 TTY，接管后不输出 JSON，退出码透传', 'Agent 请改用 send/submit/result 等会话命令', '原脚本默认端口 14096，本 CLI 统一默认 4096'],
    examples: ['node serve-api.cjs attach --port 14096 --dir /home/usb/wks/sddu'] },
  cmdAttach);

// —— 巡检/管理 ——
cmd('ps', '列出所有运行中的 serve 进程并做健康探测',
  [['-p, --port <port>', '仅显示该端口（可选过滤）']],
  { examples: ['node serve-api.cjs ps'] },
  cmdPs);

cmd('sessions', '列出会话（默认摘要最近 5 条，数据全局共享）',
  [PORT, AGENT, ['--grep <keyword>', '按 title 关键字过滤'],
   ['--limit <count>', '返回条数（0 = 全部）', intOpt('limit'), 5],
   ['--full', '输出完整字段']],
  { examples: ['node serve-api.cjs sessions --port 4096 --limit 10',
               'node serve-api.cjs sessions --port 4096 --grep "代码审查" --full'] },
  cmdSessions);

cmd('rm', '删除指定会话（不可逆，含子会话）',
  [PORT, SESSION()],
  { examples: ['node serve-api.cjs rm --port 4096 --session ses_xxx'] },
  cmdRm);

// —— v2 能力 ——
cmd('detect', '探测服务器 API 面（v1/v2 端点可用性清单）',
  [PORT],
  { desc: '解析 /doc OpenAPI 规范，输出当前服务器支持的 v1/v2 端点集合。排查兼容性问题首选。',
    examples: ['node serve-api.cjs detect --port 4096'] },
  cmdDetect);

cmd('skills', '列出服务器注册的 Skills（v2 /api/skill）',
  [PORT, ['--grep <keyword>', '按 id/name/description 过滤']],
  { examples: ['node serve-api.cjs skills --port 4096 --grep sddu'] },
  cmdSkills);

cmd('stats', '会话统计：用量/成本/工具可靠性（实验性端点）',
  [PORT],
  { examples: ['node serve-api.cjs stats --port 4096'] },
  cmdStats);

cmd('revert', '检查点回滚：stage 暂存 -> commit 提交 / clear 取消',
  [PORT, SESSION(), ['--action <name>', 'stage | commit | clear', 'stage'], MID],
  { desc: ['stage：暂存回滚点到某条消息之前（--message 省略时自动选中 v2 视图最后一条用户消息）。',
           'commit：提交暂存的回滚（文件与会话同时回退，返回 snapshot）。clear：取消暂存。'],
    notes: ['需要 v2 驱动链路（本工具会话创建已默认 v2 优先）', '流程建议：stage -> 检查 -> commit，或 stage -> clear 放弃'],
    examples: ['node serve-api.cjs revert --port 4096 --session ses_xxx --action stage',
               'node serve-api.cjs revert --port 4096 --session ses_xxx --action commit'] },
  cmdRevert);

cmd('fork', '从某消息分叉新会话（省略 --message 复制全部历史）',
  [PORT, SESSION(), MID],
  { notes: '依赖服务端 /api/session/{id}/fork 端点（detect 可探测）',
    examples: ['node serve-api.cjs fork --port 4096 --session ses_xxx'] },
  cmdFork);

cmd('compact', '压缩会话上下文（触发模型摘要调用，适合长会话续接前）',
  [PORT, SESSION()],
  { examples: ['node serve-api.cjs compact --port 4096 --session ses_xxx'] },
  cmdCompact);

cmd('diff', '查看会话产生的文件变更',
  [PORT, SESSION()],
  { examples: ['node serve-api.cjs diff --port 4096 --session ses_xxx'] },
  cmdDiff);

program
  .name('serve-api.cjs')
  .description('opencode serve API 封装 — v2 API 命令行工具')
  .version('5.1.0')
  .addHelpText('after', `
全局约定:
  stdout 恒为 JSON（含错误对象）；stderr 为人类可读进度/警告
  退出码：0 成功 / 1 运行时错误 / 2 用法错误
  v2-only：只使用 opencode v2 API（/api/*），启动时经 /doc 自探测校验 v2 可用性，输出 via 字段标注实际链路
  多数命令需要 serve 已在运行（先 start 或 ps 巡检已有实例）
  完整文档：同目录 ../SKILL.md

示例: node serve-api.cjs help revert   # 查看任一命令的参数与用法`);

// 退出码约定（集中裁决）：help/version 显式请求 -> 0；无参数帮助(stderr) -> 1；其余用法错误 -> 2
program.exitOverride((err) => { throw err; });

program.parseAsync(process.argv).catch(err => {
  if (process.env.CLI_DEBUG) console.error('DBG-CATCH code=' + err.code + ' exitCode=' + err.exitCode + ' name=' + err.name);
  if (err && typeof err.code === 'string' && err.code.startsWith('commander.')) {
    if (err.code === 'commander.help' || err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
      process.exit(err.exitCode || 0); // 无参数帮助 exitCode=1，显式 --help exitCode=0
    }
    process.exit(2);
  }
  // 运行时错误：交由全局 unhandledRejection 处理器输出 JSON 并 exit 1
  Promise.reject(err);
});
