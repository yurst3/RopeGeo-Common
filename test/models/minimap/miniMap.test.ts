import { describe, it, expect } from '@jest/globals';
import { PageDataSource } from '../../../src/models/pageDataSource';
import { PageMiniMap } from '../../../src/models/minimap/pageMiniMap';
import { MiniMap } from '../../../src/models/minimap/miniMap';
import { MiniMapType } from '../../../src/models/minimap/miniMapType';
import { RegionMiniMap } from '../../../src/models/minimap/regionMiniMap';
import { CenteredRegionMiniMap } from '../../../src/models/minimap/centeredRegionMiniMap';
import { DownloadedPageMiniMap } from '../../../src/models/minimap/downloadedPageMiniMap';

const MAP_REGION_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const ROUTE_ID = '38f5c3fa-7248-41ed-815e-8b9e6aae5d61';

function regionPayload(bounds: Record<string, number> | null) {
    return {
        miniMapType: MiniMapType.GeoJson,
        title: 'North America',
        bounds,
        routesParams: {
            region: { source: 'ropewiki', id: MAP_REGION_ID },
        },
    };
}

describe('MiniMap', () => {
    describe('fromResult', () => {
        it('delegates to RegionMiniMap', () => {
            const m = MiniMap.fromResult(regionPayload({ north: 40, south: 38, east: -108, west: -110 }));
            expect(m).toBeInstanceOf(RegionMiniMap);
            expect(m.miniMapType).toBe(MiniMapType.GeoJson);
            expect(m.title).toBe('North America');
        });

        it('delegates to PageMiniMap', () => {
            const m = MiniMap.fromResult({
                miniMapType: MiniMapType.TilesTemplate,
                title: 'Page route',
                layerId: ROUTE_ID,
                tilesTemplate: 'https://x.com/t/{z}/{x}/{y}.pbf',
                bounds: { north: 40, south: 38, east: -108, west: -110 },
            });
            expect(m).toBeInstanceOf(PageMiniMap);
            expect(m.miniMapType).toBe(MiniMapType.TilesTemplate);
        });

        it('delegates to CenteredRegionMiniMap', () => {
            const m = MiniMap.fromResult({
                miniMapType: MiniMapType.CenteredGeojson,
                title: 'Centered',
                centeredRouteId: ROUTE_ID,
                routesParams: {
                    region: { source: 'ropewiki', id: MAP_REGION_ID },
                },
            });
            expect(m).toBeInstanceOf(CenteredRegionMiniMap);
            expect(m.miniMapType).toBe(MiniMapType.CenteredGeojson);
        });

        it('rejects downloadedTilesTemplate', () => {
            expect(() =>
                MiniMap.fromResult(
                    DownloadedPageMiniMap.fromResult({
                        miniMapType: MiniMapType.DownloadedTilesTemplate,
                        title: 'L',
                        layerId: ROUTE_ID,
                        downloadedTilesTemplate: 'file:///t/{z}/{x}/{y}.pbf',
                        bounds: { north: 40, south: 38, east: -108, west: -110 },
                    }),
                ),
            ).toThrow(/MiniMap\.fromResult does not accept/);
        });

        it('throws when result is not an object', () => {
            expect(() => MiniMap.fromResult(null)).toThrow('MiniMap result must be an object');
        });

        it('throws when miniMapType is invalid', () => {
            expect(() => MiniMap.fromResult({ miniMapType: 'other' })).toThrow(
                /MiniMap\.miniMapType must be one of/,
            );
        });
    });
});

