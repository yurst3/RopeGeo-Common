import { describe, it, expect } from '@jest/globals';
import { RegionImagesCursor } from '../../../../src/types/api/getRopewikiRegionImages/regionImagesCursor';

describe('RegionImagesCursor', () => {
    describe('constructor', () => {
        it('sets value', () => {
            const c = new RegionImagesCursor('cursor-value');
            expect(c.value).toBe('cursor-value');
        });
    });

    describe('encodeBase64', () => {
        it('returns base64url string (no + or /)', () => {
            const c = new RegionImagesCursor('v');
            const encoded = c.encodeBase64();
            expect(encoded).not.toMatch(/[+/]/);
            expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
        });

        it('round-trips with decodeBase64', () => {
            const c = new RegionImagesCursor('next-image-id');
            const encoded = c.encodeBase64();
            const decoded = RegionImagesCursor.decodeBase64(encoded);
            expect(decoded.value).toBe(c.value);
        });
    });

    describe('decodeBase64', () => {
        it('decodes valid cursor', () => {
            const encoded = Buffer.from(
                JSON.stringify({ value: 'xyz' }),
                'utf8',
            ).toString('base64url');
            const c = RegionImagesCursor.decodeBase64(encoded);
            expect(c).toBeInstanceOf(RegionImagesCursor);
            expect(c.value).toBe('xyz');
        });

        it('throws for empty string', () => {
            expect(() => RegionImagesCursor.decodeBase64('')).toThrow(
                'Region images cursor must be a non-empty string',
            );
        });

        it('throws for invalid base64url', () => {
            expect(() =>
                RegionImagesCursor.decodeBase64('!!!invalid!!!'),
            ).toThrow(/Invalid region images cursor encoding/);
        });

        it('throws when decoded JSON is not an object with value', () => {
            const encoded = Buffer.from('"string"', 'utf8').toString(
                'base64url',
            );
            expect(() => RegionImagesCursor.decodeBase64(encoded)).toThrow(
                'Region images cursor must be an object with value',
            );
        });
    });
});
