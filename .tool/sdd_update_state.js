#!/usr/bin/env node

/**
 * State update utility for SDD workflow
 * Updates feature state and task progress
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function updateState(feature, stateUpdate) {
  // Feature目录路径可能为多种情况之一  
  const possiblePaths = [
    `.sdd/.specs/${feature}/state.json`,
    `.specs/${feature}/state.json`, 
    `.sdd/specs-tree-root/specs-tree-${feature}/state.json`
  ];
  
  let stateFilePath = null;
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      stateFilePath = path;
      break;
    }
  }
  
  if (!stateFilePath) {
    console.error(`State file not found for feature: ${feature}`);
    // 尝试查找匹配的目录
    console.log("Searching for possible state files...");
    const stateFiles = findStateFiles(feature);
    if (stateFiles.length > 0) {
      stateFilePath = stateFiles[0];
      console.log(`Using state file: ${stateFilePath}`);
    } else {
      console.error("No state file found, creating new one");
      // 创建新的状态文件
      const newStatePath = `.sdd/.specs/${feature}/state.json`;
      const newStateDir = require('path').dirname(newStatePath);
      if (!existsSync(newStateDir)) {
        require('fs').mkdirSync(newStateDir, { recursive: true });
      }
      const newState = {
        feature,
        status: 'specifying',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...stateUpdate
      };
      writeFileSync(newStatePath, JSON.stringify(newState, null, 2));
      console.log(`Created new state file: ${newStatePath}`);
      return;
    }
  }
  
  try {
    // 读取当前状态
    let currentState = JSON.parse(readFileSync(stateFilePath, 'utf-8'));
    
    // 更新状态
    const newState = {
      ...currentState,
      ...stateUpdate,
      updatedAt: new Date().toISOString()
    };
    
    // 写入更新后的状态
    writeFileSync(stateFilePath, JSON.stringify(newState, null, 2));
    console.log(`State updated successfully: ${stateFilePath}`);
  } catch (error) {
    console.error('Failed to update state:', error.message);
  }
}

function findStateFiles(featureSubstring) {
  // 递归查找包含feature名称的state.json文件
  const { spawnSync } = require('child_process');
  const findResult = spawnSync('find', ['.sdd', '-name', 'state.json'], { encoding: 'utf-8' });
  
  if (findResult.status !== 0) {
    return [];
  }
  
  const candidates = findResult.stdout.split('\n')
    .filter(line => line.trim() !== '')
    .filter(filePath => filePath.includes(featureSubstring));
  
  return candidates;
}

// 解析命令行参数
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
Usage: sdd_update_state <feature> <key>=<value> [key=value ...]

Examples:
  node sdd_update_state.js my-feature status=implemented
  node sdd_update_state.js my-feature status=validated phase=5
  node sdd_update_state.js my-feature data='{"currentTask":"TASK-001","progress":{"task1":"completed"}}'

Alternative usage (with JSON):
  echo '{"feature":"my-feature","state":"validated","phase":5}' | node sdd_update_state.js
  node sdd_update_state.js --json '{"feature":"my-feature","state":"validated"}'
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