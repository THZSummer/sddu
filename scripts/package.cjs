/**
 * SDDU 工具系统打包脚本
 * 实现 FR-022~025: 打包优化需求，生成 dist/sddu/ 目录结构
 * V2 独家版本 - 不做任何 SDD 向后兼容
 */

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

async function packageSddu() {
  try {
    console.log('📦 开始打包 SDDU 工具系统 (V2 独家版本 - 无 SDD 兼容)...');
    
    // 确定 dist 目录
    const distDir = path.join(__dirname, '..', 'dist');
    
    // 打包 SDDU 版本
    console.log('\n🎯 创建 SDDU 版本包...');
    const sdduDistDir = path.join(distDir, 'sddu');
    await packageSingleVersion(sdduDistDir, 'sddu', 'opencode-sddu-plugin');
    
    console.log('\n📦 创建 ZIP 压缩包...');
    
    // 创建 SDDU ZIP 包
    const sdduZipPath = path.join(distDir, 'sddu.zip');
    await createZip(sdduDistDir, sdduZipPath, 'sddu');
    
    console.log('\n🧹 清理冗余文件...');
    const itemsToKeep = ['sddu', 'sddu.zip'];
    const allItems = await fs.readdir(distDir);
    
    for (const item of allItems) {
      if (!itemsToKeep.includes(item)) {
        const itemPath = path.join(distDir, item);
        await fs.remove(itemPath);
        console.log(`  🗑️  删除：${item}`);
      }
    }
    
    console.log('\n✅ 打包完成！目录清单：');
    console.log(`  - dist/sddu/ (SDDU V2 独家插件包)`);
    console.log(`  - dist/sddu.zip (SDDU 插件压缩包)`);
    console.log(`✅ SDDU V2 独家版本打包完成（无 SDD 兼容）`);
    
    // 显示打包目录结构
    console.log('\n📋 SDDU 目录结构:');
    await printDirectoryTree(sdduDistDir, '');
    
    return {
      success: true,
      sdduOutputDir: sdduDistDir,
      sdduZipFile: sdduZipPath
    };
    
  } catch (error) {
    console.error('❌ 打包过程出错:', error);
    process.exit(1);
  }
}

