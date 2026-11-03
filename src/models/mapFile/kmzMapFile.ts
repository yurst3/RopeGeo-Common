import { unzipSync } from 'fflate';
import type { GeoJsonMapFile } from './geoJsonMapFile';
import { KMLMapFile } from './kmlMapFile';
import { MapFile, registerMapFileFactory } from './mapFile';
import { fileNameWithExtension, type MapFileContent } from './mapFileContent';
import { MapFileParseError } from './mapFileParseError';

/** A KMZ file: a zip archive whose main KML document is `doc.kml` (or else its first `.kml`). */
export class KMZMapFile extends MapFile {
    readonly format = 'kmz' as const;
    readonly bytes: Uint8Array;

    constructor(fileName: string, content: MapFileContent) {
        super(fileName);
        if (typeof content === 'string') {
            throw new MapFileParseError('kmz', 'KMZ files must be read as bytes');
        }
        this.bytes = content;
    }

    /** The archive's main KML document. */
    toKml(): KMLMapFile {
        let entries: Record<string, Uint8Array>;
        try {
            entries = unzipSync(this.bytes);
        } catch (error) {
            throw new MapFileParseError(this.format, error instanceof Error ? error.message : String(error));
        }
        const names = Object.keys(entries);
        const docName =
            names.find((name) => name.toLowerCase() === 'doc.kml') ??
            names.filter((name) => name.toLowerCase().endsWith('.kml')).sort()[0];
        if (docName == null) {
            throw new MapFileParseError(this.format, 'archive contains no .kml file');
        }
        return new KMLMapFile(fileNameWithExtension(this.fileName, 'kml'), entries[docName]!);
    }

    toGeoJson(): GeoJsonMapFile {
        return this.toKml().toGeoJson();
    }
}

registerMapFileFactory('kmz', (fileName, content) => new KMZMapFile(fileName, content));
