/**
 * dsh Skill 包生成物静态断言（TASK-009）
 *
 * 承载需求：FR-001、FR-002、FR-004、FR-005、FR-007、FR-009、NFR-002、NFR-004
 *           （ADR-003 / ADR-004 / ADR-005 / ADR-006 / R-DSH-01~05）
 *
 * ⚠️ 性质边界（NG-002）：本套件只对**生成物做静态结构断言**，
 *    **不冒充实机验证** —— dsh 无 CLI，端到端行为（V1~V5）由用户配合人工观测，
 *    方法与场景见 docs/dsh/verification.md。本文件不依赖网络、不依赖 dsh 命令。
 *
 * 生成物前置：`beforeAll` 若 dist/dsh/skills 缺失或数量不符，则按需执行
 * `node scripts/build-dsh-skills.cjs`（幂等，plan 缺口 4 的处置方案）。
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync, spawnSync } from 'child_process';

// 相对 import（与既有测试一致）：避免依赖 tsconfig paths，保持 tsc/jest 双运行时一致。
// 注意：`@dsh/*` 已在 jest.config.ts 的 moduleNameMapper 中登记（与 @opencode 对称），
// 但其 TS 类型解析需要 tsconfig paths（本 Feature 未改 tsconfig，见 build 报告的偏差登记）。
import {
  CONTRACT_SNAPSHOT,
  DEFAULT_RANK,
  DshContractError,
  EXPECTED_SKILL_COUNT,
  PROJECT_SKILLS_DIR_REL,
  ROUTER_SKILL_NAME,
  SKILL_NAMES,
  SKILL_PREFIX,
  USER_RANK,
  computeContractManifestHash,
  isSdduSkillName,
  validateContractManifest,
} from '../../../../adapters/dsh';
import {
  CONTRACT_AREAS,
  CONTRACT_REQUIRED_FIELDS,
  loadContractManifest,
} from '../../../../adapters/dsh/contract';
import { VALID_PHASES } from '../../../../state/schema-v3.0.0';

// ============================================================================
// 路径与工具
// ============================================================================

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const DSH_ASSETS_DIR = path.join(REPO_ROOT, 'src', 'adapters', 'dsh');
const COMMAND_MAP_PATH = path.join(DSH_ASSETS_DIR, 'templates', 'router-command-map.json');
const CONTRACT_MANIFEST_PATH = path.join(DSH_ASSETS_DIR, 'contract', 'dsh-contract-manifest.json');
const DIST_DSH = path.join(REPO_ROOT, 'dist', 'dsh');
const DIST_SKILLS = path.join(DIST_DSH, 'skills');
const DIST_MANIFEST_PATH = path.join(DIST_DSH, 'manifest.json');
const CONTRACT_DOC_PATH = path.join(REPO_ROOT, 'docs', 'dsh', 'contract-dependencies.md');

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listSkillDirs(): string[] {
  return fs
    .readdirSync(DIST_SKILLS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function readSkillMd(skill: string): string {
  return fs.readFileSync(path.join(DIST_SKILLS, skill, 'SKILL.md'), 'utf8');
}

/** 返回阶段 Skill 名（kind === 'phase'） */
function phaseSkillNames(): string[] {
  return (readJson(COMMAND_MAP_PATH).skills as Array<{ name: string; kind: string }>)
    .filter((skill) => skill.kind === 'phase')
    .map((skill) => skill.name);
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

/** 递归收集目录下的文件（可排除若干目录名） */
function walkFiles(dir: string, excludeDirNames: Set<string>): string[] {
  const result: string[] = [];
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (excludeDirNames.has(entry.name)) continue;
        walk(path.join(current, entry.name));
      } else if (entry.isFile()) {
        result.push(path.join(current, entry.name));
      }
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return result;
}

/** 收集全部「生成物」文本（dist/dsh 全量 + 生成的人读版契约清单） */
function collectGeneratedArtifacts(): Array<{ file: string; content: string }> {
  const artifacts: Array<{ file: string; content: string }> = [];
  for (const file of walkFiles(DIST_DSH, new Set())) {
    artifacts.push({ file: path.relative(REPO_ROOT, file), content: fs.readFileSync(file, 'utf8') });
  }
  if (fs.existsSync(CONTRACT_DOC_PATH)) {
    artifacts.push({
      file: path.relative(REPO_ROOT, CONTRACT_DOC_PATH),
      content: fs.readFileSync(CONTRACT_DOC_PATH, 'utf8'),
    });
  }
  return artifacts;
}

