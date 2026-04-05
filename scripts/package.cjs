/**
 * SDD 工具系统打包脚本
 * 实现 FR-022~025: 打包优化需求，生成 dist/sdd/ 目录结构
 */

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

async function packageSdd() {
  try {
    console.log('📦 开始打包 SDD 工具系统...');
    
    // 1. 创建 dist 目录
    const distDir = path.join(__dirname, '..', 'dist');
    const sddDistDir = path.join(distDir, 'sdd');
    
    console.log(`📁 准备输出目录: ${sddDistDir}`);
    
    // 清空原有的 sdd 目录
    if (await fs.pathExists(sddDistDir)) {
      await fs.remove(sddDistDir);
    }
    
    // 确保 dist 目录存在
    await fs.ensureDir(distDir);
    
    // 2. 复制构建产物
    const srcDir = path.join(__dirname, '..', 'dist');
    const targetSrcDir = path.join(sddDistDir, 'src');
    
    console.log('🔄 复制源码文件...');
    
    // 复制编译后的 JS 文件，排除模板目录（因为会特殊处理）
    const allFiles = await fs.readdir(srcDir);
    for (const file of allFiles) {
      // 跳过 'sdd' 目录和 'templates' 目录以及特定要单独处理的文件
      if (file === 'sdd' || file === 'templates') continue;
      
      const sourcePath = path.join(srcDir, file);
      const destPath = path.join(sddDistDir, file);
      const stat = await fs.stat(sourcePath);
      
      if (stat.isDirectory()) {
        await fs.copy(sourcePath, destPath);
      } else {
        await fs.copy(sourcePath, destPath);
      }
    }
    
    // 特殊处理模板目录 - 将 dist/templates/agents/ 复制到 dist/sdd/agents/
    const templatesAgentsDir = path.join(srcDir, 'templates', 'agents');
    if (await fs.pathExists(templatesAgentsDir)) {
      const targetAgentsDir = path.join(sddDistDir, 'agents');
      await fs.ensureDir(targetAgentsDir);
      await fs.copy(templatesAgentsDir, targetAgentsDir);
      console.log('🔄 复制 agent 模板到 dist/sdd/agents/ ...');
    }
    
    // 3. 复制根目录 package.json
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      await fs.copy(packageJsonPath, path.join(sddDistDir, 'package.json'));
      console.log('🔄 复制 package.json ...');
    }
    
    // 4. 复制主要安装脚本 (install.sh, install.ps1)
    const installShPath = path.join(__dirname, '..', 'install.sh');
    if (await fs.pathExists(installShPath)) {
      await fs.copy(installShPath, path.join(sddDistDir, 'install.sh'));
      console.log('🔄 复制 install.sh ...');
    }
    
    const installPs1Path = path.join(__dirname, '..', 'install.ps1');
    if (await fs.pathExists(installPs1Path)) {
      await fs.copy(installPs1Path, path.join(sddDistDir, 'install.ps1'));
      console.log('🔄 复制 install.ps1 ...');
    }
    
    // 5. 复制许可证和其他根文件
    const licensePath = path.join(__dirname, '..', 'LICENSE');
    if (await fs.pathExists(licensePath)) {
      await fs.copy(licensePath, path.join(sddDistDir, 'LICENSE'));
    }
    
    const readmePath = path.join(__dirname, '..', 'README.md');
    if (await fs.pathExists(readmePath)) {
      await fs.copy(readmePath, path.join(sddDistDir, 'README.md'));
    }
    
    // 6. 复制配置文件
    const configFiles = [
      '.opencode/agents',
      '.sdd/config.sample.json',
      'configs/'
    ];
    
    for (const configFile of configFiles) {
      const sourcePath = path.join(__dirname, '..', configFile);
      const targetPath = path.join(sddDistDir, configFile);
      
      if (await fs.pathExists(sourcePath)) {
        const targetDir = path.dirname(targetPath);
        await fs.ensureDir(targetDir);
        await fs.copy(sourcePath, targetPath);
        console.log(`🔄 复制 ${configFile} ...`);
      }
    }
    
    // 7. 创建打包信息
    const packageInfo = {
      version: require('../package.json').version,
      buildDate: new Date().toISOString(),
      buildScript: 'scripts/package.cjs',
      sourceDirStructure: {
        src: existsSync(path.join(sddDistDir, 'src')),
        agents: existsSync(path.join(sddDistDir, 'agents')),
        templates: existsSync(path.join(sddDistDir, 'templates')),
        scripts: existsSync(path.join(sddDistDir, 'scripts'))
      }
    };
    
    await fs.writeJson(path.join(sddDistDir, 'BUILD_INFO.json'), packageInfo, { spaces: 2 });
    console.log('📋 写入构建信息 ...');
    
    // 8. 创建 ZIP 压缩包
    console.log('📦 创建 ZIP 压缩包 ...');
    
    const zipPath = path.join(distDir, 'sdd.zip');
    
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
    
    // 添加整个 sdd 目录到压缩包
    archive.directory(sddDistDir, 'sdd');
    
    // 完成归档
    await archive.finalize();
    
    console.log(`✅ 成功创建打包文件: ${path.relative(process.cwd(), zipPath)}`);
    console.log(`✅ 打包完成，文件位于: ${path.relative(process.cwd(), sddDistDir)}`);
    
    // 9. 清理 dist 目录中的冗余文件（保留 sdd/ 和 sdd.zip）
    console.log('🧹 清理冗余文件...');
    
    const itemsToKeep = ['sdd', 'sdd.zip'];
    const allItems = await fs.readdir(distDir);
    
    for (const item of allItems) {
      if (!itemsToKeep.includes(item)) {
        const itemPath = path.join(distDir, item);
        await fs.remove(itemPath);
        console.log(`  🗑️  删除：${item}`);
      }
    }
    
    console.log('✅ 清理完成，dist/ 目录仅保留 sdd/ 和 sdd.zip');
    
    // 显示打包目录结构
    console.log('\n📋 打包目录结构:');
    await printDirectoryTree(sddDistDir, '');
    
    return {
      success: true,
      outputDir: sddDistDir,
      zipFile: zipPath
    };
    
  } catch (error) {
    console.error('❌ 打包过程出错:', error);
    process.exit(1);
  }
}

// 辅助函数：检查目录是否存在
function existsSync(path) {
  try {
    fs.accessSync(path);
    return true;
  } catch {
    return false;
  }
}

// 辅助函数：打印目录树
async function printDirectoryTree(dir, prefix = '', depth = 0) {
  if (depth > 3) return; // 限制最大深度
  
  const files = await fs.readdir(dir);
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(dir, file);
    const stats = await fs.stat(filePath);
    
    const isLast = i === files.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    
    console.log(`${prefix}${connector}${file}${stats.isDirectory() ? '/' : ''}`);
    
    if (stats.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      await printDirectoryTree(filePath, newPrefix, depth + 1);
    }
  }
}

// 导出主函数
module.exports = packageSdd;

// 如果直接运行此脚本，则执行打包
if (require.main === module) {
  packageSdd();
}