import type { GeoJsonProperties, Geometry } from 'geojson';
import { sha1 } from '@noble/hashes/legacy';
import { utf8ToBytes } from '@noble/hashes/utils';
import { LEGEND_ID_PROPERTY } from '../properties';

/** UUID namespace for legend ids (UUID v5). Never change it: every stored legend id depends on it. */
export const ROPEGEO_LEGEND_ID_NAMESPACE = '3cc8c1f9-83f5-47b6-92ab-326a2e453944';

/** Coordinate precision used when hashing: lon/lat to ~1 cm, altitude to 1 cm. */
const LON_LAT_DECIMALS = 7;
const ALTITUDE_DECIMALS = 2;

function roundTo(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function isPosition(value: unknown[]): value is number[] {
    return value.length > 0 && value.every((entry) => typeof entry === 'number');
}

function canonicalCoordinates(value: unknown): unknown {
    if (!Array.isArray(value)) return value;
    if (isPosition(value)) {
        return value.map((n, i) => roundTo(n, i < 2 ? LON_LAT_DECIMALS : ALTITUDE_DECIMALS));
    }
    return value.map(canonicalCoordinates);
}

function canonicalGeometry(geometry: Geometry | null): unknown {
    if (geometry == null) return null;
    if (geometry.type === 'GeometryCollection') {
        return { type: geometry.type, geometries: geometry.geometries.map(canonicalGeometry) };
    }
    return { type: geometry.type, coordinates: canonicalCoordinates(geometry.coordinates) };
}

/** Deep copy with object keys sorted, so key order never changes the serialized form. */
function sortKeysDeep(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortKeysDeep);
    if (value != null && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(value as Record<string, unknown>).sort()) {
            out[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
        }
        return out;
    }
    return value;
}

/**
 * Stable string for one feature (or one part of an exploded multi-geometry): properties with
 * sorted keys, minus {@link LEGEND_ID_PROPERTY} so re-enriching keeps ids, plus the geometry with
 * coordinates rounded so float formatting differences between files don't change it.
 */
export function canonicalFeatureKey(properties: GeoJsonProperties, geometry: Geometry | null): string {
    const props: Record<string, unknown> =
        properties != null && typeof properties === 'object' && !Array.isArray(properties)
            ? { ...properties }
            : {};
    delete props[LEGEND_ID_PROPERTY];
    return JSON.stringify({ p: sortKeysDeep(props), g: canonicalGeometry(geometry) });
}

function uuidToBytes(uuid: string): Uint8Array {
    const hex = uuid.replace(/-/g, '');
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

function bytesToUuid(bytes: Uint8Array): string {
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/** RFC 4122 name-based UUID (version 5, SHA-1). */
export function uuidV5(namespace: string, name: string): string {
    const namespaceBytes = uuidToBytes(namespace);
    const nameBytes = utf8ToBytes(name);
    const input = new Uint8Array(namespaceBytes.length + nameBytes.length);
    input.set(namespaceBytes);
    input.set(nameBytes, namespaceBytes.length);
    const bytes = sha1(input).slice(0, 16);
    bytes[6] = (bytes[6]! & 0x0f) | 0x50;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    return bytesToUuid(bytes);
}

/**
 * Deterministic legend id for a canonical feature key within the map file named `fileName`. Ids
 * only need to be unique within one map file; including the file name keeps identical features in
 * differently named files apart without callers passing anything extra.
 */
export function legendIdFor(fileName: string, key: string): string {
    return uuidV5(ROPEGEO_LEGEND_ID_NAMESPACE, `${fileName}\n${key}`);
}

/** Assigns the legend id for one feature (or exploded part) of a file. */
export type LegendIdAssigner = (properties: GeoJsonProperties, geometry: Geometry | null) => string;

/**
 * Returns a function assigning deterministic ids within the map file named `fileName`. Repeats of
 * an identical feature get `#2`, `#3`, … appended to their key, so they stay distinct yet
 * reproducible (file order is stable).
 */
export function createLegendIdAssigner(fileName: string): LegendIdAssigner {
    const occurrences = new Map<string, number>();
    return (properties, geometry) => {
        const key = canonicalFeatureKey(properties, geometry);
        const count = (occurrences.get(key) ?? 0) + 1;
        occurrences.set(key, count);
        return legendIdFor(fileName, count === 1 ? key : `${key}#${count}`);
    };
}
