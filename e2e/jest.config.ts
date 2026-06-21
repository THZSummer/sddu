// E2E Test Configuration — 独立于源码测试的端到端测试项目
// 不 import src/，不收集覆盖率，使用独立的 jest 配置
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/e2e'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  testTimeout: 30000,
  collectCoverage: false,
  coverageReporters: [],
};