/** 从源模板中抽取指令正文 */
function sourceBody(sourceTemplate: string): string {
  const raw = fs.readFileSync(path.join(REPO_ROOT, sourceTemplate), 'utf8');
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? raw.slice(match[0].length) : raw;
}

/**
 * 构造隔离的构建夹具（复制构建脚本 + 最小只读输入到临时目录），
 * 用于**动态**验证构建脚本的错误路径（非法 phaseTarget → 非零退出）与
 * 容错路径（缺文档记 warning 不失败）。夹具用完即删，不触碰仓库源。
 *
 * 说明：`scripts/build-dsh-skills.cjs` 以 `__dirname/..` 定位 REPO_ROOT，
 * 因此把脚本复制到 `<fixture>/scripts/` 即可让整套输入解析落在夹具内。
 */
function makeBuildFixture(options: { withDocs?: boolean } = {}): string {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'sddu-dsh-build-'));
  fs.mkdirSync(path.join(fixture, 'scripts'), { recursive: true });
  fs.copyFileSync(
    path.join(REPO_ROOT, 'scripts', 'build-dsh-skills.cjs'),
    path.join(fixture, 'scripts', 'build-dsh-skills.cjs'),
  );
  fs.cpSync(
    path.join(REPO_ROOT, 'src', 'adapters', 'dsh'),
    path.join(fixture, 'src', 'adapters', 'dsh'),
    { recursive: true },
  );
  fs.cpSync(
    path.join(REPO_ROOT, 'src', 'templates', 'agents'),
    path.join(fixture, 'src', 'templates', 'agents'),
    { recursive: true },
  );
  fs.mkdirSync(path.join(fixture, 'src', 'state'), { recursive: true });
  fs.copyFileSync(
    path.join(REPO_ROOT, 'src', 'state', 'schema-v3.0.0.ts'),
    path.join(fixture, 'src', 'state', 'schema-v3.0.0.ts'),
  );
  fs.copyFileSync(path.join(REPO_ROOT, 'package.json'), path.join(fixture, 'package.json'));
  if (options.withDocs !== false) {
    fs.cpSync(path.join(REPO_ROOT, 'docs', 'dsh'), path.join(fixture, 'docs', 'dsh'), {
      recursive: true,
    });
  }
  return fixture;
}

