import { describe, it, expect } from '@jest/globals';
import { Route, RouteType } from '../../src/types/route';

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
    });

    describe('toGeoJsonFeature', () => {
        it('returns Feature with Point geometry and [lon, lat] per RFC 7946', () => {
            const r = new Route('id-1', 'Route One', RouteType.Cave, { lat: 40.1, lon: -111.5 });
            const feature = r.toGeoJsonFeature();
            expect(feature.type).toBe('Feature');
            expect(feature.geometry.type).toBe('Point');
            expect(feature.geometry.coordinates).toEqual([-111.5, 40.1]);
            expect(feature.properties).toEqual({ id: 'id-1', name: 'Route One', type: RouteType.Cave });
        });

        it('uses 0 for missing coordinates', () => {
            const r = new Route('id-2', 'No Coords', RouteType.POI, null);
            const feature = r.toGeoJsonFeature();
            expect(feature.geometry.coordinates).toEqual([0, 0]);
        });

        it('uses 0 for undefined lat/lon', () => {
            const r = new Route('id-3', 'Partial', RouteType.Unknown, { lat: undefined, lon: undefined });
            const feature = r.toGeoJsonFeature();
            expect(feature.geometry.coordinates).toEqual([0, 0]);
        });
    });
});
