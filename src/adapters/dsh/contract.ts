/**
 * dsh 适配层 — 契约依赖点类型化装载与校验层
 *
 * 承载：TASK-001（FR-007、NFR-001、NFR-007 / ADR-006 决策 1）
 *
 * 职责：
 *  - 定义 `dsh-contract-manifest.json` 的类型契约；
 *  - 提供装载（loadContractManifest）、结构 + 枚举一致性校验（validateContractManifest）
 *    与哈希锚定（computeContractManifestHash）能力，供构建脚本与静态测试复用；
 *  - 以「清单为单一来源」消除 dsh 契约事实的第二份人工维护副本。
 *
 * 隔离约束（R-DSH-02 / R-DSH-03）：
 *  - 只经域级 index 单向 import `../../state`（核心域），不 import OpenCode 平台适配层（R-DSH-03）；
 *  - dsh 专项概念只存在于本目录，不向核心域渗透。
 *
 * 路径解析说明（避免 `import.meta` / `__dirname` 双运行时分歧）：
 *  本模块在 tsc（ESM 产物）与 ts-jest（CJS 变换）两种目标下都要可运行，因此不使用
 *  `import.meta.url` 或 `__dirname`，而是从 `process.cwd()` 逐级向上定位仓库内的清单文件。
 *  构建脚本（scripts/build-dsh-skills.cjs）与 jest 均在仓库根运行，定位稳定；
 *  调用方也可通过 `manifestPath` 参数显式指定路径（测试注入使用）。
 */

import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { dirname, isAbsolute, join, resolve } from 'path';

import { NEXT_PHASE, PHASE_ORDER, VALID_PHASES } from '../../state';
import type { Phase } from '../../state';

// ============================================================================
// 常量
// ============================================================================

/** 清单在仓库内的相对路径（相对仓库根） */
export const CONTRACT_MANIFEST_RELATIVE_PATH =
  'src/adapters/dsh/contract/dsh-contract-manifest.json';

/** dsh 契约快照日期（2026-08-14 单一快照；NFR-007） */
export const CONTRACT_SNAPSHOT_DATE = '2026-08-14';

/** 清单自身的 schema 版本（结构演进时 bump） */
export const CONTRACT_MANIFEST_SCHEMA_VERSION = '1.0';

/** 依赖点的 8 个必填字段（ADR-006 决策 1） */
export const CONTRACT_REQUIRED_FIELDS = [
  'id',
  'area',
  'snapshotDate',
  'fact',
  'assumption',
  'observableCheck',
  'breakImpact',
  'fixHint',
] as const;

/** 依赖点的 7 个 area（ADR-006 决策 1 的 7 类，必须全覆盖） */
export const CONTRACT_AREAS = [
  'skill-provider',
  'skill-discovery-cache',
  'command-registration',
  'profile-bundle',
  'dir-convention',
  'session-events',
  'guard-pipeline',
] as const;

export type ContractArea = (typeof CONTRACT_AREAS)[number];

export type ContractRequiredField = (typeof CONTRACT_REQUIRED_FIELDS)[number];

/**
 * 覆盖状态标记（用于在清单内显式暴露「快照未覆盖 / 已知缺口 / 演进点」，
 * 避免把空白表述为已确认 —— ADR-003 决策 3 / ADR-006 后果）。
 */
export type ContractCoverageStatus =
  | 'covered'
  | 'known-gap'
  | 'snapshot-uncovered'
  | 'evolution-point';

export interface DshContractDependency extends Record<ContractRequiredField, string> {
  readonly id: string;
  readonly area: string;
  readonly snapshotDate: string;
  readonly fact: string;
  readonly assumption: string;
  readonly observableCheck: string;
  readonly breakImpact: string;
  readonly fixHint: string;
  readonly coverageStatus?: ContractCoverageStatus;
  readonly coverageNote?: string;
}

export interface DshContractManifest {
  /** 顶层契约快照日期（每条依赖点的 snapshotDate 必须与之相同） */
  readonly dshContractSnapshot: string;
  /** dsh/SDDU 双方阶段枚举（必须与核心 VALID_PHASES 深度相等） */
  readonly phaseEnum: string[];
  /** 依赖点清单（≥ 7 条，覆盖 CONTRACT_AREAS 全部 7 类） */
  readonly dependencies: DshContractDependency[];
  /** 清单说明（可选） */
  readonly _note?: string | string[];
}

// ============================================================================
// 错误类型
// ============================================================================

/** 契约清单装载 / 校验失败（校验失败必须抛错，使构建脚本可非零退出） */
export class DshContractError extends Error {
  readonly code: string;
  readonly details: string[];

