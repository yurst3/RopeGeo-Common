import type { Feature } from 'geojson';
import { enrichLineString, enrichMultiLineString } from './line';
import { enrichMultiPoint, enrichPoint } from './point';
import { enrichMultiPolygon, enrichPolygon } from './polygon';
import { passThrough, type EnrichContext, type EnrichedFeature } from './types';

/**
 * Enriches one source feature: assigns legend ids and builds legend items, **exploding**
 * MultiPoint / MultiLineString / MultiPolygon into simple geometries so each legend item matches
 * one output feature. Features without geometry and GeometryCollections pass through unchanged.
 */
export function enrichFeature(feature: Feature, context: EnrichContext): EnrichedFeature[] {
    const geometry = feature.geometry;
    if (geometry == null) return [passThrough(feature)];
    switch (geometry.type) {
        case 'Point':
            return enrichPoint(feature, geometry, context);
        case 'MultiPoint':
            return enrichMultiPoint(feature, geometry, context);
        case 'LineString':
            return enrichLineString(feature, geometry, context);
        case 'MultiLineString':
            return enrichMultiLineString(feature, geometry, context);
        case 'Polygon':
            return enrichPolygon(feature, geometry, context);
        case 'MultiPolygon':
            return enrichMultiPolygon(feature, geometry, context);
        default:
            return [passThrough(feature)];
    }
}
