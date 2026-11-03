/**
 * Discriminator for {@link TripReportBlock} payloads (`blockType` field).
 */
export enum TripReportBlockType {
    Text = 'text',
    Map = 'map',
}

export const TRIP_REPORT_BLOCK_TYPES: ReadonlySet<string> = new Set<string>(
    Object.values(TripReportBlockType),
);
