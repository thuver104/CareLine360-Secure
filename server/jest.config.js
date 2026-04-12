/**
 * Jest Configuration for CareLine360 Testing
 *
 * This file should be placed at the root of the server directory
 * File name: jest.config.js
 */

module.exports = {
  // Testing environment
  testEnvironment: "node",

  // Test timeout (milliseconds)
  testTimeout: 30000,

  // Collect coverage from these files
  collectCoverageFrom: [
    "controllers/**/*.js",
    "services/**/*.js",
    "models/**/*.js",
    "middleware/**/*.js",
    "routes/**/*.js",
    "!**/node_modules/**",
    "!**/tests/**",
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Test match patterns
  testMatch: [
    "**/tests/unit/**/*.test.js",
    "**/tests/integration/**/*.test.js",
  ],

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Module paths
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  // Ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  // Display names for tests
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Fast exit
  forceExit: true,

  // Max workers
  maxWorkers: "50%",

  // Bail on first test failure (optional)
  bail: false,

  // Coverage reporters
  coverageReporters: ["text", "lcov", "html", "json"],

  // Transform files
  transform: {
    "^.+\\.js$": "babel-jest",
  },
};

/**
 * USAGE:
 *
 * 1. Copy this file to: /server/jest.config.js
 *
 * 2. Run tests:
 *    npm test
 *    npm run test:unit
 *    npm run test:integration
 *
 * 3. Generate coverage:
 *    npm test -- --coverage
 *
 * 4. Watch mode:
 *    npm test -- --watch
 *
 * 5. Run specific test:
 *    npm test -- patient.test.js
 */
