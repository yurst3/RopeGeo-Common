import { describe, it, expect } from '@jest/globals';
import type { LineString } from 'geojson';
import { Bounds, TripReportLineSegment, type TripReportLineSegmentJson } from '../../../src/models';

const boundsOf = (segment: TripReportLineSegment) =>
    segment.bounds == null
        ? null
        : {
              north: segment.bounds.north,
              south: segment.bounds.south,
              east: segment.bounds.east,
              west: segment.bounds.west,
          };

describe('TripReportLineSegment.bounds', () => {
    it('is null without waypoints', () => {
        expect(TripReportLineSegment.createEmpty('Segment 1').bounds).toBeNull();
    });

    it('is a zero-size box around a single waypoint', () => {
        const segment = TripReportLineSegment.createEmpty('Segment 1').withWaypointAppended([-109.55, 38.57]);
        expect(segment.bounds).toBeInstanceOf(Bounds);
        expect(boundsOf(segment)).toEqual({ north: 38.57, south: 38.57, east: -109.55, west: -109.55 });
    });

    it('contains every waypoint', () => {
        const segment = new TripReportLineSegment('s', 'Segment 1', [
            [-109.55, 38.57],
            [-109.54, 38.6],
            [-109.58, 38.56],
        ]);
        expect(boundsOf(segment)).toEqual({ north: 38.6, south: 38.56, east: -109.54, west: -109.58 });
    });

    it('follows every waypoint change', () => {
        const start = new TripReportLineSegment('s', 'Segment 1', [
            [-109.55, 38.57],
            [-109.54, 38.58],
        ]);

        const appended = start.withWaypointAppended([-109.5, 38.6]);
        expect(boundsOf(appended)).toEqual({ north: 38.6, south: 38.57, east: -109.5, west: -109.55 });

        const inserted = start.withWaypointInserted(1, [-109.6, 38.5]);
        expect(boundsOf(inserted)).toEqual({ north: 38.58, south: 38.5, east: -109.54, west: -109.6 });

        const moved = start.withWaypointMoved(0, [-109.53, 38.59]);
        expect(boundsOf(moved)).toEqual({ north: 38.59, south: 38.58, east: -109.53, west: -109.54 });

        const removed = start.withWaypointRemoved(1);
        expect(boundsOf(removed)).toEqual({ north: 38.57, south: 38.57, east: -109.55, west: -109.55 });
        expect(start.withWaypointRemoved(0).withWaypointRemoved(0).bounds).toBeNull();

        expect(boundsOf(start)).toEqual({ north: 38.58, south: 38.57, east: -109.54, west: -109.55 });
    });

    it('is restored from JSON and left out of it', () => {
        const segment = new TripReportLineSegment('s', 'Segment 1', [
            [-109.55, 38.57],
            [-109.54, 38.58],
        ]);
        const json = segment.toJSON();
        expect(json).not.toHaveProperty('bounds');
        expect(boundsOf(TripReportLineSegment.fromJSON(json))).toEqual(boundsOf(segment));
    });

    it('is computed for segments imported from map file lines', () => {
        const segment = TripReportLineSegment.fromMapFileLine(
            {
                type: 'LineString',
                coordinates: [
                    [-109.55, 38.57],
                    [-109.52, 38.61],
                ],
            },
            {},
            { id: 's', name: 'Approach' },
        );
        expect(boundsOf(segment)).toEqual({ north: 38.61, south: 38.57, east: -109.52, west: -109.55 });
    });
});

describe('TripReportLineSegment colors', () => {
    const LINE: LineString = {
        type: 'LineString',
        coordinates: [
            [-109.55, 38.57],
            [-109.52, 38.61],
        ],
    };
    const options = { id: 's', name: 'Approach' };

    it('keeps an imported stroke exactly as both the color and the original color', () => {
        const segment = TripReportLineSegment.fromMapFileLine(LINE, { stroke: '#FF8800' }, options);
        expect(segment.color).toBe('#ff8800');
        expect(segment.originalColor).toBe('#ff8800');
    });

    it('expands short hex colors', () => {
        const segment = TripReportLineSegment.fromMapFileLine(LINE, { stroke: '#f80' }, options);
        expect(segment.color).toBe('#ff8800');
    });

    it('uses the default color and no original color without a hex stroke', () => {
        for (const props of [{}, { stroke: 'not a color' }]) {
            const segment = TripReportLineSegment.fromMapFileLine(LINE, props, { ...options, defaultColor: 'white' });
            expect(segment.color).toBe('white');
            expect(segment.originalColor).toBeNull();
        }
    });

    it("prefers RopeGeo's own color and original color over the stroke", () => {
        const segment = TripReportLineSegment.fromMapFileLine(
            LINE,
            { stroke: '#ef4444', 'ropegeo:color': 'red', 'ropegeo:original-color': '#123456' },
            options,
        );
        expect(segment.color).toBe('red');
        expect(segment.originalColor).toBe('#123456');
    });

    it('has no original color when RopeGeo saved a color without one', () => {
        const segment = TripReportLineSegment.fromMapFileLine(
            LINE,
            { stroke: '#ef4444', 'ropegeo:color': 'red' },
            options,
        );
        expect(segment.originalColor).toBeNull();
    });

    it('keeps the original color through edits', () => {
        const segment = TripReportLineSegment.fromMapFileLine(LINE, { stroke: '#ff8800' }, options)
            .withColor('blue')
            .withName('Exit')
            .withWaypointAppended([-109.5, 38.62]);
        expect(segment.color).toBe('blue');
        expect(segment.originalColor).toBe('#ff8800');
        expect(segment.withColor(segment.originalColor!).color).toBe('#ff8800');
    });

    it('exports the drawn color as the stroke and restores both colors on re-import', () => {
        const segment = TripReportLineSegment.fromMapFileLine(LINE, { stroke: '#ff8800' }, options).withColor('blue');
        const feature = segment.toMapFileFeature()!;
        expect(feature.properties).toMatchObject({
            stroke: '#3b82f6',
            'ropegeo:color': 'blue',
            'ropegeo:original-color': '#ff8800',
        });
        const restored = TripReportLineSegment.fromMapFileLine(feature.geometry as LineString, feature.properties, options);
        expect(restored).toMatchObject({ color: 'blue', originalColor: '#ff8800' });

        const exact = segment.withColor('#ff8800').toMapFileFeature()!;
        expect(exact.properties).toMatchObject({ stroke: '#ff8800', 'ropegeo:color': '#ff8800' });
    });

    it('leaves the original color out of exports and JSON when there is none', () => {
        const segment = new TripReportLineSegment('s', 'Segment 1', [[0, 0], [1, 1]]);
        expect(segment.toMapFileFeature()!.properties).not.toHaveProperty('ropegeo:original-color');
        expect(segment.toJSON()).not.toHaveProperty('originalColor');
    });

    it('round-trips both colors through JSON', () => {
        const segment = TripReportLineSegment.fromMapFileLine(LINE, { stroke: '#ff8800' }, options);
        const json = segment.toJSON();
        expect(json).toMatchObject({ color: '#ff8800', originalColor: '#ff8800' });
        expect(TripReportLineSegment.fromJSON(JSON.parse(JSON.stringify(json)))).toEqual(segment);
    });

    it('falls back to the defaults for unknown colors in JSON', () => {
        const json = { id: 's', name: 'S', waypoints: [], color: 'mauve', originalColor: 'teal' };
        const segment = TripReportLineSegment.fromJSON(json as unknown as TripReportLineSegmentJson);
        expect(segment.color).toBe('black');
        expect(segment.originalColor).toBeNull();
    });
});
