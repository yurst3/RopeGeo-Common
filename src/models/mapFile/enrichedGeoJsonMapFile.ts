import type { Feature, FeatureCollection } from 'geojson';
import { enrichFeature } from './util/enrichGeoJson/enrichFeature';
import { createLegendIdAssigner } from './util/enrichGeoJson/legendId';
import type { LegendItem } from '../minimap/legend/abstract/legendItem';
import { GeoJsonMapFile, registerEnrichedGeoJsonMapFileFactory } from './geoJsonMapFile';

/**
 * A GeoJSON map file whose features carry legend ids, with the legend items built from them.
 * Multi-part geometries are split so each legend item matches one feature, and ids are
 * deterministic (a UUID v5 of the file name plus each feature's properties and geometry), so
 * enriching the same file again gives the same ids. Ids are unique within the file; differently
 * named files never share them, while identical files with the same name do.
 */
export class EnrichedGeoJsonMapFile extends GeoJsonMapFile {
    /** Legend items keyed by legend id; each matches the `legendId` property of one feature. */
    readonly legend: Record<string, LegendItem>;

    constructor(fileName: string, source: FeatureCollection) {
        const assignId = createLegendIdAssigner(fileName);
        const features: Feature[] = [];
        const legend: Record<string, LegendItem> = {};
        (source.features ?? []).forEach((feature, featureIndex) => {
            // One source feature can produce several enriched features: MultiPoint, MultiLineString,
            // and MultiPolygon are split into one feature (and legend item) per part.
            const enrichedFeatures = enrichFeature(feature, { assignId, featureIndex });
            enrichedFeatures.forEach(({ feature, legendItem }) => {
                features.push(feature);
                if (legendItem != null) legend[legendItem.id] = legendItem;
            })
        });
        super(fileName, { type: 'FeatureCollection', features });
        this.legend = legend;
    }
}

registerEnrichedGeoJsonMapFileFactory((fileName, source) => new EnrichedGeoJsonMapFile(fileName, source));
