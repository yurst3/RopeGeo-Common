import type { TripReportMapBlock } from '../block/tripReportMapBlock';
import { MapBlockUndoChange } from './mapBlockUndoChange';

export type AddSegmentUndoChangeJson = {
    type: 'addSegment';
    segmentId: string;
};

/** Undoes {@link TripReportMapBlock.withNewSegment} by removing the added segment. */
export class AddSegmentUndoChange extends MapBlockUndoChange {
    readonly type = 'addSegment' as const;
    readonly segmentId: string;

    constructor(segmentId: string) {
        super();
        this.segmentId = segmentId;
    }

    apply(block: TripReportMapBlock): TripReportMapBlock {
        return block.withSegments(block.segments.filter((segment) => segment.id !== this.segmentId));
    }

    toJSON(): AddSegmentUndoChangeJson {
        return { type: this.type, segmentId: this.segmentId };
    }

    static fromResult(result: unknown): AddSegmentUndoChange {
        const r = result as Record<string, unknown>;
        return new AddSegmentUndoChange(
            MapBlockUndoChange.assertNonEmptyString(r.segmentId, 'AddSegmentUndoChange.segmentId'),
        );
    }
}
