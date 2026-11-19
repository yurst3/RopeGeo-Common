import type { TripReportMapBlock } from '../block/tripReportMapBlock';
import { MapBlockUndoChange } from './mapBlockUndoChange';

export type AddMarkerUndoChangeJson = {
    type: 'addMarker';
    markerId: string;
};

/** Undoes {@link TripReportMapBlock.withNewMarker} by removing the added marker. */
export class AddMarkerUndoChange extends MapBlockUndoChange {
    readonly type = 'addMarker' as const;
    readonly markerId: string;

    constructor(markerId: string) {
        super();
        this.markerId = markerId;
    }

    apply(block: TripReportMapBlock): TripReportMapBlock {
        return block.withMarkers(block.markers.filter((marker) => marker.id !== this.markerId));
    }

    toJSON(): AddMarkerUndoChangeJson {
        return { type: this.type, markerId: this.markerId };
    }

    static fromResult(result: unknown): AddMarkerUndoChange {
        const r = result as Record<string, unknown>;
        return new AddMarkerUndoChange(
            MapBlockUndoChange.assertNonEmptyString(r.markerId, 'AddMarkerUndoChange.markerId'),
        );
    }
}
