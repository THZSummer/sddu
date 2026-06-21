/**
 * 管线状态验证器 — 验证 SDDU 工作流阶段流转合法性
 * 规则：零 @opencode-ai/plugin 依赖，不反向引用 adapters/
 */

import {
  Phase,
  PHASE_ORDER,
  VALID_PHASES,
} from '../state';
import { PipelineValidationResult } from './types';

/**
 * 管线状态验证器
 * 验证阶段流转是否符合 SDDU 工作流规则
 */
export class PipelineStateValidator {
  /**
   * 验证阶段流转是否合法
   */
  validateTransition(from: Phase, to: Phase): PipelineValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查阶段有效性
    if (!VALID_PHASES.includes(from)) {
      errors.push(`Invalid source phase: "${from}". Valid phases: ${VALID_PHASES.join(', ')}`);
    }
    if (!VALID_PHASES.includes(to)) {
      errors.push(`Invalid target phase: "${to}". Valid phases: ${VALID_PHASES.join(', ')}`);
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    // 检查流转方向（使用 PHASE_ORDER Record 获取数字顺序）
    const fromOrder = PHASE_ORDER[from] ?? -1;
    const toOrder = PHASE_ORDER[to] ?? -1;

    if (fromOrder === -1 || toOrder === -1) {
      errors.push(`Phase order lookup failed for "${from}" → "${to}"`);
      return { valid: false, errors, warnings };
    }

    // 不允许反向流转
    if (toOrder < fromOrder) {
      errors.push(
        `Backward transition not allowed: "${from}" → "${to}". ` +
        `The SDDU workflow must proceed forward through: ${VALID_PHASES.join(' → ')}`
      );
      return { valid: false, errors, warnings };
    }

    // 不允许跳级流转（差大于 1 即为跳级）
    if (toOrder > fromOrder + 1) {
      warnings.push(
        `Skipping phases: "${from}" → "${to}" skips intermediate phase(s). ` +
        `Consider progressing through each phase sequentially.`
      );
    }

    return { valid: true, errors, warnings };
  }

  /**
   * 验证阶段本身是否有效
   */
  isValidPhase(phase: string): phase is Phase {
    return VALID_PHASES.includes(phase as Phase);
  }

  /**
   * 获取两个阶段之间的所有中间阶段
   */
  getIntermediatePhases(from: Phase, to: Phase): Phase[] {
    const fromOrder = PHASE_ORDER[from] ?? -1;
    const toOrder = PHASE_ORDER[to] ?? -1;

    if (fromOrder === -1 || toOrder === -1 || fromOrder >= toOrder) {
      return [];
    }

    return VALID_PHASES.slice(fromOrder + 1, toOrder);
  }

  /**
   * 检查是否已达到最终阶段
   */
  isFinalPhase(phase: Phase): boolean {
    const order = PHASE_ORDER[phase] ?? -1;
    return order === VALID_PHASES.length - 1;
  }
}
