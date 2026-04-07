# 任务分解：插件改名 SDDU

**Feature ID**: FR-SDDU-RENAME-001  
**Feature 名称**: 插件改名 SDDU  
**版本**: 1.0.0  
**状态**: reviewed  
**创建日期**: 2026-04-06  
**作者**: SDD Tasks Agent  

---

## 任务分解原则

- **P0**: 核心功能，双名称并存的基础设施
- **P1**: 迁移支持，文档和工具链更新
- **P2**: 清理优化，测试和 CI/CD

---

## 阶段 1: 双名称并存 (P0)

### T-001: package.json 包名更新

**优先级**: P0  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: 无  
**执行波次**: 1

#### 描述
更新根目录和插件目录的 package.json，将包名从 `opencode-sdd-plugin` 改为 `opencode-sddu-plugin`，同时更新 description、keywords、scripts 和 files 字段。

#### 涉及文件
- [MODIFY] `/package.json`
- [MODIFY] `/.opencode/plugins/sdd/package.json`

#### 验收标准
- [ ] `name` 字段改为 `opencode-sddu-plugin`
- [ ] `description` 包含 "SDDU" 品牌名称
- [ ] `keywords` 包含 `sddu`
- [ ] `files` 字段指向 `dist/sddu/**/*`
- [ ] npm scripts 中的命令名更新为 `sddu-*`
- [ ] 旧脚本名保留作为别名（向后兼容）

#### 验证命令
```bash
cat package.json | grep -E '"name"|"description"|"keywords"'
npm run sddu-spec --dry-run  # 验证新脚本名可用
```

---

### T-002: opencode.json Agent 定义更新（双份定义）

**优先级**: P0  
**复杂度**: M  
**预估工时**: 2 小时  
**前置依赖**: T-001  
**执行波次**: 1

#### 描述
在根目录和插件目录的 opencode.json 中添加 18 个新 Agent 定义（@sddu-*），同时保留旧 Agent 定义（@sdd-*）并标记为 deprecated。新旧 Agent 指向同一 prompt 文件。

#### 涉及文件
- [MODIFY] `/opencode.json`
- [MODIFY] `/.opencode/plugins/sdd/opencode.json`

#### 验收标准
- [ ] 18 个新 Agent 定义完成（@sddu-*）
- [ ] 18 个旧 Agent 保留并标记 deprecated
- [ ] 新旧 Agent 指向同一 prompt 文件（sddu.md 等）
- [ ] Agent 描述中包含新旧名称映射说明
- [ ] JSON 格式验证通过

#### 验证命令
```bash
cat opencode.json | jq '.agent | keys | length'  # 应返回 36+（含原有其他 agent）
cat opencode.json | jq '.agent | keys[] | select(startswith("sddu"))'
cat opencode.json | jq '.agent | keys[] | select(startswith("sdd")) | select(contains("sddu") | not)'
```

---

### T-003: 主入口文件更新（src/index.ts）

**优先级**: P0  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: 无  
**执行波次**: 1

#### 描述
更新插件主入口文件，将导出常量名从 `SDDPlugin` 改为 `SDDUPlugin`，日志服务名从 `sdd-plugin` 改为 `sddu-plugin`。

#### 涉及文件
- [MODIFY] `/src/index.ts`

#### 验收标准
- [ ] 导出常量名改为 `SDDUPlugin`
- [ ] 日志服务名改为 `sddu-plugin`
- [ ] 保留旧导出名作为别名（向后兼容）
- [ ] TypeScript 编译无错误

#### 验证命令
```bash
npm run build  # 验证编译通过
grep -n "SDDUPlugin\|sddu-plugin" src/index.ts
```

---

### T-004: Agent 注册模块更新

**优先级**: P0  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: T-003  
**执行波次**: 2

#### 描述
更新 Agent 注册模块，将注册名从 `sdd-agents` 改为 `sddu-agents`，或新建 sddu-agents.ts 并保留旧文件。

#### 涉及文件
- [MODIFY/CREATE] `/src/agents/sdd-agents.ts` 或 `/src/agents/sddu-agents.ts`

