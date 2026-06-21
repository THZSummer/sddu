// discovery/ 公共 API 出口 — 需求挖掘阶段逻辑
// 域间 import 只能通过此文件，不得直接引用内部文件
// 规则：零 @opencode-ai/plugin 依赖，不反向引用 adapters/

export * from './workflow-engine';
export * from './coaching-mode';
export { DiscoveryStateValidator } from './state-validator';
export * from './types';
