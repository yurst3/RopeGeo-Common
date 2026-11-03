import type { FeatureCollection } from 'geojson';
import type { MapFileExportFormat } from '../formats';
import { toGpx } from './toGpx';
import { toKml } from './toKml';

export type ExportMapFileOptions = {
    /** Document title written into GPX metadata / the KML Document name. */
    documentName?: string;
};

/**
 * Writes a FeatureCollection as a GPX, KML, or GeoJSON file. Features use simplestyle properties
 * (`name`, `stroke`, `stroke-width`, `fill`, …) for styling and `ropegeo:*` properties for values
 * only RopeGeo reads back.
 */
export function exportMapFile(
    collection: FeatureCollection,
    format: MapFileExportFormat,
    options: ExportMapFileOptions = {},
): string {
    switch (format) {
        case 'gpx':
            return toGpx(collection, options);
        case 'kml':
            return toKml(collection, options);
        case 'geojson':
            return `${JSON.stringify(collection, null, 2)}\n`;
    }
}