#### 验收标准
- [ ] Agent 注册逻辑支持双名称
- [ ] 导出名改为 `SDDUAgents` 或保留双导出
- [ ] TypeScript 编译无错误

#### 验证命令
```bash
npm run build
grep -n "sddu" src/agents/*.ts
```

---

### T-005: 错误处理模块更新

**优先级**: P0  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: 无  
**执行波次**: 1

#### 描述
更新错误处理模块，将错误前缀从 `[SDD-` 改为 `[SDDU-`，类名前缀从 `SddError` 改为 `SdduError`，同时保留旧类作为别名。

#### 涉及文件
- [MODIFY] `/src/errors.ts`

#### 验收标准
- [ ] 错误前缀改为 `[SDDU-`
- [ ] 错误类名前缀改为 `SdduError`
- [ ] 保留旧类名作为别名（向后兼容）
- [ ] 错误消息格式一致

#### 验证命令
```bash
npm run build
grep -n "SDDU-\|SdduError" src/errors.ts
```

---

### T-006: 模板文件重命名（11 个 .hbs 文件）

**优先级**: P0  
**复杂度**: M  
**预估工时**: 1 小时  
**前置依赖**: 无  
**执行波次**: 1

#### 描述
使用 `git mv` 重命名 11 个 Agent prompt 模板文件，从 `sdd*.hbs` 改为 `sddu*.hbs`，保持 Git 历史。

#### 涉及文件
- [RENAME] `/src/templates/agents/sdd.md.hbs` → `sddu.md.hbs`
- [RENAME] `/src/templates/agents/sdd-help.md.hbs` → `sddu-help.md.hbs`
- [RENAME] `/src/templates/agents/sdd-discovery.md.hbs` → `sddu-discovery.md.hbs`
- [RENAME] `/src/templates/agents/sdd-spec.md.hbs` → `sddu-spec.md.hbs`
- [RENAME] `/src/templates/agents/sdd-plan.md.hbs` → `sddu-plan.md.hbs`
- [RENAME] `/src/templates/agents/sdd-tasks.md.hbs` → `sddu-tasks.md.hbs`
- [RENAME] `/src/templates/agents/sdd-build.md.hbs` → `sddu-build.md.hbs`
- [RENAME] `/src/templates/agents/sdd-review.md.hbs` → `sddu-review.md.hbs`
- [RENAME] `/src/templates/agents/sdd-validate.md.hbs` → `sddu-validate.md.hbs`
- [RENAME] `/src/templates/agents/sdd-docs.md.hbs` → `sddu-docs.md.hbs`
- [RENAME] `/src/templates/agents/sdd-roadmap.md.hbs` → `sddu-roadmap.md.hbs`

#### 验收标准
- [ ] 11 个文件全部重命名
- [ ] 使用 `git mv` 保持历史
- [ ] 文件内容无变更（仅改名）
- [ ] Git 提交记录清晰

#### 验证命令
```bash
git status | grep "renamed:"
ls src/templates/agents/sddu*.hbs | wc -l  # 应返回 11
```

---

### T-007: 模板内容更新（@sdd-* → @sddu-*）

**优先级**: P0  
**复杂度**: M  
**预估工时**: 1.5 小时  
**前置依赖**: T-006  
**执行波次**: 2

#### 描述
更新 11 个新模板文件内容，将所有 `@sdd-*` 引用改为 `@sddu-*`，同时保留旧模板文件内容不变（向后兼容）。

#### 涉及文件
- [MODIFY] `/src/templates/agents/sddu*.hbs`（11 个文件）

#### 验收标准
- [ ] 所有 `@sdd-*` Agent 引用改为 `@sddu-*`
- [ ] 所有 `sdd_*` 工具引用改为 `sddu_*`
- [ ] 所有 `.sdd/` 目录引用更新说明
- [ ] 保持语义正确性

#### 验证命令
```bash
grep -r "@sddu-" src/templates/agents/sddu*.hbs | wc -l
grep -r "@sdd-[^u]" src/templates/agents/sddu*.hbs  # 应无输出（除了注释中的说明）
```

---

### T-008: 主 README.md 更新

**优先级**: P0  
**复杂度**: S  
**预估工时**: 1 小时  
**前置依赖**: T-002, T-007  
**执行波次**: 3

