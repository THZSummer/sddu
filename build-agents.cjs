#!/usr/bin/env node
/**
 * SDDU Agent Generator (仅 SDDU 版本)
 * 从源模板生成仅 SDDU 版本的代理输出
 * 
 * 输入：
 *   - src/templates/agents/sddu-*.md.hbs (SDDU 代理模板)
 * 
 * 输出：
 *   - dist/templates/agents/*-sddu.md (所有 SDDU 独家代理定义)
 */

const fs = require('fs');
const path = require('path');

const AGENT_SRC_DIR = path.join(__dirname, 'src', 'templates', 'agents');
const AGENT_OUT_DIR = path.join(__dirname, 'dist', 'templates', 'agents');

// SDDU 代理配置（只生成短名版本，不生成序号别名）
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

// 读取 SDDU 模板
function readSdduTemplate(name) {
  const sdduName = name.replace(/^sdd(-|$)/, 'sddu$1');
  const filePath = path.join(AGENT_SRC_DIR, `${sdduName}.hbs`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`SDDU Template not found: ${sdduName}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
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

// 主函数
function build() {
  console.log('🔨 Building SDDU (exclusive version - no SDD backward compatibility)...\n');
  
  // ========== 构建 Agent 定义 ==========
  console.log('📄 Building exclusive SDDU agents (without SDD backward compatibility)...');
  var sourceMsg = '   Source: src/templates/agents/sddu-*.md.hbs (SDDU templates)';
  var outputMsg = '   Output: dist/templates/agents/sddu-*.md (短名版本，无序号别名)';
  console.log(sourceMsg);
  console.log(outputMsg + '\n');
  
  AGENT_MAP.forEach(function({ num, short, desc }) {
    // 读取 SDDU 模板
    let templateSddu;
    try {
      templateSddu = readSdduTemplate('sddu-' + short + '.md');  // 只使用 SDDU 模板
    } catch (error) {
      console.error('❌ SDDU template missing for sddu-' + short + ', stopping build.');
      process.exit(1);
    }
    
    // 生成 SDDU 短名版本（只生成短名，不生成序号别名）
    const shortPathSddu = path.join(AGENT_OUT_DIR, 'sddu-' + short + '.md');
    fs.writeFileSync(shortPathSddu, generateShortAgentSddu(templateSddu, short, desc), 'utf-8');
    console.log('  ✅ dist/templates/agents/sddu-' + short + '.md');
  });
  
  // 复制特殊 SDDU 代理 (仅 SDDU 版本)
  var specialAgents = ['sddu', 'sddu-help', 'sddu-roadmap', 'sddu-docs'];
  for(var i = 0; i < specialAgents.length; i++) {
    var name = specialAgents[i];
    try {
      const template = readSdduTemplate(name + '.md');
      const outputPath = path.join(AGENT_OUT_DIR, name + '.md');
      fs.writeFileSync(outputPath, template, 'utf-8');
      console.log('  ✅ dist/templates/agents/' + name + '.md');
    } catch (error) {
      console.log('  🚸 Skip missing template: ' + name);
    }
  }
  
  console.log('\n✅ Build complete - Exclusive SDDU version (no SDD backward compatibility)!');
  console.log('\n📦 Output structure:');
  console.log('   dist/');
  console.log('   ├── index.js               (插件入口)');
  console.log('   ├── commands/              (命令定义)');  
  console.log('   ├── agents/');
  console.log('   ├── state/                 (状态机)');
  console.log('   └── templates/agents/      (SDDU 代理定义)');
  console.log('');
  console.log('🎉 Ready for SDDU exclusive deployment!');
}

build();