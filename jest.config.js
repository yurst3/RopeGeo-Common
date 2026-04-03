/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    testMatch: ['**/*.test.ts', '**/*.test.tsx'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
};
