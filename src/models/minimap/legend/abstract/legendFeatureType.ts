/**
 * Discriminator for {@link LegendItem} wire payloads (`featureType` field).
 */
export enum LegendFeatureType {
    Point = 'point',
    Line = 'line',
    Polygon = 'polygon',
}

export const LEGEND_FEATURE_TYPES: ReadonlySet<string> = new Set<string>(
    Object.values(LegendFeatureType),
);
