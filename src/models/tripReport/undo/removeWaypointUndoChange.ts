import type { TripReportMapBlock } from '../block/tripReportMapBlock';
import type { TripReportWaypoint } from '../tripReportLineSegment';
import { MapBlockUndoChange } from './mapBlockUndoChange';
import { parseUndoWaypoint } from './parseUndoWaypoint';

export type RemoveWaypointUndoChangeJson = {
    type: 'removeWaypoint';
    segmentId: string;
    waypointIndex: number;
    waypoint: [number, number];
};

/** Undoes {@link TripReportMapBlock.withSegmentWaypointRemoved} by re-inserting the waypoint. */
export class RemoveWaypointUndoChange extends MapBlockUndoChange {
    readonly type = 'removeWaypoint' as const;
    readonly segmentId: string;
    readonly waypointIndex: number;
    readonly waypoint: TripReportWaypoint;

    constructor(segmentId: string, waypointIndex: number, waypoint: TripReportWaypoint) {
        super();
        this.segmentId = segmentId;
        this.waypointIndex = waypointIndex;
        this.waypoint = waypoint;
    }

    apply(block: TripReportMapBlock): TripReportMapBlock {
        return block.withSegments(
            block.segments.map((segment) =>
                segment.id === this.segmentId
                    ? segment.withWaypointInserted(this.waypointIndex, this.waypoint)
                    : segment,
            ),
        );
    }

    toJSON(): RemoveWaypointUndoChangeJson {
        return {
            type: this.type,
            segmentId: this.segmentId,
            waypointIndex: this.waypointIndex,
            waypoint: [this.waypoint[0], this.waypoint[1]],
        };
    }

    static fromResult(result: unknown): RemoveWaypointUndoChange {
        const r = result as Record<string, unknown>;
        return new RemoveWaypointUndoChange(
            MapBlockUndoChange.assertNonEmptyString(r.segmentId, 'RemoveWaypointUndoChange.segmentId'),
            MapBlockUndoChange.assertNonNegativeInteger(
                r.waypointIndex,
                'RemoveWaypointUndoChange.waypointIndex',
            ),
            parseUndoWaypoint(r.waypoint, 'RemoveWaypointUndoChange.waypoint'),
        );
    }
}
