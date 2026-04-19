/**
 * Discriminator for {@link MiniMap} subclasses (page tiles vs region routes vs centered region routes).
 */
export enum MiniMapType {
    Page = 'page',
    Region = 'region',
    CenteredRegion = 'centeredRegion',
}
