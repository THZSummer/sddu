#!/usr/bin/env node
/**
 * SDD Agent Generator
 * 从源模板生成所有构建产物到 dist/
 * 
 * 输入：
 *   - src/templates/agents/*.md.hbs (10 个 agent 模板)
 *   - src/templates/config/opencode.json.hbs (1 个配置模板)
 * 
 * 输出：
 *   - dist/templates/agents/*.md (18 个 agent 定义)
 *   - dist/opencode.json (配置模板副本)
 */

const fs = require('fs');
const path = require('path');

const AGENT_SRC_DIR = path.join(__dirname, 'src', 'templates', 'agents');
const CONFIG_SRC_DIR = path.join(__dirname, 'src', 'templates', 'config');
const AGENT_OUT_DIR = path.join(__dirname, 'dist', 'templates', 'agents');

// Agent 映射配置
const AGENT_MAP = [
  { num: '0', short: 'discovery', desc: '需求挖掘专家' },
  { num: '1', short: 'spec', desc: '规范编写专家' },
  { num: '2', short: 'plan', desc: '技术规划专家' },
  { num: '3', short: 'tasks', desc: '任务分解专家' },
  { num: '4', short: 'build', desc: '任务实现专家' },
  { num: '5', short: 'review', desc: '代码审查专家' },
  { num: '6', short: 'validate', desc: '验证专家' }
];

// 清理并创建输出目录
if (fs.existsSync(AGENT_OUT_DIR)) {
  fs.readdirSync(AGENT_OUT_DIR).forEach(file => {
    if (file.endsWith('.md')) {
      fs.unlinkSync(path.join(AGENT_OUT_DIR, file));
    }
  });
} else {
  fs.mkdirSync(AGENT_OUT_DIR, { recursive: true });
}

// 读取源模板
function readTemplate(dir, name) {
  const filePath = path.join(dir, `${name}.hbs`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

// 生成带序号的 agent 文件
function generateNumberedAgent(template, num, short, desc) {
  const frontMatterMatch = template.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontMatterMatch) {
    throw new Error(`No front matter in ${short}`);
  }

  let frontMatter = frontMatterMatch[1];
  const content = template.slice(frontMatterMatch[0].length);

  // 更新 description
  frontMatter = frontMatter.replace(
    /description:.*$/,
    `description: SDD ${desc} (阶段 ${num}/6)`
  );

  // 移除 model（配置在 opencode.json 中），保留 temperature
  frontMatter = frontMatter.replace(/^model:.*$\r?\n?/gm, '');

  // 根据阶段号生成正确的执行顺序
  const executionOrder = num === '0' 
    ? '[当前] 0.discovery → 1.spec → 2.plan → 3.tasks → 4.build → 5.review → 6.validate'
    : `1.spec → 2.plan → 3.tasks → 4.build → 5.review → 6.validate`;

  return `---
${frontMatter}
---

# 🎯 SDD 工作流 - 阶段 ${num}/6

## 执行顺序
\`\`\`
${executionOrder}
\`\`\`

## 依赖关系
- **前置条件**: 见各阶段说明
- **输出**: 见各阶段说明
- **下游**: 见各阶段说明

---

# @sdd-${num}-${short} - SDD ${desc}（阶段 ${num}/6）

> 💡 **提示**: 也可以用 \`@sdd-${short}\`（两者等价）

---

${content}
`;
}

// 生成短名版本的 agent 文件
function generateShortAgent(template, short, desc) {
  const frontMatterMatch = template.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontMatterMatch) {
    throw new Error(`No front matter in ${short}`);
  }

  let frontMatter = frontMatterMatch[1];
  const content = template.slice(frontMatterMatch[0].length);

  // 更新 description
  frontMatter = frontMatter.replace(
    /description:.*$/,
    `description: SDD ${desc} (短名)`
  );

  // 移除 model（配置在 opencode.json 中），保留 temperature
  frontMatter = frontMatter.replace(/^model:.*$\r?\n?/gm, '');

  return `---
${frontMatter}
---
${content}
`;
}

// 主函数
function build() {
  console.log('🔨 Building SDD...\n');
  
  // ========== 构建 Agent 定义 ==========
  console.log('📄 Building agents...');
  console.log(`   Source: src/templates/agents/*.md.hbs (11 files: 7 stages + sdd + sdd-help + sdd-roadmap + sdd-docs)`);
  console.log(`   Output: dist/templates/agents/*.md (18 files: 14 numbered/short + 4 special)\n`);
  
  AGENT_MAP.forEach(({ num, short, desc }) => {
    const template = readTemplate(AGENT_SRC_DIR, `sdd-${short}.md`);
    
    // 生成带序号版本
    const numberedPath = path.join(AGENT_OUT_DIR, `sdd-${num}-${short}.md`);
    fs.writeFileSync(numberedPath, generateNumberedAgent(template, num, short, desc), 'utf-8');
    console.log(`  ✅ dist/templates/agents/sdd-${num}-${short}.md`);
    
    // 生成短名版本
    const shortPath = path.join(AGENT_OUT_DIR, `sdd-${short}.md`);
    fs.writeFileSync(shortPath, generateShortAgent(template, short, desc), 'utf-8');
    console.log(`  ✅ dist/templates/agents/sdd-${short}.md`);
  });
  
  // 复制特殊 Agent (不需要生成编号版本)
  ['sdd', 'sdd-help', 'sdd-roadmap', 'sdd-docs'].forEach(name => {
    const template = readTemplate(AGENT_SRC_DIR, `${name}.md`);
    const outputPath = path.join(AGENT_OUT_DIR, `${name}.md`);
    fs.writeFileSync(outputPath, template, 'utf-8');
    console.log(`  ✅ dist/templates/agents/${name}.md`);
  });
  
  // ========== 复制配置模板 ==========
  console.log('\n📋 Copying config template...');
  const configSrc = path.join(CONFIG_SRC_DIR, 'opencode.json.hbs');
  const configDest = path.join(__dirname, 'dist', 'opencode.json');
  
  if (fs.existsSync(configSrc)) {
    // 复制并移除.hbs 后缀（内容不变，因为 JSON 不需要处理）
    const configContent = fs.readFileSync(configSrc, 'utf-8');
    fs.writeFileSync(configDest, configContent, 'utf-8');
    console.log('  ✅ dist/opencode.json');
  } else {
    console.log('  ⚠️  src/templates/config/opencode.json.hbs not found');
  }
  
  console.log('\n✅ Build complete!');
  console.log('\n📦 Output structure:');
  console.log('   dist/');
  console.log('   ├── opencode.json          (配置模板)');
  console.log('   ├── index.js               (插件入口)');
  console.log('   ├── agents/                (插件代码)');
  console.log('   ├── state/                 (状态机)');
  console.log('   └── templates/agents/      (18 个 agent 定义)');
}

build();
