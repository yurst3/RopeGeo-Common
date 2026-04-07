import { describe, it, expect } from '@jest/globals';
import { RouteResult } from '../../../../src/models/api/results/routeResult';
import { RouteGeoJsonFeature } from '../../../../src/models/routes/route';
import { PaginationResultType } from '../../../../src/models/api/results/paginationResults';
import { RouteType } from '../../../../src/models/routes/route';

function validFeature(): Record<string, unknown> {
    return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-111.5, 40.1] },
        properties: { id: 'id-1', name: 'Route One', type: RouteType.Canyon },
    };
}

describe('RouteResult', () => {
    describe('constructor', () => {
        it('sets results, total, page, and resultType', () => {
            const f = new RouteGeoJsonFeature(
                [-111.5, 40.1],
                'id-1',
                'Route One',
                RouteType.Canyon,
            );
            const r = new RouteResult([f], 10, 1);
            expect(r.results).toEqual([f]);
            expect(r.total).toBe(10);
            expect(r.page).toBe(1);
            expect(r.resultType).toBe(PaginationResultType.Route);
        });
    });

    describe('fromResponseBodyInner', () => {
        it('parses features from validated pagination shape', () => {
            const parsed = RouteResult.fromResponseBodyInner(
                {},
                {
                    results: [validFeature()],
                    total: 1,
                    page: 1,
                },
            );
            expect(parsed).toBeInstanceOf(RouteResult);
            expect(parsed.results).toHaveLength(1);
            expect(parsed.results[0]).toBeInstanceOf(RouteGeoJsonFeature);
            expect(parsed.total).toBe(1);
            expect(parsed.page).toBe(1);
        });

        it('parses empty results', () => {
            const parsed = RouteResult.fromResponseBodyInner(
                {},
                { results: [], total: 0, page: 1 },
            );
            expect(parsed.results).toEqual([]);
        });

        it('throws when a feature is invalid', () => {
            expect(() =>
                RouteResult.fromResponseBodyInner(
                    {},
                    {
                        results: [{ type: 'Feature' }],
                        total: 1,
                        page: 1,
                    },
                ),
            ).toThrow(/RouteResult\.results\[0\]/);
        });
    });
});
