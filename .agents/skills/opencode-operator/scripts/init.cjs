#!/usr/bin/env node
'use strict';

/**
 * init.cjs - opencode-operator 技能初始化脚本
 *
 * 由 install.sh（部署后）与 sddu-skill-sync（拷贝后）自动调用，
 * 帮助技能完成依赖安装等初始化，实现「开箱即用」。
 *
 * 约束：
 *   - 幂等：重复执行无副作用（npm install 有 lock 且满足时近乎零成本）
 *   - 零依赖：仅用 Node 内置模块
 *   - 失败退出码非 0（install 阶段阻塞、sync 阶段警告）
 *
 * 当前职责：安装 Commander 依赖（scripts/serve-api.cjs 的唯一 npm 依赖）。
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = __dirname; // 本脚本所在 scripts/ 目录

// 防御：无 package.json 则无需初始化
if (!fs.existsSync(path.join(dir, 'package.json'))) {
  process.exit(0);
}

// 安装依赖（幂等）
try {
  execSync('npm install --no-audit --no-fund', { cwd: dir, stdio: 'inherit' });
} catch (e) {
  console.error(`[opencode-operator init] 依赖安装失败: ${e.message}`);
  process.exit(1);
}
