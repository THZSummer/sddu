# 任务分解：SDDU Skill 系统（双重定位：用户级 + 框架级）

> **文档定位**: SDDU 任务清单 — 将技术方案分解为可并行执行的原子任务，作为 build 阶段的输入  
> **前置依赖**: plan.md（技术方案 v2.0.1）、spec.md（需求规范 v2.3.2）  
> **创建人**: SDDU Tasks Agent  
> **创建时间**: 2026-07-19  
> **版本**: v1.0  
> **更新人**: SDDU Tasks Agent  
> **更新时间**: 2026-07-19  
> **更新说明**: 初始创建 — 基于 plan v2.0.1 分解 10 个原子任务，4 个执行波次

## 1. 依赖拓扑总览
> 任务依赖关系和执行顺序

```
Wave 1 ─── (无依赖，全部并行)
  TASK-001 [S]  创建 sddu-skill-discovery SKILL.md（三阶段渐进披露模型）
  TASK-002 [S]  创建 sddu-skill-creator SKILL.md（对话式引导创建 Skill）
  TASK-003 [S]  创建 sddu-skill-sync SKILL.md（源→实际目录同步逻辑）

Wave 2 ─── (依赖 Wave 1 的三阶段模型定义 + 独立无依赖)
  TASK-004 [M]  修改 12 个 Agent .hbs 模板 — 新增「Skill 发现与同步」章节
  TASK-005 [S]  修改 package.cjs — 新增 src/skills/ → dist/sddu/skills/ 拷贝逻辑
  TASK-006 [S]  验证 opencode.json.hbs — 确认 skill: "allow" 权限已启用

Wave 3 ─── (依赖 Wave 2 构建体系就绪)
  TASK-007 [S]  修改 install.sh — 创建 .sddu/skills/ 空目录 + 打印同步提示（移除拷贝逻辑）
  TASK-008 [S]  更新 README.md — 新增 Skill 系统介绍 + 三元自举闭环说明

Wave 4 ─── (依赖 Wave 1-3 全部完成)
  TASK-009 [M]  构建验证 — npm run build + npm run package，验证产出物完整性
  TASK-010 [M]  E2E 验证计划 — sddu-skill-sync 全链路可达性 + sddu skill doctor 诊断覆盖度
```

## 2. 任务列表
> 每个任务的详细定义

### TASK-001: 创建 sddu-skill-discovery SKILL.md（三阶段渐进披露模型）
> 框架级 Skill 之一——描述 SDDU Agent 如何扫描源目录发现可用 Skill

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-025 |

**描述**: 
在 `src/skills/sddu-skill-discovery/` 下创建 `SKILL.md`。Skill body 实现三阶段渐进披露模型（ADR-004）：

- **Stage 1（默认）**：描述 Agent 扫描两个源目录（`.sddu/skills/` + `.opencode/plugins/sddu/skills/`），仅获取目录名列表，不读任何文件内容（~0 tokens）
- **Stage 2（感兴趣时）**：对感兴趣的 Skill 目录读取其 `SKILL.md` 头部 YAML frontmatter（name + description），约 100 tokens/skill
- **Stage 3（使用时）**：返回 Skill 目录路径，由 Agent 自行进入目录按需读取 SKILL.md body 和 references/、scripts/ 等资源文件

description 字段明确标注「仅覆盖 SDDU 源目录扫描（流程①），不涉及 LLM Agent 原生发现机制」。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/skills/sddu-skill-discovery/SKILL.md` |

**验收标准**:
- [ ] SKILL.md 存在于 `src/skills/sddu-skill-discovery/` 目录下
- [ ] frontmatter 包含 name: `sddu-skill-discovery` 和 description（明确标注仅覆盖流程①）
- [ ] body 明确描述三阶段渐进披露流程
- [ ] body 包含两个源目录路径：`.sddu/skills/`（用户级）、`.opencode/plugins/sddu/skills/`（框架级）
- [ ] body 描述命名空间规则：`sddu-` 前缀 = 框架级，无前缀 = 用户级
- [ ] body 不超过 500 行（NFR-006）

**验证命令**:
```bash
# 检查文件存在
test -f src/skills/sddu-skill-discovery/SKILL.md && echo "PASS: file exists" || echo "FAIL: file missing"

# 检查 frontmatter name
grep -A1 "^name:" src/skills/sddu-skill-discovery/SKILL.md | grep "sddu-skill-discovery" && echo "PASS: name field" || echo "FAIL: name field"

