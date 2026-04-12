import { RoutesParams } from '../api/params/routesParams';
import { MiniMap } from './miniMap';
import { MiniMapType } from './miniMapType';

/** UUID v4 (same rule as {@link RoutesParams} region id). */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Page fallback minimap: centered route GeoJSON via getRoutes using {@link RoutesParams} (region scope).
 */
export class CenteredRegionMiniMap extends MiniMap {
    readonly miniMapType = MiniMapType.CenteredGeojson;
    routesParams: RoutesParams;
    centeredRouteId: string;

    constructor(routesParams: RoutesParams, centeredRouteId: string, title: string) {
        super(title);
        this.routesParams = routesParams;
        this.centeredRouteId = centeredRouteId;
    }

    static fromResult(result: unknown): CenteredRegionMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('CenteredRegionMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.miniMapType !== MiniMapType.CenteredGeojson) {
            throw new Error(
                `CenteredRegionMiniMap.miniMapType must be "${MiniMapType.CenteredGeojson}", got: ${JSON.stringify(r.miniMapType)}`,
            );
        }
        const title = MiniMap.assertNonEmptyTitle(r.title, 'CenteredRegionMiniMap.title');
        const rid = r.centeredRouteId;
        if (typeof rid !== 'string' || !UUID_REGEX.test(rid)) {
            throw new Error(
                `CenteredRegionMiniMap.centeredRouteId must be a UUID string, got: ${JSON.stringify(rid)}`,
            );
        }
        const rp = r.routesParams;
        if (rp == null || typeof rp !== 'object') {
            throw new Error(
                `CenteredRegionMiniMap.routesParams must be an object, got: ${typeof rp}`,
            );
        }
        const routesParams = RoutesParams.fromResult(rp, true);
        return new CenteredRegionMiniMap(routesParams, rid, title);
    }
}
