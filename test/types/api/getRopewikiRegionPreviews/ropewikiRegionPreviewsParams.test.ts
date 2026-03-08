import { describe, it, expect } from '@jest/globals';
import { RegionPreviewsCursor } from '../../../../src/types/cursors/regionPreviewsCursor';
import { RopewikiRegionPreviewsParams } from '../../../../src/types/api/getRopewikiRegionPreviews/ropewikiRegionPreviewsParams';

/** Base64url-encoded RegionPreviewsCursor with sortKey 0.5, type 'page', id 'v' */
const validCursorEncoded = new RegionPreviewsCursor(0.5, 'page', 'v').encodeBase64();

describe('RopewikiRegionPreviewsParams', () => {
    describe('constructor', () => {
        it('accepts valid limit and null cursor', () => {
            const p = new RopewikiRegionPreviewsParams(20, null);
            expect(p.limit).toBe(20);
            expect(p.cursor).toBeNull();
        });

        it('accepts valid limit and encoded cursor', () => {
            const p = new RopewikiRegionPreviewsParams(10, validCursorEncoded);
            expect(p.limit).toBe(10);
            expect(p.cursor).toBeInstanceOf(RegionPreviewsCursor);
            expect(p.cursor!.sortKey).toBe(0.5);
            expect(p.cursor!.type).toBe('page');
            expect(p.cursor!.id).toBe('v');
        });

        it('treats empty string cursor as null', () => {
            const p = new RopewikiRegionPreviewsParams(5, '');
            expect(p.cursor).toBeNull();
        });

        it('throws when limit is less than 1', () => {
            expect(
                () => new RopewikiRegionPreviewsParams(0, null),
            ).toThrow(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        });

        it('throws when limit is not an integer', () => {
            expect(
                () => new RopewikiRegionPreviewsParams(20.5, null),
            ).toThrow(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        });

        it('throws when cursor is invalid', () => {
            expect(
                () => new RopewikiRegionPreviewsParams(20, '!!!invalid!!!'),
            ).toThrow('Invalid or malformed query parameter: cursor');
        });
    });

    describe('toQueryStringParams', () => {
        it('returns limit and omits cursor when cursor is null', () => {
            const p = new RopewikiRegionPreviewsParams(15, null);
            expect(p.toQueryStringParams()).toEqual({ limit: '15' });
        });

        it('includes cursor when set', () => {
            const p = new RopewikiRegionPreviewsParams(15, validCursorEncoded);
            const params = p.toQueryStringParams();
            expect(params.limit).toBe('15');
            expect(params.cursor).toBe(validCursorEncoded);
        });
    });

    describe('fromQueryStringParams', () => {
        it('parses with default limit when limit omitted', () => {
            const p = RopewikiRegionPreviewsParams.fromQueryStringParams({});
            expect(p.limit).toBe(20);
            expect(p.cursor).toBeNull();
        });

        it('parses limit and cursor', () => {
            const p = RopewikiRegionPreviewsParams.fromQueryStringParams({
                limit: '25',
                cursor: validCursorEncoded,
            });
            expect(p.limit).toBe(25);
            expect(p.cursor).toBeInstanceOf(RegionPreviewsCursor);
        });

        it('accepts Limit and Cursor (capitalized)', () => {
            const p = RopewikiRegionPreviewsParams.fromQueryStringParams({
                Limit: '10',
                Cursor: validCursorEncoded,
            });
            expect(p.limit).toBe(10);
            expect(p.cursor!.sortKey).toBe(0.5);
            expect(p.cursor!.type).toBe('page');
            expect(p.cursor!.id).toBe('v');
        });

        it('throws when limit is invalid (validation in constructor)', () => {
            expect(() =>
                RopewikiRegionPreviewsParams.fromQueryStringParams({
                    limit: 'abc',
                }),
            ).toThrow(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        });
    });
});
