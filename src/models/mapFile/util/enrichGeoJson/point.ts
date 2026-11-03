import type { Feature, GeoJsonProperties, MultiPoint, Point } from 'geojson';
import { PointLegendItem } from '../../../minimap/legend/concrete/pointLegendItem';
import { featureLabel, markerIconFromProps, withLegendId } from './legendProperties';
import { passThrough, type EnrichContext, type EnrichedFeature } from './types';

function hasFiniteLonLat(coordinates: number[]): boolean {
    return Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1]);
}

function enrichPointPart(props: GeoJsonProperties, point: Point, context: EnrichContext): EnrichedFeature {
    const id = context.assignId(props, point);
    const [lon, lat] = point.coordinates as [number, number];
    return {
        feature: { type: 'Feature', properties: withLegendId(props, id), geometry: point },
        legendItem: new PointLegendItem(
            id,
            featureLabel(props, `Point ${context.featureIndex + 1}`),
            { lat, lon },
            markerIconFromProps(props),
        ),
    };
}

/** A point legend item; points with non-finite coordinates pass through unchanged. */
export function enrichPoint(feature: Feature, point: Point, context: EnrichContext): EnrichedFeature[] {
    if (!hasFiniteLonLat(point.coordinates)) return [passThrough(feature)];
    return [enrichPointPart(feature.properties, point, context)];
}

/** One point legend item per valid position (altitude dropped); invalid positions are skipped. */
export function enrichMultiPoint(
    feature: Feature,
    multiPoint: MultiPoint,
    context: EnrichContext,
): EnrichedFeature[] {
    return multiPoint.coordinates
        .filter(hasFiniteLonLat)
        .map((position) =>
            enrichPointPart(
                feature.properties,
                { type: 'Point', coordinates: [position[0]!, position[1]!] },
                context,
            ),
        );
}
