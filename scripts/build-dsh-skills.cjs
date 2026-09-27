#!/usr/bin/env node
/**
 * SDDU × dsh Skill 包构建脚本
 *
 * 承载：TASK-008 / FR-001 / FR-003 / FR-007 / NFR-002 / NFR-007（ADR-005 / ADR-006）
 *
 * 输入（只读）：
 *   - src/adapters/dsh/templates/router-command-map.json   （11 Skill 清单 / 入口 / 别名集：唯一来源）
 *   - src/adapters/dsh/templates/skill-header.md.hbs       （包装层）
 *   - src/adapters/dsh/templates/gate-protocol.md.hbs      （门禁协议片段）
 *   - src/adapters/dsh/templates/state-sync-protocol.md.hbs（状态协议片段）
 *   - src/adapters/dsh/contract/dsh-contract-manifest.json （契约依赖点：唯一来源）
 *   - src/templates/agents/sddu-*.md.hbs                   （阶段指令正文：单一来源，只读）
 *
 * 输出：
 *   - dist/dsh/skills/<skill>/SKILL.md    × 11（gitignored 生成物）
 *   - dist/dsh/manifest.json                         （版本锚定）
 *   - dist/dsh/docs/*.md                             （docs/dsh 的拷贝）
 *   - docs/dsh/contract-dependencies.md              （由契约清单渲染的人读版，单一来源）
 *
 * 硬约束：
 *   - 对 src/templates/agents/** 零写操作（只读引用，运行前后校验 mtime+size）；
 *   - 不在 src/adapters/dsh/ 内复制指令正文（只拼接，R-DSH-05）；
 *   - 占位符 `<<...>>` 在**指令正文**中原样保留（由模型运行期填充）；仅包装层占位符被渲染；
 *   - 任何校验失败都以非零退出码收尾，并打印可定位的错误。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// 路径常量
// ---------------------------------------------------------------------------
const REPO_ROOT = path.join(__dirname, '..');
const DSH_ROOT = path.join(REPO_ROOT, 'src', 'adapters', 'dsh');
const DSH_TEMPLATES = path.join(DSH_ROOT, 'templates');
const CONTRACT_MANIFEST_PATH = path.join(DSH_ROOT, 'contract', 'dsh-contract-manifest.json');
const COMMAND_MAP_PATH = path.join(DSH_TEMPLATES, 'router-command-map.json');
const AGENT_TEMPLATES_DIR = path.join(REPO_ROOT, 'src', 'templates', 'agents');
const CORE_SCHEMA_PATH = path.join(REPO_ROOT, 'src', 'state', 'schema-v3.0.0.ts');
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');

const DIST_DSH = path.join(REPO_ROOT, 'dist', 'dsh');
const DIST_SKILLS = path.join(DIST_DSH, 'skills');
const DIST_DOCS = path.join(DIST_DSH, 'docs');
const DIST_MANIFEST_PATH = path.join(DIST_DSH, 'manifest.json');
const DOCS_DSH = path.join(REPO_ROOT, 'docs', 'dsh');
const CONTRACT_DOC_PATH = path.join(DOCS_DSH, 'contract-dependencies.md');

/** 片段标识 → 模板文件名 */
const FRAGMENT_FILES = {
  'gate-protocol': 'gate-protocol.md.hbs',
  'state-sync-protocol': 'state-sync-protocol.md.hbs',
};

const EXPECTED_SKILL_COUNT = 11;
const SNAPSHOT_FALLBACK = '2026-08-14';
const OUTPUT_TEMPLATES_DIR = path.join(REPO_ROOT, 'src', 'templates', 'outputs');
const EXPECTED_TEMPLATE_COUNT = 30;

const warnings = [];

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------
function fail(message, details) {
  console.error(`\n❌ [build-dsh-skills] ${message}`);
  if (Array.isArray(details) && details.length > 0) {
    for (const line of details) {
      console.error(`   - ${line}`);
    }
  }
  process.exit(1);
}

