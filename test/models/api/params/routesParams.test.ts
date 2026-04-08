import { describe, it, expect } from '@jest/globals';
import { PageDataSource } from '../../../../src/models/pageDataSource';
import { RouteType } from '../../../../src/models/routes/routeType';
import { PaginationParams } from '../../../../src/models/api/params/paginationParams';
import { RoutesParams } from '../../../../src/models/api/params/routesParams';

const rid = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

describe('RoutesParams', () => {
    describe('constructor', () => {
        it('accepts region with single source', () => {
            const p = new RoutesParams({
                region: {
                    id: rid,
                    source: PageDataSource.Ropewiki,
                },
            });
            expect(p.region).toEqual({
                id: rid,
                source: PageDataSource.Ropewiki,
            });
            expect(p.sources).toBeNull();
        });

        it('accepts global sources allow-list without region', () => {
            const p = new RoutesParams({
                region: null,
                sources: [PageDataSource.Ropewiki],
            });
            expect(p.region).toBeNull();
            expect(p.sources).toEqual([PageDataSource.Ropewiki]);
        });

        it('throws when region and sources are both set', () => {
            expect(
                () =>
                    new RoutesParams({
                        region: {
                            id: rid,
                            source: PageDataSource.Ropewiki,
                        },
                        sources: [PageDataSource.Ropewiki],
                    }),
            ).toThrow(/region and sources cannot both be set/);
        });

        it('accepts global (no region, no sources)', () => {
            const p = new RoutesParams({ region: null });
            expect(p.region).toBeNull();
            expect(p.sources).toBeNull();
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
                        region: {
                            id: 'not-uuid',
                            source: PageDataSource.Ropewiki,
                        },
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

        it('encodes region-id and region-source', () => {
            const p = new RoutesParams({
                region: {
                    id: rid,
                    source: PageDataSource.Ropewiki,
                },
            });
            const params = new URLSearchParams(p.toQueryString());
            expect(params.get('region-id')).toBe(rid);
            expect(params.get('region-source')).toBe('ropewiki');
            expect(params.has('sources')).toBe(false);
        });

        it('encodes sources pipe-list when global', () => {
            const p = new RoutesParams({
                region: null,
                sources: [PageDataSource.Ropewiki],
            });
            const params = new URLSearchParams(p.toQueryString());
            expect(params.get('sources')).toBe('ropewiki');
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
            expect(p.sources).toBeNull();
        });

        it('parses region-id and region-source', () => {
            const p = RoutesParams.fromQueryStringParams({
                'region-id': rid,
                'region-source': 'ropewiki',
            });
            expect(p.region).toEqual({
                id: rid,
                source: PageDataSource.Ropewiki,
            });
            expect(p.sources).toBeNull();
        });

        it('parses global sources without region', () => {
            const p = RoutesParams.fromQueryStringParams({
                sources: 'ropewiki',
            });
            expect(p.region).toBeNull();
            expect(p.sources).toEqual([PageDataSource.Ropewiki]);
        });

        it('throws when region-source is set without region-id', () => {
            expect(() =>
                RoutesParams.fromQueryStringParams({
                    'region-source': 'ropewiki',
                }),
            ).toThrow(/region-source.*without.*region-id/);
        });

        it('throws when region-id is set without region-source', () => {
            expect(() =>
                RoutesParams.fromQueryStringParams({ 'region-id': rid }),
            ).toThrow(/region-source.*required/);
        });

        it('throws when region and sources are combined', () => {
            expect(() =>
                RoutesParams.fromQueryStringParams({
                    'region-id': rid,
                    'region-source': 'ropewiki',
                    sources: 'ropewiki',
                }),
            ).toThrow(/cannot be combined with "sources"/);
        });

        it('throws when region-source token is invalid', () => {
            expect(() =>
                RoutesParams.fromQueryStringParams({
                    'region-id': rid,
                    'region-source': 'nope',
                }),
            ).toThrow(/PageDataSource token/);
        });

        it('parses route-types and ACA difficulty from query', () => {
            const p = RoutesParams.fromQueryStringParams({
                'region-id': rid,
                'region-source': 'ropewiki',
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
                'region-id': rid,
                'region-source': 'ropewiki',
                'route-types': 'Canyon|Cave',
            });
            expect(p.routeTypes).toEqual([RouteType.Canyon, RouteType.Cave]);
        });

        it('throws when route-types token is invalid', () => {
            expect(() =>
                RoutesParams.fromQueryStringParams({
                    'region-id': rid,
                    'region-source': 'ropewiki',
                    'route-types': 'Canyon|nope',
                }),
            ).toThrow(/route-types/);
        });

        it('parses limit and page from query', () => {
            const p = RoutesParams.fromQueryStringParams({
                'region-id': rid,
                'region-source': 'ropewiki',
                limit: '50',
                page: '3',
            });
            expect(p.limit).toBe(50);
            expect(p.page).toBe(3);
        });

        it('throws when limit is not a positive integer', () => {
            expect(() =>
                RoutesParams.fromQueryStringParams({
                    'region-id': rid,
                    'region-source': 'ropewiki',
                    limit: '0',
                }),
            ).toThrow(/limit/);
        });
    });

    describe('withPage', () => {
        it('returns new params with same filters and new page', () => {
            const p = new RoutesParams({
                region: {
                    id: rid,
                    source: PageDataSource.Ropewiki,
                },
                routeTypes: [RouteType.Canyon, RouteType.Cave],
                limit: 100,
                page: 1,
            });
            const p2 = p.withPage(4);
            expect(p2.page).toBe(4);
            expect(p2.limit).toBe(100);
            expect(p2.region).toEqual(p.region);
            expect(p2.sources).toEqual(p.sources);
            expect(p2.routeTypes).toEqual([RouteType.Canyon, RouteType.Cave]);
        });
    });

    describe('fromResult', () => {
        it('parses empty object as region null when requiredRegion is false', () => {
            const p = RoutesParams.fromResult({});
            expect(p.region).toBeNull();
        });

        it('parses nested region with string source', () => {
            const p = RoutesParams.fromResult({
                region: { source: 'ropewiki', id: rid },
            });
            expect(p.region).toEqual({
                id: rid,
                source: PageDataSource.Ropewiki,
            });
        });

        it('parses flat region-id and region-source', () => {
            const p = RoutesParams.fromResult({
                'region-id': rid,
                'region-source': 'ropewiki',
            });
            expect(p.region).toEqual({
                id: rid,
                source: PageDataSource.Ropewiki,
            });
        });

        it('parses top-level sources without region', () => {
            const p = RoutesParams.fromResult({
                sources: ['ropewiki'],
            });
            expect(p.region).toBeNull();
            expect(p.sources).toEqual([PageDataSource.Ropewiki]);
        });

        it('throws when nested region and flat region keys both present', () => {
            expect(() =>
                RoutesParams.fromResult({
                    region: { id: rid, source: 'ropewiki' },
                    'region-id': rid,
                    'region-source': 'ropewiki',
                }),
            ).toThrow(/either nested region or region-id/);
        });

        it('throws when region and sources both active', () => {
            expect(() =>
                RoutesParams.fromResult({
                    region: { id: rid, source: 'ropewiki' },
                    sources: ['ropewiki'],
                }),
            ).toThrow(/region and sources cannot both be set/);
        });

        it('throws when requiredRegion is true and object is empty', () => {
            expect(() => RoutesParams.fromResult({}, true)).toThrow(
                /region must be set when requiredRegion is true/,
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

        it('throws when region.source is not a non-empty string', () => {
            expect(() =>
                RoutesParams.fromResult({
                    region: { source: 1, id: rid },
                }),
            ).toThrow(/region\.source must be a non-empty string/);
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

        it('throws when nested region omits source', () => {
            expect(() =>
                RoutesParams.fromResult({ region: { id: rid } }),
            ).toThrow(/region\.source must be a non-empty string/);
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
