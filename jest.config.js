module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '\\.module\\.s?css$': 'identity-obj-proxy',
    '\\.s?css$': '<rootDir>/tests/mocks/empty.js',
    '\\.svg\\?(url|inline)$': '<rootDir>/tests/mocks/file.js',
    '\\?raw$': '<rootDir>/tests/mocks/file.js',
    '\\.svg$': '<rootDir>/tests/mocks/svg.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