#### 描述
更新主 README.md，将标题、Agent 引用、目录结构、安装说明等从 SDD 改为 SDDU。

#### 涉及文件
- [MODIFY] `/README.md`

#### 验收标准
- [ ] 标题改为 "OpenCode SDDU Plugin"
- [ ] Agent 列表使用 `@sddu-*` 前缀
- [ ] 安装命令使用新包名
- [ ] 添加新旧名称对照表
- [ ] 添加 deprecated 警告说明

#### 验证命令
```bash
grep -n "SDDU\|@sddu-" README.md | head -20
```

---

### T-009: .opencode 目录配置更新

**优先级**: P0  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: T-001, T-002  
**执行波次**: 2

#### 描述
更新 `.opencode/plugins/sdd/` 目录下的配置文件，确保插件配置与新包名一致。

#### 涉及文件
- [MODIFY] `/.opencode/plugins/sdd/opencode.json`
- [MODIFY] `/.opencode/plugins/sdd/package.json`

#### 验收标准
- [ ] plugin 引用更新
- [ ] package.json 包名更新
- [ ] Agent 定义与根目录一致

#### 验证命令
```bash
cat .opencode/plugins/sdd/opencode.json | jq '.agent | keys[] | select(startswith("sddu"))'
```

---

## 阶段 2: 迁移支持 (P1)

### T-010: 工具脚本双版本支持

**优先级**: P1  
**复杂度**: M  
**预估工时**: 1 小时  
**前置依赖**: T-001  
**执行波次**: 4

#### 描述
创建新工具脚本 `sddu_update_state.js`，同时保留旧的 `sdd_update_state.js`。新工具支持 `.sdd/` 和 `.sddu/` 双目录。

#### 涉及文件
- [CREATE] `/.tool/sddu_update_state.js`
- [MODIFY] `/.tool/sdd_update_state.js`（添加双目录支持）

#### 验收标准
- [ ] 新工具 `sddu_update_state` 可用
- [ ] 旧工具 `sdd_update_state` 仍可用
- [ ] 双目录检测逻辑正确
- [ ] 工具输出信息包含 SDDU 品牌

#### 验证命令
```bash
node .tool/sddu_update_state.js --help
node .tool/sdd_update_state.js --help  # 旧工具仍可用
```

---

### T-011: 安装脚本更新

**优先级**: P1  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: T-001  
**执行波次**: 4

#### 描述
更新安装脚本输出信息，将 "SDD Plugin Installer" 改为 "SDDU Plugin Installer"。

#### 涉及文件
- [MODIFY] `/install.sh`
- [MODIFY] `/install.ps1`

#### 验收标准
- [ ] 输出信息包含 "SDDU"
- [ ] 安装路径支持双目录
- [ ] 旧命令仍可用（向后兼容）

#### 验证命令
```bash
grep -n "SDDU" install.sh install.ps1
bash install.sh --help 2>&1 | head -5
```

---

### T-012: 构建脚本更新

**优先级**: P1  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: T-001, T-006  
**执行波次**: 4

#### 描述
更新构建和打包脚本，确保输出目录为 `dist/sddu/`，同时保留 `dist/sdd/` 支持。

#### 涉及文件
- [MODIFY] `/build-agents.cjs`
- [MODIFY] `/scripts/package.cjs`

#### 验收标准
- [ ] 构建输出目录为 `dist/sddu/`
- [ ] 保留 `dist/sdd/` 目录（向后兼容）
- [ ] Agent 生成脚本引用新模板名

#### 验证命令
```bash
npm run build
ls -la dist/sddu/
ls -la dist/sdd/  # 应存在（兼容层）
```

---

### T-013: 帮助系统更新

**优先级**: P1  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: T-002, T-007  
**执行波次**: 5

#### 描述
更新 @sddu-help Agent 的 prompt 模板，包含新旧名称映射说明和迁移指南。

#### 涉及文件
- [MODIFY] `/src/templates/agents/sddu-help.md.hbs`

#### 验收标准
- [ ] Help Agent 列出所有 18 个 @sddu-* Agent
- [ ] 包含新旧名称对照表
- [ ] 标注 deprecated 警告
- [ ] 提供迁移建议

