module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Only this checkout's tests; ignored maintenance worktrees may contain copies.
  roots: ['<rootDir>/tests'],
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@salesforce/core/testSetup$': '<rootDir>/node_modules/@salesforce/core/lib/testSetup',
  },
};
