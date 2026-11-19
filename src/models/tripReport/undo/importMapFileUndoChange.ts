import type { TripReportMapBlock } from '../block/tripReportMapBlock';
import { MapBlockUndoChange } from './mapBlockUndoChange';

export type ImportMapFileUndoChangeJson = {
    type: 'importMapFile';
    /** Segment ids that this import actually added (collisions omitted). */
    segmentIds: string[];
    /** Marker ids that this import actually added (collisions omitted). */
    markerIds: string[];
    /** Polygon/feature legend ids that this import actually added (collisions omitted). */
    featureIds: string[];
};

/**
 * Undoes {@link TripReportMapBlock.withMapFileImported} by removing only the segments, markers,
 * and imported polygons that the import newly added — never ids that were skipped as collisions.
 */
export class ImportMapFileUndoChange extends MapBlockUndoChange {
    readonly type = 'importMapFile' as const;
    readonly segmentIds: readonly string[];
    readonly markerIds: readonly string[];
    readonly featureIds: readonly string[];

    constructor(segmentIds: readonly string[], markerIds: readonly string[], featureIds: readonly string[]) {
        super();
        this.segmentIds = segmentIds;
        this.markerIds = markerIds;
        this.featureIds = featureIds;
    }

    apply(block: TripReportMapBlock): TripReportMapBlock {
        const segmentIds = new Set(this.segmentIds);
        const markerIds = new Set(this.markerIds);
        let next = block.withSegments(block.segments.filter((segment) => !segmentIds.has(segment.id)));
        next = next.withMarkers(next.markers.filter((marker) => !markerIds.has(marker.id)));
        for (const featureId of this.featureIds) {
            next = next.withFeatureRemoved(featureId);
        }
        return next;
    }

    toJSON(): ImportMapFileUndoChangeJson {
        return {
            type: this.type,
            segmentIds: [...this.segmentIds],
            markerIds: [...this.markerIds],
            featureIds: [...this.featureIds],
        };
    }

    static fromResult(result: unknown): ImportMapFileUndoChange {
        const r = result as Record<string, unknown>;
        return new ImportMapFileUndoChange(
            ImportMapFileUndoChange.parseIdArray(r.segmentIds, 'ImportMapFileUndoChange.segmentIds'),
            ImportMapFileUndoChange.parseIdArray(r.markerIds, 'ImportMapFileUndoChange.markerIds'),
            ImportMapFileUndoChange.parseIdArray(r.featureIds, 'ImportMapFileUndoChange.featureIds'),
        );
    }

    private static parseIdArray(value: unknown, context: string): string[] {
        if (!Array.isArray(value)) {
            throw new Error(`${context} must be an array`);
        }
        return value.map((entry, index) =>
            MapBlockUndoChange.assertNonEmptyString(entry, `${context}[${index}]`),
        );
    }
}
