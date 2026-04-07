#!/usr/bin/env node
/**
 * SDD/SDDU Agent Generator
 * 从源模板生成所有构建产物到 dist/
 * 
 * 输入：
 *   - src/templates/agents/*.md.hbs (11 个 agent 模板)
 * 
 * 输出（新结构）：
 *   - dist/templates/agents/*.md (同时支持 SDD 和 SDDU 代理定义)
 *   - 为 SDDU 生成新的代理名称
 */

const fs = require('fs');
const path = require('path');

const AGENT_SRC_DIR = path.join(__dirname, 'src', 'templates', 'agents');
const AGENT_OUT_DIR = path.join(__dirname, 'dist', 'templates', 'agents');

// SDDU 和 SDD 代理映射配置
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

// 读取源模板 (兼容 SDD 和 SDDU 模板)
function readTemplate(dir, name) {
  // 尝试 SDDU 名称首先，然后回退到 SDD 名称
  let filePath = path.join(dir, `${name}.hbs`);
  if (!fs.existsSync(filePath)) {
    // 尝试使用 sddu- 前缀名称
    const sdduName = name.replace(/^sdd(-|$)/, 'sddu$1');
    filePath = path.join(dir, `${sdduName}.hbs`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Template not found: ${name} nor ${sdduName}`);
    }
  }
  return fs.readFileSync(filePath, 'utf-8');
}

// 生成 SDDU 带序号的 agent 文件
function generateNumberedAgentSddu(template, num, short, desc) {
  const frontMatterMatch = template.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontMatterMatch) {
    throw new Error(`No front matter in ${short}`);
  }

  let frontMatter = frontMatterMatch[1];
  const content = template.slice(frontMatterMatch[0].length);

  // 更新 description 为 SDDU 版本
  frontMatter = frontMatter.replace(
    /description:.*$/,
    `description: SDDU ${desc} (阶段 ${num}/6)`
  );

  // 移除 model（配置在 opencode.json 中），保留 temperature
  frontMatter = frontMatter.replace(/^model:.*$\r?\n?/gm, '');

  // 根据阶段号生成正确的执行顺序
  let orderText = '';
  switch(num) {
    case '0': orderText = '[当前] 0.discovery → 1.spec → 2.plan → 3.tasks → 4.build → 5.review → 6.validate'; break;
    case '1': orderText = '0.discovery → [当前] 1.spec → 2.plan → 3.tasks → 4.build → 5.review → 6.validate'; break;
    case '2': orderText = '1.spec → [当前] 2.plan → 3.tasks → 4.build → 5.review → 6.validate'; break;
    case '3': orderText = '2.plan → [当前] 3.tasks → 4.build → 5.review → 6.validate'; break;
    case '4': orderText = '3.tasks → [当前] 4.build → 5.review → 6.validate'; break;
    case '5': orderText = '4.build → [当前] 5.review → 6.validate'; break;
    case '6': orderText = '5.review → [当前] 6.validate'; break;
    default: orderText = `[当前] ${num}-${short} → ...`; break;
  }

  return '---\n' + frontMatter + '\n---\n\n' +
'# 🎯 SDDU 工作流 - 阶段 ' + num + '/6\n\n' +
'## 执行顺序\n```\n' + orderText + '\n```\n\n' +
'## 依赖关系\n' +
'- **前置条件**: 见各阶段说明\n' +
'- **输出**: 见各阶段说明\n' +
'- **下游**: 见各阶段说明\n\n' +
'---\n\n' +
'# @sddu-' + num + '-' + short + ' - SDDU ' + desc + '（阶段 ' + num + '/6）\n\n' +
'> 💡 **提示**: 也可以用 `@sddu-' + short + '`（两者等价）\n\n' +
'---\n\n' +
content;
}

// 生成 SDD 带序号的 agent 文件
function generateNumberedAgent(template, num, short, desc) {
  const frontMatterMatch = template.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontMatterMatch) {
    throw new Error(`No front matter in ${short}`);
  }

  let frontMatter = frontMatterMatch[1];
  const content = template.slice(frontMatterMatch[0].length);

  // 更新 description 为 SDD 版本
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

  return '---\n' + frontMatter + '\n---\n\n' +
'# 🎯 SDD 工作流 - 阶段 ' + num + '/6\n\n' +
'## 执行顺序\n```\n' + executionOrder + '\n```\n\n' +
'## 依赖关系\n' +
'- **前置条件**: 见各阶段说明\n' +
'- **输出**: 见各阶段说明\n' +
'- **下游**: 见各阶段说明\n\n' +
'---\n\n' +
'# @sdd-' + num + '-' + short + ' - SDD ' + desc + '（阶段 ' + num + '/6）\n\n' +
'> 💡 **提示**: 也可以用 `@sdd-' + short + '`（两者等价）\n\n' +
'---\n' + content;
}

// 生成 SDDU 短名版本的 agent 文件
function generateShortAgentSddu(template, short, desc) {
  const frontMatterMatch = template.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontMatterMatch) {
    throw new Error(`No front matter in ${short}`);
  }

  let frontMatter = frontMatterMatch[1];
  const content = template.slice(frontMatterMatch[0].length);

  // 更新 description 为 SDDU 版本
  frontMatter = frontMatter.replace(
    /description:.*$/,
    `description: SDDU ${desc} (短名)`
  );

  // 移除 model（配置在 opencode.json 中），保留 temperature
  frontMatter = frontMatter.replace(/^model:.*$\r?\n?/gm, '');

  return '---\n' + frontMatter + '\n---\n' + content;
}

// 生成 SDD 短名版本的 agent 文件
function generateShortAgent(template, short, desc) {
  const frontMatterMatch = template.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontMatterMatch) {
    throw new Error(`No front matter in ${short}`);
  }

  let frontMatter = frontMatterMatch[1];
  const content = template.slice(frontMatterMatch[0].length);

  // 更新 description 为 SDD 版本
  frontMatter = frontMatter.replace(
    /description:.*$/,
    `description: SDD ${desc} (短名)`
  );

  // 移除 model（配置在 opencode.json 中），保留 temperature
  frontMatter = frontMatter.replace(/^model:.*$\r?\n?/gm, '');

  return '---\n' + frontMatter + '\n---\n' + content;
}

// 主函数
function build() {
  console.log('🔨 Building SDDU (with SDD backward compatibility)...\n');
  
  // ========== 构建 Agent 定义 ==========
  console.log('📄 Building agents for SDDU (with SDD backward compatibility)...');
  var sourceMsg = '   Source: src/templates/agents/sddu-*.md.hbs (or sdd-*.md.hbs as fallback)';
  var outputMsg = '   Output: dist/templates/agents/*.md (SDDU + SDD dual names)';
  console.log(sourceMsg);
  console.log(outputMsg + '\n');
  
  AGENT_MAP.forEach(function({ num, short, desc }) {
    // 儆取 SDDU 模板（如果不存在则用 sdd 模板）
    let templateSddu;
    try {
      templateSddu = readTemplate(AGENT_SRC_DIR, 'sddu-' + short + '.md');  // 优先使用 SDDU 模板
    } catch (error) {
      var msg = '   😐 No SDDU template found for sddu-' + short + ', using sdd-' + short + ' template instead';
      console.log(msg);
      templateSddu = readTemplate(AGENT_SRC_DIR, 'sdd-' + short + '.md');
    }
    
    // 儆取用于 SDD 的版本（如果有专用 SDDU 模板，复制一份再替换为 SDD；否则直接用 SDD 模板）
    let templateSdd;
    templateSdd = readTemplate(AGENT_SRC_DIR, 'sdd-' + short + '.md');  // 使用 SDD 模板
    
    // 生成 SDDU 帯号版本
    const numberedPathSddu = path.join(AGENT_OUT_DIR, 'sddu-' + num + '-' + short + '.md');
    fs.writeFileSync(numberedPathSddu, generateNumberedAgentSddu(templateSddu, num, short, desc), 'utf-8');
    console.log('  ✅ dist/templates/agents/sddu-' + num + '-' + short + '.md');
    
    // 生成 SDD 帯号版本
    const numberedPathSdd = path.join(AGENT_OUT_DIR, 'sdd-' + num + '-' + short + '.md');
    fs.writeFileSync(numberedPathSdd, generateNumberedAgent(templateSdd, num, short, desc), 'utf-8');
    console.log('  ✅ dist/templates/agents/sdd-' + num + '-' + short + '.md');
    
    // 生成 SDDU 短名版本
    const shortPathSddu = path.join(AGENT_OUT_DIR, 'sddu-' + short + '.md');
    fs.writeFileSync(shortPathSddu, generateShortAgentSddu(templateSddu, short, desc), 'utf-8');
    console.log('  ✅ dist/templates/agents/sddu-' + short + '.md');
    
    // 生成 SDD 短名版本
    const shortPathSdd = path.join(AGENT_OUT_DIR, 'sdd-' + short + '.md');
    fs.writeFileSync(shortPathSdd, generateShortAgent(templateSdd, short, desc), 'utf-8');
    console.log('  ✅ dist/templates/agents/sdd-' + short + '.md');
  });
  
  // 复复制特殊 Agent (SDDU + SDD 双版本)
  var specialAgents = ['sdd', 'sddu', 'sdd-help', 'sddu-help', 'sdd-roadmap', 'sddu-roadmap', 'sdd-docs', 'sddu-docs'];
  for(var i = 0; i < specialAgents.length; i++) {
    var name = specialAgents[i];
    try {
      const template = readTemplate(AGENT_SRC_DIR, name + '.md');
      const outputPath = path.join(AGENT_OUT_DIR, name + '.md');
      fs.writeFileSync(outputPath, template, 'utf-8');
      console.log('  ✅ dist/templates/agents/' + name + '.md');
    } catch (error) {
      console.log('  🚸 Skip missing template: ' + name);
    }
  }
  
  console.log('\n✅ Build complete - SDDU with SDD backward compatibility!');
  console.log('\n📦 Output structure:');
  console.log('   dist/');
  console.log('   ├── index.js               (插件入口)');
  console.log('   ├── commands/              (命令定义)');  
  console.log('   ├── agents/');
  console.log('   ├── state/                 (状态机)');
  console.log('   └── templates/agents/      (双版本代理定义 - SDDU + SDD)');
  console.log('');
  console.log('🎉 Ready for SDDU + SDD backward compatibility deployment!');
}

build();