import {
    CenteredRegionMiniMap,
    registerCenteredRegionMiniMapParser,
} from './centeredRegionMiniMap';
import { MiniMapType } from './miniMapType';

/** UUID v4 (same rule as {@link CenteredRegionMiniMap}). */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class OfflineCenteredRegionMiniMap extends CenteredRegionMiniMap {
    readonly fetchType = 'offline' as const;
    readonly miniMapType = MiniMapType.OfflineCenteredGeojson;
    downloadedGeojson: string;

    constructor(downloadedGeojson: string, centeredRouteId: string, title: string) {
        super(centeredRouteId, title);
        this.downloadedGeojson = downloadedGeojson;
    }

    toPlain(): Record<string, unknown> {
        return {
            fetchType: this.fetchType,
            miniMapType: this.miniMapType,
            downloadedGeojson: this.downloadedGeojson,
            centeredRouteId: this.centeredRouteId,
            title: this.title,
        };
    }

    static fromResult(result: unknown): OfflineCenteredRegionMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('OfflineCenteredRegionMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        CenteredRegionMiniMap.validateCommonFields(
            r,
            MiniMapType.OfflineCenteredGeojson,
            'offline',
            'OfflineCenteredRegionMiniMap',
        );
        const path = r.downloadedGeojson;
        if (typeof path !== 'string' || path.length === 0) {
            throw new Error(
                `OfflineCenteredRegionMiniMap.downloadedGeojson must be a non-empty string, got: ${typeof path}`,
            );
        }
        const rid = r.centeredRouteId;
        if (typeof rid !== 'string' || !UUID_REGEX.test(rid)) {
            throw new Error(
                `OfflineCenteredRegionMiniMap.centeredRouteId must be a UUID string, got: ${JSON.stringify(rid)}`,
            );
        }
        Object.setPrototypeOf(r, OfflineCenteredRegionMiniMap.prototype);
        return r as unknown as OfflineCenteredRegionMiniMap;
    }
}

registerCenteredRegionMiniMapParser(MiniMapType.OfflineCenteredGeojson, (result) =>
    OfflineCenteredRegionMiniMap.fromResult(result),
);

