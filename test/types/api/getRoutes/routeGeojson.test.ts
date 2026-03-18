import { describe, it, expect } from '@jest/globals';
import { Bounds } from '../../../../src/types/minimap/bounds';
import { Route, RouteGeoJsonFeature, RouteType } from '../../../../src/types/routes/route';
import { RoutesGeojson } from '../../../../src/types/api/getRoutes/routeGeojson';

describe('RoutesGeojson', () => {
    describe('constructor', () => {
        it('sets type and features', () => {
            const features = [
                new RouteGeoJsonFeature([-111.5, 40.1], 'id-1', 'Route One', RouteType.Canyon),
            ];
            const geojson = new RoutesGeojson(features);
            expect(geojson.type).toBe('FeatureCollection');
            expect(geojson.features).toEqual(features);
            expect(geojson.bounds).toBeNull();
        });

        it('sets bounds when provided', () => {
            const features = [
                new RouteGeoJsonFeature([-111.5, 40.1], 'id-1', 'R', RouteType.Canyon),
            ];
            const b = new Bounds(41, 40, -110, -112);
            const geojson = new RoutesGeojson(features, b);
            expect(geojson.bounds).toBe(b);
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
            expect(geojson.bounds).toBeNull();
        });

        it('sets bounds to null for empty routes even when withBounds is true', () => {
            expect(RoutesGeojson.fromRoutes([], true).bounds).toBeNull();
        });

        it('sets bounds to null by default when routes are non-empty', () => {
            const routes = [
                new Route('a', 'A', RouteType.Canyon, { lat: 40, lon: -110 }),
            ];
            expect(RoutesGeojson.fromRoutes(routes).bounds).toBeNull();
            expect(RoutesGeojson.fromRoutes(routes, false).bounds).toBeNull();
        });

        it('computes bounds for a single route as that point', () => {
            const geojson = RoutesGeojson.fromRoutes(
                [new Route('a', 'A', RouteType.Canyon, { lat: 40.5, lon: -111.25 })],
                true,
            );
            expect(geojson.bounds).toBeInstanceOf(Bounds);
            expect(geojson.bounds!.north).toBe(40.5);
            expect(geojson.bounds!.south).toBe(40.5);
            expect(geojson.bounds!.east).toBe(-111.25);
            expect(geojson.bounds!.west).toBe(-111.25);
        });

        it('computes bounds spanning all route coordinates', () => {
            const geojson = RoutesGeojson.fromRoutes(
                [
                    new Route('1', 'NorthEast', RouteType.Canyon, { lat: 42, lon: -109 }),
                    new Route('2', 'SouthWest', RouteType.Canyon, { lat: 38, lon: -113 }),
                    new Route('3', 'Mid', RouteType.Cave, { lat: 40, lon: -111 }),
                ],
                true,
            );
            expect(geojson.bounds!.north).toBe(42);
            expect(geojson.bounds!.south).toBe(38);
            expect(geojson.bounds!.east).toBe(-109);
            expect(geojson.bounds!.west).toBe(-113);
        });

        it('treats missing coordinates as (0, 0) like toGeoJsonFeature', () => {
            const geojson = RoutesGeojson.fromRoutes(
                [
                    new Route('a', 'A', RouteType.Canyon, { lat: 1, lon: 2 }),
                    new Route('b', 'B', RouteType.Canyon, null),
                ],
                true,
            );
            expect(geojson.bounds!.north).toBe(1);
            expect(geojson.bounds!.south).toBe(0);
            expect(geojson.bounds!.east).toBe(2);
            expect(geojson.bounds!.west).toBe(0);
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
            expect(geojson.bounds).toBeNull();
        });

        it('parses bounds when present', () => {
            const body = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [-111.5, 40.1] },
                        properties: { id: 'id-1', name: 'Route One', type: RouteType.Canyon },
                    },
                ],
                bounds: { north: 41, south: 40, east: -110, west: -112 },
            };
            const geojson = RoutesGeojson.fromResult(body);
            expect(geojson.bounds).toBeInstanceOf(Bounds);
            expect(geojson.bounds!.north).toBe(41);
            expect(geojson.bounds!.south).toBe(40);
            expect(geojson.bounds!.east).toBe(-110);
            expect(geojson.bounds!.west).toBe(-112);
        });

        it('parses bounds as null when omitted or null', () => {
            expect(
                RoutesGeojson.fromResult({
                    type: 'FeatureCollection',
                    features: [],
                }).bounds,
            ).toBeNull();
            expect(
                RoutesGeojson.fromResult({
                    type: 'FeatureCollection',
                    features: [],
                    bounds: null,
                }).bounds,
            ).toBeNull();
        });

        it('throws when bounds is not object or null', () => {
            expect(() =>
                RoutesGeojson.fromResult({
                    type: 'FeatureCollection',
                    features: [],
                    bounds: 'x',
                }),
            ).toThrow(/RoutesGeojson\.bounds must be Bounds or null/);
        });

        it('throws when bounds object is invalid', () => {
            expect(() =>
                RoutesGeojson.fromResult({
                    type: 'FeatureCollection',
                    features: [],
                    bounds: { north: 41, south: 40, east: -110 },
                }),
            ).toThrow(/Bounds\.west must be a number/);
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
