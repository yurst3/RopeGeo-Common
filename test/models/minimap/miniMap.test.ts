import { describe, it, expect } from '@jest/globals';
import { PageDataSource } from '../../../src/models/pageDataSource';
import { PageMiniMap } from '../../../src/models/minimap/abstract/pageMiniMap';
import { MiniMap } from '../../../src/models/minimap/abstract/miniMap';
import { MiniMapType } from '../../../src/models/minimap/abstract/miniMapType';
import { RegionMiniMap } from '../../../src/models/minimap/abstract/regionMiniMap';
import { CenteredRegionMiniMap } from '../../../src/models/minimap/abstract/centeredRegionMiniMap';
import { OfflinePageMiniMap } from '../../../src/models/minimap/concrete/offlinePageMiniMap';
import { OnlineRegionMiniMap } from '../../../src/models/minimap/concrete/onlineRegionMiniMap';
import '../../../src/models/minimap/registerMiniMapParsers';

const MAP_REGION_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const ROUTE_ID = '38f5c3fa-7248-41ed-815e-8b9e6aae5d61';

function regionPayload(bounds: Record<string, number> | null) {
    return {
        miniMapType: MiniMapType.Region,
        fetchType: 'online',
        title: 'North America',
        bounds,
        routesParams: {
            region: { source: 'ropewiki', id: MAP_REGION_ID },
        },
    };
}

