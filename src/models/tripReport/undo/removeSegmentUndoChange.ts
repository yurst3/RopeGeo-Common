import type { TripReportMapBlock } from '../block/tripReportMapBlock';
import {
    TripReportLineSegment,
    type TripReportLineSegmentJson,
} from '../tripReportLineSegment';
import { MapBlockUndoChange } from './mapBlockUndoChange';

export type RemoveSegmentUndoChangeJson = {
    type: 'removeSegment';
    segment: TripReportLineSegmentJson;
    index: number;
};

/** Undoes {@link TripReportMapBlock.withSegmentRemoved} by re-inserting the segment. */
export class RemoveSegmentUndoChange extends MapBlockUndoChange {
    readonly type = 'removeSegment' as const;
    readonly segment: TripReportLineSegmentJson;
    readonly index: number;

    constructor(segment: TripReportLineSegmentJson, index: number) {
        super();
        this.segment = segment;
        this.index = index;
    }

    apply(block: TripReportMapBlock): TripReportMapBlock {
        const restored = TripReportLineSegment.fromJSON(this.segment);
        const index = Math.min(this.index, block.segments.length);
        const segments = [...block.segments.slice(0, index), restored, ...block.segments.slice(index)];
        return block.withSegments(segments);
    }

    toJSON(): RemoveSegmentUndoChangeJson {
        return { type: this.type, segment: this.segment, index: this.index };
    }

    static fromResult(result: unknown): RemoveSegmentUndoChange {
        const r = result as Record<string, unknown>;
        if (r.segment == null || typeof r.segment !== 'object' || Array.isArray(r.segment)) {
            throw new Error('RemoveSegmentUndoChange.segment must be an object');
        }
        // Validate by parsing; store the original JSON shape for toJSON fidelity.
        const segmentJson = r.segment as TripReportLineSegmentJson;
        TripReportLineSegment.fromJSON(segmentJson);
        return new RemoveSegmentUndoChange(
            segmentJson,
            MapBlockUndoChange.assertNonNegativeInteger(r.index, 'RemoveSegmentUndoChange.index'),
        );
    }
}
