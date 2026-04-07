import { describe, it, expect } from '@jest/globals';
import { PageDataSource } from '../../../../src/models/pageDataSource';
import { RouteType } from '../../../../src/models/routes/routeType';
import { PaginationParams } from '../../../../src/models/api/params/paginationParams';
import { RoutesParams } from '../../../../src/models/api/params/routesParams';

const rid = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

describe('RoutesParams', () => {
    describe('constructor', () => {
        it('accepts region with source allow-list', () => {
            const p = new RoutesParams({
                region: {
                    id: rid,
                    source: [PageDataSource.Ropewiki],
                },
            });
            expect(p.region).toEqual({
                id: rid,
                source: [PageDataSource.Ropewiki],
            });
        });

        it('accepts region with null source (all sources)', () => {
            const p = new RoutesParams({
                region: { id: rid, source: null },
            });
            expect(p.region).toEqual({ id: rid, source: null });
        });

        it('accepts global (no region)', () => {
            const p = new RoutesParams({ region: null });
            expect(p.region).toBeNull();
            expect(p.limit).toBe(PaginationParams.DEFAULT_LIMIT);
            expect(p.page).toBe(PaginationParams.DEFAULT_PAGE);
        });

        it('accepts explicit limit and page', () => {
            const p = new RoutesParams({ region: null, limit: 100, page: 2 });
            expect(p.limit).toBe(100);
            expect(p.page).toBe(2);
        });

        it('throws when limit exceeds MAX_LIMIT', () => {
            expect(
                () =>
                    new RoutesParams({
                        region: null,
                        limit: PaginationParams.MAX_LIMIT + 1,
                    }),
            ).toThrow(/limit must not exceed/);
        });

        it('accepts routeTypes list and difficulty null', () => {
            const p = new RoutesParams({
                region: null,
                routeTypes: [RouteType.Canyon],
                difficulty: null,
            });
            expect(p.routeTypes).toEqual([RouteType.Canyon]);
            expect(p.difficulty).toBeNull();
        });

        it('dedupes routeTypes while preserving order', () => {
            const p = new RoutesParams({
                region: null,
                routeTypes: [
                    RouteType.Canyon,
                    RouteType.Cave,
                    RouteType.Canyon,
                ],
            });
            expect(p.routeTypes).toEqual([RouteType.Canyon, RouteType.Cave]);
        });

        it('normalizes empty routeTypes array to null', () => {
            const p = new RoutesParams({ region: null, routeTypes: [] });
            expect(p.routeTypes).toBeNull();
        });

        it('throws when routeTypes entry is invalid', () => {
            expect(
                () =>
                    new RoutesParams({
                        region: null,
                        routeTypes: ['NotAType' as RouteType],
                    }),
            ).toThrow(/Invalid route type/);
        });

        it('throws when region id is not a valid UUID', () => {
            expect(
                () =>
                    new RoutesParams({
                        region: { id: 'not-uuid', source: null },
                    }),
            ).toThrow(/valid UUID/);
        });
    });

    describe('toQueryString', () => {
        it('includes limit and page when global and no route-types/difficulty', () => {
            const p = new RoutesParams({ region: null });
            const params = new URLSearchParams(p.toQueryString());
            expect(params.get('limit')).toBe(String(PaginationParams.DEFAULT_LIMIT));
            expect(params.get('page')).toBe(String(PaginationParams.DEFAULT_PAGE));
        });

        it('encodes region without source when all sources', () => {
            const p = new RoutesParams({
                region: { id: rid, source: null },
            });
            const params = new URLSearchParams(p.toQueryString());
            expect(params.get('region')).toBe(rid);
            expect(params.has('source')).toBe(false);
            expect(params.get('limit')).toBe(String(PaginationParams.DEFAULT_LIMIT));
            expect(params.get('page')).toBe(String(PaginationParams.DEFAULT_PAGE));
        });

        it('encodes source pipe-list when set', () => {
            const p = new RoutesParams({
                region: {
                    id: rid,
                    source: [PageDataSource.Ropewiki],
                },
            });
            const params = new URLSearchParams(p.toQueryString());
            expect(params.get('source')).toBe('ropewiki');
        });

        it('encodes route-types as pipe-list when set', () => {
            const p = new RoutesParams({
                region: null,
                routeTypes: [RouteType.Canyon, RouteType.Cave],
            });
            const params = new URLSearchParams(p.toQueryString());
            expect(params.get('route-types')).toBe('Canyon|Cave');
        });
    });

    describe('fromQueryStringParams', () => {
        it('parses empty query as global', () => {
            const p = RoutesParams.fromQueryStringParams({});
            expect(p.region).toBeNull();
        });

        it('parses region without source (all sources)', () => {
            const p = RoutesParams.fromQueryStringParams({
                region: rid,
            });
            expect(p.region).toEqual({ id: rid, source: null });
        });

        it('parses region and source pipe-list', () => {
            const p = RoutesParams.fromQueryStringParams({
                region: rid,
                source: 'ropewiki',
            });
            expect(p.region).toEqual({
                id: rid,
                source: [PageDataSource.Ropewiki],
            });
        });

        it('throws when source is set without region', () => {
            expect(() =>
                RoutesParams.fromQueryStringParams({ source: 'ropewiki' }),
            ).toThrow(/source.*without.*region/);
        });

        it('throws when source token is invalid', () => {
            expect(() =>
                RoutesParams.fromQueryStringParams({
                    region: rid,
                    source: 'nope',
                }),
            ).toThrow(/source.*token/);
        });

        it('parses route-types and ACA difficulty from query', () => {
            const p = RoutesParams.fromQueryStringParams({
                region: rid,
                'route-types': 'Canyon',
                'difficulty-type': 'aca',
                'aca-technical-rating': '3',
            });
            expect(p.routeTypes).toEqual([RouteType.Canyon]);
            expect(p.difficulty).not.toBeNull();
            expect(p.difficulty!.isActive()).toBe(true);
        });

        it('parses pipe-separated route-types from query', () => {
            const p = RoutesParams.fromQueryStringParams({
                region: rid,
                'route-types': 'Canyon|Cave',
            });
            expect(p.routeTypes).toEqual([RouteType.Canyon, RouteType.Cave]);
        });

        it('throws when route-types token is invalid', () => {
            expect(() =>
                RoutesParams.fromQueryStringParams({
                    region: rid,
                    'route-types': 'Canyon|nope',
                }),
            ).toThrow(/route-types/);
        });

        it('parses limit and page from query', () => {
            const p = RoutesParams.fromQueryStringParams({
                region: rid,
                limit: '50',
                page: '3',
            });
            expect(p.limit).toBe(50);
            expect(p.page).toBe(3);
        });

        it('throws when limit is not a positive integer', () => {
            expect(() =>
                RoutesParams.fromQueryStringParams({ region: rid, limit: '0' }),
            ).toThrow(/limit/);
        });
    });

    describe('withPage', () => {
        it('returns new params with same filters and new page', () => {
            const p = new RoutesParams({
                region: { id: rid, source: null },
                routeTypes: [RouteType.Canyon, RouteType.Cave],
                limit: 100,
                page: 1,
            });
            const p2 = p.withPage(4);
            expect(p2.page).toBe(4);
            expect(p2.limit).toBe(100);
            expect(p2.region).toEqual(p.region);
            expect(p2.routeTypes).toEqual([RouteType.Canyon, RouteType.Cave]);
        });
    });

    describe('fromResult', () => {
        it('parses empty object as region null when requiredRegion is false', () => {
            const p = RoutesParams.fromResult({});
            expect(p.region).toBeNull();
        });

        it('parses nested region with string source (legacy)', () => {
            const p = RoutesParams.fromResult({
                region: { source: 'ropewiki', id: rid },
            });
            expect(p.region).toEqual({
                id: rid,
                source: [PageDataSource.Ropewiki],
            });
        });

        it('parses nested region with source array', () => {
            const p = RoutesParams.fromResult({
                region: { source: ['ropewiki'], id: rid },
            });
            expect(p.region!.source).toEqual([PageDataSource.Ropewiki]);
        });

        it('throws when requiredRegion is true and object is empty', () => {
            expect(() => RoutesParams.fromResult({}, true)).toThrow(
                /region must be a non-null/,
            );
        });

        it('throws when requiredRegion is true and id missing', () => {
            expect(() =>
                RoutesParams.fromResult(
                    { region: { source: 'ropewiki' } },
                    true,
                ),
            ).toThrow(/non-empty id/);
        });

        it('parses nested region when requiredRegion is true', () => {
            const p = RoutesParams.fromResult(
                { region: { source: 'ropewiki', id: rid } },
                true,
            );
            expect(p.region!.id).toBe(rid);
        });

        it('throws when result is not an object', () => {
            expect(() => RoutesParams.fromResult(null)).toThrow(
                'RoutesParams result must be an object',
            );
        });

        it('throws when region.source is not string or array', () => {
            expect(() =>
                RoutesParams.fromResult({
                    region: { source: 1, id: rid },
                }),
            ).toThrow(/region\.source must be string, string\[\], or null/);
        });

        it('throws when region is a string', () => {
            expect(() =>
                RoutesParams.fromResult({ region: 'uuid-here' }),
            ).toThrow(/must be an object/);
        });

        it('throws when nested region is empty object', () => {
            expect(() => RoutesParams.fromResult({ region: {} })).toThrow(
                /non-empty id/,
            );
        });

        it('parses top-level difficulty fields', () => {
            const p = RoutesParams.fromResult({
                region: null,
                'difficulty-type': 'aca',
                'aca-risk-rating': 'PG',
            });
            expect(p.difficulty).not.toBeNull();
            expect(p.difficulty!.toQueryString()).toContain('aca-risk-rating=pg');
        });

        it('parses nested difficulty object', () => {
            const p = RoutesParams.fromResult({
                region: null,
                difficulty: {
                    difficultyType: 'ACA',
                    'aca-technical-rating': '4',
                },
            });
            expect(p.difficulty).not.toBeNull();
            const q = new URLSearchParams(p.toQueryString());
            expect(q.get('aca-technical-rating')).toBe('4');
        });

        it('parses routeTypes string (single value)', () => {
            const p = RoutesParams.fromResult({
                region: null,
                routeTypes: 'Canyon',
            });
            expect(p.routeTypes).toEqual([RouteType.Canyon]);
        });

        it('parses routeTypes pipe string', () => {
            const p = RoutesParams.fromResult({
                region: null,
                routeTypes: 'Canyon|Cave',
            });
            expect(p.routeTypes).toEqual([RouteType.Canyon, RouteType.Cave]);
        });

        it('parses routeTypes string array', () => {
            const p = RoutesParams.fromResult({
                region: null,
                routeTypes: ['Canyon', 'Cave'],
            });
            expect(p.routeTypes).toEqual([RouteType.Canyon, RouteType.Cave]);
        });

        it('throws when routeTypes array has non-string entry', () => {
            expect(() =>
                RoutesParams.fromResult({
                    region: null,
                    routeTypes: ['Canyon', 1],
                }),
            ).toThrow(/routeTypes\[1\]/);
        });

        it('throws when routeTypes is neither string nor array', () => {
            expect(() =>
                RoutesParams.fromResult({ region: null, routeTypes: 1 }),
            ).toThrow(/string, string\[\], or null/);
        });
    });
});
