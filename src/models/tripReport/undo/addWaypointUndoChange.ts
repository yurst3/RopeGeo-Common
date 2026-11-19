import type { TripReportMapBlock } from '../block/tripReportMapBlock';
import { MapBlockUndoChange } from './mapBlockUndoChange';

export type AddWaypointUndoChangeJson = {
    type: 'addWaypoint';
    segmentId: string;
    waypointIndex: number;
};

/** Undoes {@link TripReportMapBlock.withSegmentWaypointInserted} by removing the inserted waypoint. */
export class AddWaypointUndoChange extends MapBlockUndoChange {
    readonly type = 'addWaypoint' as const;
    readonly segmentId: string;
    readonly waypointIndex: number;

    constructor(segmentId: string, waypointIndex: number) {
        super();
        this.segmentId = segmentId;
        this.waypointIndex = waypointIndex;
    }

    apply(block: TripReportMapBlock): TripReportMapBlock {
        return block.withSegments(
            block.segments.map((segment) =>
                segment.id === this.segmentId
                    ? segment.withWaypointRemoved(this.waypointIndex)
                    : segment,
            ),
        );
    }

    toJSON(): AddWaypointUndoChangeJson {
        return {
            type: this.type,
            segmentId: this.segmentId,
            waypointIndex: this.waypointIndex,
        };
    }

    static fromResult(result: unknown): AddWaypointUndoChange {
        const r = result as Record<string, unknown>;
        return new AddWaypointUndoChange(
            MapBlockUndoChange.assertNonEmptyString(r.segmentId, 'AddWaypointUndoChange.segmentId'),
            MapBlockUndoChange.assertNonNegativeInteger(
                r.waypointIndex,
                'AddWaypointUndoChange.waypointIndex',
            ),
        );
    }
}
