/**
 * Canonical relative paths inside an offline page bundle (ZIP or on-disk folder).
 * Backend zipper and client legacy download both use these paths under the page root.
 */

export function imageFileRelativePath(
    imageId: string,
    slot: string,
    ext: string,
): string {
    const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
    return `images/${imageId}-${slot}${normalizedExt}`;
}

export function mapDataTilesDirectoryRelative(mapDataId: string): string {
    return `mapdata/tiles/${mapDataId}`;
}

export function tileFileRelativePath(
    mapDataId: string,
    z: number,
    x: number,
    y: number,
): string {
    return `${mapDataTilesDirectoryRelative(mapDataId)}/${z}/${x}/${y}.pbf`;
}

/** Template for Mapbox local tile URLs (`{z}`, `{x}`, `{y}` placeholders). */
export function offlineTilesTemplateRelative(mapDataId: string): string {
    return `${mapDataTilesDirectoryRelative(mapDataId)}/{z}/{x}/{y}.pbf`;
}

export function regionRoutesGeojsonRelativePath(regionId: string): string {
    return `regions/${regionId}/routes.geojson`;
}

export function joinPageRootUri(pageRootUri: string, relativePath: string): string {
    const root = pageRootUri.endsWith('/') ? pageRootUri : `${pageRootUri}/`;
    const rel = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    return `${root}${rel}`;
}
