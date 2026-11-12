import { describe, it, expect } from '@jest/globals';
import {
    Bounds,
    LEGEND_ID_PROPERTY,
    PolygonLegendItem,
    TripReportLineSegment,
    TripReportMapBlock,
    TripReportMarker,
    TripReportMarkerStyle,
} from '../../../../src/models';

describe('TripReportMapBlock segments', () => {
    it('creates Segment 1 lazily and appends to the active segment', () => {
        const block = TripReportMapBlock.createEmpty()
            .withWaypointAppendedToActive([-109.1234567, 38.7654321])
            .withWaypointAppendedToActive([-109.2, 38.8]);
        expect(block.segments).toHaveLength(1);
        expect(block.segments[0].name).toBe('Segment 1');
        expect(block.segments[0].waypoints).toEqual([
            [-109.123457, 38.765432],
            [-109.2, 38.8],
        ]);
        expect(block.nextSegmentNumber).toBe(2);
    });

    it('gives an auto-created segment the requested color', () => {
        const block = TripReportMapBlock.createEmpty().withWaypointAppendedToActive(
            [1, 2],
            'white',
        );
        expect(block.segments[0].color).toBe('white');
        expect(block.segments[0].toJSON().color).toBe('white');
    });

    it('never reuses segment numbers after removal', () => {
        const block = TripReportMapBlock.createEmpty().withNewSegment().withNewSegment();
        const removed = block.withSegmentRemoved(block.segments[1].id).withNewSegment();
        expect(removed.segments.map((s) => s.name)).toEqual(['Segment 1', 'Segment 3']);
    });

    it('round-trips JSON and omits default appearance', () => {
        const block = TripReportMapBlock.createEmpty()
            .withWaypointAppendedToActive([1, 2])
            .withNewSegment()
            .withWaypointAppendedToActive([3, 4]);
        const styled = block.withSegmentUpdated(block.segments[1].id, (s) =>
            s.withColor('red').withStyle('dotted'),
        );
        const json = styled.toJSON();
        expect(json.segments[0]).not.toHaveProperty('color');
        expect(json.segments[1]).toMatchObject({ color: 'red', style: 'dotted' });
        expect(json.segments[1]).not.toHaveProperty('thickness');
        const restored = TripReportMapBlock.fromResult(JSON.parse(JSON.stringify(json)));
        expect(restored.toJSON()).toEqual(json);
    });

    it('continues numbering from names when the counter is missing', () => {
        const restored = TripReportMapBlock.fromResult({
            blockType: 'map',
            id: 'map-1',
            segments: [
                TripReportLineSegment.createEmpty('Segment 4').toJSON(),
                TripReportLineSegment.createEmpty('Ridge walk').toJSON(),
            ],
        });
        expect(restored.nextSegmentNumber).toBe(5);
    });

    describe('fromResult validation', () => {
        it('rejects a missing id or the wrong blockType', () => {
            expect(() => TripReportMapBlock.fromResult({ blockType: 'map', segments: [] })).toThrow(
                'TripReportMapBlock.id must be a non-empty string',
            );
            expect(() => TripReportMapBlock.fromResult({ blockType: 'text', id: 'x' })).toThrow(
                'TripReportMapBlock.blockType must be "map"',
            );
            expect(() => TripReportMapBlock.fromResult(null)).toThrow('TripReportMapBlock result must be an object');
        });

        it('rejects malformed segments, counter, features, or legend', () => {
            const base = { blockType: 'map', id: 'map-1' };
            expect(() => TripReportMapBlock.fromResult({ ...base, segments: {} })).toThrow(
                'TripReportMapBlock.segments must be an array',
            );
            expect(() => TripReportMapBlock.fromResult({ ...base, nextSegmentNumber: 0 })).toThrow(
                'TripReportMapBlock.nextSegmentNumber must be a positive integer',
            );
            expect(() => TripReportMapBlock.fromResult({ ...base, features: 'x' })).toThrow(
                'TripReportMapBlock.features must be an array',
            );
            expect(() => TripReportMapBlock.fromResult({ ...base, legend: [] })).toThrow(
                'TripReportMapBlock.legend must be an object',
            );
            expect(() => TripReportMapBlock.fromResult({ ...base, markers: {} })).toThrow(
                'TripReportMapBlock.markers must be an array',
            );
            expect(() => TripReportMapBlock.fromResult({ ...base, nextMarkerNumber: 1.5 })).toThrow(
                'TripReportMapBlock.nextMarkerNumber must be a positive integer',
            );
            expect(() => TripReportMapBlock.fromResult({ ...base, nextPolygonNumber: -1 })).toThrow(
                'TripReportMapBlock.nextPolygonNumber must be a positive integer',
            );
        });

        it('treats missing segments, markers, features, and legend as empty', () => {
            const block = TripReportMapBlock.fromResult({ blockType: 'map', id: 'map-1' });
            expect(block.segments).toEqual([]);
            expect(block.markers).toEqual([]);
            expect(block.features).toEqual([]);
            expect(block.legend).toEqual({});
            expect(block.nextSegmentNumber).toBe(1);
            expect(block.nextMarkerNumber).toBe(1);
            expect(block.nextPolygonNumber).toBe(1);
        });
    });
});