describe('RegionMiniMap', () => {
    const validRoutes = {
        region: { source: 'ropewiki', id: MAP_REGION_ID },
    };

    it('fromResult parses valid payload with bounds object', () => {
        const m = RegionMiniMap.fromResult({
            miniMapType: MiniMapType.GeoJson,
            title: 'R',
            bounds: { north: 41, south: 40, east: -110, west: -112 },
            routesParams: validRoutes,
        });
        expect(m.routesParams.region).toEqual({
            id: MAP_REGION_ID,
            source: PageDataSource.Ropewiki,
        });
        expect(m.bounds).not.toBeNull();
        expect(m.bounds!.north).toBe(41);
    });

    it('fromResult parses null bounds', () => {
        const m = RegionMiniMap.fromResult(regionPayload(null));
        expect(m.bounds).toBeNull();
    });

    it('throws when bounds key is missing', () => {
        expect(() =>
            RegionMiniMap.fromResult({
                miniMapType: MiniMapType.GeoJson,
                title: 'R',
                routesParams: validRoutes,
            } as Record<string, unknown>),
        ).toThrow(/RegionMiniMap\.bounds must be present/);
    });

    it('throws when title missing', () => {
        expect(() =>
            RegionMiniMap.fromResult({
                miniMapType: MiniMapType.GeoJson,
                bounds: null,
                routesParams: validRoutes,
            } as Record<string, unknown>),
        ).toThrow(/RegionMiniMap\.title/);
    });

    it('throws when miniMapType wrong', () => {
        expect(() =>
            RegionMiniMap.fromResult({
                miniMapType: MiniMapType.TilesTemplate,
                title: 'T',
                layerId: 'x',
                tilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                bounds: { north: 1, south: 0, east: 1, west: 0 },
            }),
        ).toThrow(/RegionMiniMap\.miniMapType must be/);
    });

    it('throws when routesParams missing', () => {
        expect(() =>
            RegionMiniMap.fromResult({
                miniMapType: MiniMapType.GeoJson,
                title: 'R',
                bounds: null,
            } as Record<string, unknown>),
        ).toThrow(/RegionMiniMap\.routesParams must be an object/);
    });

    it('throws when routesParams incomplete (requiredRegion path)', () => {
        expect(() =>
            RegionMiniMap.fromResult({
                miniMapType: MiniMapType.GeoJson,
                title: 'R',
                bounds: null,
                routesParams: { region: { source: 'ropewiki' } },
            }),
        ).toThrow();
    });
});

describe('PageMiniMap', () => {
    const validBounds = { north: 39.5, south: 38.1, east: -108.2, west: -110.0 };

    it('fromResult parses valid payload', () => {
        const m = PageMiniMap.fromResult({
            miniMapType: MiniMapType.TilesTemplate,
            title: 'T',
            layerId: '38f5c3fa-7248-41ed-815e-8b9e6aae5d61',
            tilesTemplate: 'https://api.example.com/tiles/u/{z}/{x}/{y}.pbf',
            bounds: validBounds,
        });
        expect(m.layerId).toBe('38f5c3fa-7248-41ed-815e-8b9e6aae5d61');
        expect(m.bounds.north).toBe(39.5);
        expect(m.title).toBe('T');
    });

    it('throws when title empty', () => {
        expect(() =>
            PageMiniMap.fromResult({
                miniMapType: MiniMapType.TilesTemplate,
                title: '  ',
                layerId: 'id',
                tilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                bounds: validBounds,
            }),
        ).toThrow(/PageMiniMap\.title/);
    });

    it('throws when miniMapType wrong', () => {
        expect(() =>
            PageMiniMap.fromResult({
                miniMapType: MiniMapType.GeoJson,
                title: 'R',
                routesParams: {
                    region: { source: 'ropewiki', id: MAP_REGION_ID },
                },
                bounds: null,
            } as Record<string, unknown>),
        ).toThrow(/PageMiniMap\.miniMapType must be/);
    });

    it('throws when layerId empty', () => {
        expect(() =>
            PageMiniMap.fromResult({
                miniMapType: MiniMapType.TilesTemplate,
                title: 'T',
                layerId: '',
                tilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                bounds: validBounds,
            }),
        ).toThrow(/PageMiniMap\.layerId/);
    });

    it('throws when tilesTemplate missing placeholders', () => {
        expect(() =>
            PageMiniMap.fromResult({
                miniMapType: MiniMapType.TilesTemplate,
                title: 'T',
                layerId: 'id',
                tilesTemplate: 'https://x/',
                bounds: validBounds,
            }),
        ).toThrow(/PageMiniMap\.tilesTemplate must contain/);
    });
});