# 检查三阶段关键词
grep -q "Stage 1\|Stage 2\|Stage 3\|三阶段\|渐进披露" src/skills/sddu-skill-discovery/SKILL.md && echo "PASS: three-stage model" || echo "FAIL: three-stage model"

# 检查源目录路径
grep -q "\.sddu/skills" src/skills/sddu-skill-discovery/SKILL.md && echo "PASS: user source dir" || echo "FAIL: user source dir"
grep -q "\.opencode/plugins/sddu/skills" src/skills/sddu-skill-discovery/SKILL.md && echo "PASS: framework source dir" || echo "FAIL: framework source dir"

# 检查行数限制
LINES=$(wc -l < src/skills/sddu-skill-discovery/SKILL.md); [ "$LINES" -le 500 ] && echo "PASS: line count $LINES <= 500" || echo "WARN: line count $LINES > 500"
```

---

### TASK-002: 创建 sddu-skill-creator SKILL.md（对话式引导创建 Skill）
> 框架级 Skill 之二——用 Skill 创建 Skill，形成自举闭环

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-008, FR-009, FR-010 |

**描述**:
在 `src/skills/sddu-skill-creator/` 下创建 `SKILL.md`。Skill body 描述对话式引导工作流：

1. **确定 Skill 用途**：询问用户「这个 Skill 做什么」，明确核心场景
2. **撰写 description**：提供 2-3 个候选 description 方案，指导触发语义优化（避免与已有 Skill description 重叠、使用自然语言而非关键词堆砌），长度 ≤ 1024 字符
3. **编写 body**：Progressive Disclosure 原则指导——Metadata(~100 words) → Body(on trigger) → References(as needed)
4. **输出 SKILL.md**：产出的 SKILL.md frontmatter 字段完整（name + description），name 符合 `^[a-z0-9]+(-[a-z0-9]+)*$` 约束，body ≤ 500 行
5. **触发测试（可选）**：提供 3-5 个测试场景验证触发准确率

包含自举闭环说明：skill-creator 既可用于创建用户级 Skill（直接产出），也可用于创建框架级 Skill 初稿（需走 SDDU 完整流程审查）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/skills/sddu-skill-creator/SKILL.md` |

**验收标准**:
- [ ] SKILL.md 存在于 `src/skills/sddu-skill-creator/` 目录下
- [ ] frontmatter 包含 name: `sddu-skill-creator` 和触发级 description
- [ ] body 包含 5 步对话式引导工作流（用途→description→body→输出→测试）
- [ ] body 包含 description 撰写指导（2-3 候选方案、避免重叠、自然语言）
- [ ] body 包含 Progressive Disclosure 原则说明
- [ ] body 包含自举闭环说明（用户级 vs 框架级产出路径差异）
- [ ] body 不超过 500 行（NFR-006）

**验证命令**:
```bash
# 检查文件存在
test -f src/skills/sddu-skill-creator/SKILL.md && echo "PASS: file exists" || echo "FAIL: file missing"

# 检查 frontmatter
grep -A1 "^name:" src/skills/sddu-skill-creator/SKILL.md | grep "sddu-skill-creator" && echo "PASS: name field" || echo "FAIL: name field"

# 检查对话式引导关键词
grep -q "对话式\|引导\|Progressive Disclosure\|description.*候选\|触发测试" src/skills/sddu-skill-creator/SKILL.md && echo "PASS: conversational workflow keywords" || echo "FAIL: conversational workflow"

# 检查自举闭环关键词
grep -q "自举\|bootstrapp\|框架级\|用户级\|SDDU.*流程" src/skills/sddu-skill-creator/SKILL.md && echo "PASS: bootstrapping cycle" || echo "FAIL: bootstrapping cycle"

# 检查行数限制
LINES=$(wc -l < src/skills/sddu-skill-creator/SKILL.md); [ "$LINES" -le 500 ] && echo "PASS: line count $LINES <= 500" || echo "WARN: line count $LINES > 500"
```

---

### TASK-003: 创建 sddu-skill-sync SKILL.md（源→实际目录同步逻辑）
> 框架级 Skill 之三——用 Skill 实现按需同步，完成三元自举闭环

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 1 |
| **对应 FR** | FR-028, FR-020 |

**描述**:
在 `src/skills/sddu-skill-sync/` 下创建 `SKILL.md`。Skill body 描述完整的源目录→实际目录同步逻辑：

