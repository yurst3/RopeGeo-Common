import type { GeoJsonProperties } from 'geojson';
import { LEGEND_ID_PROPERTY } from '../properties';

/** First non-blank string among `keys`, trimmed. */
export function readStringProp(props: GeoJsonProperties, keys: string[]): string | undefined {
    if (props == null || typeof props !== 'object' || Array.isArray(props)) {
        return undefined;
    }
    const o = props as Record<string, unknown>;
    for (const key of keys) {
        const v = o[key];
        if (typeof v === 'string') {
            const t = v.trim();
            if (t.length > 0) return t;
        }
    }
    return undefined;
}

/** Legend name: the feature's name, title, or description, else `fallback`. */
export function featureLabel(props: GeoJsonProperties, fallback: string): string {
    return (
        readStringProp(props, ['name', 'Name', 'title', 'Title', 'description', 'Description']) ??
        fallback
    );
}

export function strokeColorFromProps(props: GeoJsonProperties): string | undefined {
    return readStringProp(props, ['stroke', 'strokeColor', 'stroke-color', 'color', 'line-color', 'lineColor']);
}

export function strokeWidthFromProps(props: GeoJsonProperties): string | undefined {
    return readStringProp(props, ['stroke-width', 'strokeWidth', 'weight']);
}

export function borderColorFromProps(props: GeoJsonProperties): string | undefined {
    return readStringProp(props, ['stroke', 'strokeColor', 'stroke-color', 'borderColor', 'border-color']);
}

export function fillColorFromProps(props: GeoJsonProperties): string | undefined {
    return readStringProp(props, ['fill', 'fillColor', 'fill-color', 'color']);
}

export function markerIconFromProps(props: GeoJsonProperties): string | undefined {
    return readStringProp(props, ['icon', 'marker-symbol', 'markerSymbol']);
}

/** Copy of `props` with {@link LEGEND_ID_PROPERTY} set to `legendId`. */
export function withLegendId(props: GeoJsonProperties, legendId: string): GeoJsonProperties {
    const o =
        props != null && typeof props === 'object' && !Array.isArray(props)
            ? { ...(props as Record<string, unknown>) }
            : {};
    o[LEGEND_ID_PROPERTY] = legendId;
    return o as GeoJsonProperties;
}
