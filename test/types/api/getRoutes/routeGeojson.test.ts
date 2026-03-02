import { describe, it, expect } from '@jest/globals';
import { Route, RouteType } from '../../../../src/types/route';
import { RoutesGeojson } from '../../../../src/types/api/getRoutes/routeGeojson';

describe('RoutesGeojson', () => {
    describe('constructor', () => {
        it('sets type and features', () => {
            const features = [
                {
                    type: 'Feature' as const,
                    geometry: { type: 'Point' as const, coordinates: [-111.5, 40.1] as [number, number] },
                    properties: { id: 'id-1', name: 'Route One', type: RouteType.Canyon },
                },
            ];
            const geojson = new RoutesGeojson(features);
            expect(geojson.type).toBe('FeatureCollection');
            expect(geojson.features).toEqual(features);
        });
    });

    describe('fromRoutes', () => {
        it('builds FeatureCollection from Route array via toGeoJsonFeature', () => {
            const routes = [
                new Route('id-1', 'Route One', RouteType.Canyon, { lat: 40.1, lon: -111.5 }),
                new Route('id-2', 'Route Two', RouteType.Cave, { lat: 41, lon: -112 }),
            ];
            const geojson = RoutesGeojson.fromRoutes(routes);
            expect(geojson.type).toBe('FeatureCollection');
            expect(geojson.features).toHaveLength(2);
            expect(geojson.features[0]).toEqual({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [-111.5, 40.1] },
                properties: { id: 'id-1', name: 'Route One', type: RouteType.Canyon },
            });
            expect(geojson.features[1]).toEqual({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [-112, 41] },
                properties: { id: 'id-2', name: 'Route Two', type: RouteType.Cave },
            });
        });

        it('returns empty FeatureCollection for empty routes', () => {
            const geojson = RoutesGeojson.fromRoutes([]);
            expect(geojson.type).toBe('FeatureCollection');
            expect(geojson.features).toEqual([]);
        });
    });
});
