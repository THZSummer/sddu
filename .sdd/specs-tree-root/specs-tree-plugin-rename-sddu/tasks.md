# 任务分解：插件改名 SDDU

**Feature ID**: FR-SDDU-RENAME-001  
**Feature 名称**: 插件改名 SDDU  
**版本**: 1.0.5  
**状态**: tasked  
**创建日期**: 2026-04-06  
**更新日期**: 2026-04-08  
**作者**: SDD Tasks Agent  

---

## 任务分解原则

- **配置模型驱动**: 直接修改 `src/config/opencode-config.ts` 配置模型，生成产物自动生成
- **直接替换**: 不保留向后兼容，删除所有旧版 SDD 引用
- **源码优先**: 仅修改 `src/` 源码和根目录配置，不修改生成产物
- **简洁优先**: 不创建迁移脚本或迁移文档（内部工具无需）

---

## 阶段 1: 核心配置模型更新 (P0)

### T-001: package.json 包名更新

**优先级**: P0  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: 无  
**执行波次**: 1

#### 描述
更新根目录 package.json，将包名从 `opencode-sdd-plugin` 改为 `opencode-sddu-plugin`，同时更新 description、keywords、scripts 和 files 字段。

#### 涉及文件
- [MODIFY] `/package.json`

#### 验收标准
- [ ] `name` 字段改为 `opencode-sddu-plugin`
- [ ] `description` 包含 "SDDU" 品牌名称
- [ ] `keywords` 包含 `sddu`
- [ ] `files` 字段指向 `dist/sddu/**/*`
- [ ] npm scripts 中的命令名更新为 `sddu-*`
- [ ] 删除旧脚本名（不保留向后兼容）

#### 验证命令
```bash
cat package.json | grep -E '"name"|"description"|"keywords"'
npm run sddu-spec --dry-run  # 验证新脚本名可用
```

---

### T-002: 配置模型更新 (opencode-config.ts)

**优先级**: P0  
**复杂度**: L  
**预估工时**: 3 小时  
**前置依赖**: T-001  
**执行波次**: 1

#### 描述
更新 `src/config/opencode-config.ts` 配置模型，包含 18 个新 Agent 定义（@sddu-*），移除旧 Agent 定义（@sdd-*）。配置模型将自动生成 `opencode.json` 和 `.opencode/*` 配置文件。

#### 涉及文件
- [MODIFY] `/src/config/opencode-config.ts`

#### 验收标准
- [ ] 18 个新 Agent 定义完成（@sddu-*）
- [ ] 移除所有旧 Agent 定义（@sdd-*）
- [ ] Agent 指向正确的 prompt 模板文件（sddu*.hbs）
- [ ] 配置模型可正确生成 `opencode.json`
- [ ] TypeScript 编译无错误

