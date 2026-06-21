// templates/ 公共 API 出口 — 模板引擎与模板资产
// 域间 import 只能通过此文件，不得直接引用内部文件
// 规则：零 @opencode-ai/plugin 依赖，不反向引用 adapters/
// 注：HBS 模板资产（agents/ + outputs/）不在 TypeScript 编译范围

export * from './subfeature-templates';
export * from './subfeature-manager';
export * from './readme-generator';