function warn(message) {
  warnings.push(message);
  console.warn(`   ⚠️  ${message}`);
}

function readJson(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} 不存在`, [filePath]);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`${label} 不是合法 JSON`, [filePath, String(error && error.message)]);
  }
  return null;
}

function readText(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} 不存在`, [filePath]);
  }
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * 模板文件名 → 目标 skill 目录映射（ADR-001 模板随 skill 落位）。
 * 返回 { skill, subdir }；无法映射返回 null。
 */
function mapOutputTemplateToSkill(templateBasename) {
  // sddu-docs-*.hbs → sddu-docs（放 templates/output/docs/ 子目录）
  if (templateBasename.startsWith('sddu-docs-')) {
    return { skill: 'sddu-docs', subdir: 'docs' };
  }
  // sddu-review-report.md.hbs → sddu-review
  if (templateBasename.startsWith('sddu-review-report')) {
    return { skill: 'sddu-review', subdir: null };
  }
  // sddu-validate-report.md.hbs → sddu-validate
  if (templateBasename.startsWith('sddu-validate-report')) {
    return { skill: 'sddu-validate', subdir: null };
  }
  // sddu-<name>.md.hbs → sddu-<name>
  const match = templateBasename.match(/^sddu-([a-z-]+)\.md\.hbs$/);
  if (match) {
    return { skill: `sddu-${match[1]}`, subdir: null };
  }
  return null;
}

function sha256File(filePath) {
  if (!fs.existsSync(filePath)) {
    fail('无法计算哈希：文件不存在', [filePath]);
  }
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

/**
 * 渲染**包装层**的 `<<...>>` 占位符。
 * 未在 vars 中登记的占位符原样保留（指令正文根本不经过本函数，故正文占位符天然保留）。
 */
function renderWrapper(template, vars) {
  return template.replace(/<<([A-Za-z0-9_.-]+)>>/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return String(vars[key]);
    }
    return match;
  });
}

/** 剥离 YAML frontmatter，返回 { frontmatter, body } */
function splitFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontmatter: '', body: raw };
  }
  return { frontmatter: match[1], body: raw.slice(match[0].length) };
}

/** 从 frontmatter 中提取简单标量字段（仅 name / description 需要） */
function extractFrontmatterField(frontmatter, field) {
  const re = new RegExp(`^${field}:\\s*(.+)$`, 'm');
  const match = frontmatter.match(re);
  if (!match) return '';
  return match[1].trim().replace(/^["']|["']$/g, '');
}

/** 从核心 schema 源码中提取 VALID_PHASES 数组字面量（构建期枚举一致性校验的权威来源） */
function extractCoreValidPhases() {
  const source = readText(CORE_SCHEMA_PATH, '核心 schema (src/state/schema-v3.0.0.ts)');
  const blockMatch = source.match(
    /export\s+const\s+VALID_PHASES\s*:\s*Phase\[\]\s*=\s*\[([\s\S]*?)\]/,
  );
  if (!blockMatch) {
    fail(
      '无法从核心 schema 提取 VALID_PHASES 数组字面量（构建期枚举一致性校验无法执行）',
      [CORE_SCHEMA_PATH, '请保持 `export const VALID_PHASES: Phase[] = [ ... ];` 的数组字面量写法'],
    );
  }
  const phases = [];
  const tokenRe = /'([^']+)'|"([^"]+)"/g;
  let token;
  while ((token = tokenRe.exec(blockMatch[1])) !== null) {
    phases.push(token[1] || token[2]);
  }
  if (phases.length === 0) {
    fail('核心 schema 的 VALID_PHASES 数组字面量为空', [CORE_SCHEMA_PATH]);
  }
  return phases;
}

