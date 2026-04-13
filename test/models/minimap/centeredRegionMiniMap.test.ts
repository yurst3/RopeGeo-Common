import { describe, it, expect } from '@jest/globals';
import { CenteredRegionMiniMap } from '../../../src/models/minimap/centeredRegionMiniMap';
import { MiniMapType } from '../../../src/models/minimap/miniMapType';
import { OnlineCenteredRegionMiniMap } from '../../../src/models/minimap/onlineCenteredRegionMiniMap';
import { OfflineCenteredRegionMiniMap } from '../../../src/models/minimap/offlineCenteredRegionMiniMap';
import '../../../src/models/minimap/registerMiniMapParsers';

const REGION_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const ROUTE_ID = '38f5c3fa-7248-41ed-815e-8b9e6aae5d61';

describe('CenteredRegionMiniMap', () => {
    it('dispatches to online parser', () => {
        const parsed = CenteredRegionMiniMap.fromResult({
            miniMapType: MiniMapType.OnlineCenteredGeojson,
            fetchType: 'online',
            title: 'Centered',
            centeredRouteId: ROUTE_ID,
            routesParams: { region: { source: 'ropewiki', id: REGION_ID } },
        });
        expect(parsed).toBeInstanceOf(OnlineCenteredRegionMiniMap);
    });

    it('dispatches to offline parser', () => {
        const parsed = CenteredRegionMiniMap.fromResult({
            miniMapType: MiniMapType.OfflineCenteredGeojson,
            fetchType: 'offline',
            title: 'Centered',
            centeredRouteId: ROUTE_ID,
            downloadedGeojson: '/tmp/routes.geojson',
        });
        expect(parsed).toBeInstanceOf(OfflineCenteredRegionMiniMap);
    });

    it('validates online fetchType', () => {
        expect(() =>
            OnlineCenteredRegionMiniMap.fromResult({
                miniMapType: MiniMapType.OnlineCenteredGeojson,
                fetchType: 'offline',
                title: 'Centered',
                centeredRouteId: ROUTE_ID,
                routesParams: { region: { source: 'ropewiki', id: REGION_ID } },
            }),
        ).toThrow(/fetchType must be "online"/);
    });

    it('validates offline downloadedGeojson type', () => {
        expect(() =>
            OfflineCenteredRegionMiniMap.fromResult({
                miniMapType: MiniMapType.OfflineCenteredGeojson,
                fetchType: 'offline',
                title: 'Centered',
                centeredRouteId: ROUTE_ID,
                downloadedGeojson: 10,
            }),
        ).toThrow(/downloadedGeojson must be a non-empty string/);
    });
});

