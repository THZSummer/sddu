#!/usr/bin/env node
'use strict';

/**
 * serve-api.cjs - opencode serve HTTP API 封装脚本
 *
 * 零依赖，使用 Node.js 内置模块。
 * 封装 serve 的会话管理、消息发送、轮询、进程管理。
 * LLM 调用本脚本，不需要手动构造 curl 命令。
 *
 * 用法：
 *   node serve-api.cjs run --message "..." [--agent sddu] [--dir .] [--port 4096] [--timeout 600]
 *   node serve-api.cjs start [--port 4096] [--hostname 127.0.0.1] [--dir .]
 *   node serve-api.cjs send --url <url> --message "..." [--agent sddu] [--timeout 600]
 *   node serve-api.cjs stop --port 4096
 */

const { spawn, execSync } = require('child_process');
const http = require('http');

// ─── 参数解析 ───

function parseArgs(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = i + 1 < args.length && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      opts[key] = val;
      if (val !== true) i++;
    }
  }
  return opts;
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

// ─── 任务完成检测 ───
// opencode session 无 status 字段，通过消息数是否增长来判断任务是否完成。
// 连续 2 次轮询消息数不变，且消息数 > 1（有 user + assistant），则认为完成。

async function checkDone(url, sessionId, lastMsgCount) {
  const messages = await httpGet(`${url}/session/${sessionId}/message`, 10000);
  const count = Array.isArray(messages) ? messages.length : 1;
  const done = count > 1 && count === lastMsgCount;
  return { done, count, messages };
}

// ─── HTTP 工具函数 ───

function httpGet(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs || 10000, () => { req.destroy(new Error('HTTP timeout')); });
    req.end();
  });
}

function httpPost(url, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs || 10000, () => { req.destroy(new Error('HTTP timeout')); });
    req.write(payload);
    req.end();
  });
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

  // 等待健康检查通过（最多 30 秒）
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    try {
      const health = await httpGet(`${url}/global/health`, 5000);
      if (health) {
        output({ url, port, pid, status: 'running' });
        return;
      }
    } catch { /* 还没启动 */ }
  }

  output({ error: `serve 启动超时，端口 ${port} 无响应`, pid });
  process.exit(1);
}

// ─── 子命令：send ───

async function cmdSend(opts) {
  const url = getUrl(opts);
  const message = opts.message;
  const agent = opts.agent;
  const timeoutSec = parseInt(opts.timeout || '600');
  const intervalSec = parseInt(opts.interval || '5');

  if (!opts.port || !message) {
    output({ error: '缺少必填参数 --port 和 --message' });
    process.exit(1);
  }

  const start = Date.now();

  // 1. 创建会话
  const session = await httpPost(`${url}/session`, { title: 'serve-api-task' });
  const sessionId = session.id;

  if (!sessionId) {
    output({ error: '创建会话失败', response: session });
    process.exit(1);
  }

  // 2. 异步发送消息
  const msgBody = { parts: [{ type: 'text', text: message }] };
  if (agent) msgBody.agent = agent;

  await httpPost(`${url}/session/${sessionId}/prompt_async`, msgBody);

  // 3. 轮询直到完成（消息数连续 2 次不变则认为完成）
  let done = false;
  let lastMsgCount = 0;
  let messages = [];
  while (!done && (Date.now() - start) < timeoutSec * 1000) {
    await sleep(intervalSec * 1000);
    try {
      const r = await checkDone(url, sessionId, lastMsgCount);
      done = r.done;
      lastMsgCount = r.count;
      messages = r.messages;
      process.stderr.write(`[${elapsed(start)}] messages: ${r.count}${done ? ' (done)' : ''}\n`);
    } catch (e) {
      process.stderr.write(`[${elapsed(start)}] poll error: ${e.message}\n`);
    }
  }

  if (!done) {
    output({ error: '任务超时', sessionId, duration: elapsed(start) });
    process.exit(1);
  }

  output({ sessionId, status: 'completed', messages, duration: elapsed(start) });
}

// ─── 子命令：stop ───

function cmdStop(opts) {
  const port = opts.port;
  if (!port) {
    output({ error: '缺少必填参数 --port' });
    process.exit(1);
  }

  try {
    const pidStr = execSync(`lsof -ti:${port} 2>/dev/null`).toString().trim();
    if (!pidStr) {
      output({ killed: false, port: parseInt(port), reason: '端口无进程' });
      return;
    }

    const pids = pidStr.split('\n');
    for (const p of pids) {
      try { process.kill(parseInt(p), 'SIGTERM'); } catch {}
    }

    // 等待进程退出
    let killed = false;
    for (let i = 0; i < 10; i++) {
      try {
        execSync(`lsof -ti:${port} 2>/dev/null`);
        // 端口仍被占用，同步等待 500ms
        execSync('sleep 0.5');
      } catch {
        killed = true;
        break;
      }
    }

    output({ killed: true, port: parseInt(port), pids: pids.map(Number) });
  } catch {
    output({ killed: false, port: parseInt(port), reason: '端口无进程' });
  }
}

// ─── 子命令：submit（非阻塞提交） ───

