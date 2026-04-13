import { RoutesParams } from '../api/params/routesParams';
import { Bounds } from './bounds';
import { MiniMap, registerMiniMapParser } from './miniMap';
import { MiniMapType } from './miniMapType';

/**
 * Region minimap: loads route GeoJSON via getRoutes using {@link RoutesParams}.
 */
export class RegionMiniMap extends MiniMap {
    readonly miniMapType = MiniMapType.GeoJson;
    readonly fetchType = 'online' as const;
    routesParams: RoutesParams;
    /** Null when the region subtree has no route coordinates to bound. */
    bounds: Bounds | null;

    constructor(routesParams: RoutesParams, bounds: Bounds | null, title: string) {
        super(title);
        this.routesParams = routesParams;
        this.bounds = bounds;
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
        if (r.fetchType !== undefined && r.fetchType !== 'online') {
            throw new Error(
                `RegionMiniMap.fetchType must be "online" when provided, got: ${JSON.stringify(r.fetchType)}`,
            );
        }
        if (!('bounds' in r)) {
            throw new Error('RegionMiniMap.bounds must be present (Bounds object or null)');
        }
        const b = r.bounds;
        const bounds = b === null ? null : Bounds.fromResult(b);
        const title = MiniMap.assertNonEmptyTitle(r.title, 'RegionMiniMap.title');
        const rp = r.routesParams;
        if (rp == null || typeof rp !== 'object') {
            throw new Error(
                `RegionMiniMap.routesParams must be an object, got: ${typeof rp}`,
            );
        }
        const routesParams = RoutesParams.fromResult(rp, true);
        return new RegionMiniMap(routesParams, bounds, title);
    }
}

registerMiniMapParser(MiniMapType.GeoJson, (result) => RegionMiniMap.fromResult(result));
