#!/usr/bin/env node

/**
 * State update utility for SDDU workflow (SDD Ultimate version)
 * Updates feature state and task progress with dual directory support
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function updateState(feature, stateUpdate) {
  // Feature目录路径可能为多种情况之一，支持新旧目录
  const possiblePaths = [
    `.sddu/specs-tree-root/specs-tree-${feature}/state.json`,  // SDDU 新目录结构
    `.sdd/.specs/${feature}/state.json`,                       // 旧目录选项1
    `.specs/${feature}/state.json`,                            // 旧目录选项2
    `.sdd/specs-tree-root/specs-tree-${feature}/state.json`,   // SDD 旧目录结构
    `.sddu/.specs/${feature}/state.json`                       // SDDU 替代旧目录
  ];
  
  let stateFilePath = null;
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      stateFilePath = path;
      break;
    }
  }
  
  if (!stateFilePath) {
    console.error(`SDDU State file not found for feature: ${feature}`);
    // 尝试查找匹配的目录
    console.log("Searching for possible state files...");
    const stateFiles = findStateFiles(feature);
    if (stateFiles.length > 0) {
      stateFilePath = stateFiles[0];
      console.log(`Using SDDU state file: ${stateFilePath}`);
    } else {
      console.error("No state file found, creating new one in standard location");
      // 创建新的状态文件
      const newStatePath = `.sddu/specs-tree-root/specs-tree-${feature}/state.json`;
      const newStateDir = require('path').dirname(newStatePath);
      if (!existsSync(newStateDir)) {
        require('fs').mkdirSync(newStateDir, { recursive: true });
      }
      const newState = {
        feature,
        status: 'specifying',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workflowVersion: 'SDDU',
        ...stateUpdate
      };
      writeFileSync(newStatePath, JSON.stringify(newState, null, 2));
      console.log(`Created new SDDU state file: ${newStatePath}`);
      return;
    }
  }
  
  try {
    // 读取当前状态
    let currentState = JSON.parse(readFileSync(stateFilePath, 'utf-8'));
    
    // 更新状态
    const newState = {
      ...currentState,
      workflowVersion: 'SDDU',  // 确保标记为SDDU版本
      ...stateUpdate,
      updatedAt: new Date().toISOString()
    };
    
    // 写入更新后的状态
    writeFileSync(stateFilePath, JSON.stringify(newState, null, 2));
    console.log(`SDDU State updated successfully: ${stateFilePath}`);
  } catch (error) {
    console.error('Failed to update SDDU state:', error.message);
  }
}

function findStateFiles(featureSubstring) {
  // 递归查找包含feature名称的state.json文件，支持新旧目录
  const { spawnSync } = require('child_process');
  
  // 检查多个可能的目录位置
  const results = [];
  try {
    const result1 = spawnSync('find', ['.sddu', '-name', 'state.json'], { encoding: 'utf-8' });
    if (result1.status === 0) {
      results.push(...result1.stdout.split('\n')
        .filter(line => line.trim() !== '' && line.includes(featureSubstring)));
    }
  } catch(e) {}
  
  try {
    const result2 = spawnSync('find', ['.sdd', '-name', 'state.json'], { encoding: 'utf-8' });
    if (result2.status === 0) {
      results.push(...result2.stdout.split('\n')
        .filter(line => line.trim() !== '' && line.includes(featureSubstring)));
    }
  } catch(e) {}
  
  try {
    const result3 = spawnSync('find', ['.', '-name', 'state.json'], { encoding: 'utf-8' });
    if (result3.status === 0) {
      results.push(...result3.stdout.split('\n')
        .filter(line => line.trim() !== '' && 
                    (line.includes(featureSubstring) && 
                     (line.includes('/.sdd/') || line.includes('/.sddu/')))));
    }
  } catch(e) {}
  
  return results;
}

// 解析命令行参数
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
SDDU State Update Utility

Updates feature state for the SDDU (Specification-Driven Development Ultimate) workflow.
Supports both .sdd and .sddu directory structures for backwards compatibility.

Usage: sddu_update_state <feature> <key>=<value> [key=value ...]

Examples:
  node sddu_update_state.js my-feature status=implemented
  node sddu_update_state.js my-feature status=validated phase=5
  node sddu_update_state.js my-feature data='{"currentTask":"TASK-001","progress":{"task1":"completed"}}'

Alternative usage (with JSON):
  echo '{"feature":"my-feature","state":"validated","phase":5}' | node sddu_update_state.js
  node sddu_update_state.js --json '{"feature":"my-feature","state":"validated"}'
  `.trim());
  process.exit(1);
}

// 检查是否是JSON输入模式
if (args[0] === '--json') {
  const jsonData = JSON.parse(args[1]);
  const { feature, ...updateData } = jsonData;
  updateState(feature, updateData);
} else if (args.length === 1 && args[0].startsWith('{')) {
  // 输入可能是JSON字符串
  const jsonData = JSON.parse(args[0]);
  const { feature, ...updateData } = jsonData;
  updateState(feature, updateData);
} else if (args.length >= 2) {
  // 传统键值对模式
  const [feature, ...updates] = args;
  const updateObj = {};
  
  for (const update of updates) {
    const [key, value] = update.split('=');
    if (key && value !== undefined) {
      // 尝试解析JSON值
      try {
        updateObj[key] = JSON.parse(value);
      } catch {
        // 如果不是有效的JSON，则视为字符串
        updateObj[key] = value;
      }
    } else {
      console.warn(`Invalid key-value pair: ${update}, skipping...`);
    }
  }
  
  updateState(feature, updateObj);
}