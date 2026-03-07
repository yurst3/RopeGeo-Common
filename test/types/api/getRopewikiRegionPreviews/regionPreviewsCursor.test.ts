import { describe, it, expect } from '@jest/globals';
import { RegionPreviewsCursor } from '../../../../src/types/api/getRopewikiRegionPreviews/regionPreviewsCursor';

describe('RegionPreviewsCursor', () => {
    describe('constructor', () => {
        it('sets value', () => {
            const c = new RegionPreviewsCursor('cursor-value');
            expect(c.value).toBe('cursor-value');
        });
    });

    describe('encodeBase64', () => {
        it('returns base64url string (no + or /)', () => {
            const c = new RegionPreviewsCursor('v');
            const encoded = c.encodeBase64();
            expect(encoded).not.toMatch(/[+/]/);
            expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
        });

        it('round-trips with decodeBase64', () => {
            const c = new RegionPreviewsCursor('next-page-id');
            const encoded = c.encodeBase64();
            const decoded = RegionPreviewsCursor.decodeBase64(encoded);
            expect(decoded.value).toBe(c.value);
        });
    });

    describe('decodeBase64', () => {
        it('decodes valid cursor', () => {
            const encoded = Buffer.from(
                JSON.stringify({ value: 'abc' }),
                'utf8',
            ).toString('base64url');
            const c = RegionPreviewsCursor.decodeBase64(encoded);
            expect(c).toBeInstanceOf(RegionPreviewsCursor);
            expect(c.value).toBe('abc');
        });

        it('throws for empty string', () => {
            expect(() => RegionPreviewsCursor.decodeBase64('')).toThrow(
                'Region previews cursor must be a non-empty string',
            );
        });

        it('throws for invalid base64url', () => {
            expect(() =>
                RegionPreviewsCursor.decodeBase64('!!!invalid!!!'),
            ).toThrow(/Invalid region previews cursor encoding/);
        });

        it('throws when decoded JSON is not an object with value', () => {
            const encoded = Buffer.from('"string"', 'utf8').toString(
                'base64url',
            );
            expect(() => RegionPreviewsCursor.decodeBase64(encoded)).toThrow(
                'Region previews cursor must be an object with value',
            );
        });
    });
});