describe('TripReportMapBlock markers', () => {
    it('adds numbered markers and never reuses numbers after removal', () => {
        const block = TripReportMapBlock.createEmpty().withNewMarker([-110, 38]).withNewMarker([-110.1, 38.1], 'red');
        expect(block.markers.map((m) => [m.name, m.color, m.style])).toEqual([
            ['Marker 1', 'black', TripReportMarkerStyle.Marker],
            ['Marker 2', 'red', TripReportMarkerStyle.Marker],
        ]);
        const removed = block.withMarkerRemoved(block.markers[0]!.id).withNewMarker([0, 0]);
        expect(removed.markers.map((m) => m.name)).toEqual(['Marker 2', 'Marker 3']);
        expect(removed.hasId(block.markers[0]!.id)).toBe(false);
        expect(removed.hasId(block.markers[1]!.id)).toBe(true);
    });

    it('updates only the matching marker', () => {
        const block = TripReportMapBlock.createEmpty().withNewMarker([-110, 38]).withNewMarker([-110.1, 38.1]);
        const updated = block.withMarkerUpdated(block.markers[1]!.id, (m) =>
            m.withName('Camp').withStyle(TripReportMarkerStyle.Camp),
        );
        expect(updated.markers[0]).toBe(block.markers[0]);
        expect(updated.markers[1]).toMatchObject({ id: block.markers[1]!.id, name: 'Camp', style: 'camp' });
    });

    it('round-trips markers and their counter through JSON', () => {
        const block = TripReportMapBlock.createEmpty()
            .withNewMarker([-110, 38])
            .withNewMarker([-110.1, 38.1], 'blue', TripReportMarkerStyle.Waterfall);
        const json = block.toJSON();
        expect(json.markers![0]).not.toHaveProperty('color');
        expect(json.markers![1]).toMatchObject({ color: 'blue', style: 'waterfall' });
        expect(json.nextMarkerNumber).toBe(3);
        const restored = TripReportMapBlock.fromResult(JSON.parse(JSON.stringify(json)));
        expect(restored.markers).toEqual(block.markers);
        expect(restored.toJSON()).toEqual(json);
    });

    it('continues marker numbering from names when the counter is missing', () => {
        const restored = TripReportMapBlock.fromResult({
            blockType: 'map',
            id: 'map-1',
            markers: [
                TripReportMarker.create('Marker 6', [0, 0]).toJSON(),
                TripReportMarker.create('Camp', [1, 1]).toJSON(),
            ],
        });
        expect(restored.nextMarkerNumber).toBe(7);
    });

    it('omits markers from JSON when there are none', () => {
        expect(TripReportMapBlock.createEmpty().toJSON()).not.toHaveProperty('markers');
    });
});

describe('TripReportMapBlock polygon numbering', () => {
    const polygon = (legendId: string, name: string) => ({
        feature: {
            type: 'Feature',
            properties: { [LEGEND_ID_PROPERTY]: legendId },
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 0],
                    ],
                ],
            },
        },
        legendItem: new PolygonLegendItem(legendId, name, new Bounds(1, 0, 1, 0)).toPlain(),
    });

    it('starts at 1 and round-trips through JSON', () => {
        const block = TripReportMapBlock.createEmpty();
        expect(block.nextPolygonNumber).toBe(1);
        const json = { ...block.toJSON(), nextPolygonNumber: 4 };
        expect(json.nextPolygonNumber).toBe(4);
        const restored = TripReportMapBlock.fromResult(JSON.parse(JSON.stringify(json)));
        expect(restored.nextPolygonNumber).toBe(4);
        expect(restored.toJSON().nextPolygonNumber).toBe(4);
    });

    it('keeps its counter through other edits', () => {
        const json = { ...TripReportMapBlock.createEmpty().toJSON(), nextPolygonNumber: 3 };
        const block = TripReportMapBlock.fromResult(json).withNewMarker([0, 0]).withNewSegment();
        expect(block.nextPolygonNumber).toBe(3);
    });

    it('continues numbering from polygon names when the counter is missing', () => {
        const first = polygon('p1', 'Polygon 2');
        const second = polygon('p2', 'Swimming hole');
        const restored = TripReportMapBlock.fromResult({
            blockType: 'map',
            id: 'map-1',
            features: [first.feature, second.feature],
            legend: { p1: first.legendItem, p2: second.legendItem },
        });
        expect(restored.nextPolygonNumber).toBe(3);
    });
});
