import type { MapFileImportFormat } from './util/formats';

/** Thrown when a map file can't be read as its format. */
export class MapFileParseError extends Error {
    readonly format: MapFileImportFormat;

    constructor(format: MapFileImportFormat, message: string) {
        super(`Couldn't read ${format.toUpperCase()} file: ${message}`);
        this.name = 'MapFileParseError';
        this.format = format;
    }
}
