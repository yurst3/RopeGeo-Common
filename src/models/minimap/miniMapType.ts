/**
 * Discriminator for {@link MiniMap} subclasses (vector tiles vs GeoJSON URL).
 */
export enum MiniMapType {
    GeoJson = 'geojson',
    OnlineTilesTemplate = 'onlineTilesTemplate',
    OfflineTilesTemplate = 'offlineTilesTemplate',
    OnlineCenteredGeojson = 'onlineCenteredGeojson',
    OfflineCenteredGeojson = 'offlineCenteredGeojson',
    /** @deprecated Use OnlineTilesTemplate. */
    TilesTemplate = 'onlineTilesTemplate',
    /** @deprecated Use OnlineCenteredGeojson. */
    CenteredGeojson = 'onlineCenteredGeojson',
    /** @deprecated Use OfflineTilesTemplate. */
    DownloadedTilesTemplate = 'offlineTilesTemplate',
    /** @deprecated Use OfflineCenteredGeojson. */
    DownloadedCenteredGeojson = 'offlineCenteredGeojson',
}