#### 验证命令
```bash
npm run build  # 验证配置模型可构建
cat opencode.json | jq '.agent | keys[] | select(startswith("sddu"))'  # 验证生成产物
cat opencode.json | jq '.agent | keys[] | select(startswith("sdd") | select(contains("sddu") | not))'  # 应无输出（旧版已删除）
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
- [ ] 删除旧导出名（不保留向后兼容）
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
更新 Agent 注册模块，将文件名从 `sdd-agents.ts` 改为 `sddu-agents.ts`，导出名改为 `SDDUAgents`。

#### 涉及文件
- [RENAME] `/src/agents/sdd-agents.ts` → `/src/agents/sddu-agents.ts`
- [MODIFY] `/src/agents/sddu-agents.ts`（更新导出名和引用）

#### 验收标准
- [ ] 文件名改为 `sddu-agents.ts`
- [ ] 导出名改为 `SDDUAgents`
- [ ] 删除旧文件 `sdd-agents.ts`
- [ ] TypeScript 编译无错误

#### 验证命令
```bash
npm run build
ls src/agents/sddu-agents.ts  # 应存在
ls src/agents/sdd-agents.ts 2>/dev/null  # 应不存在
```

---

### T-005: 错误处理模块更新

**优先级**: P0  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: 无  
**执行波次**: 1

#### 描述
更新错误处理模块，将错误前缀从 `[SDD-` 改为 `[SDDU-`，类名前缀从 `SddError` 改为 `SdduError`。

#### 涉及文件
- [MODIFY] `/src/errors.ts`

#### 验收标准
- [ ] 错误前缀改为 `[SDDU-`
- [ ] 错误类名前缀改为 `SdduError`
- [ ] 删除旧类名（不保留向后兼容）
- [ ] 错误消息格式一致

#### 验证命令
```bash
npm run build
grep -n "SDDU-\|SdduError" src/errors.ts
grep -n "SDD-\|SddError" src/errors.ts  # 应无输出（旧版已删除）
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
- [ ] 删除旧文件（不保留向后兼容）
- [ ] Git 提交记录清晰

#### 验证命令
```bash
git status | grep "renamed:"
ls src/templates/agents/sddu*.hbs | wc -l  # 应返回 11
ls src/templates/agents/sdd-*.hbs 2>/dev/null | wc -l  # 应返回 0
```

---

### T-007: 配置模板更新（opencode.json.hbs）

**优先级**: P0  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: 无  
**执行波次**: 1

#### 描述
更新 `src/templates/config/opencode.json.hbs` 配置模板内容，将插件名引用从 `opencode-sdd-plugin` 改为 `opencode-sddu-plugin`。此模板是生成根目录 `opencode.json` 的源文件。

#### 涉及文件
- [MODIFY] `/src/templates/config/opencode.json.hbs`

#### 变更详情
```hbs
// 第 3 行，旧内容：
"plugin": ["opencode-sdd-plugin"],

// 第 3 行，新内容：
"plugin": ["opencode-sddu-plugin"],
```

#### 验收标准
- [ ] 第 3 行插件名引用更新为 `opencode-sddu-plugin`
- [ ] 模板内容中无其他 `sdd-plugin` 引用
- [ ] 构建后生成的 `opencode.json` 包含正确插件名
- [ ] 文件名保持不变（仅内容更新）

#### 验证命令
```bash
grep "plugin" src/templates/config/opencode.json.hbs
npm run build  # 验证构建
cat opencode.json | jq '.plugin'  # 验证生成产物应为 ["opencode-sddu-plugin"]
```

---


### T-008: 模板内容更新（@sdd-* → @sddu-*）

**优先级**: P0  
**复杂度**: M  
**预估工时**: 1.5 小时  
**前置依赖**: T-006  
**执行波次**: 2

#### 描述
更新 11 个新模板文件内容，将所有 `@sdd-*` 引用改为 `@sddu-*`，将所有 `sdd_*` 工具引用改为 `sddu_*`。

#### 涉及文件
- [MODIFY] `/src/templates/agents/sddu*.hbs`（11 个文件）

#### 验收标准
- [ ] 所有 `@sdd-*` Agent 引用改为 `@sddu-*`
- [ ] 所有 `sdd_*` 工具引用改为 `sddu_*`
- [ ] 所有 `.sdd/` 目录引用更新说明（说明支持 `.sdd/` 和 `.sddu/` 双目录）
- [ ] 保持语义正确性

#### 验证命令
```bash
grep -r "@sddu-" src/templates/agents/sddu*.hbs | wc -l
grep -r "@sdd-[^u]" src/templates/agents/sddu*.hbs  # 应无输出
```

---

### T-009: 主 README.md 更新

**优先级**: P0  
**复杂度**: S  
**预估工时**: 1 小时  
**前置依赖**: T-002, T-007, T-008  
**执行波次**: 3

#### 描述
更新主 README.md，将标题、Agent 引用、目录结构、安装说明等从 SDD 改为 SDDU。

#### 涉及文件
- [MODIFY] `/README.md`

#### 验收标准
- [ ] 标题改为 "OpenCode SDDU Plugin"
- [ ] Agent 列表使用 `@sddu-*` 前缀
- [ ] 安装命令使用新包名
- [ ] 添加改名对照表
- [ ] 删除 deprecated 警告说明（直接替换无需）

#### 验证命令
```bash
grep -n "SDDU\|@sddu-" README.md | head -20
```

---

## 阶段 2: 工具和脚本更新 (P1)

### T-010: 工具脚本更新

**优先级**: P1  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: T-001  
**执行波次**: 4

#### 描述
创建新工具脚本 `sddu_update_state.js`，删除旧工具 `sdd_update_state.js`。

#### 涉及文件
- [CREATE] `/.tool/sddu_update_state.js`
- [DELETE] `/.tool/sdd_update_state.js`

#### 验收标准
- [ ] 新工具 `sddu_update_state` 可用
- [ ] 旧工具 `sdd_update_state` 已删除
- [ ] 工具输出信息包含 SDDU 品牌
- [ ] 工具支持 `.sdd/` 和 `.sddu/` 双目录检测

#### 验证命令
```bash
node .tool/sddu_update_state.js --help
ls .tool/sdd_update_state.js 2>/dev/null  # 应不存在
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
- [ ] 删除旧版 SDD 引用

#### 验证命令
```bash
grep -n "SDDU" install.sh install.ps1
bash install.sh --help 2>&1 | head -5
```

---

### T-012: 构建和打包脚本更新

**优先级**: P1  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: T-001, T-006  
**执行波次**: 4

#### 描述
更新构建和打包脚本，确保输出目录为 `dist/sddu/`。

#### 涉及文件
- [MODIFY] `/build-agents.cjs`
- [MODIFY] `/scripts/package.cjs`

#### 验收标准
- [ ] 构建输出目录为 `dist/sddu/`
- [ ] Agent 生成脚本引用新模板名（sddu*.hbs）
- [ ] 删除旧目录引用（dist/sdd/）

#### 验证命令
```bash
npm run build
ls -la dist/sddu/
ls -la dist/sdd/ 2>/dev/null  # 应不存在
```

---

### T-013: FAQ 文档更新

**优先级**: P1  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: T-009  
**执行波次**: 5

#### 描述
更新容器化 FAQ 文档中的品牌名称引用。

#### 涉及文件
- [MODIFY] `/docs/containerization-faq.md`

#### 验收标准
- [ ] 品牌名称更新为 SDDU
- [ ] Agent 名称使用 @sddu-*
- [ ] 删除旧版 SDD 引用

#### 验证命令
```bash
grep -n "SDDU\|@sddu-" docs/containerization-faq.md
grep -n "SDD Plugin\|@sdd-" docs/containerization-faq.md  # 应无输出
```

---

## 阶段 3: 清理和测试 (P2)

### T-014: 旧文件清理

**优先级**: P1  
**复杂度**: S  
**预估工时**: 0.5 小时  
**前置依赖**: T-004, T-006  
**执行波次**: 5

#### 描述
清理所有旧版 SDD 相关文件，包括旧 Agent 源码和旧模板文件。

#### 涉及文件
- [DELETE] `/src/agents/sdd-agents.ts`（如重命名后残留）
- [DELETE] `/src/templates/agents/sdd*.hbs`（如重命名后残留）

#### 验收标准
- [ ] 所有旧文件已删除
- [ ] Git 提交记录清晰
- [ ] 无引用旧文件的地方

#### 验证命令
```bash
git status | grep deleted
find src -name "sdd-*.ts" 2>/dev/null  # 应无输出
find src -name "sdd-*.hbs" 2>/dev/null  # 应无输出
```

---

### T-015: 测试文件更新

**优先级**: P2  
**复杂度**: M  
**预估工时**: 2 小时  
**前置依赖**: T-001-T-013  
**执行波次**: 6

#### 描述
更新测试文件中的描述文本和引用，确保测试覆盖新命名。

#### 涉及文件
- [MODIFY] `/tests/**/*.test.ts`（多个测试文件）

#### 验收标准
- [ ] 测试描述包含 SDDU 品牌
- [ ] 所有测试通过
- [ ] 测试覆盖率 ≥ 90%

#### 验证命令
```bash
npm test
npm run test:coverage  # 检查覆盖率报告
```

---

### T-016: CI/CD 配置更新

**优先级**: P2  
**复杂度**: S  
**预估工时**: 1 小时  
**前置依赖**: T-001, T-015  
**执行波次**: 7

#### 描述
更新 CI/CD 配置文件（如有），确保构建和发布流程使用新包名。

#### 涉及文件
- [MODIFY] `/.github/workflows/*.yml`（如存在）
- [MODIFY] `/.gitlab-ci.yml`（如存在）

#### 验收标准
- [ ] 构建流程使用新包名
- [ ] 发布流程配置正确
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
| Wave 1 | 7 | T-001, T-002, T-003, T-005, T-006, T-007, T-010 | 6.5 小时 |
| Wave 2 | 2 | T-004, T-008 | 2 小时 |
| Wave 3 | 1 | T-009 | 1 小时 |
| Wave 4 | 3 | T-010, T-011, T-012 | 1.5 小时 |
| Wave 5 | 2 | T-013, T-014 | 1 小时 |
| Wave 6 | 1 | T-015 | 2 小时 |
| Wave 7 | 1 | T-016 | 1 小时 |
| **总计** | **16** | - | **15 小时** |

---

## 任务统计表

| 阶段 | 优先级 | 任务数 | 总工时 | 复杂度分布 |
|------|--------|--------|--------|------------|
| 阶段 1: 核心配置模型更新 | P0 | 9 | 9 小时 | S: 6, M: 2, L: 1 |
| 阶段 2: 工具和脚本更新 | P1 | 4 | 2.5 小时 | S: 4, M: 0, L: 0 |
| 阶段 3: 清理和测试 | P2 | 3 | 3.5 小时 | S: 2, M: 1, L: 0 |
| **总计** | - | **16** | **15 小时** | **S: 12, M: 3, L: 1** |

---

## 依赖关系图

```
Wave 1 (无依赖)
├─ T-001: package.json 更新
├─ T-002: 配置模型更新
├─ T-003: src/index.ts 更新
├─ T-005: errors.ts 更新
├─ T-006: 模板文件重命名
├─ T-007: 配置模板更新 (opencode.json.hbs)
└─ T-010: 工具脚本更新

Wave 2 (依赖 Wave 1)
├─ T-004 → T-003
└─ T-008 → T-006

Wave 3 (依赖 Wave 2)
└─ T-009 → T-002, T-007, T-008

Wave 4 (依赖 Wave 1)
├─ T-010 → T-001
├─ T-011 → T-001
└─ T-012 → T-001, T-006

Wave 5 (依赖 Wave 3, Wave 4)
├─ T-013 → T-009
└─ T-014 → T-004, T-006

Wave 6 (依赖 Wave 4)
└─ T-015 → T-001~T-013

Wave 7 (依赖 Wave 6)
└─ T-016 → T-001, T-015
```

---

## 风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| Git 历史丢失 | 中 | 使用 `git mv` 而非删除 + 新建 |
| 配置模型错误 | 中 | 构建后验证生成的配置文件 |
| 测试覆盖不足 | 中 | 添加完整工作流测试用例 |
| 文档不一致 | 中 | 统一更新，使用查找替换验证 |

---

## 版本历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|---------|
| 1.0.6 | 2026-04-08 | Tasks Agent | 纳入遗漏的 `src/templates/config/opencode.json.hbs` 模板文件，添加 T-007 任务，重新编号后续任务 (T-007→T-016) |
| 1.0.5 | 2026-04-08 | Tasks Agent | 更新以符合 spec v1.0.5：移除生成产物修改项，移除向后兼容要求，移除迁移脚本和迁移文档任务 |
| 1.0.0 | 2026-04-06 | SDD Tasks Agent | 初始版本 |

---

## 下一步行动

1. ✅ 任务分解完成
2. 👉 运行 `@sddu-build T-001` 开始实现第一个任务
3. 👉 或运行 `@sddu-build T-001,T-003,T-005,T-006` 批量执行 Wave 1 的 S 级任务

---

**任务分解完成时间**: 2026-04-08  
**任务状态**: tasked  
**下一步**: 运行 `/tool sddu_update_state {"feature": "specs-tree-plugin-rename-sddu", "state": "tasked"}` 更新状态