  constructor(message: string, code = 'DSH_CONTRACT_INVALID', details: string[] = []) {
    super(message);
    this.name = 'DshContractError';
    this.code = code;
    this.details = details;
  }
}

// ============================================================================
// 路径解析
// ============================================================================

/**
 * 解析清单文件绝对路径。
 *
 * @param manifestPath 显式路径（绝对路径直接使用；相对路径相对 process.cwd() 解析）
 */
export function resolveContractManifestPath(manifestPath?: string): string {
  if (manifestPath && manifestPath.length > 0) {
    return isAbsolute(manifestPath) ? manifestPath : resolve(process.cwd(), manifestPath);
  }

  let dir = resolve(process.cwd());
  for (let i = 0; i < 12; i += 1) {
    const candidate = join(dir, CONTRACT_MANIFEST_RELATIVE_PATH);
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  // 未找到时返回 cwd 下的预期路径，由调用方以明确的错误信息暴露问题
  return resolve(process.cwd(), CONTRACT_MANIFEST_RELATIVE_PATH);
}

// ============================================================================
// 装载
// ============================================================================

/**
 * 装载清单（仅解析，不做校验）。
 * 使用 `fs.readFileSync` + `JSON.parse` 而非 `import`（避免 tsconfig 未开 `resolveJsonModule`，
 * 并保持 tsc/jest 双运行时行为一致）。
 */
export function loadContractManifest(manifestPath?: string): DshContractManifest {
  const path = resolveContractManifestPath(manifestPath);

  if (!existsSync(path)) {
    throw new DshContractError(
      `[dsh-contract] 契约清单不存在: ${path}`,
      'DSH_CONTRACT_MISSING',
      [path],
    );
  }

  const raw = readFileSync(path, 'utf8');
  try {
    return JSON.parse(raw) as DshContractManifest;
  } catch (error) {
    throw new DshContractError(
      `[dsh-contract] 契约清单不是合法 JSON: ${path}`,
      'DSH_CONTRACT_PARSE_ERROR',
      [path, error instanceof Error ? error.message : String(error)],
    );
  }
}

// ============================================================================
// 校验
// ============================================================================

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 校验「核心 phase 枚举自身」的一致性：VALID_PHASES / PHASE_ORDER / NEXT_PHASE 三者同源。
 * 这是构建期枚举一致性的基础保障（被 validateContractManifest 调用）。
 */
function validateCorePhaseEnumeration(): void {
  const details: string[] = [];

  for (const phase of Object.keys(NEXT_PHASE)) {
    if (!VALID_PHASES.includes(phase as Phase)) {
      details.push(`NEXT_PHASE 含未在 VALID_PHASES 中的阶段: ${phase}`);
    }
  }

  for (const [from, to] of Object.entries(NEXT_PHASE)) {
    const fromOrder = PHASE_ORDER[from as Phase];
    const toOrder = PHASE_ORDER[to as Phase];
    if (typeof fromOrder !== 'number' || typeof toOrder !== 'number') {
      details.push(`NEXT_PHASE 映射含未知阶段: ${from} -> ${to}`);
      continue;
    }
    if (toOrder !== fromOrder + 1) {
      details.push(`NEXT_PHASE 非相邻跃迁: ${from}(${fromOrder}) -> ${to}(${toOrder})`);
    }
  }

  if (details.length > 0) {
    throw new DshContractError(
      '[dsh-contract] 核心 phase 枚举自身不一致（VALID_PHASES / PHASE_ORDER / NEXT_PHASE）',
      'DSH_CORE_PHASE_ENUM_INCONSISTENT',
      details,
    );
  }
}

/**
 * 校验清单结构与 dsh↔核心 的 phase 枚举一致性。
 *
 * 校验失败**抛错**（不返回 false），以便构建脚本捕获后非零退出。
 *
 * 校验项：
 *  1. 核心 phase 枚举自洽（VALID_PHASES / PHASE_ORDER / NEXT_PHASE）；
 *  2. `dshContractSnapshot` 为非空字符串；
 *  3. `phaseEnum` 必须存在且与核心 `VALID_PHASES` 深度相等（防漂移 / NFR-002）；
 *  4. `dependencies` 为数组且长度 ≥ 7；
 *  5. 每条依赖点含 8 个必填字段且均为非空字符串；
 *  6. 每条依赖点 `snapshotDate` 等于顶层 `dshContractSnapshot`；
 *  7. `area` 属于 `CONTRACT_AREAS`，且 7 类全覆盖；
 *  8. `id` 唯一。
 *
 * @returns 校验通过时返回 `true`
 */
export function validateContractManifest(manifest: DshContractManifest): true {
  validateCorePhaseEnumeration();

  const details: string[] = [];

  if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new DshContractError(
      '[dsh-contract] 契约清单顶层必须是对象',
      'DSH_CONTRACT_INVALID',
      ['expected: { dshContractSnapshot, phaseEnum, dependencies[] }'],
    );
  }

  if (!isNonEmptyString(manifest.dshContractSnapshot)) {
    details.push('顶层字段 dshContractSnapshot 必须是非空字符串');
  }

  // --- phase 枚举一致性 ------------------------------------------------
  if (!Array.isArray(manifest.phaseEnum)) {
    details.push('顶层字段 phaseEnum 必须存在且为数组（用于与核心 VALID_PHASES 校验一致性）');
  } else {
    const expected = [...VALID_PHASES];
    const actual = manifest.phaseEnum;
    if (actual.length !== expected.length) {
      details.push(
        `phaseEnum 长度不一致：期望 ${expected.length}（核心 VALID_PHASES），实际 ${actual.length}`,
      );
    } else {
      for (let i = 0; i < expected.length; i += 1) {
        if (expected[i] !== actual[i]) {
          details.push(
            `phaseEnum 与核心 VALID_PHASES 不一致（索引 ${i}）：期望 '${expected[i]}'，实际 '${String(actual[i])}'`,
          );
        }
      }
    }
  }

  // --- 依赖点 -----------------------------------------------------------
  if (!Array.isArray(manifest.dependencies)) {
    details.push('顶层字段 dependencies 必须是数组');
  } else {
    if (manifest.dependencies.length < 7) {
      details.push(
        `dependencies 长度必须 ≥ 7（ADR-006 决策 1 的 7 类），实际 ${manifest.dependencies.length}`,
      );
    }

    const seenIds = new Set<string>();
    const seenAreas = new Set<string>();

    manifest.dependencies.forEach((dependency, index) => {
      const label = `dependencies[${index}]`;

      if (dependency === null || typeof dependency !== 'object') {
        details.push(`${label} 必须是对象`);
        return;
      }

      for (const field of CONTRACT_REQUIRED_FIELDS) {
        if (!isNonEmptyString((dependency as unknown as Record<string, unknown>)[field])) {
          details.push(`${label}.${field} 必须是非空字符串`);
        }
      }

      const id = dependency.id;
      if (isNonEmptyString(id)) {
        if (seenIds.has(id)) {
          details.push(`${label}.id 重复: '${id}'`);
        }
        seenIds.add(id);
      }

      const area = dependency.area;
      if (isNonEmptyString(area)) {
        if (!(CONTRACT_AREAS as readonly string[]).includes(area)) {
          details.push(
            `${label}.area 非法: '${area}'，允许值 [${CONTRACT_AREAS.join(', ')}]`,
          );
        }
        seenAreas.add(area);
      }

      if (
        isNonEmptyString(dependency.snapshotDate) &&
        isNonEmptyString(manifest.dshContractSnapshot) &&
        dependency.snapshotDate !== manifest.dshContractSnapshot
      ) {
        details.push(
          `${label}.snapshotDate ('${dependency.snapshotDate}') 必须等于顶层 dshContractSnapshot ('${manifest.dshContractSnapshot}')`,
        );
      }
    });

    for (const area of CONTRACT_AREAS) {
      if (!seenAreas.has(area)) {
        details.push(`dependencies 未覆盖 area: '${area}'`);
      }
    }
  }

  if (details.length > 0) {
    throw new DshContractError(
      `[dsh-contract] 契约清单校验失败（${details.length} 项）`,
      'DSH_CONTRACT_INVALID',
      details,
    );
  }

  return true;
}

/** 装载并校验清单（构建脚本的推荐入口） */
export function loadAndValidateContractManifest(manifestPath?: string): DshContractManifest {
  const manifest = loadContractManifest(manifestPath);
  validateContractManifest(manifest);
  return manifest;
}

// ============================================================================
// 哈希锚定
// ============================================================================

/**
 * 计算清单文件**字节**的 sha256（用于 `dist/dsh/manifest.json` 的 contractManifestHash 锚定）。
 * 与 `scripts/build-dsh-skills.cjs` 使用同一算法，保证两侧可交叉核对。
 */
export function computeContractManifestHash(manifestPath?: string): string {
  const path = resolveContractManifestPath(manifestPath);

  if (!existsSync(path)) {
    throw new DshContractError(
      `[dsh-contract] 无法计算哈希，契约清单不存在: ${path}`,
      'DSH_CONTRACT_MISSING',
      [path],
    );
  }

  return createHash('sha256').update(readFileSync(path)).digest('hex');
}