(a) **扫描源目录**：扫描 `.sddu/skills/`（用户级） + `.opencode/plugins/sddu/skills/`（框架级），识别有效 Skill（包含有效 SKILL.md 的目录）
(b) **检测实际目录路径**：检测当前 LLM Agent 工具的实际目录路径（OpenCode → `.opencode/skills/`，Claude Code → `.claude/skills/` 等），使用通用自然语言描述，不硬编码路径
(c) **全量拷贝 + 管辖标识**：将所有源目录中的 Skill 全量拷贝到实际目录；框架级 Skill 保持 `sddu-` 前缀，用户级 Skill 保持原名；命名冲突时框架级优先；拷贝后在目标目录创建/更新 `.sddu-manifest.txt` 管辖标识清单
(d) **残留清理**：检查实际目录中是否存在于源目录中已删除的 SDDU 管辖 Skill（依据 .sddu-manifest.txt），若有则清理；不清理非管辖 Skill
(e) **同步报告**：输出同步摘要——新增/更新/删除的 Skill 数量及清单

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| NEW | `src/skills/sddu-skill-sync/SKILL.md` |

**验收标准**:
- [ ] SKILL.md 存在于 `src/skills/sddu-skill-sync/` 目录下
- [ ] frontmatter 包含 name: `sddu-skill-sync` 和触发级 description
- [ ] body 包含 5 步同步流程（a-e 全部覆盖）
- [ ] body 描述管辖标识机制（`.sddu-manifest.txt`）
- [ ] body 描述命名冲突处理（框架级优先）
- [ ] body 描述实际目录路径检测（通用措辞，非硬编码）
- [ ] body 包含用户触发语义示例（如「同步 SDDU Skills」）
- [ ] body 不超过 500 行（NFR-006）

**验证命令**:
```bash
# 检查文件存在
test -f src/skills/sddu-skill-sync/SKILL.md && echo "PASS: file exists" || echo "FAIL: file missing"

# 检查 frontmatter
grep -A1 "^name:" src/skills/sddu-skill-sync/SKILL.md | grep "sddu-skill-sync" && echo "PASS: name field" || echo "FAIL: name field"

# 检查同步流程关键词
grep -q "扫描源目录\|实际目录\|全量拷贝\|管辖标识\|残留清理\|同步报告" src/skills/sddu-skill-sync/SKILL.md && echo "PASS: sync workflow keywords" || echo "FAIL: sync workflow"

# 检查管辖标识
grep -q "sddu-manifest\|管辖\|manifest" src/skills/sddu-skill-sync/SKILL.md && echo "PASS: manifest mechanism" || echo "FAIL: manifest"

# 检查行数限制
LINES=$(wc -l < src/skills/sddu-skill-sync/SKILL.md); [ "$LINES" -le 500 ] && echo "PASS: line count $LINES <= 500" || echo "WARN: line count $LINES > 500"
```

---

### TASK-004: 修改 12 个 Agent .hbs 模板 — 新增「Skill 发现与同步」章节
> 为所有 SDDU Agent 注入统一的 Skill 发现能力（仅硬编码 discovery，sync 和 creator 间接发现）

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-001（三阶段模型定义） |
| **执行波次** | 2 |
| **对应 FR** | FR-026, G-008 |

**描述**:
为全部 12 个 Agent `.hbs` 模板新增 `## Skill 发现与同步` 章节。内容为三阶段渐进披露指令，仅硬编码 `sddu-skill-discovery` 引用——`sddu-skill-sync` 和 `sddu-skill-creator` 通过 discovery 间接发现。

**标准化文本**（插入位置：`## N. 规则` 与 `## 修订记录` 之间）:

