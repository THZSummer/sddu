// SDD Agents 注册
export async function registerAgents(context: any) {
  const agents = [
    // 智能入口和帮助
    {
      name: 'sdd',
      description: 'SDD 工作流智能入口 - 自动路由到正确阶段',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd.md'
    },
    {
      name: 'sdd-help',
      description: 'SDD 工作流帮助 - 查看完整命令参考',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-help.md'
    },
    // 阶段 1/6: 规范编写
    {
      name: 'sdd-1-spec',
      description: 'SDD 规范编写专家 (阶段 1/6) - 推荐用这个',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-spec.md'
    },
    {
      name: 'sdd-spec',
      description: 'SDD 规范编写专家 (阶段 1/6) - 同 sdd-1-spec',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-spec.md'
    },
    // 阶段 2/6: 技术规划
    {
      name: 'sdd-2-plan',
      description: 'SDD 技术规划专家 (阶段 2/6) - 推荐用这个',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-plan.md'
    },
    {
      name: 'sdd-plan',
      description: 'SDD 技术规划专家 (阶段 2/6) - 同 sdd-2-plan',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-plan.md'
    },
    // 阶段 3/6: 任务分解
    {
      name: 'sdd-3-tasks',
      description: 'SDD 任务分解专家 (阶段 3/6) - 推荐用这个',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-tasks.md'
    },
    {
      name: 'sdd-tasks',
      description: 'SDD 任务分解专家 (阶段 3/6) - 同 sdd-3-tasks',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-tasks.md'
    },
    // 阶段 4/6: 任务实现
    {
      name: 'sdd-4-build',
      description: 'SDD 任务实现专家 (阶段 4/6) - 推荐用这个',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-build.md'
    },
    {
      name: 'sdd-build',
      description: 'SDD 任务实现专家 (阶段 4/6) - 同 sdd-4-build',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-build.md'
    },
    // 阶段 5/6: 代码审查
    {
      name: 'sdd-5-review',
      description: 'SDD 代码审查专家 (阶段 5/6) - 推荐用这个',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-review.md'
    },
    {
      name: 'sdd-review',
      description: 'SDD 代码审查专家 (阶段 5/6) - 同 sdd-5-review',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-review.md'
    },
    // 阶段 6/6: 最终验证
    {
      name: 'sdd-6-validate',
      description: 'SDD 验证专家 (阶段 6/6) - 推荐用这个',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-validate.md'
    },
    {
      name: 'sdd-validate',
      description: 'SDD 验证专家 (阶段 6/6) - 同 sdd-6-validate',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-validate.md'
    },
    // 扩展功能: Roadmap 规划
    {
      name: 'sdd-roadmap',
      description: 'SDD Roadmap 规划专家 - 多版本路线图规划',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-roadmap.md'
    },
    // 扩展功能：文档维护
    {
      name: 'sdd-docs',
      description: 'SDD 目录导航生成器 - 扫描目录结构生成 README 导航',
      mode: 'subagent',
      promptFile: '.opencode/agents/sdd-docs.md'
    }
  ];

  for (const agent of agents) {
    try {
      const fs = await import('fs/promises');
      await fs.access(agent.promptFile);
      console.log(`✅ Agent 可用：${agent.name}`);
    } catch {
      console.warn(`⚠️ Agent prompt 文件不存在：${agent.promptFile}`);
    }
  }
}
