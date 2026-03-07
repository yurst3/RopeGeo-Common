import { describe, it, expect } from '@jest/globals';
import { RegionImagesCursor } from '../../../../src/types/api/getRopewikiRegionImages/regionImagesCursor';
import { RopewikiRegionImagesParams } from '../../../../src/types/api/getRopewikiRegionImages/ropewikiRegionImagesParams';

/** Base64url-encoded RegionImagesCursor with sortKey 0.5, pageId 'page-1', imageId 'img-v' */
const validCursorEncoded = Buffer.from(
    JSON.stringify({
        sortKey: 0.5,
        pageId: 'page-1',
        imageId: 'img-v',
    }),
    'utf8',
).toString('base64url');

describe('RopewikiRegionImagesParams', () => {
    describe('constructor', () => {
        it('accepts valid limit and null cursor', () => {
            const p = new RopewikiRegionImagesParams(20, null);
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
                () => new RopewikiRegionImagesParams(0, null),
            ).toThrow(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        });

        it('throws when limit is not an integer', () => {
            expect(
                () => new RopewikiRegionImagesParams(20.5, null),
            ).toThrow(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        });

        it('throws when cursor is invalid', () => {
            expect(
                () => new RopewikiRegionImagesParams(20, '!!!invalid!!!'),
            ).toThrow('Invalid or malformed query parameter: cursor');
        });
    });

    describe('toQueryStringParams', () => {
        it('returns limit and omits cursor when cursor is null', () => {
            const p = new RopewikiRegionImagesParams(15, null);
            expect(p.toQueryStringParams()).toEqual({ limit: '15' });
        });

        it('includes cursor when set', () => {
            const p = new RopewikiRegionImagesParams(15, validCursorEncoded);
            const params = p.toQueryStringParams();
            expect(params.limit).toBe('15');
            expect(params.cursor).toBe(validCursorEncoded);
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
