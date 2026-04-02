import { describe, it, expect } from '@jest/globals';
import { Route, RouteType } from '../../../src/classes/routes/route';
import { RouteGeoJsonFeature } from '../../../src/classes/routes/routeGeoJsonFeature';

describe('Route', () => {
    describe('constructor', () => {
        it('sets id, name, type, and coordinates', () => {
            const coords = { lat: 40.1, lon: -111.5 };
            const r = new Route('id-1', 'Test Route', RouteType.Canyon, coords);
            expect(r.id).toBe('id-1');
            expect(r.name).toBe('Test Route');
            expect(r.type).toBe(RouteType.Canyon);
            expect(r.coordinates).toBe(coords);
        });

        it('accepts each RouteType', () => {
            expect(new Route('a', 'Cave', RouteType.Cave, null).type).toBe(RouteType.Cave);
            expect(new Route('b', 'Canyon', RouteType.Canyon, null).type).toBe(RouteType.Canyon);
            expect(new Route('c', 'POI', RouteType.POI, null).type).toBe(RouteType.POI);
            expect(new Route('d', 'Unknown', RouteType.Unknown, null).type).toBe(RouteType.Unknown);
        });
    });

    describe('toGeoJsonFeature', () => {
        it('returns RouteGeoJsonFeature with Point geometry and [lon, lat] per RFC 7946', () => {
            const r = new Route('id-1', 'Route One', RouteType.Cave, { lat: 40.1, lon: -111.5 });
            const feature = r.toGeoJsonFeature();
            expect(feature).toBeInstanceOf(RouteGeoJsonFeature);
            expect(feature.type).toBe('Feature');
            expect(feature.geometry.type).toBe('Point');
            expect(feature.geometry.coordinates).toEqual([-111.5, 40.1]);
            expect(feature.properties).toEqual({
                id: 'id-1',
                name: 'Route One',
                type: RouteType.Cave,
            });
        });

        it('uses 0 for missing coordinates', () => {
            const r = new Route('id-2', 'No Coords', RouteType.POI, null);
            const feature = r.toGeoJsonFeature();
            expect(feature.geometry.coordinates).toEqual([0, 0]);
        });

        it('uses 0 for undefined coordinates object', () => {
            const r = new Route('id-2', 'No Coords', RouteType.POI, undefined);
            const feature = r.toGeoJsonFeature();
            expect(feature.geometry.coordinates).toEqual([0, 0]);
        });

        it('uses 0 for undefined lat/lon', () => {
            const r = new Route('id-3', 'Partial', RouteType.Unknown, {
                lat: undefined,
                lon: undefined,
            });
            const feature = r.toGeoJsonFeature();
            expect(feature.geometry.coordinates).toEqual([0, 0]);
        });

        it('uses provided lat when lon is missing', () => {
            const r = new Route('id-4', 'Lat only', RouteType.Canyon, { lat: 35.5 });
            const feature = r.toGeoJsonFeature();
            expect(feature.geometry.coordinates).toEqual([0, 35.5]);
        });

        it('uses provided lon when lat is missing', () => {
            const r = new Route('id-5', 'Lon only', RouteType.Canyon, { lon: -100 });
            const feature = r.toGeoJsonFeature();
            expect(feature.geometry.coordinates).toEqual([-100, 0]);
        });
    });
});
