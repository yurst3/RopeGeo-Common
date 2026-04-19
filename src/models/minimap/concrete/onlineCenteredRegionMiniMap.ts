import { RoutesParams } from '../../api/params/routesParams';
import type { OnlineMiniMap } from '../abstract/onlineMiniMap';
import {
    CenteredRegionMiniMap,
    registerCenteredRegionMiniMapParser,
} from '../abstract/centeredRegionMiniMap';
import { OfflineCenteredRegionMiniMap } from './offlineCenteredRegionMiniMap';

export class OnlineCenteredRegionMiniMap extends CenteredRegionMiniMap implements OnlineMiniMap {
    readonly fetchType = 'online' as const;
    routesParams: RoutesParams;

    constructor(routesParams: RoutesParams, centeredRouteId: string, title: string) {
        super(centeredRouteId, title);
        this.routesParams = routesParams;
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
        Object.setPrototypeOf(r, OnlineCenteredRegionMiniMap.prototype);
        return r as unknown as OnlineCenteredRegionMiniMap;
    }
}

registerCenteredRegionMiniMapParser('online', (res) => OnlineCenteredRegionMiniMap.fromResult(res));
