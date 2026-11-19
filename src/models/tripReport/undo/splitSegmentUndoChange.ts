import type { TripReportMapBlock } from '../block/tripReportMapBlock';
import { MapBlockUndoChange } from './mapBlockUndoChange';

export type SplitSegmentUndoChangeJson = {
    type: 'splitSegment';
    segmentId: string;
    newSegmentId: string;
    waypointIndex: number;
};

/**
 * Undoes {@link TripReportMapBlock.withSegmentSplitAt} by concatenating the new segment's
 * waypoints back onto the original and removing the new segment.
 */
export class SplitSegmentUndoChange extends MapBlockUndoChange {
    readonly type = 'splitSegment' as const;
    readonly segmentId: string;
    readonly newSegmentId: string;
    readonly waypointIndex: number;

    constructor(segmentId: string, newSegmentId: string, waypointIndex: number) {
        super();
        this.segmentId = segmentId;
        this.newSegmentId = newSegmentId;
        this.waypointIndex = waypointIndex;
    }

    apply(block: TripReportMapBlock): TripReportMapBlock {
        const original = block.segments.find((segment) => segment.id === this.segmentId);
        const split = block.segments.find((segment) => segment.id === this.newSegmentId);
        if (original == null || split == null) return block;
        const merged = original.withWaypoints([...original.waypoints, ...split.waypoints]);
        return block.withSegments(
            block.segments.flatMap((segment) => {
                if (segment.id === this.segmentId) return [merged];
                if (segment.id === this.newSegmentId) return [];
                return [segment];
            }),
        );
    }

    toJSON(): SplitSegmentUndoChangeJson {
        return {
            type: this.type,
            segmentId: this.segmentId,
            newSegmentId: this.newSegmentId,
            waypointIndex: this.waypointIndex,
        };
    }

    static fromResult(result: unknown): SplitSegmentUndoChange {
        const r = result as Record<string, unknown>;
        return new SplitSegmentUndoChange(
            MapBlockUndoChange.assertNonEmptyString(r.segmentId, 'SplitSegmentUndoChange.segmentId'),
            MapBlockUndoChange.assertNonEmptyString(
                r.newSegmentId,
                'SplitSegmentUndoChange.newSegmentId',
            ),
            MapBlockUndoChange.assertNonNegativeInteger(
                r.waypointIndex,
                'SplitSegmentUndoChange.waypointIndex',
            ),
        );
    }
}
