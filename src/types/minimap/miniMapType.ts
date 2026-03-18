/**
 * Discriminator for {@link MiniMap} subclasses (vector tiles vs GeoJSON URL).
 */
export enum MiniMapType {
    GeoJson = 'geojson',
    TilesTemplate = 'tilesTemplate',
}
