import { joinPageRootUri } from './offlinePageBundlePaths';

const PATH_LIKE_KEYS = new Set([
    'downloadedPreviewPath',
    'downloadedBannerPath',
    'downloadedFullPath',
    'offlineTilesTemplate',
    'downloadedGeojson',
]);

function isRelativeBundlePath(value: string): boolean {
    if (value.length === 0) {
        return false;
    }
    if (value.startsWith('file://')) {
        return false;
    }
    if (value.startsWith('http://') || value.startsWith('https://')) {
        return false;
    }
    return !value.includes('://');
}

function hydratePathValue(pageRootUri: string, value: unknown): unknown {
    if (typeof value !== 'string' || !isRelativeBundlePath(value)) {
        return value;
    }
    return joinPageRootUri(pageRootUri, value);
}

/** Rewrites relative bundle paths in offline page wire JSON to absolute URIs under `pageRootUri`. */
export function hydrateOfflinePageWirePaths(
    pageRootUri: string,
    node: Record<string, unknown>,
): void {
    for (const [key, value] of Object.entries(node)) {
        if (PATH_LIKE_KEYS.has(key)) {
            node[key] = hydratePathValue(pageRootUri, value);
            continue;
        }
        if (value != null && typeof value === 'object' && !Array.isArray(value)) {
            hydrateOfflinePageWirePaths(pageRootUri, value as Record<string, unknown>);
        }
        if (Array.isArray(value)) {
            for (const item of value) {
                if (item != null && typeof item === 'object') {
                    hydrateOfflinePageWirePaths(pageRootUri, item as Record<string, unknown>);
                }
            }
        }
    }
}
