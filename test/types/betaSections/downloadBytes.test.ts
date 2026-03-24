import { describe, it, expect } from '@jest/globals';
import { DownloadBytes } from '../../../src/types/betaSections/downloadBytes';

function validBody(): Record<string, unknown> {
    return {
        preview: 100,
        banner: 2000,
        full: 500000,
    };
}

describe('DownloadBytes', () => {
    describe('constructor', () => {
        it('sets all properties', () => {
            const d = new DownloadBytes(1, 2, 3);
            expect(d.preview).toBe(1);
            expect(d.banner).toBe(2);
            expect(d.full).toBe(3);
        });
    });

    describe('fromResult', () => {
        it('returns instance with validated fields', () => {
            const d = DownloadBytes.fromResult(validBody());
            expect(d).toBeInstanceOf(DownloadBytes);
            expect(d.preview).toBe(100);
            expect(d.banner).toBe(2000);
            expect(d.full).toBe(500000);
        });

        it('accepts zero for any field', () => {
            const d = DownloadBytes.fromResult({
                preview: 0,
                banner: 0,
                full: 0,
            });
            expect(d.preview).toBe(0);
            expect(d.banner).toBe(0);
            expect(d.full).toBe(0);
        });

        it('throws when result is null', () => {
            expect(() => DownloadBytes.fromResult(null)).toThrow(
                'DownloadBytes result must be an object',
            );
        });

        it('throws when preview is negative', () => {
            expect(() =>
                DownloadBytes.fromResult({ ...validBody(), preview: -1 }),
            ).toThrow('DownloadBytes.preview must be a finite non-negative number');
        });

        it('throws when banner is NaN', () => {
            expect(() =>
                DownloadBytes.fromResult({ ...validBody(), banner: NaN }),
            ).toThrow('DownloadBytes.banner must be a finite non-negative number');
        });

        it('throws when full is missing', () => {
            const { full: _, ...rest } = validBody();
            expect(() => DownloadBytes.fromResult(rest)).toThrow(
                'DownloadBytes.full must be a finite non-negative number',
            );
        });
    });
});
