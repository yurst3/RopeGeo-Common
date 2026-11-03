import { describe, it, expect } from '@jest/globals';
import {
    canonicalFeatureKey,
    createLegendIdAssigner,
    LEGEND_ID_PROPERTY,
    legendIdFor,
    uuidV5,
} from '../../../../../src/models';

const UUID_V5 = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const point = { type: 'Point' as const, coordinates: [-109.0, 38.5] };

describe('uuidV5', () => {
    it('matches the RFC 4122 test vector', () => {
        // DNS namespace + "python.org", from the Python uuid docs.
        expect(uuidV5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'python.org')).toBe(
            '886313e1-3b8a-5372-9b90-0c9aee199e5d',
        );
    });
});

describe('canonicalFeatureKey', () => {
    it('ignores property key order and legendId', () => {
        expect(canonicalFeatureKey({ b: 1, a: { d: 2, c: 3 }, [LEGEND_ID_PROPERTY]: 'x' }, point)).toBe(
            canonicalFeatureKey({ a: { c: 3, d: 2 }, b: 1 }, point),
        );
    });

    it('ignores tiny float differences in coordinates', () => {
        expect(canonicalFeatureKey({}, { type: 'Point', coordinates: [-109.00000000001, 38.49999999999] })).toBe(
            canonicalFeatureKey({}, point),
        );
    });

    it('changes with properties or geometry', () => {
        const base = canonicalFeatureKey({ name: 'A' }, point);
        expect(canonicalFeatureKey({ name: 'B' }, point)).not.toBe(base);
        expect(canonicalFeatureKey({ name: 'A' }, { type: 'Point', coordinates: [-109.1, 38.5] })).not.toBe(base);
    });
});

describe('legendIdFor', () => {
    it('is a UUID v5 that depends on the file name', () => {
        const key = canonicalFeatureKey({}, point);
        expect(legendIdFor('a.geojson', key)).toMatch(UUID_V5);
        expect(legendIdFor('a.geojson', key)).toBe(legendIdFor('a.geojson', key));
        expect(legendIdFor('a.geojson', key)).not.toBe(legendIdFor('b.geojson', key));
    });
});

describe('createLegendIdAssigner', () => {
    it('keeps repeated identical features distinct and reproducible', () => {
        const first = createLegendIdAssigner('trip.geojson');
        const ids = [first({}, point), first({}, point), first({}, point)];
        expect(new Set(ids).size).toBe(3);
        const second = createLegendIdAssigner('trip.geojson');
        expect([second({}, point), second({}, point), second({}, point)]).toEqual(ids);
        expect(ids[0]).toBe(legendIdFor('trip.geojson', canonicalFeatureKey({}, point)));
    });
});
