import { describe, it, expect } from '@jest/globals';
import { RegionImagesCursor } from '../../../../src/models/api/params/cursors/regionImagesCursor';
import { RopewikiRegionImagesParams } from '../../../../src/models/api/params/ropewikiRegionImagesParams';

/** Base64url-encoded RegionImagesCursor with sortKey 0.5, pageId 'page-1', imageId 'img-v' */
const validCursorEncoded = new RegionImagesCursor(0.5, 'page-1', 'img-v').encodeBase64();

describe('RopewikiRegionImagesParams', () => {
    describe('constructor', () => {
        it('accepts valid limit without cursor (cursor omitted)', () => {
            const p = new RopewikiRegionImagesParams(20);
            expect(p.limit).toBe(20);
            expect(p.cursor).toBeNull();
        });

        it('accepts valid limit and null cursor', () => {
            const p = new RopewikiRegionImagesParams(20, undefined);
            expect(p.limit).toBe(20);
            expect(p.cursor).toBeNull();
        });

        it('accepts valid limit and encoded cursor', () => {
            const p = new RopewikiRegionImagesParams(10, validCursorEncoded);
            expect(p.limit).toBe(10);
            expect(p.cursor).toBeInstanceOf(RegionImagesCursor);
            expect(p.cursor!.sortKey).toBe(0.5);
            expect(p.cursor!.pageId).toBe('page-1');
            expect(p.cursor!.imageId).toBe('img-v');
        });

        it('treats empty string cursor as null', () => {
            const p = new RopewikiRegionImagesParams(5, '');
            expect(p.cursor).toBeNull();
        });

        it('throws when limit is less than 1', () => {
            expect(
                () => new RopewikiRegionImagesParams(0),
            ).toThrow(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        });

        it('throws when limit is not an integer', () => {
            expect(
                () => new RopewikiRegionImagesParams(20.5),
            ).toThrow(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        });

        it('throws when cursor is invalid', () => {
            expect(
                () => new RopewikiRegionImagesParams(20, '!!!invalid!!!'),
            ).toThrow(/Invalid region images cursor encoding/);
        });
    });

    describe('toQueryString', () => {
        it('returns URL-encoded string with limit when cursor is null', () => {
            const p = new RopewikiRegionImagesParams(15);
            const q = p.toQueryString();
            expect(typeof q).toBe('string');
            const params = new URLSearchParams(q);
            expect(params.get('limit')).toBe('15');
            expect(params.has('cursor')).toBe(false);
        });

        it('includes cursor in URL-encoded string when set', () => {
            const p = new RopewikiRegionImagesParams(15, validCursorEncoded);
            const q = p.toQueryString();
            const params = new URLSearchParams(q);
            expect(params.get('limit')).toBe('15');
            expect(params.get('cursor')).toBe(validCursorEncoded);
        });
    });

    describe('withCursor', () => {
        it('returns new instance with null cursor when passed null', () => {
            const p = new RopewikiRegionImagesParams(10);
            const next = p.withCursor(null);
            expect(next).not.toBe(p);
            expect(next.cursor).toBeNull();
            expect(next.limit).toBe(p.limit);
        });

        it('returns new instance with encoded cursor for next page', () => {
            const p = new RopewikiRegionImagesParams(10);
            const next = p.withCursor(validCursorEncoded);
            expect(next).not.toBe(p);
            expect(next.cursor).toBeInstanceOf(RegionImagesCursor);
            expect(next.cursor!.encodeBase64()).toBe(validCursorEncoded);
        });
    });

    describe('fromQueryStringParams', () => {
        it('parses with default limit when limit omitted', () => {
            const p = RopewikiRegionImagesParams.fromQueryStringParams({});
            expect(p.limit).toBe(20);
            expect(p.cursor).toBeNull();
        });

        it('parses limit and cursor', () => {
            const p = RopewikiRegionImagesParams.fromQueryStringParams({
                limit: '25',
                cursor: validCursorEncoded,
            });
            expect(p.limit).toBe(25);
            expect(p.cursor).toBeInstanceOf(RegionImagesCursor);
        });

        it('accepts Limit and Cursor (capitalized)', () => {
            const p = RopewikiRegionImagesParams.fromQueryStringParams({
                Limit: '10',
                Cursor: validCursorEncoded,
            });
            expect(p.limit).toBe(10);
            expect(p.cursor!.sortKey).toBe(0.5);
            expect(p.cursor!.pageId).toBe('page-1');
            expect(p.cursor!.imageId).toBe('img-v');
        });

        it('throws when limit is invalid (validation in constructor)', () => {
            expect(() =>
                RopewikiRegionImagesParams.fromQueryStringParams({
                    limit: 'abc',
                }),
            ).toThrow(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        });
    });
});
