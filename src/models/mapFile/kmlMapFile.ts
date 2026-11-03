import type { FeatureCollection } from 'geojson';
import { kml } from '@tmcw/togeojson';
import { GeoJsonMapFile } from './geoJsonMapFile';
import { MapFile, registerMapFileFactory } from './mapFile';
import { fileNameWithExtension, mapFileContentToText, type MapFileContent } from './mapFileContent';
import { parseXmlDocument } from './util/xmlDocument';

/** A KML file: placemarks become features, with styles and ExtendedData as properties. */
export class KMLMapFile extends MapFile {
    readonly format = 'kml' as const;
    readonly text: string;

    constructor(fileName: string, content: MapFileContent) {
        super(fileName);
        this.text = mapFileContentToText(content);
    }

    toGeoJson(): GeoJsonMapFile {
        const document = parseXmlDocument(this.format, this.text, 'kml');
        return new GeoJsonMapFile(
            fileNameWithExtension(this.fileName, 'geojson'),
            kml(document) as FeatureCollection,
        );
    }
}

registerMapFileFactory('kml', (fileName, content) => new KMLMapFile(fileName, content));
