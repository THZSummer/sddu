/**
 * Discovery 状态验证器
 * 用于验证从 drafting 到 discovered 的状态流转
 */

import { StateMachine } from '../state/machine';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FeatureState } from '../state/machine';

interface DiscoveryTransitionResult {
  canTransition: boolean;
  reason: string;
  warning?: string;
  discoveryExists: boolean;
}

export class DiscoveryStateValidator {
  constructor(private stateMachine: StateMachine) {}

  /**
   * 检查是否可以从 drafting 转移到 discovered 状态
   * - discovery.md 文件是否存在
   * - discovery.md 内容基本结构是否完整
   */
  async canTransitionToDiscovered(featureId: string): Promise<DiscoveryTransitionResult> {
    const featureStateObj = this.stateMachine.getState(featureId);
    if (!featureStateObj) {
      return {
        canTransition: false,
        reason: 'Feature 不存在',
        discoveryExists: false
      };
    }

    // 检查当前状态是否可以过渡到 discovered
    if (featureStateObj.state !== 'drafting') {
      return {
        canTransition: false,
        reason: '只有 drafting 状态可以转移到 discovered 状态',
        discoveryExists: false
      };
    }

    // 检查 discovery.md 文件是否存在
    const featureDir = path.join(this.stateMachine['specsDir'], featureId); 
    
    try {
      // 检查 discovery.md 是否存在
      const discoveryPath = path.join(featureDir, 'discovery.md');
      await fs.access(discoveryPath);
      
      // 检查文件是否有内容
      const content = await fs.readFile(discoveryPath, 'utf-8');
      const hasContent = content && content.trim().length > 0;
      
      // 检查是否包含基本的发现内容标记
      const hasBasicStructure = [
        '# 需求挖掘报告',
        '## 1', '## 2', '## 3', '## 4', '## 5', '## 6', '## 7'
      ].some(item => content.includes(item));
      
      return {
        canTransition: true,
        reason: 'discovery.md 已存在且包含内容',
        discoveryExists: hasContent && hasBasicStructure
      };
    } catch (error) {
      // 文件不存在，返回警告但仍可能允许跳过
      return {
        canTransition: true, // 允许转移，但在UI中显示警告
        reason: 'discovery.md 不存在',
        warning: '发现阶段未完成，建议执行 @sddu discovery [feature] 完善需求挖掘',
        discoveryExists: false
      };
    }
  }

  /**
   * 检查是否可以从 discovered 转移到 specified 状态
   * 这是为了确保 discovery 阶段已经完成后再进行 spec 预写
   */
  async canTransitionFromDiscoveredToSpecified(featureId: string): Promise<{ canTransition: boolean; reason: string; discovered: boolean }> {
    const featureStateObj = this.stateMachine.getState(featureId);
    if (!featureStateObj) {
      return {
        canTransition: false,
        reason: 'Feature 不存在',
        discovered: false
      };
    }

    if (featureStateObj.state !== 'discovered') {
      return {
        canTransition: false,
        reason: '必须从 discovered 状态才能过渡到 specified',
        discovered: false
      };
    }

    // 检查 discovery.md 文件是否存在于对应目录中
    const featureDir = path.join(this.stateMachine['specsDir'], featureId);
    try {
      const discoveryPath = path.join(featureDir, 'discovery.md');
      await fs.access(discoveryPath);
      const content = await fs.readFile(discoveryPath, 'utf-8');
      
      return {
        canTransition: true,
        reason: 'discovery 文件已存在',
        discovered: content && content.trim().length > 0
      };
    } catch (error) {
      return {
        canTransition: false,
        reason: 'discovery.md 文件缺失',
        discovered: false
      };
    }
  }

  /**
   * 验证从 drafting 直接到 specified 的情况
   * 这是一种跳过 discovery 的情况，应发出警告
   */
  async checkSkippedDiscovery(featureId: string): Promise<boolean> {
    const featureStateObj = this.stateMachine.getState(featureId);
    if (!featureStateObj || featureStateObj.state !== 'drafting') {
      return false; // 不在 drafting 状态，不能检查跳过情况
    }

    // 检查 discovery.md 是否存在
    const featureDir = path.join(this.stateMachine['specsDir'], featureId);
    try {
      const discoveryPath = path.join(featureDir, 'discovery.md');
      await fs.access(discoveryPath);
      // 如果 discovery.md 存在，则说明没有跳过
      return false;
    } catch (error) {
      // 如果 discovery.md 不存在，说明直接从 drafting 到 specified 跳过了 discovery
      return true;
    }
  }
}