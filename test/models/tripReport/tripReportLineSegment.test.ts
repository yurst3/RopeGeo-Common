import { describe, it, expect } from '@jest/globals';
import { Bounds, TripReportLineSegment } from '../../../src/models';

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
