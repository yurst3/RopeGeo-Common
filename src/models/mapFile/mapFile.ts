import { mapFileFormatFromFileName, type MapFileImportFormat } from './util/formats';
import { fileNameFromPath, type MapFileContent } from './mapFileContent';
import { MapFileParseError } from './mapFileParseError';
import type { GeoJsonMapFile } from './geoJsonMapFile';

/** Reads a file's bytes, e.g. with Node's `fs` or Expo's file system. */
export type MapFileReader = (filePath: string) => Promise<Uint8Array>;

type MapFileFactory = (fileName: string, content: MapFileContent) => MapFile;

const mapFileFactories = new Map<MapFileImportFormat, MapFileFactory>();

/** Called by each concrete map file module so {@link MapFile.fromContent} can construct it. */
export function registerMapFileFactory(format: MapFileImportFormat, factory: MapFileFactory): void {
    mapFileFactories.set(format, factory);
}

type NodeFsPromises = { readFile: (path: string) => Promise<Uint8Array> };
type NodeProcess = { getBuiltinModule?: (id: string) => unknown };

/**
 * Node's `fs` through `process.getBuiltinModule` (Node 20.16+/22.3+), so bundlers such as Metro
 * never see a `require('fs')`. Elsewhere (React Native) a reader must be passed in.
 */
function defaultMapFileReader(): MapFileReader {
    const nodeProcess = (globalThis as { process?: NodeProcess }).process;
    const fs = nodeProcess?.getBuiltinModule?.('fs/promises') as NodeFsPromises | undefined;
    if (fs == null) {
        return async () => {
            throw new Error('No default file reader on this platform; pass one to MapFile.readFile');
        };
    }
    return async (filePath) => new Uint8Array(await fs.readFile(filePath));
}

/**
 * A map file in one of the importable formats. Read one with {@link MapFile.readFile} (or
 * {@link MapFile.fromContent} when the contents are already loaded), then call `toGeoJson()` to
 * convert it and `enrich()` to assign legend ids.
 */
export abstract class MapFile {
    abstract readonly format: MapFileImportFormat;
    /** File name, without directories. */
    readonly fileName: string;

    protected constructor(fileName: string) {
        this.fileName = fileName;
    }

    /** This file as GeoJSON. Throws {@link MapFileParseError} when the contents are invalid. */
    abstract toGeoJson(): GeoJsonMapFile;

    /**
     * The concrete map file for already-loaded contents. The format comes from the file name's
     * extension unless given.
     */
    static fromContent(
        fileName: string,
        content: MapFileContent,
        format: MapFileImportFormat | null = mapFileFormatFromFileName(fileName),
    ): MapFile {
        if (format == null) {
            throw new Error(`Unsupported map file type: ${fileName}`);
        }
        const factory = mapFileFactories.get(format);
        if (factory == null) {
            throw new MapFileParseError(format, 'no map file class registered for this format');
        }
        return factory(fileNameFromPath(fileName), content);
    }

    /**
     * Reads the file at `filePath` and returns its concrete map file (GPX, KML, KMZ, or GeoJSON),
     * chosen by extension. Uses Node's file system unless a `reader` is given.
     */
    static async readFile(filePath: string, reader: MapFileReader = defaultMapFileReader()): Promise<MapFile> {
        const format = mapFileFormatFromFileName(filePath);
        if (format == null) {
            throw new Error(`Unsupported map file type: ${filePath}`);
        }
        return MapFile.fromContent(filePath, await reader(filePath), format);
    }
}
