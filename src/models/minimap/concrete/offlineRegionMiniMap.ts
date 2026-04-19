import { Bounds } from '../bounds';
import { MiniMap } from '../abstract/miniMap';
import { MiniMapType } from '../abstract/miniMapType';
import type { OfflineMiniMap } from '../abstract/offlineMiniMap';
import { RegionMiniMap, registerRegionMiniMapParser } from '../abstract/regionMiniMap';

/**
 * Offline region minimap: bundled routes GeoJSON on disk.
 */
export class OfflineRegionMiniMap extends RegionMiniMap implements OfflineMiniMap {
    readonly fetchType = 'offline' as const;
    downloadedGeojson: string;

    constructor(downloadedGeojson: string, bounds: Bounds | null, title: string) {
        super(bounds, title);
        this.downloadedGeojson = downloadedGeojson;
    }

    toPlain(): Record<string, unknown> {
        return {
            fetchType: this.fetchType,
            miniMapType: this.miniMapType,
            downloadedGeojson: this.downloadedGeojson,
            bounds:
                this.bounds == null
                    ? null
                    : {
                          north: this.bounds.north,
                          south: this.bounds.south,
                          east: this.bounds.east,
                          west: this.bounds.west,
                      },
            title: this.title,
        };
    }

    static fromResult(result: unknown): OfflineRegionMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('OfflineRegionMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.miniMapType !== MiniMapType.Region) {
            throw new Error(
                `OfflineRegionMiniMap.miniMapType must be "${MiniMapType.Region}", got: ${JSON.stringify(r.miniMapType)}`,
            );
        }
        if (r.fetchType !== 'offline') {
            throw new Error(
                `OfflineRegionMiniMap.fetchType must be "offline", got: ${JSON.stringify(r.fetchType)}`,
            );
        }
        if (!('bounds' in r)) {
            throw new Error('OfflineRegionMiniMap.bounds must be present (Bounds object or null)');
        }
        const b = r.bounds;
        const bounds = b === null ? null : Bounds.fromResult(b);
        const title = MiniMap.assertNonEmptyTitle(r.title, 'OfflineRegionMiniMap.title');
        const path = r.downloadedGeojson;
        if (typeof path !== 'string' || path.length === 0) {
            throw new Error(
                `OfflineRegionMiniMap.downloadedGeojson must be a non-empty string, got: ${typeof path}`,
            );
        }
        return new OfflineRegionMiniMap(path, bounds, title);
    }
}

registerRegionMiniMapParser('offline', (res) => OfflineRegionMiniMap.fromResult(res));
