import { describe, it, expect } from '@jest/globals';
import { TripReportLineSegment, TripReportMapBlock } from '../../../../src/models';

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
        });

        it('treats missing segments, features, and legend as empty', () => {
            const block = TripReportMapBlock.fromResult({ blockType: 'map', id: 'map-1' });
            expect(block.segments).toEqual([]);
            expect(block.features).toEqual([]);
            expect(block.legend).toEqual({});
            expect(block.nextSegmentNumber).toBe(1);
        });
    });
});
