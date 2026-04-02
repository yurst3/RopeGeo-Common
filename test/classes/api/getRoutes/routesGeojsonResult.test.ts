import { describe, it, expect } from '@jest/globals';
import { RoutesGeojsonResult } from '../../../../src/classes/api/getRoutes/routesGeojsonResult';
import { RoutesGeojson } from '../../../../src/classes/api/getRoutes/routeGeojson';
import { RouteGeoJsonFeature } from '../../../../src/classes/routes/route';
import { ResultType } from '../../../../src/classes/results/result';
import { RouteType } from '../../../../src/classes/routes/route';

function validResult(): Record<string, unknown> {
    return {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [-111.5, 40.1] },
                properties: { id: 'id-1', name: 'Route One', type: RouteType.Canyon },
            },
        ],
    };
}

describe('RoutesGeojsonResult', () => {
    describe('constructor', () => {
        it('sets result and resultType', () => {
            const geojson = new RoutesGeojson([]);
            const r = new RoutesGeojsonResult(geojson);
            expect(r.result).toBe(geojson);
            expect(r.resultType).toBe(ResultType.RoutesGeojson);
        });
    });

    describe('fromResult', () => {
        it('parses valid result and returns RoutesGeojsonResult with RoutesGeojson', () => {
            const result = validResult();
            const parsed = RoutesGeojsonResult.fromResult(result);
            expect(parsed).toBeInstanceOf(RoutesGeojsonResult);
            expect(parsed.resultType).toBe(ResultType.RoutesGeojson);
            expect(parsed.result).toBeInstanceOf(RoutesGeojson);
            expect(parsed.result.type).toBe('FeatureCollection');
            expect(parsed.result.features).toHaveLength(1);
            expect(parsed.result.features[0]).toBeInstanceOf(RouteGeoJsonFeature);
            expect(parsed.result.features[0].properties).toEqual({
                id: 'id-1',
                name: 'Route One',
                type: RouteType.Canyon,
            });
            expect(parsed.result.features[0].geometry.coordinates).toEqual([-111.5, 40.1]);
        });

        it('parses empty features array', () => {
            const result = { type: 'FeatureCollection', features: [] };
            const parsed = RoutesGeojsonResult.fromResult(result);
            expect(parsed.result.features).toEqual([]);
        });

        it('throws when result is null', () => {
            expect(() => RoutesGeojsonResult.fromResult(null)).toThrow(
                'RoutesGeojson result must be an object',
            );
        });

        it('throws when result is not an object', () => {
            expect(() => RoutesGeojsonResult.fromResult('string')).toThrow(
                'RoutesGeojson result must be an object',
            );
        });

        it('throws when type is not FeatureCollection', () => {
            expect(() =>
                RoutesGeojsonResult.fromResult({ type: 'Feature', features: [] }),
            ).toThrow('RoutesGeojson.type must be "FeatureCollection"');
        });

        it('throws when features is not an array', () => {
            expect(() =>
                RoutesGeojsonResult.fromResult({ type: 'FeatureCollection', features: null }),
            ).toThrow('RoutesGeojson.features must be an array');
        });
    });
});
