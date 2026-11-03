import { describe, it, expect } from '@jest/globals';
import type { MultiPoint, Point } from 'geojson';
import { PointLegendItem } from '../../../../../src/models/minimap/legend/concrete/pointLegendItem';
import { enrichMultiPoint, enrichPoint } from '../../../../../src/models';
import { feature, legendIdOf, testContext } from './context';

describe('enrichPoint', () => {
    it('builds a point legend item and tags the feature with its id', () => {
        const point: Point = { type: 'Point', coordinates: [-109.0, 38.5] };
        const [result] = enrichPoint(feature(point, { name: 'Start', icon: 'flag' }), point, testContext());
        const item = result!.legendItem as PointLegendItem;
        expect(item).toBeInstanceOf(PointLegendItem);
        expect(item.name).toBe('Start');
        expect(item.coordinates).toEqual({ lat: 38.5, lon: -109.0 });
        expect(legendIdOf(result!.feature)).toBe(item.id);
        expect(result!.feature.geometry).toBe(point);
    });

    it('falls back to "Point N" by feature index', () => {
        const point: Point = { type: 'Point', coordinates: [1, 2] };
        const [result] = enrichPoint(feature(point), point, testContext(4));
        expect(result!.legendItem!.name).toBe('Point 5');
    });

    it('passes points with non-finite coordinates through', () => {
        const point: Point = { type: 'Point', coordinates: [Number.NaN, 2] };
        const source = feature(point, { name: 'Bad' });
        const [result] = enrichPoint(source, point, testContext());
        expect(result!.legendItem).toBeNull();
        expect(result!.feature).toEqual(source);
        expect(legendIdOf(result!.feature)).toBeUndefined();
    });
});

describe('enrichMultiPoint', () => {
    it('explodes into points, dropping altitude and skipping invalid positions', () => {
        const multi: MultiPoint = {
            type: 'MultiPoint',
            coordinates: [
                [1, 2, 300],
                [Number.NaN, 0],
                [3, 4],
            ],
        };
        const results = enrichMultiPoint(feature(multi, { name: 'Anchors' }), multi, testContext());
        expect(results.map((r) => r.feature.geometry)).toEqual([
            { type: 'Point', coordinates: [1, 2] },
            { type: 'Point', coordinates: [3, 4] },
        ]);
        expect(new Set(results.map((r) => r.legendItem!.id)).size).toBe(2);
        expect(results.every((r) => r.legendItem!.name === 'Anchors')).toBe(true);
    });
});
