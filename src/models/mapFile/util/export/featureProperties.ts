import type { GeoJsonProperties } from 'geojson';
import { ROPEGEO_PROPERTY_PREFIX, STYLE_PROPERTY } from '../properties';

export function propsObject(props: GeoJsonProperties): Record<string, unknown> {
    return props != null && typeof props === 'object' && !Array.isArray(props)
        ? (props as Record<string, unknown>)
        : {};
}

export function stringProp(props: Record<string, unknown>, key: string): string | undefined {
    const value = props[key];
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return undefined;
}

export function numberProp(props: Record<string, unknown>, key: string): number | undefined {
    const value = props[key];
    const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    return Number.isFinite(parsed) ? parsed : undefined;
}

export function featureName(props: Record<string, unknown>): string | undefined {
    return stringProp(props, STYLE_PROPERTY.name) ?? stringProp(props, 'title');
}

export function featureDescription(props: Record<string, unknown>): string | undefined {
    return stringProp(props, STYLE_PROPERTY.description) ?? stringProp(props, 'desc');
}

/** `ropegeo:*` values, keyed without the prefix (e.g. `color`). */
export function ropeGeoValues(props: Record<string, unknown>): [string, string][] {
    const out: [string, string][] = [];
    for (const [key, value] of Object.entries(props)) {
        if (!key.startsWith(ROPEGEO_PROPERTY_PREFIX)) continue;
        if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;
        out.push([key.slice(ROPEGEO_PROPERTY_PREFIX.length), String(value)]);
    }
    return out;
}
