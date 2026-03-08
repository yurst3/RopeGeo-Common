import { describe, it, expect } from '@jest/globals';
import { CursorType } from '../../../../src/types/cursors/cursor';
import { RegionPreviewsCursor } from '../../../../src/types/cursors/regionPreviewsCursor';

describe('RegionPreviewsCursor', () => {
    describe('constructor', () => {
        it('sets sortKey, type, and id', () => {
            const c = new RegionPreviewsCursor(0.95, 'page', 'abc-123');
            expect(c.sortKey).toBe(0.95);
            expect(c.type).toBe('page');
            expect(c.id).toBe('abc-123');
        });
    });

    describe('encodeBase64', () => {
        it('returns base64url string (no + or /)', () => {
            const c = new RegionPreviewsCursor(0.5, 'region', 'v');
            const encoded = c.encodeBase64();
            expect(encoded).not.toMatch(/[+/]/);
            expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
        });

        it('round-trips with decodeBase64', () => {
            const c = new RegionPreviewsCursor(0.8, 'page', 'next-page-id');
            const encoded = c.encodeBase64();
            const decoded = RegionPreviewsCursor.decodeBase64(encoded);
            expect(decoded.sortKey).toBe(c.sortKey);
            expect(decoded.type).toBe(c.type);
            expect(decoded.id).toBe(c.id);
        });
    });

    describe('decodeBase64', () => {
        it('decodes valid cursor with sortKey, type, and id', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.RegionPreviews,
                    sortKey: 0.9,
                    type: 'page',
                    id: 'item-id',
                }),
                'utf8',
            ).toString('base64url');
            const c = RegionPreviewsCursor.decodeBase64(encoded);
            expect(c).toBeInstanceOf(RegionPreviewsCursor);
            expect(c.sortKey).toBe(0.9);
            expect(c.type).toBe('page');
            expect(c.id).toBe('item-id');
        });

        it('throws for empty string', () => {
            expect(() => RegionPreviewsCursor.decodeBase64('')).toThrow(
                'region previews cursor must be a non-empty string',
            );
        });

        it('throws for invalid base64url', () => {
            expect(() =>
                RegionPreviewsCursor.decodeBase64('!!!invalid!!!'),
            ).toThrow(/Invalid region previews cursor encoding/);
        });

        it('throws when decoded JSON is not an object with sortKey, type, and id', () => {
            const encoded = Buffer.from('"string"', 'utf8').toString(
                'base64url',
            );
            expect(() => RegionPreviewsCursor.decodeBase64(encoded)).toThrow(
                'region previews cursor must be an object',
            );
        });

        it('throws when sortKey is missing', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.RegionPreviews,
                    type: 'page',
                    id: 'x',
                }),
                'utf8',
            ).toString('base64url');
            expect(() => RegionPreviewsCursor.decodeBase64(encoded)).toThrow(
                'Region previews cursor must be an object with sortKey, type, and id',
            );
        });

        it('throws when sortKey is not a number', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.RegionPreviews,
                    sortKey: 'high',
                    type: 'page',
                    id: 'x',
                }),
                'utf8',
            ).toString('base64url');
            expect(() => RegionPreviewsCursor.decodeBase64(encoded)).toThrow(
                'Region previews cursor sortKey must be a number',
            );
        });

        it('throws when type is not a string', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.RegionPreviews,
                    sortKey: 0,
                    type: 123,
                    id: 'x',
                }),
                'utf8',
            ).toString('base64url');
            expect(() => RegionPreviewsCursor.decodeBase64(encoded)).toThrow(
                'Region previews cursor type must be a string',
            );
        });

        it('throws when id is not a string', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.RegionPreviews,
                    sortKey: 0,
                    type: 'page',
                    id: 456,
                }),
                'utf8',
            ).toString('base64url');
            expect(() => RegionPreviewsCursor.decodeBase64(encoded)).toThrow(
                'Region previews cursor id must be a string',
            );
        });
    });
});
