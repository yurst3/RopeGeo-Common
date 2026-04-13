import { RoutesParams } from '../api/params/routesParams';
import { CenteredRegionMiniMap } from './centeredRegionMiniMap';
import { registerMiniMapParser } from './miniMap';
import { MiniMapType } from './miniMapType';
import { OfflineCenteredRegionMiniMap } from './offlineCenteredRegionMiniMap';
import { registerCenteredRegionMiniMapParser } from './centeredRegionMiniMap';

export class OnlineCenteredRegionMiniMap extends CenteredRegionMiniMap {
    readonly fetchType = 'online' as const;
    readonly miniMapType = MiniMapType.OnlineCenteredGeojson;
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
        CenteredRegionMiniMap.validateCommonFields(
            r,
            MiniMapType.OnlineCenteredGeojson,
            'online',
            'OnlineCenteredRegionMiniMap',
        );
        r.routesParams = CenteredRegionMiniMap.parseRoutesParams(r, 'OnlineCenteredRegionMiniMap');
        Object.setPrototypeOf(r, OnlineCenteredRegionMiniMap.prototype);
        return r as unknown as OnlineCenteredRegionMiniMap;
    }
}

registerCenteredRegionMiniMapParser(MiniMapType.OnlineCenteredGeojson, (result) =>
    OnlineCenteredRegionMiniMap.fromResult(result),
);
registerMiniMapParser(MiniMapType.OnlineCenteredGeojson, (result) =>
    OnlineCenteredRegionMiniMap.fromResult(result),
);