#### 验证命令
```bash
grep -A 20 "改名对照表\|迁移" src/templates/agents/sddu-help.md.hbs
```

---

### T-014: .sdd 目录文档更新

**优先级**: P1  
**复杂度**: S  
**预估工时**: 1 小时  
**前置依赖**: T-008  
**执行波次**: 5

#### 描述
更新 `.sdd/` 目录下的核心文档，包括 README.md、TREE.md、ROADMAP.md。

#### 涉及文件
- [MODIFY] `/.sdd/README.md`
- [MODIFY] `/.sdd/TREE.md`
- [MODIFY] `/.sdd/ROADMAP.md`

#### 验收标准
- [ ] README.md 标题和内容更新为 SDDU
- [ ] TREE.md 中 "SDD" 定义改为 "SDDU"
- [ ] ROADMAP.md 版本历史包含改名记录
- [ ] 保留 .sdd/ 目录名（不强制改名）

#### 验证命令
```bash
grep -n "SDDU" .sdd/README.md .sdd/TREE.md .sdd/ROADMAP.md
```

---

### T-015: 迁移指南文档编写

**优先级**: P1  
**复杂度**: M  
**预估工时**: 1.5 小时  
**前置依赖**: T-008  
**执行波次**: 5

#### 描述
编写详细的迁移指南文档，说明从 SDD 到 SDDU 的迁移步骤、注意事项和常见问题。

#### 涉及文件
- [MODIFY] `/docs/migration-guide.md`

#### 验收标准
- [ ] 包含 3 阶段迁移策略说明
- [ ] 包含改名对照表
- [ ] 包含自动迁移脚本使用说明
- [ ] 包含常见问题 FAQ
- [ ] 包含回滚指南

#### 验证命令
```bash
cat docs/migration-guide.md | grep -E "阶段 | 步骤 | FAQ|回滚" | wc -l
```

---

### T-016: FAQ 文档更新

**优先级**: P1  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: T-015  
**执行波次**: 6

#### 描述
更新容器化和其他 FAQ 文档中的品牌名称引用。

#### 涉及文件
- [MODIFY] `/docs/containerization-faq.md`

#### 验收标准
- [ ] 品牌名称更新为 SDDU
- [ ] Agent 名称使用 @sddu-*
- [ ] 添加新旧名称说明

#### 验证命令
```bash
grep -n "SDDU\|@sddu-" docs/containerization-faq.md
```

---

### T-017: 迁移脚本实现

**优先级**: P1  
**复杂度**: M  
**预估工时**: 1.5 小时  
**前置依赖**: T-010, T-015  
**执行波次**: 6

#### 描述
实现自动迁移脚本，帮助用户将旧项目配置迁移到新命名规范。

#### 涉及文件
- [CREATE] `/scripts/migrate-to-sddu.js` 或 `/scripts/migrate-to-sddu.sh`

#### 验收标准
- [ ] 支持检测旧配置
- [ ] 支持自动更新 opencode.json
- [ ] 支持 .sdd/ → .sddu/ 目录迁移（可选）
- [ ] 提供干运行模式（--dry-run）
- [ ] 提供回滚选项

#### 验收命令
```bash
node scripts/migrate-to-sddu.js --help
node scripts/migrate-to-sddu.js --dry-run
```

---

## 阶段 3: 清理优化 (P2)

### T-018: 测试文件更新

**优先级**: P2  
**复杂度**: M  
**预估工时**: 2 小时  
**前置依赖**: T-001-T-009  
**执行波次**: 7

#### 描述
更新测试文件中的描述文本和引用，确保测试覆盖新旧双名称。

#### 涉及文件
- [MODIFY] `/tests/**/*.test.ts`（多个测试文件）

#### 验收标准
- [ ] 测试描述包含 SDDU 品牌
- [ ] 添加向后兼容性测试用例
- [ ] 所有测试通过
- [ ] 测试覆盖率 ≥ 90%

#### 验证命令
```bash
npm test
npm run test:coverage  # 检查覆盖率报告
```

---

### T-019: CI/CD 配置更新

