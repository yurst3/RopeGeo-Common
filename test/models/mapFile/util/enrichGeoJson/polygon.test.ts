import { describe, it, expect } from '@jest/globals';
import type { MultiPolygon, Polygon } from 'geojson';
import { PolygonLegendItem } from '../../../../../src/models/minimap/legend/concrete/polygonLegendItem';
import { enrichMultiPolygon, enrichPolygon } from '../../../../../src/models';
import { feature, legendIdOf, testContext } from './context';

const square: Polygon = {
    type: 'Polygon',
    coordinates: [
        [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
        ],
    ],
};

describe('enrichPolygon', () => {
    it('builds a polygon legend item with bounds, border, and fill', () => {
        const [result] = enrichPolygon(
            feature(square, { name: 'Camp', stroke: '#000000', fill: '#00ff00' }),
            square,
            testContext(),
        );
        const item = result!.legendItem as PolygonLegendItem;
        expect(item).toBeInstanceOf(PolygonLegendItem);
        expect(item.name).toBe('Camp');
        expect(item.bounds).toMatchObject({ west: 0, east: 1, south: 0, north: 1 });
        expect(item.borderColor).toBe('#000000');
        expect(item.fillColor).toBe('#00ff00');
        expect(legendIdOf(result!.feature)).toBe(item.id);
    });

    it('falls back to "Area N" and passes empty polygons through', () => {
        expect(enrichPolygon(feature(square), square, testContext(1))[0]!.legendItem!.name).toBe('Area 2');
        const empty: Polygon = { type: 'Polygon', coordinates: [] };
        expect(enrichPolygon(feature(empty), empty, testContext())[0]!.legendItem).toBeNull();
    });
});

describe('enrichMultiPolygon', () => {
    it('explodes into polygons, skipping empty parts', () => {
        const multi: MultiPolygon = { type: 'MultiPolygon', coordinates: [square.coordinates, [], square.coordinates] };
        const results = enrichMultiPolygon(feature(multi), multi, testContext());
        expect(results.map((r) => r.legendItem!.name)).toEqual(['Area 1 (1)', 'Area 1 (2)']);
        expect(results.map((r) => r.feature.geometry?.type)).toEqual(['Polygon', 'Polygon']);
        // Identical parts are repeats of the same key, so they still get distinct ids.
        expect(new Set(results.map((r) => r.legendItem!.id)).size).toBe(2);
    });
});
