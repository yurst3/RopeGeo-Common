import type { TripReportMapBlock } from '../block/tripReportMapBlock';
import type { TripReportWaypoint } from '../tripReportLineSegment';
import { MapBlockUndoChange } from './mapBlockUndoChange';
import { parseUndoWaypoint } from './parseUndoWaypoint';

export type MoveMarkerUndoChangeJson = {
    type: 'moveMarker';
    markerId: string;
    previousPosition: [number, number];
};

/** Undoes {@link TripReportMapBlock.withMarkerMoved} by restoring the prior position. */
export class MoveMarkerUndoChange extends MapBlockUndoChange {
    readonly type = 'moveMarker' as const;
    readonly markerId: string;
    readonly previousPosition: TripReportWaypoint;

    constructor(markerId: string, previousPosition: TripReportWaypoint) {
        super();
        this.markerId = markerId;
        this.previousPosition = previousPosition;
    }

    apply(block: TripReportMapBlock): TripReportMapBlock {
        return block.withMarkers(
            block.markers.map((marker) =>
                marker.id === this.markerId ? marker.withPosition(this.previousPosition) : marker,
            ),
        );
    }

    toJSON(): MoveMarkerUndoChangeJson {
        return {
            type: this.type,
            markerId: this.markerId,
            previousPosition: [this.previousPosition[0], this.previousPosition[1]],
        };
    }

    static fromResult(result: unknown): MoveMarkerUndoChange {
        const r = result as Record<string, unknown>;
        return new MoveMarkerUndoChange(
            MapBlockUndoChange.assertNonEmptyString(r.markerId, 'MoveMarkerUndoChange.markerId'),
            parseUndoWaypoint(r.previousPosition, 'MoveMarkerUndoChange.previousPosition'),
        );
    }
}
