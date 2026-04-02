import { describe, it, expect } from '@jest/globals';
import { Route, RouteGeoJsonFeature, RouteType } from '../../../../src/classes/routes/route';
import { RoutesGeojson } from '../../../../src/classes/api/getRoutes/routeGeojson';

describe('RoutesGeojson', () => {
    describe('constructor', () => {
        it('sets type and features', () => {
            const features = [
                new RouteGeoJsonFeature([-111.5, 40.1], 'id-1', 'Route One', RouteType.Canyon),
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

    describe('fromResult', () => {
        it('parses valid result and validates features via RouteGeoJsonFeature.fromResult', () => {
            const body = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [-111.5, 40.1] },
                        properties: { id: 'id-1', name: 'Route One', type: RouteType.Canyon },
                    },
                ],
            };
            const geojson = RoutesGeojson.fromResult(body);
            expect(geojson.type).toBe('FeatureCollection');
            expect(geojson.features).toHaveLength(1);
            expect(geojson.features[0]).toBeInstanceOf(RouteGeoJsonFeature);
            expect(geojson.features[0].properties).toEqual({
                id: 'id-1',
                name: 'Route One',
                type: RouteType.Canyon,
            });
            expect(geojson.features[0].geometry.coordinates).toEqual([-111.5, 40.1]);
        });

        it('throws when body is not an object', () => {
            expect(() => RoutesGeojson.fromResult(null)).toThrow(
                'RoutesGeojson result must be an object',
            );
            expect(() => RoutesGeojson.fromResult('string')).toThrow(
                'RoutesGeojson result must be an object',
            );
        });

        it('throws when type is not FeatureCollection', () => {
            expect(() =>
                RoutesGeojson.fromResult({ type: 'Feature', features: [] }),
            ).toThrow('RoutesGeojson.type must be "FeatureCollection"');
        });

        it('throws when features is not an array', () => {
            expect(() =>
                RoutesGeojson.fromResult({ type: 'FeatureCollection', features: null }),
            ).toThrow('RoutesGeojson.features must be an array');
        });
    });
});
