import { RoutesParams } from '../../api/params/routesParams';
import type { OnlineMiniMap } from '../abstract/onlineMiniMap';
import {
    CenteredRegionMiniMap,
    registerCenteredRegionMiniMapParser,
} from '../abstract/centeredRegionMiniMap';
import { OfflineCenteredRegionMiniMap } from './offlineCenteredRegionMiniMap';
import { MiniMap } from '../abstract/miniMap';

export class OnlineCenteredRegionMiniMap extends CenteredRegionMiniMap implements OnlineMiniMap {
    readonly fetchType = 'online' as const;
    routesParams: RoutesParams;
    routeCount: number;
    totalBytes: number;

    constructor(
        routesParams: RoutesParams,
        centeredRouteId: string,
        title: string,
        routeCount: number,
        totalBytes: number,
    ) {
        super(centeredRouteId, title);
        this.routesParams = routesParams;
        this.routeCount = routeCount;
        this.totalBytes = totalBytes;
    }

    toOffline(downloadedGeojson: string): OfflineCenteredRegionMiniMap {
        return new OfflineCenteredRegionMiniMap(downloadedGeojson, this.centeredRouteId, this.title);
    }

    static fromResult(result: unknown): OnlineCenteredRegionMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('OnlineCenteredRegionMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        CenteredRegionMiniMap.validateCommonFields(r, 'online', 'OnlineCenteredRegionMiniMap');
        r.routesParams = CenteredRegionMiniMap.parseRoutesParams(r, 'OnlineCenteredRegionMiniMap');
        r.routeCount =
            r.routeCount === undefined
                ? 0
                : MiniMap.assertNonNegativeInteger(
                      r.routeCount,
                      'OnlineCenteredRegionMiniMap.routeCount',
                  );
        r.totalBytes =
            r.totalBytes === undefined
                ? 0
                : MiniMap.assertNonNegativeInteger(
                      r.totalBytes,
                      'OnlineCenteredRegionMiniMap.totalBytes',
                  );
        Object.setPrototypeOf(r, OnlineCenteredRegionMiniMap.prototype);
        return r as unknown as OnlineCenteredRegionMiniMap;
    }
}

registerCenteredRegionMiniMapParser('online', (res) => OnlineCenteredRegionMiniMap.fromResult(res));