**优先级**: P2  
**复杂度**: S  
**预估工时**: 1 小时  
**前置依赖**: T-001, T-018  
**执行波次**: 8

#### 描述
更新 CI/CD 配置文件（如有），确保构建和发布流程使用新包名。

#### 涉及文件
- [MODIFY] `/.github/workflows/*.yml`（如存在）
- [MODIFY] `/.gitlab-ci.yml`（如存在）

#### 验收标准
- [ ] 构建流程使用新包名
- [ ] 发布流程配置正确
- [ ] CI 测试包含新旧双名称验证
- [ ] 如无 CI/CD 配置则跳过

#### 验证命令
```bash
ls .github/workflows/ 2>/dev/null || echo "无 GitHub Actions 配置"
grep -r "sddu" .github/workflows/ 2>/dev/null || echo "无需更新"
```

---

## 任务执行波次汇总

| 波次 | 任务数 | 任务 ID | 预计耗时 |
|------|--------|---------|----------|
| Wave 1 | 6 | T-001, T-002, T-003, T-005, T-006, T-009 | 5 小时 |
| Wave 2 | 2 | T-004, T-007 | 2 小时 |
| Wave 3 | 1 | T-008 | 1 小时 |
| Wave 4 | 3 | T-010, T-011, T-012 | 2 小时 |
| Wave 5 | 3 | T-013, T-014, T-015 | 3 小时 |
| Wave 6 | 2 | T-016, T-017 | 2 小时 |
| Wave 7 | 1 | T-018 | 2 小时 |
| Wave 8 | 1 | T-019 | 1 小时 |
| **总计** | **19** | - | **18 小时** |

---

## 任务统计表

| 阶段 | 优先级 | 任务数 | 总工时 | 复杂度分布 |
|------|--------|--------|--------|------------|
| 阶段 1: 双名称并存 | P0 | 9 | 8.5 小时 | S: 5, M: 3, L: 1 |
| 阶段 2: 迁移支持 | P1 | 8 | 7.5 小时 | S: 5, M: 3, L: 0 |
| 阶段 3: 清理优化 | P2 | 2 | 3 小时 | S: 1, M: 1, L: 0 |
| **总计** | - | **19** | **19 小时** | **S: 11, M: 7, L: 1** |

---

## 依赖关系图

```
Wave 1 (无依赖)
├─ T-001: package.json 更新
├─ T-002: opencode.json Agent 定义
├─ T-003: src/index.ts 更新
├─ T-005: errors.ts 更新
├─ T-006: 模板文件重命名
└─ T-009: .opencode 配置更新

Wave 2 (依赖 Wave 1)
├─ T-004 → T-003
└─ T-007 → T-006

Wave 3 (依赖 Wave 2)
└─ T-008 → T-002, T-007

Wave 4 (依赖 Wave 1)
├─ T-010 → T-001
├─ T-011 → T-001
└─ T-012 → T-001, T-006

Wave 5 (依赖 Wave 3)
├─ T-013 → T-002, T-007
├─ T-014 → T-008
└─ T-015 → T-008

Wave 6 (依赖 Wave 5)
├─ T-016 → T-015
└─ T-017 → T-010, T-015

Wave 7 (依赖 Wave 2)
└─ T-018 → T-001~T-009

Wave 8 (依赖 Wave 7)
└─ T-019 → T-001, T-018
```

---

## 风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| Git 历史丢失 | 中 | 使用 `git mv` 而非删除 + 新建 |
| 向后兼容断裂 | 高 | 保留旧文件/配置，双名称并存 |
| 测试覆盖不足 | 中 | 添加新旧双名称测试用例 |
| 文档不一致 | 中 | 统一更新，使用查找替换验证 |

---

## 下一步行动

1. ✅ 任务分解完成
2. 👉 运行 `@sddu-build T-001` 开始实现第一个任务
3. 👉 或运行 `@sddu-build T-001,T-003,T-005,T-006,T-009` 批量执行 Wave 1 的 S 级任务

---

**任务分解完成时间**: 2026-04-06  
**任务状态**: tasked  
**下一步**: 运行 `/tool sddu_update_state {"feature": "specs-tree-plugin-rename-sddu", "state": "tasked"}` 更新状态
