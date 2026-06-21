/**
 * Discovery 状态验证器
 * 用于验证从 drafting/registered 到 discovered 的状态流转
 *
 * v3.0.0: Adapted to use Phase + FeatureStatus two-field model.
 * Removed old FeatureStateEnum / mapWorkflowStatusToStateEnum mapping.
 */

import { StateMachine } from '../state';
import * as fsPromises from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { Phase } from '../state';

interface DiscoveryTransitionResult {
  canTransition: boolean;
  reason: string;
  warning?: string;
  discoveryExists: boolean;
}

export class DiscoveryStateValidator {
  constructor(private stateMachine: StateMachine) {}

  /**
   * 检查是否可以从当前阶段转移到 discovered 状态
   * - Feature 必须处于注册后、discovery 前阶段 (registered 或上一阶段的 drafted)
   * - discovery.md 文件是否存在
   * - discovery.md 内容基本结构是否完整
   */
  async canTransitionToDiscovered(featureId: string): Promise<DiscoveryTransitionResult> {
    const featureStateObj = await this.stateMachine.getState(featureId);
    if (!featureStateObj) {
      return {
        canTransition: false,
        reason: 'Feature 不存在',
        discoveryExists: false
      };
    }

    // v3.0.0: Check phase directly — only registered features can move to discovered
    const currentPhase = featureStateObj.phase as Phase;

    // Allow transition from 'registered' phase only (v3.0.0)
    if (currentPhase !== 'registered') {
      return {
        canTransition: false,
        reason: `只有 registered 状态可以转移到 discovered 状态，当前为 ${currentPhase}`,
        discoveryExists: false
      };
    }

    // 检查 discovery.md 文件是否存在
    const featureDir = path.join(this.stateMachine['specsDir'], featureId); 
    const discoveryPath = path.join(featureDir, 'discovery.md');
    if (existsSync(discoveryPath)) {
      try {
        // 读取并验证 discovery.md 的基本结构
        const content = await fsPromises.readFile(discoveryPath, 'utf8');
        
        // 检查是否包含必要章节
        if (content.includes('问题空间探索') || content.includes('用户画像') || content.includes('需' + '求')) {
          // 检查了基本内容的存在性
          return {
            canTransition: true,
            reason: '',
            discoveryExists: true
          };
        } else {
          // discovery 文件存在但内容不完整
          return {
            canTransition: false,
            reason: 'discovery.md 文件存在但内容不完整，请完善内容后再切换',
            warning: '文件内容不充分',
            discoveryExists: true
          };
        }
      } catch (error) {
        console.error(`读取 discovery.md 时出错: ${error}`);
        return {
          canTransition: false,
          reason: '无法读取 discovery.md',
          discoveryExists: false
        };
      }
    } else {
      return {
        canTransition: false,
        reason: 'discovery.md 不存在',
        discoveryExists: false
      };
    }
  }

  /**
   * 检查是否可以从 discovered 转移到 specified 状态
   * 这是为了确保 discovery 阶段已经完成后再进行 spec 预写
   */
  async canTransitionFromDiscoveredToSpecified(featureId: string): Promise<{ canTransition: boolean; reason: string; discovered: boolean }> {
    const featureStateObj = await this.stateMachine.getState(featureId);
    if (!featureStateObj) {
      return {
        canTransition: false,
        reason: 'Feature 不存在',
        discovered: false
      };
    }

    const currentPhase = featureStateObj.phase as Phase;
    if (currentPhase !== 'discovered') {
      return {
        canTransition: false,
        reason: '必须从 discovered 状态才能过渡到 specified',
        discovered: false
      };
    }

    // 检查 discovery.md 文件是否存在
    const featureDir = path.join(this.stateMachine['specsDir'], featureId);
    try {
      const discoveryPath = path.join(featureDir, 'discovery.md');
      await fsPromises.access(discoveryPath);
      
      // 检查文件是否有内容
      const content = await fsPromises.readFile(discoveryPath, 'utf-8');
      const hasContent = content && content.trim().length > 0;
      
      // 检查是否包含基本的发现内容标记
      const hasBasicStructure = [
        '# 需求挖掘报告',
        '## 1', '## 2', '## 3', '## 4', '## 5', '## 6', '## 7'
      ].some(item => content.includes(item));
      
      return {
        canTransition: true,
        reason: 'discovery.md 已存在且包含内容',
        discovered: hasContent && hasBasicStructure
      };
    } catch (error) {
      // 文件不存在，返回警告但仍可能允许跳过
      return {
        canTransition: true, // 允许转移，但在UI中显示警告
        reason: 'discovery.md 不存在',
        discovered: false
      };
    }
  }

  /**
   * 检查用户是否在当前会话中跳过了 discovery 阶段
   * 这是一种跳过 discovery 的情况，应发出警告
   */
  async checkSkippedDiscovery(featureId: string): Promise<boolean> {
    const featureStateObj = await this.stateMachine.getState(featureId);
    const currentPhase = (featureStateObj as any)?.phase || '';

    if (!featureStateObj || (currentPhase !== 'registered')) {
      return false; // 不在 registered 状态，不能检查跳过情况
    }

    // 检查 discovery.md 是否存在
    const featureDir = path.join(this.stateMachine['specsDir'], featureId);
    try {
      const discoveryPath = path.join(featureDir, 'discovery.md');
      await fsPromises.access(discoveryPath);
      // 如果 discovery.md 存在，则说明没有跳过
      return false;
    } catch (error) {
      // 如果 discovery.md 不存在，说明直接从 registered 到 specified 跳过了 discovery
      return true;
    }
  }
}