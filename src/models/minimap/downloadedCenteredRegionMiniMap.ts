import { MiniMap } from './miniMap';
import { MiniMapType } from './miniMapType';

/** UUID v4 (same rule as {@link CenteredRegionMiniMap}). */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Client-persisted centered-region minimap: merged routes GeoJSON on disk (`file://` or absolute path).
 */
export class DownloadedCenteredRegionMiniMap extends MiniMap {
    readonly miniMapType = MiniMapType.DownloadedCenteredGeojson;
    downloadedGeojson: string;
    centeredRouteId: string;

    constructor(downloadedGeojson: string, centeredRouteId: string, title: string) {
        super(title);
        this.downloadedGeojson = downloadedGeojson;
        this.centeredRouteId = centeredRouteId;
    }

    toPlain(): Record<string, unknown> {
        return {
            miniMapType: this.miniMapType,
            downloadedGeojson: this.downloadedGeojson,
            centeredRouteId: this.centeredRouteId,
            title: this.title,
        };
    }

    static fromResult(result: unknown): DownloadedCenteredRegionMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('DownloadedCenteredRegionMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.miniMapType !== MiniMapType.DownloadedCenteredGeojson) {
            throw new Error(
                `DownloadedCenteredRegionMiniMap.miniMapType must be "${MiniMapType.DownloadedCenteredGeojson}", got: ${JSON.stringify(r.miniMapType)}`,
            );
        }
        const title = MiniMap.assertNonEmptyTitle(r.title, 'DownloadedCenteredRegionMiniMap.title');
        const path = r.downloadedGeojson;
        if (typeof path !== 'string' || path.length === 0) {
            throw new Error(
                `DownloadedCenteredRegionMiniMap.downloadedGeojson must be a non-empty string, got: ${typeof path}`,
            );
        }
        const rid = r.centeredRouteId;
        if (typeof rid !== 'string' || !UUID_REGEX.test(rid)) {
            throw new Error(
                `DownloadedCenteredRegionMiniMap.centeredRouteId must be a UUID string, got: ${JSON.stringify(rid)}`,
            );
        }
        return new DownloadedCenteredRegionMiniMap(path, rid, title);
    }
}