/** 对指定目录树生成 mtime+size 指纹（用于「零写操作」断言） */
function fingerprintTree(dir) {
  const result = {};
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const stat = fs.statSync(full);
        result[full] = `${stat.size}:${stat.mtimeMs}`;
      }
    }
  };
  if (fs.existsSync(dir)) {
    walk(dir);
  }
  return result;
}

function assertSameFingerprint(before, after, dir) {
  const changed = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (before[key] !== after[key]) {
      changed.push(path.relative(dir, key) || key);
    }
  }
  if (changed.length > 0) {
    fail('构建脚本对源模板目录产生了写操作（违反 R-DSH-05 只读引用约束）', changed);
  }
}

// ---------------------------------------------------------------------------
// 协议片段 / 结尾声明段
// ---------------------------------------------------------------------------

/**
 * 结尾协议声明段（ADR-005 §2 的「结尾的协议声明段」）。
 * 注意：禁用语口径 —— `硬强制` 只允许出现在 `非硬强制` 否定语境；
 * 不得出现 `强制执行` / `运行时硬拒绝`（EC-003）。
 */
function renderClosingDeclaration(skill, commandMap, snapshot) {
  const lines = [];
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 📌 协议声明段（构建生成，请勿手工编辑本文件）');
  lines.push('');

  if (skill.kind === 'phase') {
    lines.push(
      `本 Skill 由 \`scripts/build-dsh-skills.cjs\` 生成，锚定 dsh 契约快照 **${snapshot}**。`,
    );
    lines.push('');
    lines.push('本文件包含以下结构化协议块（可在会话记录中检索，供人工对账与回放）：');
    lines.push('');
    lines.push('- 门禁协议：`[SDDU-GATE-DENY]` / `[SDDU-GATE-ALLOW]`（见上文「dsh 阶段门禁协议」段）');
    lines.push('- 状态同步协议：`[SDDU-STATE-SYNC]`（见上文「dsh 状态同步与对账协议」段）');
    lines.push('');
    lines.push(
      '> ⚠️ 门禁为模型执行的**显式软引导**（FR-004b），**非硬强制**：dsh 侧无可执行的运行时拒绝点，' +
        '其约束力来自模型对指令的遵从；非法跃迁会输出 `[SDDU-GATE-DENY]` 且不推进。',
    );
    lines.push('');
    lines.push(
      '证据强度边界：`[SDDU-GATE-*]` 与 `[SDDU-STATE-SYNC]` 记录**不构成机器可校验的强断言**；' +
        '状态权威判定始终以 `.sddu/specs-tree-root/<feature>/state.json` 为准。',
    );
  } else if (skill.kind === 'router') {
    lines.push(
      `本 Skill 由 \`scripts/build-dsh-skills.cjs\` 生成，锚定 dsh 契约快照 **${snapshot}**。`,
    );
    lines.push('');
    lines.push('- 非法阶段输入：`[SDDU-ROUTE-REJECT]`（不进入任何阶段、不写任何文件）');
    lines.push('- 门禁与状态落盘**不**由本 Skill 承载：分别由阶段 Skill 的 gate-protocol 与 state-sync-protocol 承载，三者不得互相越权（ADR-002 决策 3）');
    lines.push('');
    lines.push(
      '> 入口实质是「指令约定的入口」：本 Feature **不承诺**平台级命令注册（快照未覆盖该 seam）。' +
        '降级用法见上文「降级用法」段。',
    );
  } else {
    lines.push(
      `本 Skill（独立 Skill）由 \`scripts/build-dsh-skills.cjs\` 生成，锚定 dsh 契约快照 **${snapshot}**。`,
    );
    lines.push('');
    lines.push(
      '本 Skill **不推进** SDDU 阶段状态：不注入 gate-protocol / state-sync-protocol，' +
        '不写 `.sddu/specs-tree-root/<feature>/state.json`。',
    );
  }

  lines.push('');
  lines.push(`> 时效声明：全部 dsh 事实来自 ${snapshot} 单一快照；**未刷新即不可信**，`);
  lines.push('> 刷新流程见 `docs/dsh/upgrade-following.md` 步骤 0~6。');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
function build() {
  console.log('🔨 [build-dsh-skills] 生成 dsh Skill 包（dist/dsh/**）...\n');

  const templatesBefore = fingerprintTree(AGENT_TEMPLATES_DIR);

  // ---- 0. 装载并校验契约清单 ---------------------------------------------
  const contractManifest = readJson(CONTRACT_MANIFEST_PATH, 'dsh 契约清单');
  if (
    !contractManifest ||
    typeof contractManifest.dshContractSnapshot !== 'string' ||
    contractManifest.dshContractSnapshot.length === 0
  ) {
    fail('契约清单缺少顶层 dshContractSnapshot', [CONTRACT_MANIFEST_PATH]);
  }
  if (!Array.isArray(contractManifest.dependencies) || contractManifest.dependencies.length < 7) {
    fail('契约清单 dependencies 缺失或少于 7 条', [CONTRACT_MANIFEST_PATH]);
  }
  const snapshot = contractManifest.dshContractSnapshot;
  const contractHash = sha256File(CONTRACT_MANIFEST_PATH);

  // ---- 1. 核心枚举一致性：schema-v3.0.0.ts 的 VALID_PHASES ⟷ 清单 phaseEnum ----
  const coreValidPhases = extractCoreValidPhases();
  const declaredPhases = Array.isArray(contractManifest.phaseEnum) ? contractManifest.phaseEnum : [];
  if (
    declaredPhases.length !== coreValidPhases.length ||
    coreValidPhases.some((phase, index) => phase !== declaredPhases[index])
  ) {
    fail('契约清单 phaseEnum 与核心 VALID_PHASES 不一致', [
      `核心 VALID_PHASES (${CORE_SCHEMA_PATH}): [${coreValidPhases.join(', ')}]`,
      `清单 phaseEnum (${CONTRACT_MANIFEST_PATH}): [${declaredPhases.join(', ')}]`,
      '修复：同步 dsh-contract-manifest.json 的 phaseEnum（不得反向改核心枚举）',
    ]);
  }
  console.log(`   ✅ 枚举一致性：phaseEnum ⟷ 核心 VALID_PHASES（${coreValidPhases.length} 项）`);

  // ---- 2. 装载命令映射清单（唯一来源）-------------------------------------
  const commandMap = readJson(COMMAND_MAP_PATH, 'router-command-map.json');
  const skills = Array.isArray(commandMap.skills) ? commandMap.skills : [];
  if (skills.length !== EXPECTED_SKILL_COUNT) {
    fail(`router-command-map.json 的 skills 数量必须为 ${EXPECTED_SKILL_COUNT}`, [
      `实际: ${skills.length}`,
    ]);
  }

  const skillNames = skills.map((skill) => skill.name);
  const nameSet = new Set(skillNames);
  if (nameSet.size !== skillNames.length) {
    fail('router-command-map.json 存在重名 Skill', [skillNames.join(', ')]);
  }

  skills.forEach((skill) => {
    const label = `skills[${skill.name}]`;
    if (!skill.sourceTemplate) {
      fail(`${label} 缺少 sourceTemplate`);
    }
    const templatePath = path.join(REPO_ROOT, skill.sourceTemplate);
    if (!fs.existsSync(templatePath)) {
      fail(`${label} 的 sourceTemplate 不存在`, [templatePath]);
    }
    if (skill.phaseTarget !== null && skill.phaseTarget !== undefined) {
      if (!coreValidPhases.includes(skill.phaseTarget)) {
        fail(`${label} 的 phaseTarget 非法（不在核心 VALID_PHASES 中）`, [
          `phaseTarget = ${JSON.stringify(skill.phaseTarget)}`,
          `VALID_PHASES = [${coreValidPhases.join(', ')}]`,
        ]);
      }
    }
    const fragments = Array.isArray(skill.protocolFragments) ? skill.protocolFragments : [];
    fragments.forEach((fragment) => {
      const known =
        Object.prototype.hasOwnProperty.call(FRAGMENT_FILES, fragment) ||
        fragment === 'router-entry-protocol';
      if (!known) {
        fail(`${label} 引用了未知协议片段: '${fragment}'`);
      }
    });
  });

  // entries 与 phaseAliases 的一致性
  const entries = Array.isArray(commandMap.entries) ? commandMap.entries : [];
  entries.forEach((entry, index) => {
    if (!nameSet.has(entry.targetSkill)) {
      fail(`entries[${index}].targetSkill 未在 skills 中定义: '${entry.targetSkill}'`);
    }
  });
  const aliases = commandMap.phaseAliases && typeof commandMap.phaseAliases === 'object'
    ? commandMap.phaseAliases
    : {};
  Object.entries(aliases).forEach(([alias, target]) => {
    if (!coreValidPhases.includes(target)) {
      fail(`phaseAliases['${alias}'] 的目标值不在核心 VALID_PHASES 中: '${target}'`);
    }
  });
  console.log(
    `   ✅ 命令映射校验：${skills.length} 个 Skill / ${entries.length} 条入口 / ${Object.keys(aliases).length} 个别名`,
  );

  // ---- 3. 装载包装层与协议片段 -------------------------------------------
  const headerTemplate = readText(
    path.join(DSH_TEMPLATES, 'skill-header.md.hbs'),
    'skill-header 模板',
  );
  const fragmentTemplates = {};
  for (const [id, fileName] of Object.entries(FRAGMENT_FILES)) {
    fragmentTemplates[id] = readText(path.join(DSH_TEMPLATES, fileName), `协议片段 ${id}`);
  }
  const routerProtocol = commandMap.routerEntryProtocol || {};

  // ---- 4. 重建输出目录（保证幂等：无陈旧 Skill 目录残留）-----------------
  fs.rmSync(DIST_DSH, { recursive: true, force: true });
  fs.mkdirSync(DIST_SKILLS, { recursive: true });

  const pkg = readJson(PACKAGE_JSON_PATH, 'package.json');
  const sdduVersion = pkg.version;

  // ---- 5. 渲染 11 个 SKILL.md --------------------------------------------
  const renderedSkills = [];
  for (const skill of skills) {
    const templateRaw = readText(path.join(REPO_ROOT, skill.sourceTemplate), `${skill.name} 源模板`);
    const { frontmatter, body } = splitFrontmatter(templateRaw);
    if (!body || body.trim().length === 0) {
      fail(`${skill.name} 的源模板指令正文为空`, [skill.sourceTemplate]);
    }

    const sourceDescription = extractFrontmatterField(frontmatter, 'description');
    const skillDescription =
      skill.description || sourceDescription || `SDDU ${skill.name}（dsh Skill）`;

    const header = renderWrapper(headerTemplate, {
      skillName: skill.name,
      skillDescription,
      sdduVersion,
      contractSnapshot: snapshot,
      sourceTemplate: path.basename(skill.sourceTemplate),
    });

    const segments = [header];
    const fragments = Array.isArray(skill.protocolFragments) ? skill.protocolFragments : [];
    const bodyMarker = `<!-- ===== BEGIN SOURCE INSTRUCTION BODY (${skill.sourceTemplate}) — 单一来源，占位符原样保留 ===== -->`;

    // ADR-005 §2 顺序：skill-header → 源指令正文（占位符原样保留）→ 协议片段 → 结尾协议声明段
    segments.push(bodyMarker);
    segments.push(body.endsWith('\n') ? body : `${body}\n`);
    segments.push(
      `<!-- ===== END SOURCE INSTRUCTION BODY (${skill.sourceTemplate}) ===== -->`,
    );

    for (const fragment of fragments) {
      if (fragment === 'router-entry-protocol') {
        segments.push('\n---\n');
        segments.push(routerProtocol.entryRecognition || '');
        segments.push('\n---\n');
        segments.push(routerProtocol.rejectFormat || '');
        segments.push('\n---\n');
        segments.push(routerProtocol.fallback || '');
        segments.push('\n');
      } else {
        segments.push('\n---\n');
        segments.push(fragmentTemplates[fragment]);
        segments.push('\n');
      }
    }

    segments.push(renderClosingDeclaration(skill, commandMap, snapshot));

    const output = segments.join('\n');
    const skillDir = path.join(DIST_SKILLS, skill.name);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), output, 'utf8');

    // 生成物自检：非空 + 关键协议标识
    const written = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
    if (written.trim().length === 0) {
      fail(`${skill.name} 的 SKILL.md 生成后为空`);
    }
    if (skill.kind === 'phase') {
      for (const token of ['[SDDU-GATE-DENY]', '[SDDU-GATE-ALLOW]', '[SDDU-STATE-SYNC]']) {
        if (!written.includes(token)) {
          fail(`${skill.name} 的 SKILL.md 缺少协议标识 ${token}`);
        }
      }
    }
    if (skill.kind === 'router' && !written.includes('[SDDU-ROUTE-REJECT]')) {
      fail(`${skill.name} 的 SKILL.md 缺少 [SDDU-ROUTE-REJECT] 段`);
    }

    renderedSkills.push(skill.name);
    console.log(`   ✅ dist/dsh/skills/${skill.name}/SKILL.md`);
  }

  // ---- 5.5 分发输出模板（ADR-001 模板随 skill 落位）------------------------
  const outputTemplateFiles = fs
    .readdirSync(OUTPUT_TEMPLATES_DIR, { withFileTypes: true })
    .flatMap((entry) => {
      const file = path.join(OUTPUT_TEMPLATES_DIR, entry.name);
      if (entry.isFile() && entry.name.endsWith('.hbs')) return [entry.name];
      if (entry.isDirectory()) {
        return fs
          .readdirSync(file)
          .filter((n) => n.endsWith('.hbs'))
          .map((n) => `${entry.name}/${n}`);
      }
      return [];
    });

  let distributedTemplateCount = 0;
  for (const rel of outputTemplateFiles) {
    const basename = path.basename(rel);
    const mapping = mapOutputTemplateToSkill(basename);
    if (!mapping) {
      warn(`无法映射模板到 skill，已跳过: ${rel}`);
      continue;
    }
    const sub = mapping.subdir ? mapping.subdir : '';
    const destDir = path.join(DIST_SKILLS, mapping.skill, 'templates', 'output', sub);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(path.join(OUTPUT_TEMPLATES_DIR, rel), path.join(destDir, basename));
    distributedTemplateCount++;
  }

  if (distributedTemplateCount !== EXPECTED_TEMPLATE_COUNT) {
    fail(`输出模板分发数量不符：期望 ${EXPECTED_TEMPLATE_COUNT} 个，实际 ${distributedTemplateCount} 个`);
  }
  console.log(`   ✅ 输出模板分发：${distributedTemplateCount} 个模板随 skill 落位`);

  // ---- 6. 生成物目录完整性校验 -------------------------------------------
  const generatedDirs = fs
    .readdirSync(DIST_SKILLS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  if (generatedDirs.length !== EXPECTED_SKILL_COUNT) {
    fail(`dist/dsh/skills 目录数必须为 ${EXPECTED_SKILL_COUNT}`, [
      `实际: ${generatedDirs.length} [${generatedDirs.join(', ')}]`,
    ]);
  }
  for (const name of skillNames) {
    const skillMd = path.join(DIST_SKILLS, name, 'SKILL.md');
    if (!fs.existsSync(skillMd) || fs.statSync(skillMd).size === 0) {
      fail(`生成物缺失或为空: ${skillMd}`);
    }
  }
  console.log(`   ✅ 生成物完整性：${generatedDirs.length} 个 Skill 目录，SKILL.md 均非空`);

  // ---- 7. dist/dsh/manifest.json（版本锚定，ADR-006 决策 2）-------------
  const manifest = {
    sdduVersion,
    dshContractSnapshot: snapshot,
    contractManifestHash: contractHash,
    contractManifestPath: path.relative(REPO_ROOT, CONTRACT_MANIFEST_PATH),
    generator: 'scripts/build-dsh-skills.cjs',
    generatedAt: new Date().toISOString(),
    skillCount: renderedSkills.length,
    skills: renderedSkills,
  };
  fs.writeFileSync(DIST_MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`   ✅ dist/dsh/manifest.json（hash=${contractHash.slice(0, 12)}…）`);

  // ---- 8. 由清单渲染人读版 docs/dsh/contract-dependencies.md（单一来源）--
  fs.mkdirSync(DOCS_DSH, { recursive: true });
  fs.writeFileSync(
    CONTRACT_DOC_PATH,
    renderContractDoc(contractManifest, contractHash, sdduVersion),
    'utf8',
  );
  console.log('   ✅ docs/dsh/contract-dependencies.md（由清单渲染）');

  // ---- 9. 拷贝 docs/dsh/*.md → dist/dsh/docs/ ----------------------------
  fs.mkdirSync(DIST_DOCS, { recursive: true });
  let copiedDocs = 0;
  const docEntries = fs.existsSync(DOCS_DSH)
    ? fs.readdirSync(DOCS_DSH, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.md'))
    : [];
  for (const entry of docEntries) {
    fs.copyFileSync(path.join(DOCS_DSH, entry.name), path.join(DIST_DOCS, entry.name));
    copiedDocs += 1;
  }
  const expectedDocs = ['README.md', 'dual-platform-diff.md', 'positioning.md', 'upgrade-following.md', 'verification.md'];
  const missingDocs = expectedDocs.filter((name) => !fs.existsSync(path.join(DOCS_DSH, name)));
  if (missingDocs.length > 0) {
    warn(`以下 docs/dsh 文档尚未产出，dist/dsh/docs/ 暂缺（不视为构建失败）: ${missingDocs.join(', ')}`);
  }
  console.log(`   ✅ dist/dsh/docs/（拷贝 ${copiedDocs} 个文档）`);

  // ---- 10. 零写操作断言（src/templates/agents/**）------------------------
  const templatesAfter = fingerprintTree(AGENT_TEMPLATES_DIR);
  assertSameFingerprint(templatesBefore, templatesAfter, AGENT_TEMPLATES_DIR);
  console.log('   ✅ 零写操作断言：src/templates/agents/** 未被修改');

  // ---- 完成 --------------------------------------------------------------
  console.log('\n🎉 [build-dsh-skills] 构建完成');
  console.log(`   产出: dist/dsh/skills/ ×${renderedSkills.length}、dist/dsh/manifest.json、dist/dsh/docs/`);
  console.log(`   锚定: sdduVersion=${sdduVersion}, dshContractSnapshot=${snapshot}`);
  if (warnings.length > 0) {
    console.log(`   ⚠️  ${warnings.length} 条 warning（见上）`);
  }
}

// ---------------------------------------------------------------------------
// 人读版契约清单（从清单单一来源渲染，禁止手工维护第二份）
// ---------------------------------------------------------------------------
function renderContractDoc(contractManifest, contractHash, sdduVersion) {
  const snapshot = contractManifest.dshContractSnapshot;
  const deps = contractManifest.dependencies;
  const lines = [];

  lines.push('# dsh 契约依赖点（人读版）');
  lines.push('');
  lines.push('> **文档定位**: dsh 适配的契约依赖点清单 —— 升级跟随与破坏点定位的对照表');
  lines.push('> **生成方式**: ⚙️ 本文件由 `scripts/build-dsh-skills.cjs` 从 ');
  lines.push('> `src/adapters/dsh/contract/dsh-contract-manifest.json` **自动渲染**，**禁止手工编辑**（ADR-006）。');
  lines.push('> **权威来源**: `src/adapters/dsh/contract/dsh-contract-manifest.json`（唯一来源）');
  lines.push('> **契约快照**: ' + snapshot + '（**截至该日期的事实**）');
  lines.push(`> **契约清单哈希**: \`${contractHash}\``);
  lines.push(`> **SDDU 版本**: ${sdduVersion}`);
  lines.push(`> **生成时间**: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## ⚠️ 时效声明（NFR-007）');
  lines.push('');
  lines.push(
    '全部 dsh 事实来自 **' + snapshot + ' 单一调研快照**；在按 ' +
      '[`upgrade-following.md`](./upgrade-following.md) **步骤 0 刷新契约**之前，**本清单不得被当作当前 dsh 事实**。',
  );
  lines.push('');
  lines.push(
    '**未刷新即不可信**：跳过步骤 0 / 步骤 5 会让 `snapshotDate` 失真，清单反而产生**虚假确定性**。',
  );
  lines.push('');
  lines.push(
    '`command-registration` / `profile-bundle` / `guard-pipeline` 三类为**快照未覆盖或演进点**，' +
      '其 `observableCheck` 只能写「需刷新后补全」，属**已知空白** —— 不得在文档中把空白表述为已确认。',
  );
  lines.push('');
  lines.push('## 依赖点总览');
  lines.push('');
  lines.push(`共 **${deps.length}** 条依赖点，覆盖 ${new Set(deps.map((d) => d.area)).size} 个 area。`);
  lines.push('');
  lines.push('| # | id | area | 覆盖状态 | 快照日期 |');
  lines.push('|:--:|----|------|---------|---------|');
  deps.forEach((dep, index) => {
    lines.push(
      `| ${index + 1} | \`${dep.id}\` | \`${dep.area}\` | ${dep.coverageStatus || 'covered'}${dep.coverageNote ? `（${dep.coverageNote}）` : ''} | ${dep.snapshotDate} |`,
    );
  });
  lines.push('');

  deps.forEach((dep, index) => {
    lines.push(`## ${index + 1}. \`${dep.id}\``);
    lines.push('');
    lines.push(`- **area**: \`${dep.area}\``);
    lines.push(`- **快照日期**: ${dep.snapshotDate}`);
    if (dep.coverageStatus) {
      lines.push(`- **覆盖状态**: ${dep.coverageStatus}${dep.coverageNote ? ` —— ${dep.coverageNote}` : ''}`);
    }
    lines.push(`- **事实（快照）**: ${dep.fact}`);
    lines.push(`- **假设**: ${dep.assumption}`);
    lines.push(`- **可观测校验 (\`observableCheck\`)**: ${dep.observableCheck}`);
    lines.push(`- **破坏影响 (\`breakImpact\`)**: ${dep.breakImpact}`);
    lines.push(`- **修复提示 (\`fixHint\`)**: ${dep.fixHint}`);
    lines.push('');
  });

  lines.push('## 维护规则');
  lines.push('');
  lines.push('1. 修改契约事实 → 只改 `dsh-contract-manifest.json`，然后重跑 `npm run build:dsh` 重新生成本文件；');
  lines.push('2. 刷新 dsh 契约后 → 修改 `fact` / `assumption`，并 **bump `snapshotDate`** 为本次刷新日期（ADR-006 步骤 5）；');
  lines.push('3. `phaseEnum` 必须与核心 `src/state/schema-v3.0.0.ts` 的 `VALID_PHASES` 深度相等，构建期强制校验；');
  lines.push('4. 哈希变化即代表契约基线变化，应同步复核 `docs/dsh/dual-platform-diff.md` 与 ADR 修订说明。');
  lines.push('');

  return lines.join('\n');
}

build();
