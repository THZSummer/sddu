#!/usr/bin/env node

/**
 * SDD 状态迁移工具 (概念验证)
 * 
 * 用于演示 v1.1.1 -> v1.2.11 迁移过程的模拟实现
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class StateMigrator {
  constructor() {
    this.backupDir = path.join(process.cwd(), '.sdd', '.backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * 模拟迁移函数
   */
  migrateState(legacyStatePath) {
    console.log(`🔍 开始处理状态文件: ${legacyStatePath}`);
    
    // 读取旧数据
    const rawData = fs.readFileSync(legacyStatePath, 'utf8');
    const legacyState = JSON.parse(rawData);
    
    // 执行备份
    this.createBackup(legacyStatePath, legacyState);
    
    // 执行迁移转换
    const newState = this.transformState(legacyState);
    
    // 写入新数据
    fs.writeFileSync(legacyStatePath, JSON.stringify(newState, null, 2));
    
    console.log(`✅ 状态文件迁移完成: ${legacyStatePath}`);
    console.log(`📋 变更摘要:`);
    console.log(`   - 添加 'version': '${newState.version}'`);
    console.log(`   - 移除 'mode' 字段: '${legacyState.mode}'`);
    console.log(`   - 移除 'subFeatures' 字段 (${legacyState.subFeatures?.length || 0} 个子特性)`);
    console.log(`   - 更新 'updatedAt' 字段`);
    
    return newState;
  }
  
  /**
   * 创建备份
   */
  createBackup(originalPath, originalData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').split('Z')[0];
    const fileName = path.basename(originalPath);
    const backupFileName = `${path.parse(fileName).name}-backup-${timestamp}.json`;
    const backupPath = path.join(this.backupDir, backupFileName);
    
    fs.writeFileSync(backupPath, JSON.stringify(originalData, null, 2));
    console.log(`💾 创建备份: ${backupPath}`);
  }
  
  /**
   * 转换状态对象
   */
  transformState(legacyState) {
    // 移除不需要的字段并添加新字段
    const { mode, subFeatures, ...newState } = legacyState;
    
    // 附加新字段
    newState.version = '1.2.11';
    newState.updatedAt = new Date().toISOString();
    
    return newState;
  }
  
  /**
   * 处理整个目录中的所有状态文件
   */
  processDirectory(specsDir) {
    console.log(`📁 扫描目录: ${specsDir}`);
    
    if (!fs.existsSync(specsDir)) {
      console.log(`⚠️  目录不存在: ${specsDir}`);
      return;
    }
    
    const items = fs.readdirSync(specsDir);
    
    for (const item of items) {
      const fullPath = path.join(specsDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 检查此子目录是否包含 state.json
        const statePath = path.join(fullPath, 'state.json');
        if (fs.existsSync(statePath)) {
          this.processStateFile(statePath);
        }
        
        // 递归处理子目录
        this.processDirectory(fullPath);
      }
    }
  }
  
  /**
   * 处理单个状态文件
   */
  processStateFile(statePath) {
    try {
      const rawData = fs.readFileSync(statePath, 'utf8');
      const state = JSON.parse(rawData);
      
      // 检查是否需要迁移（没有版本号或者版本低于 1.2.11）
      if (!state.version || state.version === '1.1.1') {
        console.log(`🔄 发现已过时的状态格式: ${statePath} (version: ${state.version || 'undefined'})`);
        return this.migrateState(statePath);
      } else {
        console.log(`✅ 状态文件已是最新格式: ${statePath} (version: ${state.version})`);
        return state;
      }
    } catch (err) {
      console.error(`❌ 处理状态文件失败: ${statePath}`, err.message);
      return null;
    }
  }
}

// 主执行逻辑
function main() {
  console.log('🔄 SDD 状态迁移工具 v1.2.11');
  console.log('🚀 开始检查并迁移旧状态格式...');
  console.log('');
  
  const migrator = new StateMigrator();
  
  // 查找要处理的目标
  const targetPaths = [
    '.sdd/.specs',  // 新结构位置
    '.specs'        // 旧结构位置
  ];
  
  let processedAny = false;
  
  for (const targetDir of targetPaths) {
    if (fs.existsSync(targetDir)) {
      console.log(`\n🎯 处理目标目录: ${targetDir}`);
      migrator.processDirectory(targetDir);
      processedAny = true;
    }
  }
  
  if (!processedAny) {
    console.log('⚠️  未发现任何 SDD 规范目录（.specs 或 .sdd/.specs）');
  }
  
  console.log('\n✨ 迁移检查完成！');
  console.log('📋 操作摘要:');
  console.log('- 检查了 .specs/ 和 .sdd/.specs/ 目录中的状态文件');
  console.log('- 自动识别需要迁移的 v1.1.1 格式文件');
  console.log('- 创建了原始状态的备份文件');
  console.log('- 移除了 mode 和 subFeatures 字段');
  console.log('- 添加了 version: "1.2.11" 标识');
  console.log('- 保留了所有其他业务字段');
  console.log('- 备份文件保存在 .sdd/.backups/ 目录中');
}

// 仅当直接运行此脚本时才执行主函数
if (require.main === module) {
  main();
}

module.exports = { StateMigrator };