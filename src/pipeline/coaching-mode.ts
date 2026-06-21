/**
 * 管线级引导模式 — SDDU 工作流阶段引导策略
 * 规则：零 @opencode-ai/plugin 依赖，不反向引用 adapters/
 */

/** 辅导级别 */
export enum CoachingLevel {
  IDEA_STAGE = 'idea',
  PAIN_STAGE = 'pain',
  SOLUTION_STAGE = 'solution',
  EXECUTION_STAGE = 'execution',
}

/** 辅导配置 */
export interface CoachingConfig {
  level: CoachingLevel;
  name: string;
  intervention: 'high' | 'medium' | 'low' | 'minimal';
  guidance: string;
}

/** 辅导级别配置映射 */
export const COACHING_CONFIGS: Record<CoachingLevel, CoachingConfig> = {
  [CoachingLevel.IDEA_STAGE]: {
    level: CoachingLevel.IDEA_STAGE,
    name: '想法阶段',
    intervention: 'high',
    guidance: '用户仅有模糊想法，需要深度引导完成问题空间探索和需求挖掘',
  },
  [CoachingLevel.PAIN_STAGE]: {
    level: CoachingLevel.PAIN_STAGE,
    name: '痛点阶段',
    intervention: 'medium',
    guidance: '用户明确痛点但尚未形成方案，需要引导需求分析和优先级排序',
  },
  [CoachingLevel.SOLUTION_STAGE]: {
    level: CoachingLevel.SOLUTION_STAGE,
    name: '方案阶段',
    intervention: 'low',
    guidance: '用户已有解决方案设想，需要辅助技术设计和任务分解',
  },
  [CoachingLevel.EXECUTION_STAGE]: {
    level: CoachingLevel.EXECUTION_STAGE,
    name: '执行阶段',
    intervention: 'minimal',
    guidance: '用户已有明确方案和计划，需要辅助实施、审查和验证',
  },
};

/**
 * 管线辅导模式引擎
 * 根据用户输入判断其所处阶段并提供相应引导策略
 */
export class CoachingModeEngine {
  /**
   * 检测用户所处辅导级别
   */
  detectLevel(userInput: string): CoachingLevel {
    const input = userInput.toLowerCase();

    // 执行阶段关键词（最具体，优先匹配）
    const executionKeywords = [
      '实现', '代码', '构建', 'build', '测试', 'test',
      '审查', 'review', '验证', 'validate', '部署', 'deploy',
    ];
    if (executionKeywords.some(kw => input.includes(kw))) {
      return CoachingLevel.EXECUTION_STAGE;
    }

    // 方案阶段关键词
    const solutionKeywords = [
      '方案', '设计', 'plan', '架构', '技术', '接口',
      'api', '数据库', 'database', '组件', '模块',
    ];
    if (solutionKeywords.some(kw => input.includes(kw))) {
      return CoachingLevel.SOLUTION_STAGE;
    }

    // 痛点阶段关键词
    const painKeywords = [
      '问题', '痛点', '需求', 'requirement', '功能', 'feature',
      '用户', 'user', '场景', '优化', 'improve',
    ];
    if (painKeywords.some(kw => input.includes(kw))) {
      return CoachingLevel.PAIN_STAGE;
    }

    // 默认：想法阶段
    return CoachingLevel.IDEA_STAGE;
  }

  /**
   * 获取辅导配置
   */
  getConfig(level: CoachingLevel): CoachingConfig {
    return COACHING_CONFIGS[level];
  }

  /**
   * 根据辅导级别调整引导策略
   */
  getGuidanceStrategy(level: CoachingLevel): string {
    return COACHING_CONFIGS[level].guidance;
  }
}
