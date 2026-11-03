import { describe, it, expect } from '@jest/globals';
import type { LineString, MultiLineString } from 'geojson';
import { LegendFeatureType } from '../../../../../src/models/minimap/legend/abstract/legendFeatureType';
import { LineLegendItem } from '../../../../../src/models/minimap/legend/concrete/lineLegendItem';
import { enrichLineString, enrichMultiLineString } from '../../../../../src/models';
import { feature, legendIdOf, testContext } from './context';

const northFork: LineString = {
    type: 'LineString',
    coordinates: [
        [-110.0, 38.2],
        [-109.5, 38.4],
    ],
};

describe('enrichLineString', () => {
    it('builds a line legend item with bounds and stroke style', () => {
        const [result] = enrichLineString(
            feature(northFork, { name: 'North fork', stroke: '#ff0000', 'stroke-width': '3' }),
            northFork,
            testContext(),
        );
        const item = result!.legendItem as LineLegendItem;
        expect(item).toBeInstanceOf(LineLegendItem);
        expect(item.featureType).toBe(LegendFeatureType.Line);
        expect(item.name).toBe('North fork');
        expect(item.bounds).toMatchObject({ west: -110.0, east: -109.5, south: 38.2, north: 38.4 });
        expect(item.strokeColor).toBe('#ff0000');
        expect(item.strokeWidth).toBe('3');
        expect(legendIdOf(result!.feature)).toBe(item.id);
    });

    it('falls back to "Line N"', () => {
        const [result] = enrichLineString(feature(northFork), northFork, testContext(2));
        expect(result!.legendItem!.name).toBe('Line 3');
    });

    it('passes lines without coordinates through', () => {
        const empty: LineString = { type: 'LineString', coordinates: [] };
        const [result] = enrichLineString(feature(empty), empty, testContext());
        expect(result!.legendItem).toBeNull();
    });
});

describe('enrichMultiLineString', () => {
    const multi: MultiLineString = {
        type: 'MultiLineString',
        coordinates: [
            [
                [-110, 38],
                [-109.9, 38.1],
            ],
            [],
            [
                [-109.8, 38.0],
                [-109.7, 38.05],
            ],
        ],
    };

    it('explodes into lines, skipping empty parts and numbering fallback names', () => {
        const results = enrichMultiLineString(feature(multi), multi, testContext(0));
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.legendItem!.name)).toEqual(['Line 1 (1)', 'Line 1 (2)']);
        expect(results.map((r) => r.feature.geometry?.type)).toEqual(['LineString', 'LineString']);
        expect(new Set(results.map((r) => r.legendItem!.id)).size).toBe(2);
    });

    it('gives each part the same id as that line on its own', () => {
        const [firstPart] = enrichMultiLineString(feature(multi, { name: 'A' }), multi, testContext());
        const standalone: LineString = { type: 'LineString', coordinates: multi.coordinates[0]! };
        const [alone] = enrichLineString(feature(standalone, { name: 'A' }), standalone, testContext());
        expect(firstPart!.legendItem!.id).toBe(alone!.legendItem!.id);
    });
});
