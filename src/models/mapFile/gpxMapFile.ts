import type { FeatureCollection } from 'geojson';
import { gpx } from '@tmcw/togeojson';
import { ROPEGEO_PROPERTY_PREFIX } from './util/properties';
import { GeoJsonMapFile } from './geoJsonMapFile';
import { MapFile, registerMapFileFactory } from './mapFile';
import { fileNameWithExtension, mapFileContentToText, type MapFileContent } from './mapFileContent';
import { parseXmlDocument } from './util/xmlDocument';

/**
 * togeojson copies GPX extension elements from namespaces declared on `<gpx>` into properties
 * named `prefix_name`. Restores RopeGeo's own values to their `ropegeo:` keys.
 */
function restoreRopeGeoProperties(collection: FeatureCollection): FeatureCollection {
    const gpxPrefix = ROPEGEO_PROPERTY_PREFIX.replace(':', '_');
    for (const feature of collection.features) {
        const props = feature.properties;
        if (props == null) continue;
        for (const key of Object.keys(props)) {
            if (!key.startsWith(gpxPrefix)) continue;
            const restored = ROPEGEO_PROPERTY_PREFIX + key.slice(gpxPrefix.length);
            if (!(restored in props)) props[restored] = props[key];
            delete props[key];
        }
    }
    return collection;
}

/** A GPX 1.0/1.1 file: tracks and routes become lines, waypoints become points. */
export class GPXMapFile extends MapFile {
    readonly format = 'gpx' as const;
    readonly text: string;

    constructor(fileName: string, content: MapFileContent) {
        super(fileName);
        this.text = mapFileContentToText(content);
    }

    toGeoJson(): GeoJsonMapFile {
        const document = parseXmlDocument(this.format, this.text, 'gpx');
        return new GeoJsonMapFile(
            fileNameWithExtension(this.fileName, 'geojson'),
            restoreRopeGeoProperties(gpx(document) as FeatureCollection),
        );
    }
}

registerMapFileFactory('gpx', (fileName, content) => new GPXMapFile(fileName, content));
