# ADR-010: TREE.md 裁撤——目录名即导航，不保留目录导航文件

## 状态
PROPOSED（2026-11-24 用户拍板）

## 背景
v6 确立「零 TS、零构建、零 npm、零校验脚本」后，审视 `TREE.md`（每层级目录导航文件）及其生成器 `src/skills/framework/sddu-tree/scripts/generate-tree.cjs`（702 行），发现它与 v6 每一条范式都冲突：

1. **零脚本**：generate-tree.cjs 是运行时工具，而 scripts/ 已收敛为「复制器一对」；
2. **读 state.json**：已拍板 state.json 退役 → state.md，生成器仍在解析 state.json；
3. **平台依赖**：用 `execSync` 调 `find` 命令，与「平台中立」矛盾；
4. **在 src/ 下**：已拍板 src/ 整体退役（ADR-005/007）；
5. **所属 skill**：`sddu-tree` 正是「框架级 skills ×4（discovery/creator/sync/tree）」之一，本就在 FR-004 裁撤评估范围。

## 决策
**`TREE.md` 整体裁撤**，不留目录导航文件。理由：

1. **目录名即导航**——Feature 目录名 `specs-tree-<version>-<slug>`（次段两位零填充）使 `ls` / `git ls` / shell glob 天然按版本序排列，目录结构本身就是导航，无需额外的导航文件。
2. **状态投影已有归处**——Feature 状态由 `state.md` front-matter 承载，跨 Feature 投影由 ROADMAP §3（specs-tree 实时投影）承担，TREE.md 的状态表与之重复。
3. **生成器无存在价值**——TREE.md 若保留则需生成器维护，而生成器与「零脚本」范式冲突；若手工维护则与「目录名即导航」冗余。二者皆无必要。

## 对既有设计的修订
- **ADR-009**：其「聚合索引不引入生成器」结论仍成立，但对象收窄为 ROADMAP.md（TREE.md 随本 ADR 裁撤）。
- **spec FR-008 验收②**：workspace 空骨架清单移除 TREE 种子，仅保留 ROADMAP.md。
- **plan §5.1 树 / §5.2**：删除 workspace 及 specs-tree-root / docs-tree-root 下的 TREE.md 行。

## 后果
- 正面：scripts/ 维持「复制器一对」零代码形态；workspace 骨架更简（ROADMAP + specs-tree-root + docs-tree-root + .sddu-config）；消除「导航文件 ↔ 目录结构」漂移（目录即真相，无副本可漂移）。
- 负面：无 TREE.md 时，需靠 `ls` / `git ls` 或 ROADMAP §3 查看目录与 Feature 概览（可接受——目录名自解释 + ROADMAP 已投影）。
- 不可逆性：低——目录结构未变，仅移除导航文件；如未来需要，可由 ROADMAP §3 或重新生成导航文件恢复。
