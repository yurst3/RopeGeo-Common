import { Bounds } from '../../../src/models/minimap/bounds';
import { LegendFeatureType } from '../../../src/models/minimap/legend/abstract/legendFeatureType';
import { LegendItem } from '../../../src/models/minimap/legend/abstract/legendItem';
import '../../../src/models/minimap/legend/concrete/lineLegendItem';
import '../../../src/models/minimap/legend/concrete/pointLegendItem';
import '../../../src/models/minimap/legend/concrete/polygonLegendItem';
import { LineLegendItem } from '../../../src/models/minimap/legend/concrete/lineLegendItem';
import { PointLegendItem } from '../../../src/models/minimap/legend/concrete/pointLegendItem';
import { PolygonLegendItem } from '../../../src/models/minimap/legend/concrete/polygonLegendItem';

const validBounds = { north: 39.5, south: 38.1, east: -108.2, west: -110.0 };

describe('LegendItem', () => {
    it('fromResult dispatches to PointLegendItem', () => {
        const item = LegendItem.fromResult({
            featureType: LegendFeatureType.Point,
            id: 'p1',
            name: 'Start',
            coordinates: { lat: 38.5, lon: -109.0 },
            icon: 'pin',
        });
        expect(item).toBeInstanceOf(PointLegendItem);
        expect(item.featureType).toBe(LegendFeatureType.Point);
        expect((item as PointLegendItem).coordinates.lat).toBe(38.5);
        expect((item as PointLegendItem).icon).toBe('pin');
    });

    it('fromResult dispatches to LineLegendItem', () => {
        const item = LegendItem.fromResult({
            featureType: LegendFeatureType.Line,
            id: 'l1',
            name: 'Route',
            bounds: validBounds,
            strokeColor: '#f00',
            strokeWidth: '2',
        });
        expect(item).toBeInstanceOf(LineLegendItem);
        expect((item as LineLegendItem).bounds.north).toBe(39.5);
        expect((item as LineLegendItem).strokeWidth).toBe('2');
    });

    it('fromResult dispatches to PolygonLegendItem', () => {
        const item = LegendItem.fromResult({
            featureType: LegendFeatureType.Polygon,
            id: 'a1',
            name: 'Area',
            bounds: validBounds,
            fillColor: '#00ff0080',
        });
        expect(item).toBeInstanceOf(PolygonLegendItem);
        expect((item as PolygonLegendItem).fillColor).toBe('#00ff0080');
    });

    it('throws when featureType unknown', () => {
        expect(() =>
            LegendItem.fromResult({
                featureType: 'other',
                id: 'x',
                name: 'n',
            } as Record<string, unknown>),
        ).toThrow(/LegendItem\.featureType must be one of/);
    });

    it('legendRecordFromResult builds a record', () => {
        const rec = LegendItem.legendRecordFromResult(
            {
                a: {
                    featureType: LegendFeatureType.Point,
                    id: 'a',
                    name: 'A',
                    coordinates: { lat: 1, lon: 2 },
                },
            },
            'test.legend',
        );
        expect(rec.a).toBeInstanceOf(PointLegendItem);
    });

    it('toPlain round-trips point', () => {
        const item = PointLegendItem.fromResult({
            featureType: 'point',
            id: 'p',
            name: 'P',
            coordinates: { lat: 3, lon: 4 },
        });
        expect(PointLegendItem.fromResult(item.toPlain())).toEqual(item);
    });

    it('fromResult parses optional relevantContext on legend items', () => {
        const item = LegendItem.fromResult({
            featureType: LegendFeatureType.Point,
            id: 'p1',
            name: 'R1',
            coordinates: { lat: 38.5, lon: -109.0 },
            relevantContext: {
                measurements: [],
                betaSectionExcerpts: {
                    'beta-descent': [{ text: '<b>R1</b>', confidence: 0.98 }],
                },
                images: {
                    '': [{ id: 'img-1', confidence: 0.9 }],
                },
            },
        });
        expect(item.relevantContext).not.toBeNull();
        expect(item.relevantContext!.betaSectionExcerpts['beta-descent']).toHaveLength(1);
        const roundTripped = LegendItem.fromResult(item.toPlain());
        expect(roundTripped.relevantContext).not.toBeNull();
        expect(roundTripped.relevantContext!.images['']![0]!.id).toBe('img-1');
    });

    it('throws when relevantContext is invalid', () => {
        expect(() =>
            LegendItem.fromResult({
                featureType: LegendFeatureType.Point,
                id: 'p1',
                name: 'R1',
                coordinates: { lat: 38.5, lon: -109.0 },
                relevantContext: {
                    measurements: 'bad',
                },
            }),
        ).toThrow('RelevantContext.measurements must be an array');
    });
});

describe('Bounds integration on legend items', () => {
    it('LineLegendItem.fromResult uses Bounds.fromResult', () => {
        expect(() =>
            LineLegendItem.fromResult({
                featureType: LegendFeatureType.Line,
                id: 'l',
                name: 'L',
                bounds: { north: 'x' } as unknown as Record<string, unknown>,
            }),
        ).toThrow(/Bounds\./);
    });
});
