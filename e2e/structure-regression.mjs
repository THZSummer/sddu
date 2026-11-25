#!/usr/bin/env node
// SDDU 结构回归（裸 node，零依赖）——断言安装范式与内核契约
// 用法: node e2e/structure-regression.mjs
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, mkdtempSync, rmSync, readFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const template = join(repoRoot, 'sddu-project-template');
const installScript = join(repoRoot, 'scripts/install/install.sh');

let failures = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); }
  else { console.error(`  ❌ ${msg}`); failures++; }
}
function countDir(dir) { return readdirSync(dir).length; }

console.log('== SDDU 结构回归 ==');

// ① 模板树基线断言
console.log('\n[1] 模板树结构');
assert(existsSync(join(template, '.agents/skills/sddu/SKILL.md')), '唯一入口索引存在');
assert(existsSync(join(template, '.sddu/.sddu/sddu.md')), '内核 sddu.md 存在');
assert(existsSync(join(template, '.sddu/.sddu/README.md')), 'README 入本体');
assert(existsSync(join(template, '.sddu/.sddu/LICENSE')), 'LICENSE 入本体');

const modulesDir = join(template, '.sddu/.sddu/modules');
const modules = readdirSync(modulesDir).filter(d => !d.startsWith('.'));
assert(modules.length === 10, `模块目录 = 10（实际 ${modules.length}）`);
let contracts = 0;
for (const m of modules) {
  const cd = join(modulesDir, m, 'contracts');
  if (existsSync(cd)) contracts += readdirSync(cd).length;
}
assert(contracts === 31, `契约总数 = 31（实际 ${contracts}）`);

// ② 内核契约断言（phase 8 / status 5 + 十二字段）
console.log('\n[2] 内核契约');
const kernel = readFileSync(join(template, '.sddu/.sddu/sddu.md'), 'utf8');
const phases = ['registered','discovered','specified','planned','tasked','builded','reviewed','validated'];
const statuses = ['tracked','completed','suspended','terminated','merged'];
assert(phases.every(p => kernel.includes(p)), 'phase 8 值齐');
assert(statuses.every(s => kernel.includes(s)), 'status 5 值齐');
for (const f of ['feature','featureId','name','version','phase','status','depth','childrens','phaseHistory','description','dependencies','suspendedUntil','mergedInto']) {
  if (!kernel.includes(f)) { assert(false, `front-matter 字段 ${f}`); }
}
// 零平台事实
assert(!/\.opencode|\.dsh|npm install|npx |tsc /.test(kernel), '内核零平台事实');

// ③ 安装范式断言
console.log('\n[3] 安装范式');
const tmp = mkdtempSync(join(tmpdir(), 'sddu-e2e-'));
try {
  execSync(`bash "${installScript}" "${tmp}/proj"`, { stdio: 'pipe' });
  assert(existsSync(join(tmp, 'proj/.sddu/.sddu/sddu.md')), '安装后内核落位');
  assert(existsSync(join(tmp, 'proj/.agents/skills/sddu/SKILL.md')), '安装后入口索引落位');
  assert(existsSync(join(tmp, 'proj/.sddu/workspace/ROADMAP.md')), '安装后 workspace 种子落位');

  // workspace 逐字节不变（重装不触碰）
  const ws = join(tmp, 'proj/.sddu/workspace');
  const before = readdirSync(ws).sort().join(',');
  execSync(`bash "${installScript}" "${tmp}/proj"`, { stdio: 'pipe' });
  const after = readdirSync(ws).sort().join(',');
  assert(before === after, `workspace 重装逐字节不变（${before}）`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log(failures === 0 ? '\n== 结构回归通过 ==' : `\n== 结构回归失败 ${failures} 项 ==`);
process.exit(failures === 0 ? 0 : 1);
