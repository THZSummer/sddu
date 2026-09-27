/**
 * dsh 适配层公共 API 出口
 *
 * 承载：TASK-007（FR-009 / ADR-005）
 *
 * 职责：
 *  - re-export 契约清单能力（类型 + 装载 / 校验 / 哈希）；
 *  - 导出命名与落位常量，作为构建脚本（scripts/build-dsh-skills.cjs）与静态测试
 *    （skill-package.test.ts）的**同源常量来源**，避免常量在多处硬编码漂移（ADR-001「同源表达」）。
 *
 * 隔离约束（R-DSH-01 / R-DSH-02 / R-DSH-04）：
 *  - dsh 概念不进顶层公共 API（不修改 src/index.ts 薄桶）；
 *  - 本模块不 import OpenCode 平台适配层，也不引入核心域之外的平台概念。
 */

// ---------------------------------------------------------------------------
// 契约清单能力（TASK-001）
// ---------------------------------------------------------------------------
export {
  CONTRACT_MANIFEST_RELATIVE_PATH,
  CONTRACT_SNAPSHOT_DATE,
  CONTRACT_MANIFEST_SCHEMA_VERSION,
  CONTRACT_REQUIRED_FIELDS,
  CONTRACT_AREAS,
  DshContractError,
  resolveContractManifestPath,
  loadContractManifest,
  validateContractManifest,
  loadAndValidateContractManifest,
  computeContractManifestHash,
} from './contract';

export type {
  ContractArea,
  ContractRequiredField,
  ContractCoverageStatus,
  DshContractDependency,
  DshContractManifest,
} from './contract';

// ---------------------------------------------------------------------------
// 命名与落位常量（与 ADR-001 §2/§3、skill-header.md.hbs、install-dsh.sh、
// docs/dsh/README.md 同源表达；改动必须同步这五处）
// ---------------------------------------------------------------------------

/** Skill 命名前缀（FR-001 / EC-007） */
export const SKILL_PREFIX = 'sddu-';

/** 路由 / 入口 Skill 名（无后缀，ADR-002 决策 1） */
export const ROUTER_SKILL_NAME = 'sddu';

/** 主落位 rank：project-dsh → <projectRoot>/.dsh/skills（ADR-001 §2） */
export const DEFAULT_RANK = 100;

/** 用户级落位 rank：user-dsh → <dshHome>/skills（ADR-001 §2） */
export const USER_RANK = 400;

/** 项目级落位根目录（相对项目根） */
export const PROJECT_SKILLS_DIR_REL = '.dsh/skills';

/** 用户级落位子目录（相对 <dshHome>） */
export const USER_SKILLS_DIR_NAME = 'skills';

/** dsh 契约快照日期（NFR-007；与 dsh-contract-manifest.json 顶层一致） */
export const CONTRACT_SNAPSHOT = '2026-08-14';

/** 预期交付的 Skill 目录数（1 路由 + 7 阶段 + 3 独立 = 11） */
export const EXPECTED_SKILL_COUNT = 11;

/** 11 个 Skill 名（与 router-command-map.json 的 `skills[].name` 严格同序同集，TASK-009 断言） */
export const SKILL_NAMES = [
  'sddu',
  'sddu-discovery',
  'sddu-spec',
  'sddu-plan',
  'sddu-tasks',
  'sddu-build',
  'sddu-review',
  'sddu-validate',
  'sddu-roadmap',
  'sddu-docs',
  'sddu-fast',
] as const;

/** 协议片段标识（与 router-command-map.json 的 `protocolFragments` 取值同源） */
export const PROTOCOL_FRAGMENTS = [
  'gate-protocol',
  'state-sync-protocol',
  'router-entry-protocol',
] as const;

export type ProtocolFragment = (typeof PROTOCOL_FRAGMENTS)[number];

export type SkillName = (typeof SKILL_NAMES)[number];

// ---------------------------------------------------------------------------
// 小工具（供构建脚本 / 测试复用的命名判定，避免多份前缀逻辑）
// ---------------------------------------------------------------------------

/**
 * 判定目录 / 条目名是否属于 SDDU 自有 Skill。
 *
 * 注意：路由 Skill 名为 `sddu`（**无**连字符），其余 10 个为 `sddu-*`。
 * 安装 / 卸载脚本必须按同一口径匹配，否则会漏掉路由 Skill（EC-007）。
 */
export function isSdduSkillName(name: string): boolean {
  return name === ROUTER_SKILL_NAME || name.startsWith(SKILL_PREFIX);
}