```markdown
## N. Skill 发现与同步
> 三阶段渐进披露模型 — 用 Skill 发现 Skill

### Stage 1 — 目录扫描（默认执行，零成本）
每次会话启动时，使用 `ls`/`readdir` 类工具扫描以下源目录获取 Skill 目录名清单（仅目录名，不读文件内容）：
- **用户级**：`.sddu/skills/`
- **框架级**：`.opencode/plugins/sddu/skills/`
返回：`sddu-skill-discovery/`, `sddu-skill-creator/`, `sddu-skill-sync/`, ...（目录名列表）

### Stage 2 — frontmatter 读取（按兴趣触发）
根据当前任务语义，对感兴趣的 skill 读取其 `SKILL.md` 头部 YAML frontmatter（仅 name + description 字段），判断是否与任务相关。
返回：name + description（约 100 tokens/skill）

### Stage 3 — 目录路径引用（按需加载）
确定使用某 skill 后，获取该 skill 的目录路径，进入目录按需读取 `SKILL.md` body 及 `references/`、`scripts/` 等资源，按指引执行。
返回：目录路径（0 tokens context 占用）

### 同步
所有 Skill 的实际运行副本（LLM Agent 原生机制）位于当前 Agent 工具的实际目录（OpenCode → `.opencode/skills/`，Claude Code → `.claude/skills/`）。若 Stage 1 发现实际目录中无 SDDU Skill，则按 Stage 2→3 流程从源目录发现并加载 `sddu-skill-sync` 执行同步，将源目录 Skill 全量拷贝到实际目录。
```

**节号映射**：sddu.md.hbs（coordinator）使用 §14，其他 11 个 Agent 按其现有最大节号 +1 编号（如 sddu-build 现有 §11，使用 §12）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/templates/agents/sddu.md.hbs`（coordinator） |
| MODIFY | `src/templates/agents/sddu-discovery.md.hbs` |
| MODIFY | `src/templates/agents/sddu-spec.md.hbs` |
| MODIFY | `src/templates/agents/sddu-plan.md.hbs` |
| MODIFY | `src/templates/agents/sddu-tasks.md.hbs` |
| MODIFY | `src/templates/agents/sddu-build.md.hbs` |
| MODIFY | `src/templates/agents/sddu-review.md.hbs` |
| MODIFY | `src/templates/agents/sddu-validate.md.hbs` |
| MODIFY | `src/templates/agents/sddu-roadmap.md.hbs` |
| MODIFY | `src/templates/agents/sddu-tree.md.hbs` |
| MODIFY | `src/templates/agents/sddu-docs.md.hbs` |
| MODIFY | `src/templates/agents/sddu-fast.md.hbs` |

**验收标准**:
- [ ] 全部 12 个 Agent 模板包含 `## Skill 发现与同步` 或 `## N. Skill 发现与同步` 章节
- [ ] 每个模板的三阶段文本措辞一致（可与 coordinator 模板对比验证）
- [ ] 每个模板仅硬编码 `sddu-skill-discovery` 引用（不硬编码 sync 或 creator）
- [ ] 插入位置正确——位于 `## 规则` 与 `## 修订记录` 之间
- [ ] coordinator 模板（sddu.md.hbs）的节号对齐为 §14
- [ ] 各模板的节号按各自原有最大节号 +1（如 sddu-build → §12）

**验证命令**:
```bash
# 检查所有 12 个模板包含 Skill 章节
for f in src/templates/agents/sddu*.hbs; do
  if grep -q "Skill 发现与同步" "$f"; then
    echo "PASS: $f"
  else
    echo "FAIL: $f - missing Skill section"
  fi
done

# 检查只硬编码 discovery，不硬编码 sync/creator
for f in src/templates/agents/sddu*.hbs; do
  # 确认有 sddu-skill-discovery 引用
  grep -q "sddu-skill-discovery" "$f" && echo "OK discovery: $f" || echo "WARN: $f missing discovery ref"
  # 确认三阶段文本中没有不必要的 sddu-skill-sync 或 sddu-skill-creator 直接引用（同步段除外）
  # 同步段允许提及 sddu-skill-sync（作为间接发现示例）
done

# 检查三阶段关键词全覆盖
for f in src/templates/agents/sddu*.hbs; do
  if grep -q "Stage 1" "$f" && grep -q "Stage 2" "$f" && grep -q "Stage 3" "$f"; then
    echo "PASS: $f three-stage covered"
  else
    echo "FAIL: $f missing stages"
  fi
done

# 验证 coordinator 一致性：对比 sddu.md.hbs 的 Skill 章节与 TASK-001 中的三阶段文本
diff <(sed -n '/## .*Skill 发现与同步/,/^## /p' src/templates/agents/sddu.md.hbs | head -n -1) \
     <(sed -n '/## .*Skill 发现与同步/,/^## /p' src/templates/agents/sddu-build.md.hbs | head -n -1) \
     && echo "PASS: wording consistency" || echo "WARN: wording difference (needs review)"
```

---

