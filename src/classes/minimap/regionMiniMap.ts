import { RoutesParams } from '../requestParams/routesParams';
import { MiniMap } from './miniMap';
import { MiniMapType } from './miniMapType';

/**
 * Region minimap: loads route GeoJSON via getRoutes using {@link RoutesParams}.
 */
export class RegionMiniMap extends MiniMap {
    readonly miniMapType = MiniMapType.GeoJson;
    routesParams: RoutesParams;

    constructor(routesParams: RoutesParams) {
        super();
        this.routesParams = routesParams;
    }

    static fromResult(result: unknown): RegionMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('RegionMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.miniMapType !== MiniMapType.GeoJson) {
            throw new Error(
                `RegionMiniMap.miniMapType must be "${MiniMapType.GeoJson}", got: ${JSON.stringify(r.miniMapType)}`,
            );
        }
        const rp = r.routesParams;
        if (rp == null || typeof rp !== 'object') {
            throw new Error(
                `RegionMiniMap.routesParams must be an object, got: ${typeof rp}`,
            );
        }
        const routesParams = RoutesParams.fromResult(rp, true);
        return new RegionMiniMap(routesParams);
    }
}
