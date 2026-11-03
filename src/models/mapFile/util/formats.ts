export const MAP_FILE_IMPORT_FORMATS = ['gpx', 'kml', 'kmz', 'geojson'] as const;
/** Map file formats that can be imported. */
export type MapFileImportFormat = (typeof MAP_FILE_IMPORT_FORMATS)[number];

export const MAP_FILE_EXPORT_FORMATS = ['gpx', 'kml', 'geojson'] as const;
/** Map file formats that can be exported. */
export type MapFileExportFormat = (typeof MAP_FILE_EXPORT_FORMATS)[number];

/** File extension (without the dot) written for each format. */
export const MAP_FILE_EXTENSIONS: Record<MapFileImportFormat, string> = {
    gpx: 'gpx',
    kml: 'kml',
    kmz: 'kmz',
    geojson: 'geojson',
};

export const MAP_FILE_MIME_TYPES: Record<MapFileImportFormat, string> = {
    gpx: 'application/gpx+xml',
    kml: 'application/vnd.google-earth.kml+xml',
    kmz: 'application/vnd.google-earth.kmz',
    geojson: 'application/geo+json',
};

/** Import format for a file name or URL by its extension (`.json` counts as GeoJSON), else null. */
export function mapFileFormatFromFileName(fileName: string): MapFileImportFormat | null {
    const path = fileName.split(/[?#]/)[0] ?? '';
    const dot = path.lastIndexOf('.');
    if (dot < 0) return null;
    const extension = path.slice(dot + 1).toLowerCase();
    if (extension === 'json') return 'geojson';
    return (MAP_FILE_IMPORT_FORMATS as readonly string[]).includes(extension)
        ? (extension as MapFileImportFormat)
        : null;
}