/** 在夹具内运行构建脚本，返回 { status, output }（成功/失败都捕获 stdout+stderr，不抛出） */
function runBuildScript(fixture: string): { status: number; output: string } {
  const result = spawnSync(
    process.execPath,
    [path.join(fixture, 'scripts', 'build-dsh-skills.cjs')],
    { cwd: fixture, encoding: 'utf8' },
  );
  return {
    status: result.status ?? -1,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

beforeAll(() => {
  const needsBuild =
    !fs.existsSync(DIST_SKILLS) ||
    fs.readdirSync(DIST_SKILLS).filter((name) => fs.statSync(path.join(DIST_SKILLS, name)).isDirectory())
      .length !== EXPECTED_SKILL_COUNT;
  if (needsBuild) {
    execFileSync(
      process.execPath,
      [path.join(REPO_ROOT, 'scripts', 'build-dsh-skills.cjs')],
      { cwd: REPO_ROOT, stdio: 'pipe' },
    );
  }
});

// ============================================================================
// 1. Skill 目录齐全性、命名前缀与非空（FR-001① / EC-007）
// ============================================================================
describe('1. Skill 目录齐全性与命名（FR-001① / EC-007）', () => {
  it('dist/dsh/skills 恰有 EXPECTED_SKILL_COUNT 个 Skill 目录', () => {
    expect(listSkillDirs()).toHaveLength(EXPECTED_SKILL_COUNT);
  });

  it('全部目录名带 sddu 前缀且与 SKILL_NAMES 一致（含无连字符的路由 Skill）', () => {
    const dirs = listSkillDirs();
    expect(dirs).toEqual([...SKILL_NAMES].sort());
    for (const dir of dirs) {
      expect(isSdduSkillName(dir)).toBe(true);
      // 路由 Skill 无连字符，其余统一 sddu- 前缀
      expect(dir === ROUTER_SKILL_NAME || dir.startsWith(SKILL_PREFIX)).toBe(true);
    }
  });

  it('每个 Skill 目录内 SKILL.md 存在且非空', () => {
    for (const dir of listSkillDirs()) {
      const skillMd = path.join(DIST_SKILLS, dir, 'SKILL.md');
      expect(fs.existsSync(skillMd)).toBe(true);
      expect(fs.statSync(skillMd).size).toBeGreaterThan(0);
    }
  });

  it('每个 SKILL.md 的 frontmatter 含 name 与来源标识', () => {
    for (const dir of listSkillDirs()) {
      const content = readSkillMd(dir);
      expect(content.startsWith('---')).toBe(true);
      expect(content).toContain(`name: ${dir}`);
      expect(content).toContain('metadata.sddu-source: adapters/dsh@');
    }
  });
});

// ============================================================================
// 2. 入口清单完整性与防漂移（FR-002③ / plan 缺口 2）
// ============================================================================
describe('2. 入口清单完整性与防漂移（FR-002③）', () => {
  it('router-command-map.json 的 skills 与生成目录一一对应', () => {
    const map = readJson(COMMAND_MAP_PATH);
    expect(map.skills).toHaveLength(EXPECTED_SKILL_COUNT);
    const mapNames = (map.skills as Array<{ name: string }>).map((s) => s.name).sort();
    expect(mapNames).toEqual(listSkillDirs());
  });

  it('entries 覆盖 11 条入口，targetSkill 均存在且字段齐备', () => {
    const map = readJson(COMMAND_MAP_PATH);
    const names = new Set((map.skills as Array<{ name: string }>).map((s) => s.name));
    expect(map.entries).toHaveLength(11);
    for (const entry of map.entries) {
      expect(names.has(entry.targetSkill)).toBe(true);
      expect(typeof entry.entry).toBe('string');
      expect(typeof entry.prerequisite).toBe('string');
      expect(typeof entry.artifact).toBe('string');
      expect(entry.entry.length).toBeGreaterThan(0);
    }
  });

  it('phaseAliases 的目标值 ⊆ 核心 VALID_PHASES', () => {
    const map = readJson(COMMAND_MAP_PATH);
    const targets = Object.values(map.phaseAliases as Record<string, string>);
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(VALID_PHASES).toContain(target);
    }
  });

  it('`_note` 已登记别名集漂移风险（R-DSH-03 导致无编译期等价保障）', () => {
    const map = readJson(COMMAND_MAP_PATH);
    expect(typeof map._note).toBe('string');
    expect(map._note).toContain('漂移');
    expect(map._note).toContain('legacyStatusToPhase');
    expect(map._note).toContain('VALID_PHASES');
  });

  it('src/adapters/dsh/index.ts 的 SKILL_NAMES 与清单一致（防漂移）', () => {
    const map = readJson(COMMAND_MAP_PATH);
    const mapNames = (map.skills as Array<{ name: string }>).map((s) => s.name);
    expect([...SKILL_NAMES]).toEqual(mapNames);
  });

  it('docs/dsh/README.md 的入口清单与 router-command-map.json 一致（NFR-002 防漂移）', () => {
    const readmePath = path.join(REPO_ROOT, 'docs', 'dsh', 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);
    const readme = fs.readFileSync(readmePath, 'utf8');
    const map = readJson(COMMAND_MAP_PATH);
    for (const entry of map.entries as Array<{ entry: string }>) {
      expect({ entry: entry.entry, present: readme.includes(entry.entry) }).toEqual({
        entry: entry.entry,
        present: true,
      });
    }
  });

  it('jest 别名 @dsh 可解析（与 @opencode 对称的 moduleNameMapper）', () => {
    // 通过 require 走 jest 的 moduleNameMapper（TS 类型解析需 tsconfig paths，本 Feature 不动 tsconfig）
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dsh = require('@dsh/index');
    expect(dsh.SKILL_PREFIX).toBe(SKILL_PREFIX);
    expect(dsh.DEFAULT_RANK).toBe(DEFAULT_RANK);
  });
});

// ============================================================================
// 3. 协议片段存在性（FR-004② / FR-005 / ADR-003 / ADR-004）
// ============================================================================
describe('3. 协议片段存在性（ADR-003 / ADR-004）', () => {
  it('每个阶段 SKILL.md 含三段协议标识与降级声明', () => {
    const phases = phaseSkillNames();
    expect(phases.length).toBe(7);
    for (const skill of phases) {
      const content = readSkillMd(skill);
      expect(content).toContain('[SDDU-GATE-DENY]');
      expect(content).toContain('[SDDU-GATE-ALLOW]');
      expect(content).toContain('[SDDU-STATE-SYNC]');
      expect(content).toContain('已知降级');
      expect(content).toContain('非硬强制');
      expect(content).toContain('FR-004b');
    }
  });

  it('门禁块含 action 字段（拒绝 none / 放行 proceed）', () => {
    for (const skill of phaseSkillNames()) {
      const content = readSkillMd(skill);
      expect(content).toContain('"action":"none"');
      expect(content).toContain('"action":"proceed"');
      expect(content).toContain('NEXT_PHASE');
      expect(content).toContain('PHASE_ORDER');
    }
  });

  it('状态同步块含固定字段（phaseHistoryAdded / artifact / ts）与权威裁定', () => {
    for (const skill of phaseSkillNames()) {
      const content = readSkillMd(skill);
      expect(content).toContain('phaseHistoryAdded');
      expect(content).toContain('"artifact"');
      expect(content).toContain('"ts"');
      expect(content).toContain('唯一权威');
      expect(content).toContain('对账');
      expect(content).toContain('phaseHistory');
    }
  });

  it('路由 Skill 含入口识别 / 拒绝格式 / 降级用法三段', () => {
    const content = readSkillMd(ROUTER_SKILL_NAME);
    expect(content).toContain('[SDDU-ROUTE-REJECT]');
    expect(content).toContain('不进入任何阶段');
    expect(content).toContain('降级用法');
    expect(content).toContain('入口识别');
  });
});

// ============================================================================
// 4. 禁用语断言（EC-003 / ADR-003 §2 / plan 缺口 3）
// ============================================================================
describe('4. 禁用语断言（EC-003）', () => {
  it('「硬强制」只允许出现在「非硬强制」否定语境', () => {
    for (const { file, content } of collectGeneratedArtifacts()) {
      const bare = countOccurrences(content, '硬强制');
      const negated = countOccurrences(content, '非硬强制');
      expect({ file, bare, negated }).toEqual({ file, bare: negated, negated });
    }
  });

  it('不出现「强制执行」与「运行时硬拒绝」', () => {
    for (const { file, content } of collectGeneratedArtifacts()) {
      expect({ file, hit: content.includes('强制执行') }).toEqual({ file, hit: false });
      expect({ file, hit: content.includes('运行时硬拒绝') }).toEqual({ file, hit: false });
    }
  });
});

// ============================================================================
// 5. 单一来源（R-DSH-05 / NFR-002）
// ============================================================================
describe('5. 指令单一来源（R-DSH-05 / NFR-002）', () => {
  it('每个生成物含其 sourceTemplate 正文的抽样特征串', () => {
    const skills = readJson(COMMAND_MAP_PATH).skills as Array<{ name: string; sourceTemplate: string }>;
    for (const skill of skills) {
      const body = sourceBody(skill.sourceTemplate);
      const heading = body.split(/\r?\n/).find((line) => line.startsWith('#'));
      expect(heading).toBeTruthy();
      expect(readSkillMd(skill.name)).toContain(heading as string);
    }
  });

  it('生成物含源指令正文的 BEGIN/END 边界标记（拼接而非改写）', () => {
    for (const skill of listSkillDirs()) {
      const content = readSkillMd(skill);
      expect(content).toContain('BEGIN SOURCE INSTRUCTION BODY');
      expect(content).toContain('END SOURCE INSTRUCTION BODY');
    }
  });

  it('src/adapters/dsh 内不存在阶段指令正文副本', () => {
    const skills = readJson(COMMAND_MAP_PATH).skills as Array<{ sourceTemplate: string }>;
    const headings = skills
      .map((skill) => sourceBody(skill.sourceTemplate).split(/\r?\n/).find((line) => line.startsWith('#')))
      .filter((line): line is string => Boolean(line));

    const assetFiles = walkFiles(DSH_ASSETS_DIR, new Set());
    for (const file of assetFiles) {
      const content = fs.readFileSync(file, 'utf8');
      for (const heading of headings) {
        expect({ file: path.relative(REPO_ROOT, file), heading, hit: content.includes(heading) }).toEqual({
          file: path.relative(REPO_ROOT, file),
          heading,
          hit: false,
        });
      }
    }
  });
});

// ============================================================================
// 6. 版本锚定（ADR-006；plan 缺口 1：清单结构与枚举一致性）
// ============================================================================
describe('6. 版本锚定与契约清单（ADR-006）', () => {
  it('manifest.json 锚定 sdduVersion / 快照 / 哈希 / 11 个 Skill', () => {
    const manifest = readJson(DIST_MANIFEST_PATH);
    const pkg = readJson(path.join(REPO_ROOT, 'package.json'));
    expect(manifest.sdduVersion).toBe(pkg.version);
    expect(manifest.dshContractSnapshot).toBe(CONTRACT_SNAPSHOT);
    expect(manifest.skills).toHaveLength(EXPECTED_SKILL_COUNT);
    expect([...manifest.skills].sort()).toEqual(listSkillDirs());
  });

  it('contractManifestHash 等于契约清单文件字节的 sha256', () => {
    const manifest = readJson(DIST_MANIFEST_PATH);
    const expected = computeContractManifestHash(CONTRACT_MANIFEST_PATH);
    expect(manifest.contractManifestHash).toBe(expected);
    expect(manifest.contractManifestHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('每个 SKILL.md 携带 metadata.sddu-contract-snapshot', () => {
    for (const dir of listSkillDirs()) {
      expect(readSkillMd(dir)).toContain(`metadata.sddu-contract-snapshot: ${CONTRACT_SNAPSHOT}`);
    }
  });

  it('契约清单结构完备：phaseEnum == VALID_PHASES 且 8 字段 / 7 area 全覆盖', () => {
    const manifest = loadContractManifest(CONTRACT_MANIFEST_PATH);
    expect(manifest.phaseEnum).toEqual([...VALID_PHASES]);
    expect(manifest.dependencies.length).toBeGreaterThanOrEqual(7);
    const areas = new Set(manifest.dependencies.map((dep) => dep.area));
    for (const area of CONTRACT_AREAS) {
      expect(areas.has(area)).toBe(true);
    }
    for (const dep of manifest.dependencies) {
      for (const field of CONTRACT_REQUIRED_FIELDS) {
        expect(typeof (dep as unknown as Record<string, unknown>)[field]).toBe('string');
      }
      expect(dep.snapshotDate).toBe(CONTRACT_SNAPSHOT);
    }
  });

  it('落位常量与 ADR-001 一致（rank 100/400 + .dsh/skills）', () => {
    expect(DEFAULT_RANK).toBe(100);
    expect(USER_RANK).toBe(400);
    expect(PROJECT_SKILLS_DIR_REL).toBe('.dsh/skills');
  });
});

// ============================================================================
// 7. 适配层隔离（R-DSH-01 / R-DSH-02 / R-DSH-03）
// ============================================================================
describe('7. 适配层隔离（R-DSH-01/02/03）', () => {
  it('核心域（排除 dsh 资产与测试）无 dsh / .dsh/skills / rank 概念泄漏', () => {
    const files = walkFiles(path.join(REPO_ROOT, 'src'), new Set(['node_modules'])).filter(
      (file) =>
        file.endsWith('.ts') &&
        !file.startsWith(DSH_ASSETS_DIR + path.sep) &&
        !file.startsWith(path.join(REPO_ROOT, 'src', '__tests__') + path.sep),
    );
    const offenders: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      if (/dsh/.test(content) || /\.dsh\/skills/.test(content) || /\brank\b/.test(content)) {
        offenders.push(path.relative(REPO_ROOT, file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('src/index.ts 薄桶无 dsh 导出（R-DSH-04）', () => {
    const content = fs.readFileSync(path.join(REPO_ROOT, 'src', 'index.ts'), 'utf8');
    expect(content.toLowerCase()).not.toContain('dsh');
  });

  it('dsh 资产不 import OpenCode 平台适配层（R-DSH-03）', () => {
    const files = walkFiles(DSH_ASSETS_DIR, new Set()).filter((file) => file.endsWith('.ts'));
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect({ file: path.relative(REPO_ROOT, file), hit: content.includes('adapters/opencode') }).toEqual({
        file: path.relative(REPO_ROOT, file),
        hit: false,
      });
    }
  });

  it('dsh 资产收敛于 src/adapters/dsh（R-DSH-01：src 其他位置无 dsh 命名文件）', () => {
    const files = walkFiles(path.join(REPO_ROOT, 'src'), new Set(['node_modules', '__tests__'])).filter(
      (file) => path.basename(file).toLowerCase().includes('dsh'),
    );
    for (const file of files) {
      expect(path.relative(REPO_ROOT, file).startsWith(path.join('src', 'adapters', 'dsh') + path.sep)).toBe(true);
    }
    // dsh 测试文件只允许位于 src/__tests__/unit/adapters/dsh/
    const testFiles = walkFiles(path.join(REPO_ROOT, 'src', '__tests__'), new Set(['node_modules'])).filter(
      (file) => path.basename(file).toLowerCase().includes('dsh'),
    );
    for (const file of testFiles) {
      expect(path.relative(REPO_ROOT, file)).toBe(
        path.join('src', '__tests__', 'unit', 'adapters', 'dsh', 'skill-package.test.ts'),
      );
    }
  });
});

// ============================================================================
// 8. OpenCode 链路零污染（R-DSH-04）
// ============================================================================
describe('8. OpenCode 链路零污染（R-DSH-04）', () => {
  it('install.sh / install.ps1 未被 dsh 变更触碰', () => {
    for (const name of ['install.sh', 'install.ps1']) {
      const file = path.join(REPO_ROOT, name);
      expect(fs.existsSync(file)).toBe(true);
      const content = fs.readFileSync(file, 'utf8').toLowerCase();
      expect({ name, hit: content.includes('dsh') }).toEqual({ name, hit: false });
    }
  });

  it('src/adapters/opencode 未被 dsh 变更触碰', () => {
    const files = walkFiles(path.join(REPO_ROOT, 'src', 'adapters', 'opencode'), new Set());
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8').toLowerCase();
      expect({ file: path.relative(REPO_ROOT, file), hit: content.includes('dsh') }).toEqual({
        file: path.relative(REPO_ROOT, file),
        hit: false,
      });
    }
  });

  it('jest.config.ts 保留既有映射且 @dsh 为追加', () => {
    const config = fs.readFileSync(path.join(REPO_ROOT, 'jest.config.ts'), 'utf8');
    for (const mapping of ['@pipeline', '@state', '@discovery', '@agents', '@templates', '@opencode', '@shared']) {
      expect(config).toContain(mapping);
    }
    expect(config).toContain("'^@dsh/(.*)$': '<rootDir>/src/adapters/dsh/$1'");
  });
});

// ============================================================================
// 9. 边界与错误路径（EC-008 / TASK-008~009 AC；补齐 review C44）
// ============================================================================
describe('9. 边界与错误路径（EC-008 / C44）', () => {
  it('validateContractManifest：非法 phase 枚举（与核心 VALID_PHASES 漂移）抛 DshContractError', () => {
    const manifest = JSON.parse(JSON.stringify(loadContractManifest(CONTRACT_MANIFEST_PATH)));
    manifest.phaseEnum = [...manifest.phaseEnum];
    manifest.phaseEnum[0] = 'not-a-phase';

    expect(() => validateContractManifest(manifest)).toThrow(DshContractError);

    let code: string | undefined;
    try {
      validateContractManifest(manifest);
    } catch (error) {
      code = (error as DshContractError).code;
    }
    expect(code).toBe('DSH_CONTRACT_INVALID');
  });

  it('validateContractManifest：缺失 area（未覆盖 7 类之一）抛 DshContractError', () => {
    const manifest = JSON.parse(JSON.stringify(loadContractManifest(CONTRACT_MANIFEST_PATH)));
    const firstId = manifest.dependencies[0].id;
    manifest.dependencies = manifest.dependencies.filter(
      (dependency: { id: string }) => dependency.id !== firstId,
    );

    expect(() => validateContractManifest(manifest)).toThrow(/未覆盖 area|校验失败/);
  });

  it(
    '构建脚本错误路径：非法 phaseTarget → 非零退出且打印可定位错误（EC-008）',
    () => {
      const fixture = makeBuildFixture();
      try {
        const mapPath = path.join(fixture, 'src', 'adapters', 'dsh', 'templates', 'router-command-map.json');
        const map = readJson(mapPath);
        const phaseSkill = (map.skills as Array<{ kind: string; phaseTarget: string | null }>).find(
          (skill) => skill.kind === 'phase',
        );
        phaseSkill!.phaseTarget = 'not-a-valid-phase';
        fs.writeFileSync(mapPath, JSON.stringify(map, null, 2), 'utf8');

        const { status, output } = runBuildScript(fixture);
        expect(status).not.toBe(0);
        expect(output).toContain('phaseTarget 非法');
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
    60000,
  );

  it(
    '构建脚本容错：docs/dsh 文档缺失记 warning 且退出码仍为 0（非零退出反例）',
    () => {
      const fixture = makeBuildFixture({ withDocs: false });
      try {
        const { status, output } = runBuildScript(fixture);
        expect(status).toBe(0);
        expect(output).toContain('尚未产出');
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    },
    60000,
  );
});