### TASK-005: 修改 package.cjs — 新增 src/skills/ 拷贝逻辑
> 确保构建流程将框架级 Skill SKILL.md 文件打包到 dist/sddu/skills/

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无（独立于 Wave 1，仅依赖现有 package.cjs 结构） |
| **执行波次** | 2 |
| **对应 FR** | FR-002 |

**描述**:
在 `scripts/package.cjs` 的 `packageSingleVersion()` 函数中新增 `src/skills/` → `dist/sddu/skills/` 的目录拷贝逻辑。约 10 行代码。

**具体改动位置**：Step 5（复制 opencode.json）之后，Step 6（创建 BUILD_INFO.json）之前。

**拷贝行为**：
```javascript
// 新增：复制 Skill 源文件到构建产物
const skillsSourceDir = path.join(__dirname, '..', 'src', 'skills');
const skillsTargetDir = path.join(distDir, 'skills');
if (await fs.pathExists(skillsSourceDir)) {
  await fs.ensureDir(skillsTargetDir);
  await fs.copy(skillsSourceDir, skillsTargetDir);
  console.log('🔄 复制 Skill 源文件到 dist/sddu/skills/ ...');
}
```

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `scripts/package.cjs` |

**验收标准**:
- [ ] package.cjs 新增约 10 行拷贝逻辑
- [ ] 拷贝源为 `src/skills/`，目标为 `dist/sddu/skills/`
- [ ] 不破坏现有构建流程（clean → install → build → package 完整链路可执行）
- [ ] 构建完成后 `dist/sddu/skills/` 包含 3 个 Skill 目录

**验证命令**:
```bash
# 执行完整构建
npm run build && npm run package

# 检查构建产物中包含 skills 目录
test -d dist/sddu/skills && echo "PASS: skills dir exists in dist" || echo "FAIL: skills dir missing"

# 检查三个 Skill 目录
for skill in sddu-skill-discovery sddu-skill-creator sddu-skill-sync; do
  test -f "dist/sddu/skills/$skill/SKILL.md" && echo "PASS: $skill" || echo "FAIL: $skill missing"
done

# 检查 package.cjs 中新增的 skills 拷贝代码
grep -q "src/skills" scripts/package.cjs && echo "PASS: copy logic present" || echo "FAIL: copy logic missing"
```

---

### TASK-006: 验证 opencode.json.hbs — 确认 skill 权限已启用
> 确保 `skill: "allow"` 权限已配置，OpenCode 原生 Skill 机制可用

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | 无 |
| **执行波次** | 2 |
| **对应 FR** | FR-006 |

**描述**:
检查 `src/adapters/opencode/templates/opencode.json.hbs` 中 `permission` 块是否包含 `"skill": "allow"`。

如果已存在（当前状态：已存在），验证通过，无需修改。
如果缺失，添加 `"skill": "allow"` 到 permission 块中。

同时验证 `tools.skill` 未在任何 Agent 配置中设为 `false`（按 FR-007 要求，默认所有 Agent 启用 Skill 能力）。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `src/adapters/opencode/templates/opencode.json.hbs`（仅当 skill 权限缺失时） |

**验收标准**:
- [ ] `permission` 块包含 `"skill": "allow"`
- [ ] 无 Agent 配置中 `tools.skill` 设为 `false`（或仅文档说明的例外）
- [ ] 验证完成后输出确认报告

**验证命令**:
```bash
# 检查 skill 权限
grep -A1 '"skill"' src/adapters/opencode/templates/opencode.json.hbs | grep -q "allow" && echo "PASS: skill permission is allow" || echo "FAIL: skill permission needs fix"

# 检查是否有 Agent 禁用 skill 工具（不应存在）
grep -n '"skill".*false' src/adapters/opencode/templates/opencode.json.hbs && echo "WARN: found skill: false in some agent" || echo "PASS: no agent disables skill"
```

---

### TASK-007: 修改 install.sh — 创建 .sddu/skills/ 目录 + 同步提示
> 安装脚本不再执行 Skill 拷贝，改为初始化空目录 + 提示用户运行 sddu-skill-sync

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-005（package.cjs 构建产物中包含 skills/） |
| **执行波次** | 3 |
| **对应 FR** | FR-020, G-009 |

**描述**:
修改 `install.sh` 两个位置：

**改动 1 — Step 4（创建目录，约第 204 行）**：
在现有目录创建循环中新增 `.sddu/skills/`：
```bash
for dir in "..." ".../.sddu/skills"; do
```

