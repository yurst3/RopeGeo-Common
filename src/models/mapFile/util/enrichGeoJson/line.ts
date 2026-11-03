import type { Feature, GeoJsonProperties, LineString, MultiLineString } from 'geojson';
import { LineLegendItem } from '../../../minimap/legend/concrete/lineLegendItem';
import { getBoundsFromGeometry } from '../bounds';
import {
    featureLabel,
    strokeColorFromProps,
    strokeWidthFromProps,
    withLegendId,
} from './legendProperties';
import { passThrough, type EnrichContext, type EnrichedFeature } from './types';

function enrichLinePart(
    props: GeoJsonProperties,
    line: LineString,
    fallbackName: string,
    context: EnrichContext,
): EnrichedFeature | null {
    const bounds = getBoundsFromGeometry(line);
    if (bounds == null) return null;
    const id = context.assignId(props, line);
    return {
        feature: { type: 'Feature', properties: withLegendId(props, id), geometry: line },
        legendItem: new LineLegendItem(
            id,
            featureLabel(props, fallbackName),
            bounds,
            strokeColorFromProps(props),
            strokeWidthFromProps(props),
        ),
    };
}

/** A line legend item; lines without any coordinates pass through unchanged. */
export function enrichLineString(feature: Feature, line: LineString, context: EnrichContext): EnrichedFeature[] {
    const enriched = enrichLinePart(feature.properties, line, `Line ${context.featureIndex + 1}`, context);
    return [enriched ?? passThrough(feature)];
}

/** One line legend item per part, named "Line N (part)"; empty parts are skipped. */
export function enrichMultiLineString(
    feature: Feature,
    multiLine: MultiLineString,
    context: EnrichContext,
): EnrichedFeature[] {
    const out: EnrichedFeature[] = [];
    for (const coordinates of multiLine.coordinates) {
        const enriched = enrichLinePart(
            feature.properties,
            { type: 'LineString', coordinates },
            `Line ${context.featureIndex + 1} (${out.length + 1})`,
            context,
        );
        if (enriched != null) out.push(enriched);
    }
    return out;
}
