import type { TripReportMapBlock } from '../block/tripReportMapBlock';
import { MapBlockUndoChange } from './mapBlockUndoChange';

export type SplitSegmentUndoChangeJson = {
    type: 'splitSegment';
    segmentId: string;
    newSegmentId: string;
    waypointIndex: number;
    /** When true, the new segment's first waypoint is a 1 m bridge and must be dropped on undo. */
    hasBridgeStart?: boolean;
};

/**
 * Undoes {@link TripReportMapBlock.withSegmentSplitAt} by concatenating the new segment's
 * waypoints back onto the original (skipping a bridge start when present) and removing the new
 * segment.
 */
export class SplitSegmentUndoChange extends MapBlockUndoChange {
    readonly type = 'splitSegment' as const;
    readonly segmentId: string;
    readonly newSegmentId: string;
    readonly waypointIndex: number;
    readonly hasBridgeStart: boolean;

    constructor(
        segmentId: string,
        newSegmentId: string,
        waypointIndex: number,
        hasBridgeStart = false,
    ) {
        super();
        this.segmentId = segmentId;
        this.newSegmentId = newSegmentId;
        this.waypointIndex = waypointIndex;
        this.hasBridgeStart = hasBridgeStart;
    }

    apply(block: TripReportMapBlock): TripReportMapBlock {
        const original = block.segments.find((segment) => segment.id === this.segmentId);
        const split = block.segments.find((segment) => segment.id === this.newSegmentId);
        if (original == null || split == null) return block;
        const rejoined = this.hasBridgeStart ? split.waypoints.slice(1) : split.waypoints;
        const merged = original.withWaypoints([...original.waypoints, ...rejoined]);
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
            ...(this.hasBridgeStart ? { hasBridgeStart: true } : {}),
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
            r.hasBridgeStart === true,
        );
    }
}
