import type { Feature, GeoJsonProperties, MultiPolygon, Polygon } from 'geojson';
import { PolygonLegendItem } from '../../../minimap/legend/concrete/polygonLegendItem';
import { getBoundsFromGeometry } from '../bounds';
import {
    borderColorFromProps,
    featureLabel,
    fillColorFromProps,
    withLegendId,
} from './legendProperties';
import { passThrough, type EnrichContext, type EnrichedFeature } from './types';

function enrichPolygonPart(
    props: GeoJsonProperties,
    polygon: Polygon,
    fallbackName: string,
    context: EnrichContext,
): EnrichedFeature | null {
    const bounds = getBoundsFromGeometry(polygon);
    if (bounds == null) return null;
    const id = context.assignId(props, polygon);
    return {
        feature: { type: 'Feature', properties: withLegendId(props, id), geometry: polygon },
        legendItem: new PolygonLegendItem(
            id,
            featureLabel(props, fallbackName),
            bounds,
            borderColorFromProps(props),
            fillColorFromProps(props),
        ),
    };
}

/** A polygon ("Area") legend item; polygons without any coordinates pass through unchanged. */
export function enrichPolygon(feature: Feature, polygon: Polygon, context: EnrichContext): EnrichedFeature[] {
    const enriched = enrichPolygonPart(feature.properties, polygon, `Area ${context.featureIndex + 1}`, context);
    return [enriched ?? passThrough(feature)];
}

/** One polygon legend item per part, named "Area N (part)"; empty parts are skipped. */
export function enrichMultiPolygon(
    feature: Feature,
    multiPolygon: MultiPolygon,
    context: EnrichContext,
): EnrichedFeature[] {
    const out: EnrichedFeature[] = [];
    for (const coordinates of multiPolygon.coordinates) {
        const enriched = enrichPolygonPart(
            feature.properties,
            { type: 'Polygon', coordinates },
            `Area ${context.featureIndex + 1} (${out.length + 1})`,
            context,
        );
        if (enriched != null) out.push(enriched);
    }
    return out;
}