**改动 2 — Step 8（初始化工作空间，约第 409-412 行）**：
替换 `print_color "${GREEN}[OK] .sddu/ directories ready${NC}"` 为：
```bash
print_color "${GREEN}[OK] .sddu/ directories ready${NC}"

# 提示用户运行 sddu-skill-sync 同步 Skills
print_color "${CYAN}[INFO] SDDU Skills 需要在首次使用前同步到实际目录${NC}"
print_color "${YELLOW}👉 在 OpenCode 中运行以下命令同步 SDDU Skills：${NC}"
echo "    @sddu 同步 SDDU Skills"
echo ""
print_color "${GREEN}[OK] 提示：SDDU Skills（发现/创建/同步）安装完成，使用前请先同步${NC}"
```

**不修改 Step 5**：Step 5 继续将框架源拷贝到 `.opencode/plugins/sddu/`，其中包含 `skills/` 子目录（由 package.cjs 打包的框架级 Skill）——这是插件分发逻辑，不受 sync 机制影响。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `install.sh` |

**验收标准**:
- [ ] Step 4 创建 `.sddu/skills/` 空目录（`mkdir -p`，不报错）
- [ ] Step 8 打印同步提示（「运行 @sddu 同步 SDDU Skills」）
- [ ] Step 5 继续拷贝框架源到 `.opencode/plugins/sddu/`（不受影响）
- [ ] install.sh 中不存在旧的 Skill 拷贝逻辑（如 `cp .../skills/`）
- [ ] 执行 install.sh 后 `.opencode/skills/` 为空或仅有用户手动放置的 Skill

**验证命令**:
```bash
# 检查 Step 4 包含 .sddu/skills 创建
grep -q "\.sddu/skills" install.sh && echo "PASS: Step 4 creates .sddu/skills/" || echo "FAIL: Step 4 missing"

# 检查 Step 8 包含同步提示
grep -q "sddu-skill-sync\|同步" install.sh && echo "PASS: Step 8 sync hint" || echo "FAIL: Step 8 missing sync hint"

# 确认无旧的拷贝逻辑残留
grep -n "cp.*skills\|copy.*skills\|拷贝.*skill" install.sh && echo "WARN: found potential copy logic" || echo "PASS: no copy logic in install.sh"

# 端到端验证：执行安装后检查
# （在 TASK-009/TASK-010 中运行完整 E2E）
```

---

### TASK-008: 更新 README.md — 新增 Skill 系统章节
> 在项目文档中介绍 Skill 系统的双重定位、三元自举闭环和两套发现流程

| 属性 | 值 |
|------|-----|
| **复杂度** | S |
| **前置依赖** | TASK-001, TASK-002, TASK-003（需知道 Skill 名称和职责才能描述） |
| **执行波次** | 3 |
| **对应 FR** | FR-018 |

**描述**:
在 `README.md` 中新增 Skill 系统章节。插入位置建议：在 `## ⚡ 双模架构` 之后（或 `## 🤖 Agent 速览` 之前），新增一个独立章节 `## 🧩 Skill 系统（能力扩展）`。

内容覆盖：
1. **Skill 定位**：SDDU 的轻量能力扩展机制——新能力首选 Skill 而非新增 Agent
2. **三元自举闭环**：sddu-skill-discovery（发现）+ sddu-skill-creator（创建）+ sddu-skill-sync（同步）
3. **源目录 + 实际目录双层架构**：用户级 `.sddu/skills/`、框架级 `.opencode/plugins/sddu/skills/`（源目录）→ 同步到 `.opencode/skills/`（实际目录）
4. **两套发现流程**：SDDU Agent 源目录扫描（流程①）+ LLM Agent 原生发现（流程②）互不影响
5. **快速上手**：如何使用内置 Skill、「同步 SDDU Skills」命令

同时在 `## 🔧 完整安装` 部分补充安装后的首次同步提示。

**涉及文件**:

| 操作 | 文件路径 |
|:--:|------|
| MODIFY | `README.md` |

**验收标准**:
- [ ] README.md 新增 Skill 系统章节（`## 🧩 Skill 系统`）
- [ ] 章节包含三元自举闭环说明（discovery + creator + sync）
- [ ] 章节包含双层架构和两套发现流程说明
- [ ] 章节包含「同步 SDDU Skills」使用提示
- [ ] 安装指南部分包含首次同步提示
- [ ] 不破坏现有 README.md 结构和章节组织