describe('MiniMap', () => {
    describe('fromResult', () => {
        it('delegates to OnlineRegionMiniMap', () => {
            const m = MiniMap.fromResult(regionPayload({ north: 40, south: 38, east: -108, west: -110 }));
            expect(m).toBeInstanceOf(OnlineRegionMiniMap);
            expect(m.miniMapType).toBe(MiniMapType.Region);
            expect(m.title).toBe('North America');
        });

        it('delegates to PageMiniMap', () => {
            const m = MiniMap.fromResult({
                miniMapType: MiniMapType.Page,
                fetchType: 'online',
                title: 'Page route',
                layerId: ROUTE_ID,
                onlineTilesTemplate: 'https://x.com/t/{z}/{x}/{y}.pbf',
                bounds: { north: 40, south: 38, east: -108, west: -110 },
            });
            expect(m).toBeInstanceOf(PageMiniMap);
            expect(m.miniMapType).toBe(MiniMapType.Page);
        });

        it('delegates to CenteredRegionMiniMap', () => {
            const m = MiniMap.fromResult({
                miniMapType: MiniMapType.CenteredRegion,
                fetchType: 'online',
                title: 'Centered',
                centeredRouteId: ROUTE_ID,
                routesParams: {
                    region: { source: 'ropewiki', id: MAP_REGION_ID },
                },
            });
            expect(m).toBeInstanceOf(CenteredRegionMiniMap);
            expect(m.miniMapType).toBe(MiniMapType.CenteredRegion);
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
            miniMapType: MiniMapType.Region,
            fetchType: 'online',
            title: 'R',
            bounds: { north: 41, south: 40, east: -110, west: -112 },
            routesParams: validRoutes,
        });
        expect((m as OnlineRegionMiniMap).routesParams.region).toEqual({
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
                miniMapType: MiniMapType.Region,
                fetchType: 'online',
                title: 'R',
                routesParams: validRoutes,
            } as Record<string, unknown>),
        ).toThrow(/OnlineRegionMiniMap\.bounds must be present/);
    });

    it('throws when title missing', () => {
        expect(() =>
            RegionMiniMap.fromResult({
                miniMapType: MiniMapType.Region,
                fetchType: 'online',
                bounds: null,
                routesParams: validRoutes,
            } as Record<string, unknown>),
        ).toThrow(/OnlineRegionMiniMap\.title/);
    });

    it('throws when miniMapType wrong', () => {
        expect(() =>
            RegionMiniMap.fromResult({
                miniMapType: MiniMapType.Page,
                fetchType: 'online',
                title: 'T',
                layerId: 'x',
                onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                bounds: { north: 1, south: 0, east: 1, west: 0 },
            }),
        ).toThrow(/RegionMiniMap\.miniMapType must be/);
    });

    it('throws when routesParams missing', () => {
        expect(() =>
            RegionMiniMap.fromResult({
                miniMapType: MiniMapType.Region,
                fetchType: 'online',
                title: 'R',
                bounds: null,
            } as Record<string, unknown>),
        ).toThrow(/OnlineRegionMiniMap\.routesParams must be an object/);
    });

    it('throws when routesParams incomplete (requiredRegion path)', () => {
        expect(() =>
            RegionMiniMap.fromResult({
                miniMapType: MiniMapType.Region,
                fetchType: 'online',
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
            miniMapType: MiniMapType.Page,
            fetchType: 'online',
            title: 'T',
            layerId: '38f5c3fa-7248-41ed-815e-8b9e6aae5d61',
            onlineTilesTemplate: 'https://api.example.com/tiles/u/{z}/{x}/{y}.pbf',
            bounds: validBounds,
        });
        expect(m.layerId).toBe('38f5c3fa-7248-41ed-815e-8b9e6aae5d61');
        expect(m.bounds.north).toBe(39.5);
        expect(m.title).toBe('T');
    });

    it('throws when title empty', () => {
        expect(() =>
            PageMiniMap.fromResult({
                miniMapType: MiniMapType.Page,
                fetchType: 'online',
                title: '  ',
                layerId: 'id',
                onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                bounds: validBounds,
            }),
        ).toThrow(/OnlinePageMiniMap\.title/);
    });

    it('throws when miniMapType wrong', () => {
        expect(() =>
            PageMiniMap.fromResult({
                miniMapType: MiniMapType.Region,
                fetchType: 'online',
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
                miniMapType: MiniMapType.Page,
                fetchType: 'online',
                title: 'T',
                layerId: '',
                onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                bounds: validBounds,
            }),
        ).toThrow(/OnlinePageMiniMap\.layerId/);
    });

    it('throws when tilesTemplate missing placeholders', () => {
        expect(() =>
            PageMiniMap.fromResult({
                miniMapType: MiniMapType.Page,
                fetchType: 'online',
                title: 'T',
                layerId: 'id',
                onlineTilesTemplate: 'https://x/',
                bounds: validBounds,
            }),
        ).toThrow(/OnlinePageMiniMap\.onlineTilesTemplate must contain/);
    });

    it('parses offline page minimap', () => {
        const m = PageMiniMap.fromResult({
            miniMapType: MiniMapType.Page,
            fetchType: 'offline',
            title: 'Offline',
            layerId: ROUTE_ID,
            offlineTilesTemplate: 'file:///tiles/{z}/{x}/{y}.pbf',
            bounds: validBounds,
        });
        expect(m).toBeInstanceOf(OfflinePageMiniMap);
    });

    it('parses optional legend on online page minimap', () => {
        const m = PageMiniMap.fromResult({
            miniMapType: MiniMapType.Page,
            fetchType: 'online',
            title: 'T',
            layerId: 'layer-1',
            onlineTilesTemplate: 'https://api.example.com/tiles/u/{z}/{x}/{y}.pbf',
            bounds: validBounds,
            legend: {
                seg: {
                    featureType: 'line',
                    id: 'seg',
                    name: 'Main',
                    bounds: validBounds,
                },
            },
        });
        expect(m.legend).toBeDefined();
        expect(m.legend?.seg.featureType).toBe('line');
    });

    it('validates offline page minimap template', () => {
        expect(() =>
            PageMiniMap.fromResult({
                miniMapType: MiniMapType.Page,
                fetchType: 'offline',
                title: 'Offline',
                layerId: ROUTE_ID,
                offlineTilesTemplate: '/tiles/no-placeholders.pbf',
                bounds: validBounds,
            }),
        ).toThrow(/OfflinePageMiniMap\.offlineTilesTemplate must contain/);
    });
});
