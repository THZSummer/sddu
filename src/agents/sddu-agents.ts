// SDDU Agents 注册
import { StateMachine } from "../state/machine";
import { Phase } from "../state/schema-v3.0.0";
import { AgentMetadata } from "../types";
import { agentRegistry } from "./registry";

export interface AgentIntegrationResult {
  success: boolean;
  message: string;
  updatedStates?: string[];
  errors?: string[];
}

// 定义内置的 agents，但不再直接暴露它们，而是注册到 registry
const builtinAgents: AgentMetadata[] = [
  // 智能入口和帮助
  {
    name: 'sddu',
    description: 'SDDU 工作流智能入口 - 自动路由到正确阶段',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu.md'
  },
  {
    name: 'sddu-help',
    description: 'SDDU 工作流帮助 - 查看完整命令参考',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-help.md'
  },
  // 阶段 1/8: 需求挖掘
  {
    name: 'sddu-0-discovery',
    description: 'SDDU 需求挖掘专家 (阶段 0/8) - 推荐用这个',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-discovery.md'
  },
  {
    name: 'sddu-discovery',
    description: 'SDDU 需求挖掘专家 (阶段 0/8) - 同 sddu-0-discovery',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-discovery.md'
  },
  // 阶段 2/8: 规范编写
  {
    name: 'sddu-1-spec',
    description: 'SDDU 规范编写专家 (阶段 1/8) - 推荐用这个',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-spec.md'
  },
  {
    name: 'sddu-spec',
    description: 'SDDU 规范编写专家 (阶段 1/8) - 同 sddu-1-spec',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-spec.md'
  },
  // 阶段 3/8: 技术规划
  {
    name: 'sddu-2-plan',
    description: 'SDDU 技术规划专家 (阶段 2/8) - 推荐用这个',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-plan.md'
  },
  {
    name: 'sddu-plan',
    description: 'SDDU 技术规划专家 (阶段 2/8) - 同 sddu-2-plan',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-plan.md'
  },
  // 阶段 4/8: 任务分解
  {
    name: 'sddu-3-tasks',
    description: 'SDDU 任务分解专家 (阶段 3/8) - 推荐用这个',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-tasks.md'
  },
  {
    name: 'sddu-tasks',
    description: 'SDDU 任务分解专家 (阶段 3/8) - 同 sddu-3-tasks',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-tasks.md'
  },
  // 阶段 5/8: 任务实现
  {
    name: 'sddu-4-build',
    description: 'SDDU 任务实现专家 (阶段 4/8) - 推荐用这个',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-build.md'
  },
  {
    name: 'sddu-build',
    description: 'SDDU 任务实现专家 (阶段 4/8) - 同 sddu-4-build',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-build.md'
  },
  // 阶段 6/8: 代码审查
  {
    name: 'sddu-5-review',
    description: 'SDDU 代码审查专家 (阶段 5/8) - 推荐用这个',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-review.md'
  },
  {
    name: 'sddu-review',
    description: 'SDDU 代码审查专家 (阶段 5/8) - 同 sddu-5-review',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-review.md'
  },
  // 阶段 7/8: 最终验证
  {
    name: 'sddu-6-validate',
    description: 'SDDU 验证专家 (阶段 6/8) - 推荐用这个',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-validate.md'
  },
  {
    name: 'sddu-validate',
    description: 'SDDU 验证专家 (阶段 6/8) - 同 sddu-6-validate',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-validate.md'
  },
  // 扩展功能: Roadmap 规划
  {
    name: 'sddu-roadmap',
    description: 'SDDU Roadmap 规划专家 - 多版本路线图规划',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-roadmap.md'
  },
  // 扩展功能：文档维护
  {
    name: 'sddu-docs',
    description: 'SDDU 目录导航生成器 - 扫描目录结构生成 README 导航',
    mode: 'subagent',
    promptFile: '.opencode/agents/sddu-docs.md'
  }
];

