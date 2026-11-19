import type { TripReportMapBlock } from '../block/tripReportMapBlock';
import type { TripReportWaypoint } from '../tripReportLineSegment';
import { MapBlockUndoChange } from './mapBlockUndoChange';
import { parseUndoWaypoint } from './parseUndoWaypoint';

export type MoveWaypointUndoChangeJson = {
    type: 'moveWaypoint';
    segmentId: string;
    waypointIndex: number;
    previousPosition: [number, number];
};

/** Undoes {@link TripReportMapBlock.withSegmentWaypointMoved} by restoring the prior waypoint. */
export class MoveWaypointUndoChange extends MapBlockUndoChange {
    readonly type = 'moveWaypoint' as const;
    readonly segmentId: string;
    readonly waypointIndex: number;
    readonly previousPosition: TripReportWaypoint;

    constructor(segmentId: string, waypointIndex: number, previousPosition: TripReportWaypoint) {
        super();
        this.segmentId = segmentId;
        this.waypointIndex = waypointIndex;
        this.previousPosition = previousPosition;
    }

    apply(block: TripReportMapBlock): TripReportMapBlock {
        return block.withSegments(
            block.segments.map((segment) =>
                segment.id === this.segmentId
                    ? segment.withWaypointMoved(this.waypointIndex, this.previousPosition)
                    : segment,
            ),
        );
    }

    toJSON(): MoveWaypointUndoChangeJson {
        return {
            type: this.type,
            segmentId: this.segmentId,
            waypointIndex: this.waypointIndex,
            previousPosition: [this.previousPosition[0], this.previousPosition[1]],
        };
    }

    static fromResult(result: unknown): MoveWaypointUndoChange {
        const r = result as Record<string, unknown>;
        return new MoveWaypointUndoChange(
            MapBlockUndoChange.assertNonEmptyString(r.segmentId, 'MoveWaypointUndoChange.segmentId'),
            MapBlockUndoChange.assertNonNegativeInteger(
                r.waypointIndex,
                'MoveWaypointUndoChange.waypointIndex',
            ),
            parseUndoWaypoint(r.previousPosition, 'MoveWaypointUndoChange.previousPosition'),
        );
    }
}
