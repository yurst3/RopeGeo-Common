import { jest } from '@jest/globals';

/** Suppress `console.warn` during tests that intentionally exercise retry paths. */
export function mockConsoleWarn(): jest.SpiedFunction<typeof console.warn> {
    return jest.spyOn(console, 'warn').mockImplementation(() => {});
}
