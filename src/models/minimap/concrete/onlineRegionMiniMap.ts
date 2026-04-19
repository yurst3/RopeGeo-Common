import { RoutesParams } from '../../api/params/routesParams';
import { Bounds } from '../bounds';
import { MiniMap } from '../abstract/miniMap';
import { MiniMapType } from '../abstract/miniMapType';
import type { OnlineMiniMap } from '../abstract/onlineMiniMap';
import { RegionMiniMap, registerRegionMiniMapParser } from '../abstract/regionMiniMap';

/**
 * API region minimap: loads route GeoJSON via getRoutes using {@link RoutesParams}.
 */
export class OnlineRegionMiniMap extends RegionMiniMap implements OnlineMiniMap {
    readonly fetchType = 'online' as const;
    routesParams: RoutesParams;

    constructor(routesParams: RoutesParams, bounds: Bounds | null, title: string) {
        super(bounds, title);
        this.routesParams = routesParams;
    }

    static fromResult(result: unknown): OnlineRegionMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('OnlineRegionMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.miniMapType !== MiniMapType.Region) {
            throw new Error(
                `OnlineRegionMiniMap.miniMapType must be "${MiniMapType.Region}", got: ${JSON.stringify(r.miniMapType)}`,
            );
        }
        if (r.fetchType !== 'online') {
            throw new Error(
                `OnlineRegionMiniMap.fetchType must be "online", got: ${JSON.stringify(r.fetchType)}`,
            );
        }
        if (!('bounds' in r)) {
            throw new Error('OnlineRegionMiniMap.bounds must be present (Bounds object or null)');
        }
        const b = r.bounds;
        const bounds = b === null ? null : Bounds.fromResult(b);
        const title = MiniMap.assertNonEmptyTitle(r.title, 'OnlineRegionMiniMap.title');
        const rp = r.routesParams;
        if (rp == null || typeof rp !== 'object') {
            throw new Error(
                `OnlineRegionMiniMap.routesParams must be an object, got: ${typeof rp}`,
            );
        }
        const routesParams = RoutesParams.fromResult(rp, true);
        return new OnlineRegionMiniMap(routesParams, bounds, title);
    }
}

registerRegionMiniMapParser('online', (res) => OnlineRegionMiniMap.fromResult(res));
