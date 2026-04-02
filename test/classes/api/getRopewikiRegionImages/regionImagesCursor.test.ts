import { describe, it, expect } from '@jest/globals';
import { CursorType } from '../../../../src/classes/cursors/cursor';
import { RegionImagesCursor } from '../../../../src/classes/cursors/regionImagesCursor';

describe('RegionImagesCursor', () => {
    describe('constructor', () => {
        it('sets sortKey, pageId, and imageId', () => {
            const c = new RegionImagesCursor(0.95, 'page-123', 'img-456');
            expect(c.sortKey).toBe(0.95);
            expect(c.pageId).toBe('page-123');
            expect(c.imageId).toBe('img-456');
        });
    });

    describe('encodeBase64', () => {
        it('returns base64url string (no + or /)', () => {
            const c = new RegionImagesCursor(0.5, 'p', 'i');
            const encoded = c.encodeBase64();
            expect(encoded).not.toMatch(/[+/]/);
            expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
        });

        it('round-trips with decodeBase64', () => {
            const c = new RegionImagesCursor(0.8, 'page-id', 'next-image-id');
            const encoded = c.encodeBase64();
            const decoded = RegionImagesCursor.decodeBase64(encoded);
            expect(decoded.sortKey).toBe(c.sortKey);
            expect(decoded.pageId).toBe(c.pageId);
            expect(decoded.imageId).toBe(c.imageId);
        });
    });

    describe('decodeBase64', () => {
        it('decodes valid cursor with sortKey, pageId, and imageId', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.RegionImages,
                    sortKey: 0.9,
                    pageId: 'page-uuid',
                    imageId: 'image-uuid',
                }),
                'utf8',
            ).toString('base64url');
            const c = RegionImagesCursor.decodeBase64(encoded);
            expect(c).toBeInstanceOf(RegionImagesCursor);
            expect(c.sortKey).toBe(0.9);
            expect(c.pageId).toBe('page-uuid');
            expect(c.imageId).toBe('image-uuid');
        });

        it('throws for empty string', () => {
            expect(() => RegionImagesCursor.decodeBase64('')).toThrow(
                'region images cursor must be a non-empty string',
            );
        });

        it('throws for invalid base64url', () => {
            expect(() =>
                RegionImagesCursor.decodeBase64('!!!invalid!!!'),
            ).toThrow(/Invalid region images cursor encoding/);
        });

        it('throws when decoded JSON is not an object with sortKey, pageId, and imageId', () => {
            const encoded = Buffer.from('"string"', 'utf8').toString(
                'base64url',
            );
            expect(() => RegionImagesCursor.decodeBase64(encoded)).toThrow(
                'region images cursor must be an object',
            );
        });

        it('throws when sortKey is missing', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.RegionImages,
                    pageId: 'p',
                    imageId: 'i',
                }),
                'utf8',
            ).toString('base64url');
            expect(() => RegionImagesCursor.decodeBase64(encoded)).toThrow(
                'Region images cursor must be an object with sortKey, pageId, and imageId',
            );
        });

        it('throws when sortKey is not a number', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.RegionImages,
                    sortKey: 'high',
                    pageId: 'p',
                    imageId: 'i',
                }),
                'utf8',
            ).toString('base64url');
            expect(() => RegionImagesCursor.decodeBase64(encoded)).toThrow(
                'Region images cursor sortKey must be a number',
            );
        });

        it('throws when pageId is not a string', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.RegionImages,
                    sortKey: 0,
                    pageId: 123,
                    imageId: 'i',
                }),
                'utf8',
            ).toString('base64url');
            expect(() => RegionImagesCursor.decodeBase64(encoded)).toThrow(
                'Region images cursor pageId must be a string',
            );
        });

        it('throws when imageId is not a string', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.RegionImages,
                    sortKey: 0,
                    pageId: 'p',
                    imageId: 456,
                }),
                'utf8',
            ).toString('base64url');
            expect(() => RegionImagesCursor.decodeBase64(encoded)).toThrow(
                'Region images cursor imageId must be a string',
            );
        });
    });
});