**验证命令**:
```bash
# 检查 Skill 章节存在
grep -q "Skill 系统\|Skill" README.md && echo "PASS: Skill section exists" || echo "FAIL: missing Skill section"

# 检查三元闭环
grep -q "sddu-skill-discovery.*sddu-skill-creator.*sddu-skill-sync" README.md || \
grep -q "发现.*技能\|discovery.*creator.*sync\|三元" README.md && \
echo "PASS: three-bootstrap cycle" || echo "FAIL: missing bootstrap cycle"

# 检查双层架构
grep -q "源目录\|实际目录\|\.opencode/plugins/sddu/skills" README.md && echo "PASS: two-layer architecture" || echo "FAIL: missing architecture"

# 检查同步提示
grep -q "同步.*sddu-skill-sync" README.md && echo "PASS: sync hint" || echo "FAIL: missing sync hint"
```

---

### TASK-009: 构建验证 — npm run build + npm run package
> 验证完整构建链路产出所有预期文件

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-001 ~ TASK-008 全部完成 |
| **执行波次** | 4 |
| **对应 FR** | FR-002, FR-025, FR-026, FR-028 |

**描述**:
执行完整的构建链路，验证所有 Wave 1-3 的产物正确集成：

1. `npm run build` — 编译所有 Agent 模板 + TypeScript
2. `npm run package` — 打包生成 `dist/sddu/`
3. 逐项检查 dist/sddu/ 目录结构与 plan §5 文件影响表一致

验证清单：
- [ ] `dist/sddu/skills/` 存在，包含 3 个 Skill 子目录（discovery/creator/sync），每个含 SKILL.md
- [ ] `dist/sddu/agents/` 中 12 个 Agent 文件全部包含 `Skill 发现与同步` 章节
- [ ] `dist/sddu/opencode.json` 中 `permission.skill = "allow"`
- [ ] `dist/sddu/install.sh` 中包含 `.sddu/skills/` 创建 + 同步提示
- [ ] `dist/sddu/README.md` 中包含 Skill 系统章节
- [ ] 构建过程零 error

**涉及文件**:
> 本任务不修改文件 — 仅运行构建命令并验证产出

**验收标准**:
- [ ] `npm run build` 执行成功（exit code 0）
- [ ] `npm run package` 执行成功（exit code 0）
- [ ] `dist/sddu/skills/` 包含 3 个 Skill 目录
- [ ] `dist/sddu/agents/` 中 12 个 Agent 全部含 Skill 发现章节
- [ ] `dist/sddu/opencode.json` permission.skill = "allow"
- [ ] 构建过程无 error/warning

**验证命令**:
```bash
echo "=== 1/5: Clean build ==="
npm run clean 2>/dev/null || rm -rf dist/

echo "=== 2/5: Build ==="
npm run build || { echo "FAIL: build error"; exit 1; }

echo "=== 3/5: Package ==="
npm run package || { echo "FAIL: package error"; exit 1; }

echo "=== 4/5: Verify skills in dist ==="
test -d dist/sddu/skills && echo "PASS: skills dir exists" || echo "FAIL: skills dir missing"
for skill in sddu-skill-discovery sddu-skill-creator sddu-skill-sync; do
  test -f "dist/sddu/skills/$skill/SKILL.md" && echo "PASS: $skill" || echo "FAIL: $skill"
done

echo "=== 5/5: Verify agent Skill sections ==="
AGENT_COUNT=$(ls dist/sddu/agents/*.hbs 2>/dev/null | wc -l)
echo "Agent files found: $AGENT_COUNT"
for f in dist/sddu/agents/*.hbs; do
  grep -q "Skill 发现与同步" "$f" && echo "PASS: $(basename $f)" || echo "FAIL: $(basename $f)"
done

echo "=== Build verification complete ==="
```

---

### TASK-010: E2E 验证计划 — 全链路可达性 + Skill Doctor 诊断覆盖度
> 输出供 validate 阶段执行的 E2E 验证计划，确认 plan §10 技术验证项覆盖

| 属性 | 值 |
|------|-----|
| **复杂度** | M |
| **前置依赖** | TASK-009（构建验证通过） |
| **执行波次** | 4 |
| **对应 FR** | FR-005, FR-020, FR-025, FR-028 |

