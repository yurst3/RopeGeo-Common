import { describe, it, expect } from '@jest/globals';
import { RouteGeoJsonFeature } from '../../../src/classes/routes/routeGeoJsonFeature';
import { RouteType } from '../../../src/classes/routes/routeType';

function validResult(): Record<string, unknown> {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [-111.5, 40.1],
        },
        properties: {
            id: 'id-1',
            name: 'Route One',
            type: RouteType.Canyon,
        },
    };
}

describe('RouteGeoJsonFeature', () => {
    describe('constructor', () => {
        it('sets type, geometry, and properties', () => {
            const coords: [number, number] = [-112, 41];
            const f = new RouteGeoJsonFeature(coords, 'r1', 'My Route', RouteType.Cave);
            expect(f.type).toBe('Feature');
            expect(f.geometry.type).toBe('Point');
            expect(f.geometry.coordinates).toBe(coords);
            expect(f.geometry.coordinates).toEqual([-112, 41]);
            expect(f.properties).toEqual({
                id: 'r1',
                name: 'My Route',
                type: RouteType.Cave,
            });
        });

        it('accepts each RouteType in properties', () => {
            const types = [RouteType.Cave, RouteType.Canyon, RouteType.POI, RouteType.Unknown];
            for (const t of types) {
                const f = new RouteGeoJsonFeature([0, 0], 'id', 'Name', t);
                expect(f.properties.type).toBe(t);
            }
        });
    });

    describe('fromResult', () => {
        it('parses valid result and returns RouteGeoJsonFeature instance', () => {
            const result = validResult();
            const parsed = RouteGeoJsonFeature.fromResult(result);
            expect(parsed).toBeInstanceOf(RouteGeoJsonFeature);
            expect(parsed.type).toBe('Feature');
            expect(parsed.geometry.type).toBe('Point');
            expect(parsed.geometry.coordinates).toEqual([-111.5, 40.1]);
            expect(parsed.properties).toEqual({
                id: 'id-1',
                name: 'Route One',
                type: RouteType.Canyon,
            });
        });

        it('mutates result object and sets prototype', () => {
            const result = validResult();
            const parsed = RouteGeoJsonFeature.fromResult(result);
            expect(parsed).toBe(result);
            expect(result).toBeInstanceOf(RouteGeoJsonFeature);
        });

        it('throws when result is null', () => {
            expect(() => RouteGeoJsonFeature.fromResult(null)).toThrow(
                'RouteGeoJsonFeature result must be an object',
            );
        });

        it('throws when result is not an object', () => {
            expect(() => RouteGeoJsonFeature.fromResult('string')).toThrow(
                'RouteGeoJsonFeature result must be an object',
            );
            expect(() => RouteGeoJsonFeature.fromResult(42)).toThrow(
                'RouteGeoJsonFeature result must be an object',
            );
        });

        it('throws when type is not Feature', () => {
            expect(() =>
                RouteGeoJsonFeature.fromResult({ ...validResult(), type: 'Point' }),
            ).toThrow('RouteGeoJsonFeature.type must be "Feature"');
        });

        it('throws when geometry is missing or not an object', () => {
            expect(() =>
                RouteGeoJsonFeature.fromResult({ ...validResult(), geometry: null }),
            ).toThrow(/RouteGeoJsonFeature\.geometry must be an object/);
            expect(() =>
                RouteGeoJsonFeature.fromResult({ ...validResult(), geometry: 'point' }),
            ).toThrow(/RouteGeoJsonFeature\.geometry must be an object/);
        });

        it('throws when geometry.type is not Point', () => {
            expect(() =>
                RouteGeoJsonFeature.fromResult({
                    ...validResult(),
                    geometry: { type: 'LineString', coordinates: [] },
                }),
            ).toThrow(/RouteGeoJsonFeature\.geometry\.type must be "Point"|RouteGeoJsonFeature\.type must be "Point"/);
        });

        it('throws when geometry.coordinates is not [number, number]', () => {
            expect(() =>
                RouteGeoJsonFeature.fromResult({
                    ...validResult(),
                    geometry: { type: 'Point', coordinates: [] },
                }),
            ).toThrow(/coordinates must be \[number, number\]/);
            expect(() =>
                RouteGeoJsonFeature.fromResult({
                    ...validResult(),
                    geometry: { type: 'Point', coordinates: [1] },
                }),
            ).toThrow(/coordinates must be \[number, number\]/);
            expect(() =>
                RouteGeoJsonFeature.fromResult({
                    ...validResult(),
                    geometry: { type: 'Point', coordinates: [1, 2, 3] },
                }),
            ).toThrow(/coordinates must be \[number, number\]/);
            expect(() =>
                RouteGeoJsonFeature.fromResult({
                    ...validResult(),
                    geometry: { type: 'Point', coordinates: ['x', 2] },
                }),
            ).toThrow(/coordinates must be \[number, number\]/);
            expect(() =>
                RouteGeoJsonFeature.fromResult({
                    ...validResult(),
                    geometry: { type: 'Point', coordinates: [NaN, 40] },
                }),
            ).toThrow(/coordinates must be finite numbers/);
        });

        it('throws when properties is missing or not an object', () => {
            expect(() =>
                RouteGeoJsonFeature.fromResult({ ...validResult(), properties: null }),
            ).toThrow(/RouteGeoJsonFeature\.properties must be an object/);
            expect(() =>
                RouteGeoJsonFeature.fromResult({ ...validResult(), properties: 'invalid' }),
            ).toThrow(/RouteGeoJsonFeature\.properties must be an object, got: string/);
        });

        it('throws when properties.id is not a string', () => {
            expect(() =>
                RouteGeoJsonFeature.fromResult({
                    ...validResult(),
                    properties: { ...(validResult().properties as object), id: 1 },
                }),
            ).toThrow(/RouteGeoJsonFeature\.properties\.id must be a string/);
        });

        it('throws when properties.name is not a string', () => {
            expect(() =>
                RouteGeoJsonFeature.fromResult({
                    ...validResult(),
                    properties: { ...(validResult().properties as object), name: null },
                }),
            ).toThrow(/RouteGeoJsonFeature\.properties\.name must be a string/);
        });

        it('throws when properties.type is not a valid RouteType', () => {
            expect(() =>
                RouteGeoJsonFeature.fromResult({
                    ...validResult(),
                    properties: { ...(validResult().properties as object), type: 'Invalid' },
                }),
            ).toThrow(/RouteGeoJsonFeature\.properties\.type must be one of/);
            expect(() =>
                RouteGeoJsonFeature.fromResult({
                    ...validResult(),
                    properties: { ...(validResult().properties as object), type: 1 },
                }),
            ).toThrow(/RouteGeoJsonFeature\.properties\.type must be one of/);
        });

        it('accepts all valid RouteType values in properties', () => {
            for (const t of Object.values(RouteType)) {
                const result = {
                    ...validResult(),
                    properties: { id: 'id', name: 'Name', type: t },
                };
                const parsed = RouteGeoJsonFeature.fromResult(result);
                expect(parsed.properties.type).toBe(t);
            }
        });
    });
});
