import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { getBoundsFromGeoJson } from './util/bounds';
import type { Bounds } from '../minimap/bounds';
import type { EnrichedGeoJsonMapFile } from './enrichedGeoJsonMapFile';
import { MapFile, registerMapFileFactory } from './mapFile';
import { mapFileContentToText, type MapFileContent } from './mapFileContent';
import { MapFileParseError } from './mapFileParseError';

const GEOMETRY_TYPES = new Set([
    'Point',
    'MultiPoint',
    'LineString',
    'MultiLineString',
    'Polygon',
    'MultiPolygon',
    'GeometryCollection',
]);

function asFeature(value: unknown): Feature | null {
    if (value == null || typeof value !== 'object') return null;
    const o = value as Record<string, unknown>;
    if (o.type === 'Feature') {
        const geometry = o.geometry as Geometry | null | undefined;
        if (geometry != null && !GEOMETRY_TYPES.has(geometry.type)) return null;
        return {
            type: 'Feature',
            ...(o.id != null ? { id: o.id as string | number } : null),
            properties: (o.properties as Feature['properties']) ?? {},
            geometry: geometry ?? null,
        } as Feature;
    }
    if (typeof o.type === 'string' && GEOMETRY_TYPES.has(o.type)) {
        return { type: 'Feature', properties: {}, geometry: value as Geometry };
    }
    return null;
}

/**
 * A GeoJSON map file, either read directly or converted from GPX/KML/KMZ. Styles are simplestyle
 * properties (`stroke`, `stroke-width`, `fill`, …) and RopeGeo values use `ropegeo:` keys.
 */
export class GeoJsonMapFile extends MapFile {
    readonly format = 'geojson' as const;
    readonly geoJson: FeatureCollection;

    constructor(fileName: string, geoJson: FeatureCollection) {
        super(fileName);
        this.geoJson = geoJson;
    }

    /**
     * Parses GeoJSON text or bytes. Accepts a FeatureCollection, a single Feature, or a bare
     * Geometry; malformed features in a collection are dropped.
     */
    static parse(fileName: string, content: MapFileContent): GeoJsonMapFile {
        let parsed: unknown;
        try {
            parsed = JSON.parse(mapFileContentToText(content));
        } catch (error) {
            throw new MapFileParseError('geojson', error instanceof Error ? error.message : String(error));
        }
        if (
            parsed != null &&
            typeof parsed === 'object' &&
            (parsed as { type?: unknown }).type === 'FeatureCollection'
        ) {
            const features = (parsed as { features?: unknown }).features;
            if (!Array.isArray(features)) {
                throw new MapFileParseError('geojson', 'FeatureCollection has no features array');
            }
            return new GeoJsonMapFile(fileName, {
                type: 'FeatureCollection',
                features: features.map(asFeature).filter((f): f is Feature => f != null),
            });
        }
        const feature = asFeature(parsed);
        if (feature == null) {
            throw new MapFileParseError('geojson', 'expected a FeatureCollection, Feature, or Geometry');
        }
        return new GeoJsonMapFile(fileName, { type: 'FeatureCollection', features: [feature] });
    }

    get bounds(): Bounds | null {
        return getBoundsFromGeoJson(this.geoJson);
    }

    toGeoJson(): GeoJsonMapFile {
        return this;
    }

    /**
     * This file with legend ids assigned, hashed with its {@link fileName}; see
     * {@link EnrichedGeoJsonMapFile}.
     */
    enrich(): EnrichedGeoJsonMapFile {
        if (enrichedFactory == null) {
            throw new Error('EnrichedGeoJsonMapFile is not loaded; import it from ropegeo-common/models');
        }
        return enrichedFactory(this.fileName, this.geoJson);
    }
}

type EnrichedGeoJsonMapFileFactory = (fileName: string, source: FeatureCollection) => EnrichedGeoJsonMapFile;

let enrichedFactory: EnrichedGeoJsonMapFileFactory | null = null;

/**
 * Called by the EnrichedGeoJsonMapFile module. That subclass extends {@link GeoJsonMapFile}, so
 * importing it here would form a CommonJS import cycle; it registers itself instead.
 */
export function registerEnrichedGeoJsonMapFileFactory(factory: EnrichedGeoJsonMapFileFactory): void {
    enrichedFactory = factory;
}

registerMapFileFactory('geojson', (fileName, content) => GeoJsonMapFile.parse(fileName, content));
