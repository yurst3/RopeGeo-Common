import { describe, it, expect } from '@jest/globals';
import { CenteredRegionMiniMap } from '../../../src/models/minimap/abstract/centeredRegionMiniMap';
import { MiniMapType } from '../../../src/models/minimap/abstract/miniMapType';
import { OnlineCenteredRegionMiniMap } from '../../../src/models/minimap/concrete/onlineCenteredRegionMiniMap';
import { OfflineCenteredRegionMiniMap } from '../../../src/models/minimap/concrete/offlineCenteredRegionMiniMap';
import '../../../src/models/minimap/registerMiniMapParsers';

const MAP_REGION_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const ROUTE_ID = '38f5c3fa-7248-41ed-815e-8b9e6aae5d61';

describe('CenteredRegionMiniMap', () => {
    it('fromResult parses online', () => {
        const parsed = CenteredRegionMiniMap.fromResult({
            miniMapType: MiniMapType.CenteredRegion,
            fetchType: 'online',
            title: 'Route One',
            centeredRouteId: ROUTE_ID,
            routesParams: {
                region: { source: 'ropewiki', id: MAP_REGION_ID },
            },
        });
        expect(parsed).toBeInstanceOf(OnlineCenteredRegionMiniMap);
    });

    it('fromResult parses offline', () => {
        const parsed = CenteredRegionMiniMap.fromResult({
            miniMapType: MiniMapType.CenteredRegion,
            fetchType: 'offline',
            title: 'Route One',
            centeredRouteId: ROUTE_ID,
            downloadedGeojson: '/path/to/routes.geojson',
        });
        expect(parsed).toBeInstanceOf(OfflineCenteredRegionMiniMap);
    });

    it('online fromResult throws when routesParams missing', () => {
        expect(() =>
            OnlineCenteredRegionMiniMap.fromResult({
                miniMapType: MiniMapType.CenteredRegion,
                fetchType: 'online',
                title: 'T',
                centeredRouteId: ROUTE_ID,
            } as Record<string, unknown>),
        ).toThrow();
    });

    it('offline fromResult throws when downloadedGeojson missing', () => {
        expect(() =>
            OfflineCenteredRegionMiniMap.fromResult({
                miniMapType: MiniMapType.CenteredRegion,
                fetchType: 'offline',
                title: 'T',
                centeredRouteId: ROUTE_ID,
            } as Record<string, unknown>),
        ).toThrow(/OfflineCenteredRegionMiniMap\.downloadedGeojson/);
    });
});
