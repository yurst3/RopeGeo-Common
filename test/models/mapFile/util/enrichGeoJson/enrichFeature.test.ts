import { describe, it, expect } from '@jest/globals';
import type { Geometry } from 'geojson';
import { enrichFeature } from '../../../../../src/models';
import { feature, testContext } from './context';

describe('enrichFeature', () => {
    it.each<[Geometry, string[]]>([
        [{ type: 'Point', coordinates: [1, 2] }, ['Point']],
        [{ type: 'MultiPoint', coordinates: [[1, 2], [3, 4]] }, ['Point', 'Point']],
        [{ type: 'LineString', coordinates: [[1, 2], [3, 4]] }, ['LineString']],
        [{ type: 'MultiLineString', coordinates: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]] }, ['LineString', 'LineString']],
        [{ type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] }, ['Polygon']],
        [{ type: 'MultiPolygon', coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]]] }, ['Polygon']],
    ])('enriches %j', (geometry, outputTypes) => {
        const results = enrichFeature(feature(geometry), testContext());
        expect(results.map((r) => r.feature.geometry?.type)).toEqual(outputTypes);
        expect(results.every((r) => r.legendItem != null)).toBe(true);
    });

    it('passes features without geometry and GeometryCollections through', () => {
        const noGeometry = feature(null, { name: 'Note' });
        expect(enrichFeature(noGeometry, testContext())).toEqual([{ feature: noGeometry, legendItem: null }]);
        const collection = feature({ type: 'GeometryCollection', geometries: [] });
        expect(enrichFeature(collection, testContext())).toEqual([{ feature: collection, legendItem: null }]);
    });
});