// 注册 agents 到 registry
export function registerBuiltinAgents(): void {
  const validAgents = builtinAgents.filter(agent => {
    try {
      const fs = require('fs/promises');
      return typeof fs.access === 'function'; // 简单验证 node fs 模块可用性
    } catch (e) {
      console.warn(`⚠️ Agent prompt 文件检查模块不可用：${agent.name}`);
      return true; // 仍然注册代理，但我们无法验证其 prompt 文件
    }
  });
  
  // 现在使用 AgentRegistry 来注册 agents
  agentRegistry.registerMany(validAgents);
  
  // 验证注册的 agents
  for (const agent of validAgents) {
    console.log(`✅ Agent 已注册：${agent.name}`);
  }
}

/**
 * Agent → Phase mapping (v3.0.0 two-field model).
 * When an SDDU agent completes its work, the feature's phase advances
 * to the corresponding value.
 */
const agentToPhaseMap: Record<string, Phase> = {
  'sddu-discovery':   'discovered',
  'sddu-0-discovery': 'discovered',
  'sddu-spec':        'specified',
  'sddu-1-spec':      'specified',
  'sddu-plan':        'planned',
  'sddu-2-plan':      'planned',
  'sddu-tasks':       'tasked',
  'sddu-3-tasks':     'tasked',
  'sddu-build':       'builded',
  'sddu-4-build':     'builded',
  'sddu-review':      'reviewed',
  'sddu-5-review':    'reviewed',
  'sddu-validate':    'validated',
  'sddu-6-validate':  'validated',
};

export async function registerAgents(context: any) {
  // 首先注册内置的 agents
  registerBuiltinAgents();
  
  // Create instance of StateMachine to integrate with agent workflow
  const stateMachine = new StateMachine();

  // Enhanced registration to support state workflow integration
  // 现在改为提供所有在 registry 中的已注册 agent 信息（主要用于信息检索）
  const registeredAgents = agentRegistry.getAll();

  for (const agent of registeredAgents) {
    try {
      const fs = await import('fs/promises');
      await fs.access(agent.promptFile);
    } catch {
      console.warn(`⚠️ Agent prompt 文件不存在：${agent.promptFile}`);
    }
  }
  
  // Integration function that updates states when agents are called
  const updateStateForAgentCall = async (agentName: string, featureId: string): Promise<AgentIntegrationResult> => {
    const targetPhase = agentToPhaseMap[agentName];
    
    if (targetPhase) {
      try {
        await stateMachine.load();  // Load the current state first
        
        console.log(`Updating state for feature ${featureId} to phase ${targetPhase} via agent ${agentName}`);
        
        await stateMachine.updateState(
          featureId, 
          targetPhase,  // v3.0.0: directly use Phase value
          {},  // No additional data for now
          agentName,  // triggeredBy
          `SDDU Agent executed: ${agentName}`,
          true  // skipValidation = true for agent-triggered updates
        );
        
        console.log(`✅ State updated for feature ${featureId}: phase=${targetPhase}`); 
        
        return {
          success: true,
          message: `状态已更新至 phase=${targetPhase}`,
          updatedStates: [targetPhase]
        };
      } catch (error: any) {
        console.error(`❌ State update failed for feature ${featureId} via agent ${agentName}:`, error.message);
        
        return {
          success: false,
          message: `状态更新失败: ${error.message}`,
          errors: [error.message]
        };
      }
    }
    
    return {
      success: true,
      message: `无状态更新的必要: ${agentName} 不对应于状态变更`
    };
  };
  
  // Return the agent info
  return {
    agents: registeredAgents,
    updateStateForAgentCall
  };
}

// Export the agent-to-phase map for external use
export { agentToPhaseMap };

// Re-export Phase type from schema-v3.0.0 for backward compatibility
export type { Phase } from '../state/schema-v3.0.0';
