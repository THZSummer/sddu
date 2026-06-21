// Jest Configuration — Projects-based to support layered test execution
// 支持 core / opencode / integration 三层独立测试粒度（FR-005, ADR-004）
// 不包含 e2e/ — E2E 使用独立的 e2e/jest.config.ts

import type { Config } from 'jest';

const baseConfig: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@pipeline/(.*)$': '<rootDir>/src/pipeline/$1',
    '^@state/(.*)$': '<rootDir>/src/state/$1',
    '^@discovery/(.*)$': '<rootDir>/src/discovery/$1',
    '^@agents/(.*)$': '<rootDir>/src/agents/$1',
    '^@templates/(.*)$': '<rootDir>/src/templates/$1',
    '^@opencode/(.*)$': '<rootDir>/src/adapters/opencode/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
};

const config: Config = {
  ...baseConfig,
  projects: [
    {
      displayName: 'core',
      ...baseConfig,
      testMatch: [
        '<rootDir>/src/__tests__/unit/pipeline/**/*.test.ts',
        '<rootDir>/src/__tests__/unit/state/**/*.test.ts',
        '<rootDir>/src/__tests__/unit/discovery/**/*.test.ts',
        '<rootDir>/src/__tests__/unit/agents/**/*.test.ts',
        '<rootDir>/src/__tests__/unit/templates/**/*.test.ts',
        '<rootDir>/src/__tests__/unit/shared/**/*.test.ts',
      ],
      collectCoverageFrom: [
        'src/pipeline/**/*.ts',
        'src/state/**/*.ts',
        'src/discovery/**/*.ts',
        'src/agents/**/*.ts',
        'src/templates/**/*.ts',
        'src/shared/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
      ],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    {
      displayName: 'opencode',
      ...baseConfig,
      testMatch: [
        '<rootDir>/src/__tests__/unit/adapters/**/*.test.ts',
      ],
      collectCoverageFrom: [
        'src/adapters/**/*.ts',
        '!src/adapters/**/*.d.ts',
        '!src/adapters/**/index.ts',
      ],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    {
      displayName: 'integration',
      ...baseConfig,
      testMatch: [
        '<rootDir>/src/__tests__/integration/**/*.test.ts',
      ],
      collectCoverageFrom: [],
      coverageThreshold: undefined,
    },
  ],
};

export default config;
