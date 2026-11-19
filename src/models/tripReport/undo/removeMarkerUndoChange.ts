import type { TripReportMapBlock } from '../block/tripReportMapBlock';
import { TripReportMarker, type TripReportMarkerJson } from '../tripReportMarker';
import { MapBlockUndoChange } from './mapBlockUndoChange';

export type RemoveMarkerUndoChangeJson = {
    type: 'removeMarker';
    marker: TripReportMarkerJson;
    index: number;
};

/** Undoes {@link TripReportMapBlock.withMarkerRemoved} by re-inserting the marker. */
export class RemoveMarkerUndoChange extends MapBlockUndoChange {
    readonly type = 'removeMarker' as const;
    readonly marker: TripReportMarkerJson;
    readonly index: number;

    constructor(marker: TripReportMarkerJson, index: number) {
        super();
        this.marker = marker;
        this.index = index;
    }

    apply(block: TripReportMapBlock): TripReportMapBlock {
        const restored = TripReportMarker.fromJSON(this.marker);
        const index = Math.min(this.index, block.markers.length);
        const markers = [...block.markers.slice(0, index), restored, ...block.markers.slice(index)];
        return block.withMarkers(markers);
    }

    toJSON(): RemoveMarkerUndoChangeJson {
        return { type: this.type, marker: this.marker, index: this.index };
    }

    static fromResult(result: unknown): RemoveMarkerUndoChange {
        const r = result as Record<string, unknown>;
        if (r.marker == null || typeof r.marker !== 'object' || Array.isArray(r.marker)) {
            throw new Error('RemoveMarkerUndoChange.marker must be an object');
        }
        const markerJson = r.marker as TripReportMarkerJson;
        TripReportMarker.fromJSON(markerJson);
        return new RemoveMarkerUndoChange(
            markerJson,
            MapBlockUndoChange.assertNonNegativeInteger(r.index, 'RemoveMarkerUndoChange.index'),
        );
    }
}