**描述**:
准备供 validate 阶段使用的 E2E 验证计划。本任务**不执行**实际测试（那是 validate 的职责），而是：

1. **验证 sddu-skill-sync 全链路可达性**（plan §10.1）：
   - 在 OpenCode 环境中模拟用户对话「同步 SDDU Skills」
   - 验证路径：Agent 硬编码 discovery 引用 → 扫描源目录 → 发现 sync → 加载 sync Skill → Agent 理解 Skill body 中的同步逻辑 → 执行文件操作工具
   - 记录可达性结论（通过/失败/部分通过）

2. **验证 sddu skill doctor 诊断覆盖度**（plan §10.2）：
   - 对照 EC-008 场景清单，逐项验证诊断命令的覆盖度
   - EC-008 场景：有效 Skill / 格式错误 SKILL.md / 缺失 SKILL.md 的目录 / 命名冲突 / 命名规范违规 / 管辖标识异常 / 源目录与实际目录不一致

3. **生成验证报告模板**：包含验证场景 → 预期行为 → 实际行为 → 通过/失败的表格

**涉及文件**:
> 本任务不修改源码文件 — 仅输出验证计划文档

**验收标准**:
- [ ] sddu-skill-sync 全链路可达性分析报告完成（覆盖 5 步链路）
- [ ] sddu skill doctor 诊断覆盖度矩阵完成（覆盖 EC-008 全部 7 个场景）
- [ ] 验证计划文档明确标注供 validate 阶段执行

**验证命令**:
```bash
# 本任务为计划文档产出，验证命令用于 self-check
echo "=== sddu-skill-sync reachability chain ==="
echo "Chain: Agent template → discovery ref → scan source → find sync → load sync → understand sync body → execute file ops"
echo "Status: [ ] Verified / [ ] Partial / [ ] Blocked"
echo "Blocker (if any): ______"

echo "=== sddu skill doctor coverage matrix ==="
for scenario in \
  "valid skill detection" \
  "malformed SKILL.md" \
  "missing SKILL.md" \
  "naming conflict" \
  "naming convention violation" \
  "manifest corruption" \
  "source/actual mismatch"
do
  echo "  EC-008: $scenario -> [ ] Covered / [ ] Partial / [ ] Gap"
done
```

---

## 3. 任务汇总
> 任务数量、复杂度和波次的统计总览

| 统计项 | 数值 |
|--------|:--:|
| 总任务数 | 10 |
| S 级 (简单) | 7 |
| M 级 (中等) | 3 |
| L 级 (复杂) | 0 |
| 执行波次 | 4 |

| FR 覆盖 | 覆盖任务 |
|---------|---------|
| FR-002 (框架源目录) | TASK-005, TASK-009 |
| FR-006 (权限控制) | TASK-006 |
| FR-008/009/010 (skill-creator) | TASK-002 |
| FR-018 (写作指南) | TASK-008 |
| FR-020 (同步机制) | TASK-003, TASK-007 |
| FR-025 (skill-discovery) | TASK-001 |
| FR-026 (Agent 模板引用) | TASK-004 |
| FR-028 (skill-sync 内置) | TASK-003 |
| G-008 (模板硬编码) | TASK-004 |
| G-009 (sddu-skill-sync) | TASK-003, TASK-007 |

## 4. 执行策略
> 各波次的执行说明

| 波次 | 任务 | 策略 |
|:--:|------|------|
| 1 | TASK-001, TASK-002, TASK-003 | **并行执行** — 三个框架级 Skill SKILL.md 互不依赖，可同时创建。均为纯 Markdown 文件，S 级复杂度。 |
| 2 | TASK-004, TASK-005, TASK-006 | **并行执行** — TASK-004 依赖 TASK-001（三阶段文本已定义）、TASK-005 和 TASK-006 独立。12 个 Agent 模板内容相同可批量修改。 |
| 3 | TASK-007, TASK-008 | **并行执行** — install.sh 和 README.md 改动互不干扰。依赖 Wave 2 构建体系就绪。 |
| 4 | TASK-009 → TASK-010 | **顺序执行** — TASK-009 先完成构建验证，确保所有产物正确；TASK-010 基于构建产物准备验证计划。 |

## 修订记录
> 记录本文档的版本变更历史

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 — 基于 plan v2.0.1 分解 10 个原子任务，4 个波次（S×7 / M×3 / L×0），覆盖 12 FR + 2 Goal | 2026-07-19 | SDDU Tasks Agent |
