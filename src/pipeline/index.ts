// pipeline/ 公共 API 出口 — 管线定义与工作流阶段流转
// 域间 import 只能通过此文件，不得直接引用内部文件
// 规则：零 @opencode-ai/plugin 依赖，不反向引用 adapters/

export * from './types';
export * from './workflow-engine';
export * from './coaching-mode';
export * from './state-validator';
export * from './tasks-parser';