// 打包单个版本的函数（SDD 或 SDDU）
async function packageSingleVersion(distDir, version, packageName) {
  console.log(`📁 准备输出目录: ${distDir}`);
  
  // 清空原有目录
  if (await fs.pathExists(distDir)) {
    await fs.remove(distDir);
  }
  
  // 确保 dist 目录存在
  await fs.ensureDir(path.dirname(distDir));
  
  // 1. 复制构建产物 (JS 文件等)
  const srcDir = path.join(__dirname, '..', 'dist');
  const allFiles = await fs.readdir(srcDir);
  
  console.log(`🔄 复制构建文件 (${version})...`);
  for (const file of allFiles) {
    // 跳过 dist 目录本身和其他输出目录
    if (file === 'sddu' || file === 'templates') continue;
    
    const sourcePath = path.join(srcDir, file);
    const destPath = path.join(distDir, file);
    const stat = await fs.stat(sourcePath);
    
    if (stat.isDirectory()) {
      await fs.copy(sourcePath, destPath);
    } else {
      await fs.copy(sourcePath, destPath);
    }
  }
  
  // 特殊处理模板目录 - 将 dist/templates/agents/ 复制到 [distDir]/agents/
  const templatesAgentsDir = path.join(srcDir, 'templates', 'agents');
  if (await fs.pathExists(templatesAgentsDir)) {
    const targetAgentsDir = path.join(distDir, 'agents');
      
    await fs.ensureDir(targetAgentsDir);
    
    // 读取所有模板文件并进行命名替换
    const agentTemplateFiles = await fs.readdir(templatesAgentsDir);
    for (const templateFile of agentTemplateFiles) {
      const templatePath = path.join(templatesAgentsDir, templateFile);
      const outputPath = path.join(targetAgentsDir, templateFile);
      
      if ((await fs.stat(templatePath)).isFile() && templateFile.endsWith('.hbs')) {
        let content = await fs.readFile(templatePath, 'utf8');
        
        // SDDU 版本：将所有 SDD 相关名称改为 SDDU
        content = content 
          .replace(/SDD(?!\w)/g, 'SDDU')  // 仅替换完整的 "SDD" 单不匹配 "SDDD" 等
          .replace(/sdd(?!\w)/g, 'sddu')  // 仅替换小写的 "sdd"
          .replace(/@sdd-/g, '@sddu-');   // 替换命令 @sdd- -> @sddu-
        
        await fs.writeFile(outputPath, content, 'utf8');
      } else {
        // 靠制非模板文件
        await fs.copy(templatePath, outputPath);
      }
    }
    
    console.log(`🔄 复制 ${version} agent 模板到 ${path.basename(distDir)}/agents/ ...`);
  }
  
  // 2. 生成插件包特定的 package.json
  const originalPkg = require('../package.json');
  const pluginPkg = {
    ...originalPkg,
    name: packageName,
    description: 'Specification-Driven Development Ultimate plugin for OpenCode (V2 Exclusive - No SDD Compatibility)',
    scripts: {
      ...originalPkg.scripts,
      'sddu-spec': 'node ./dist/commands/sdd-spec.js',
      'sddu-plan': 'node ./dist/commands/sdd-plan.js', 
      'sddu-tasks': 'node ./dist/commands/sdd-tasks.js',
      'sddu-build': 'node ./dist/commands/sdd-build.js',
      'sddu-review': 'node ./dist/commands/sdd-review.js',
      'sddu-validate': 'node ./dist/commands/sdd-validate.js',
      'sddu-docs': 'node ./dist/commands/sdd-docs.js',
      'sddu-roadmap': 'node ./dist/commands/sdd-roadmap.js',
      'sddu-help': 'node ./dist/commands/sdd-help.js',
    },
    files: [
      'dist/sddu/**/*',
      'src/**/*',
      '!.opencode',
      '!.sdd',
      'README.md',
      'LICENSE'
    ]
  };
  
  await fs.writeJson(path.join(distDir, 'package.json'), pluginPkg, { spaces: 2 });
  console.log(`🔄 生成 ${version} 版本的 package.json ...`);
  
  // 3. 复制主要安装脚本 (install.sh, install.ps1) 
  const installShPath = path.join(__dirname, '..', 'install.sh');
  if (await fs.pathExists(installShPath)) {
    await fs.copy(installShPath, path.join(distDir, 'install.sh'));
    console.log(`🔄 复制 ${version} install.sh ...`);
  }
  
  const installPs1Path = path.join(__dirname, '..', 'install.ps1');
  if (await fs.pathExists(installPs1Path)) {
    await fs.copy(installPs1Path, path.join(distDir, 'install.ps1'));
    console.log(`🔄 复制 ${version} install.ps1 ...`);
  }
  
  // 4. 复制许可证和其他文件
  const filesToCopy = [
    { src: path.join(__dirname, '..', 'LICENSE'), dest: 'LICENSE' },
    { src: path.join(__dirname, '..', 'README.md'), dest: 'README.md' }
  ];
  
  for (const fileObj of filesToCopy) {
    if (await fs.pathExists(fileObj.src)) {
      await fs.copy(fileObj.src, path.join(distDir, fileObj.dest));
    }
  }
  
// 5. 准备版本特定的 opencode.json
  let opencodeConfig;
  
  if (version === 'sddu') {
    // SDDU 版本：仅包含 12 个 sddu-* agents
    opencodeConfig = {
      "$schema": "https://opencode.ai/config.json",
      "plugin": [`opencode-${version}-plugin`],
      "agent": {
        "sddu": {
          "description": "SDDU Master Coordinator - 智能路由助手 (新版本)",
          "model": "bailian/qwen3.5-plus",
          "prompt": "{file:.opencode/agents/sddu.md}",
          "deprecated": false
        },
        "sddu-help": {
          "description": "SDDU Help Assistant - 使用指南 (新版本)",
          "model": "bailian/qwen3.5-plus",
          "prompt": "{file:.opencode/agents/sddu-help.md}",
          "deprecated": false
        },
        "sddu-discovery": {
          "description": `SDDU 需求挖掘专家 (阶段 0/6, 新版本)`,
          "model": "bailian/qwen3.5-plus",
          "prompt": "{file:.opencode/agents/sddu-discovery.md}",
          "deprecated": false
        },
        "sddu-0-discovery": {
          "description": `SDDU 需求挖掘专家 (阶段 0/6, 新版本)`,
          "model": "bailian/qwen3.5-plus",
          "prompt": "{file:.opencode/agents/sddu-0-discovery.md}",
          "deprecated": false
        },
        "sddu-1-spec": {
          "description": `SDDU 规范编写专家 (阶段 1/6, 新版本)`,
          "model": "bailian/qwen3.5-plus",
          "prompt": "{file:.opencode/agents/sddu-1-spec.md}",
          "deprecated": false
        },
        "sddu-2-plan": {
          "description": `SDDU 技术规划专家 (阶段 2/6, 新版本)`,
          "model": "bailian/qwen3.5-plus",
          "prompt": "{file:.opencode/agents/sddu-2-plan.md}",
          "deprecated": false
        },
        "sddu-3-tasks": {
          "description": `SDDU 任务分解专家 (阶段 3/6, 新版本)`,
          "model": "bailian/qwen3.5-plus",
          "prompt": "{file:.opencode/agents/sddu-3-tasks.md}",
          "deprecated": false
        },
        "sddu-4-build": {
          "description": `SDDU 任务实现专家 (阶段 4/6, 新版本)`,
          "model": "bailian/qwen3-coder-plus",
          "prompt": "{file:.opencode/agents/sddu-4-build.md}",
          "deprecated": false
        },
        "sddu-5-review": {
          "description": `SDDU 代码审查专家 (阶段 5/6, 新版本)`,
          "model": "bailian/qwen3-coder-plus",
          "prompt": "{file:.opencode/agents/sddu-5-review.md}",
          "deprecated": false
        },
        "sddu-6-validate": {
          "description": `SDDU 验证专家 (阶段 6/6, 新版本)`,
          "model": "bailian/qwen3-coder-plus",
          "prompt": "{file:.opencode/agents/sddu-6-validate.md}",
          "deprecated": false
        },
        "sddu-roadmap": {
          "description": `SDDU Roadmap 规划专家 - 多版本路线图规划 (新版本)`,
          "model": "bailian/qwen3.5-plus",
          "prompt": "{file:.opencode/agents/sddu-roadmap.md}",
          "deprecated": false
        },
        "sddu-docs": {
          "description": `SDDU 目录导航生成器 - 扫描目录结构生成 README 导航 (新版本)`,
          "model": "bailian/qwen3.5-plus",
          "prompt": "{file:.opencode/agents/sddu-docs.md}",
          "deprecated": false
        }
      },
      "permission": {
        "*": "allow",
        "read": "allow",
        "edit": "allow",
        "bash": "allow",
        "glob": "allow",
        "grep": "allow",
        "list": "allow",
        "task": "allow",
        "skill": "allow",
        "question": "allow",
        "webfetch": "allow",
        "external_directory": "allow"
      }
    };
  
    await fs.writeJson(path.join(distDir, 'opencode.json'), opencodeConfig, { spaces: 2 });
  console.log(`🔄 生成 ${version} 版本的 opencode.json ...`);
  
  // 6. 创建打包信息文件
  const packageInfo = {
    version: require('../package.json').version,
    buildDate: new Date().toISOString(),
    buildScript: 'scripts/package.cjs',
    versionType: version,
    packageName: packageName,
    sourceDirStructure: {
      src: await fs.pathExists(path.join(distDir, 'src')),
      agents: await fs.pathExists(path.join(distDir, 'agents')),
      packageJson: await fs.pathExists(path.join(distDir, 'package.json')),
      opencodeJson: await fs.pathExists(path.join(distDir, 'opencode.json'))
    }
  };
  
  await fs.writeJson(path.join(distDir, 'BUILD_INFO.json'), packageInfo, { spaces: 2 });
  console.log(`📋 写入 ${version} 构建信息 ...`);
}

}
// 创建 ZIP 压缩包
async function createZip(sourceDir, zipPath, versionName) {
  console.log(`📦 为 ${versionName} 创建 ZIP 压缩包: ${path.basename(zipPath)} ...`);
  
  // 创建输出流
  const outputStream = fs.createWriteStream(zipPath);
  
  // 创建 archiver 实例，设置压缩格式为 zip
  const archive = archiver('zip', {
    zlib: { level: 9 } // 设置压缩级别为最大
  });
  
  // 监听压缩过程中的错误事件
  outputStream.on('close', () => {
    console.log(`✅ ZIP 文件创建成功: ${archive.pointer()} total bytes`);
  });
  
  archive.on('error', (err) => {
    console.error('❌ 压缩过程中出错:', err);
    process.exit(1);
  });
  
  // 设置导出流
  archive.pipe(outputStream);
  
  // 添加整个目录到压缩包
  archive.directory(sourceDir, `${versionName}`);  // 使用版本名作为压缩包内的顶级目录名
  
  // 完成归档
  await archive.finalize();
  
  console.log(`✅ 成功创建 ${versionName} 压缩包: ${path.relative(process.cwd(), zipPath)}`);
}

// 辅助函数：打印目录树
async function printDirectoryTree(dir, prefix = '', depth = 0) {
  if (depth > 3) return; // 限制最大深度
  
  try {
    const files = await fs.readdir(dir);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);
      
      const isLast = (i === files.length - 1);
      const connector = isLast ? '└── ' : '├── ';
      
      console.log(`${prefix}${connector}${file}${stats.isDirectory() ? '/' : ''}`);
      
      if (stats.isDirectory()) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        await printDirectoryTree(filePath, newPrefix, depth + 1);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }
}

// 导出主函数
module.exports = packageSddu;

// 如果直接运行此脚本，则执行打包
if (require.main === module) {
  packageSddu();
}