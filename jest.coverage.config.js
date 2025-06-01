module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/types/**/*.ts', '!src/index.ts', '!src/**/*.d.ts'],
  // No coverage thresholds for CI reporting
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Modern ts-jest configuration
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
        },
      },
    ],
  },
};