async function cmdSubmit(opts) {
  const url = getUrl(opts);
  const message = opts.message;
  const agent = opts.agent;

  if (!message) {
    output({ error: '缺少必填参数 --message' });
    process.exit(1);
  }

  // 创建会话 + 异步发送消息，不等结果
  const session = await httpPost(`${url}/session`, { title: 'serve-api-task' });
  const sessionId = session.id;

  const msgBody = { parts: [{ type: 'text', text: message }] };
  if (agent) msgBody.agent = agent;
  await httpPost(`${url}/session/${sessionId}/prompt_async`, msgBody);

  output({ sessionId, status: 'submitted', url });
}

// ─── 子命令：status（查状态） ───

async function cmdStatus(opts) {
  const url = getUrl(opts);
  const sessionId = opts.session;

  if (!opts.port) {
    output({ error: '缺少必填参数 --port' });
    process.exit(1);
  }

  // 检查服务器健康
  let health;
  try {
    health = await httpGet(`${url}/global/health`, 5000);
  } catch {
    output({ server: 'down', url });
    return;
  }

  // 指定 session 时查询会话详情
  if (sessionId) {
    try {
      const messages = await httpGet(`${url}/session/${sessionId}/message`, 10000);
      const msgCount = Array.isArray(messages) ? messages.length : 1;
      // 通过消息数判断：>1 条消息且最后一条非 user 则认为完成
      const lastMsg = Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1] : null;
      const lastRole = lastMsg ? (lastMsg.role || lastMsg.type || '') : '';
      const done = msgCount > 1 && lastRole !== 'user';
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

  if (!opts.port || !sessionId) {
    output({ error: '缺少必填参数 --port 和 --session' });
    process.exit(1);
  }

  const messages = await httpGet(`${url}/session/${sessionId}/message`, 30000);
  const msgCount = Array.isArray(messages) ? messages.length : 1;
  const lastMsg = Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1] : null;
  const lastRole = lastMsg ? (lastMsg.role || lastMsg.type || '') : '';
  const done = msgCount > 1 && lastRole !== 'user';

  output({ sessionId, status: done ? 'completed' : 'running', messages });
}

// ─── 子命令：abort（中止会话） ───

async function cmdAbort(opts) {
  const url = getUrl(opts);
  const sessionId = opts.session;

  if (!opts.port || !sessionId) {
    output({ error: '缺少必填参数 --port 和 --session' });
    process.exit(1);
  }

  await httpPost(`${url}/session/${sessionId}/abort`, {});
  output({ aborted: true, sessionId });
}

// ─── 子命令：run（start + send + stop 一条龙） ───

async function cmdRun(opts) {
  const message = opts.message;
  if (!message) {
    output({ error: '缺少必填参数 --message' });
    process.exit(1);
  }

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
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    try {
      await httpGet(`${url}/global/health`, 5000);
      ready = true;
      break;
    } catch {}
  }

  if (!ready) {
    try { child.kill('SIGKILL'); } catch {}
    output({ error: 'serve 启动超时' });
    process.exit(1);
  }

  // 2. 创建会话 + 发送消息 + 轮询
  try {
    const session = await httpPost(`${url}/session`, { title: 'serve-api-run' });
    const sessionId = session.id;

    const msgBody = { parts: [{ type: 'text', text: message }] };
    if (agent) msgBody.agent = agent;
    await httpPost(`${url}/session/${sessionId}/prompt_async`, msgBody);

    // 轮询（消息数连续 2 次不变则完成）
    let done = false;
    let lastMsgCount = 0;
    let messages = [];
    while (!done && (Date.now() - start) < timeoutSec * 1000) {
      await sleep(5000);
      try {
        const r = await checkDone(url, sessionId, lastMsgCount);
        done = r.done;
        lastMsgCount = r.count;
        messages = r.messages;
        process.stderr.write(`[${elapsed(start)}] messages: ${r.count}${done ? ' (done)' : ''}\n`);
      } catch (e) {
        process.stderr.write(`[${elapsed(start)}] poll error: ${e.message}\n`);
      }
    }

    output({
      sessionId,
      status: done ? 'completed' : 'timeout',
      messages,
      duration: elapsed(start),
      port,
    });
  } finally {
    // 3. 停止 serve
    try { child.kill('SIGTERM'); } catch {}
  }
}

// ─── 主入口 ───

const args = process.argv.slice(2);
const cmd = args[0];
const opts = parseArgs(args.slice(1));

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
  default:
    process.stderr.write(`Usage: node serve-api.cjs <command> [options]

阻塞模式：
  run    --message "..." [--agent sddu] [--dir .] [--port 4096] [--timeout 600]
         一条龙：启动 serve -> 提交 -> 轮询 -> 取结果 -> 关闭

  send   --port 4096 --message "..." [--agent sddu] [--timeout 600]
         向已运行的 serve 提交任务，阻塞直到完成

非阻塞模式：
  start  [--port 4096] [--hostname 127.0.0.1] [--dir .]
         启动 serve，返回端口 + PID

  submit --port 4096 --message "..." [--agent sddu]
         提交任务，立即返回 sessionId，不等待完成

  status --port 4096 [--session <sid>]
         查 serve 健康状态；指定 --session 时查会话进度

  result --port 4096 --session <sid>
         取已完成的会话消息

  abort  --port 4096 --session <sid>
         中止运行中的会话

  stop   --port 4096
         按端口查找并杀掉 serve 进程
`);
    process.exit(1);
}
