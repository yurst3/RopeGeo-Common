import { describe, it, expect } from '@jest/globals';
import { PaginationResults, PaginationResultType } from '../../../../src/types/results/paginationResults';
import { MapDataTileKeysResults } from '../../../../src/types/api/listMapDataTileKeys/mapDataTileKeysResults';

describe('MapDataTileKeysResults', () => {
    it('parses via PaginationResults.fromResponseBody', () => {
        const body = {
            resultType: PaginationResultType.MapDataTileKeys,
            results: ['a/b/1.pbf', 'a/b/2.pbf'],
            total: 100,
            page: 1,
            totalBytes: 4096,
        };
        const parsed = PaginationResults.fromResponseBody(body);
        expect(parsed).toBeInstanceOf(MapDataTileKeysResults);
        const m = parsed as MapDataTileKeysResults;
        expect(m.results).toEqual(['a/b/1.pbf', 'a/b/2.pbf']);
        expect(m.total).toBe(100);
        expect(m.page).toBe(1);
        expect(m.totalBytes).toBe(4096);
        expect(m.resultType).toBe(PaginationResultType.MapDataTileKeys);
    });

    it('throws when totalBytes is missing', () => {
        expect(() =>
            PaginationResults.fromResponseBody({
                resultType: PaginationResultType.MapDataTileKeys,
                results: [],
                total: 0,
                page: 1,
            }),
        ).toThrow('Response body must have totalBytes');
    });

    it('throws when a result is not a string', () => {
        expect(() =>
            PaginationResults.fromResponseBody({
                resultType: PaginationResultType.MapDataTileKeys,
                results: [123],
                total: 1,
                page: 1,
                totalBytes: 0,
            }),
        ).toThrow('MapDataTileKeysResults.results[0] must be a string');
    });

    it('throws when page is not a positive integer', () => {
        expect(() =>
            PaginationResults.fromResponseBody({
                resultType: PaginationResultType.MapDataTileKeys,
                results: [],
                total: 0,
                page: 0,
                totalBytes: 0,
            }),
        ).toThrow('Response body.page must be a positive integer');
    });
});
