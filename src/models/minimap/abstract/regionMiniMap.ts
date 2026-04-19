import type { FetchType } from '../../fetchType';
import { Bounds } from '../bounds';
import { MiniMap } from './miniMap';
import { MiniMapType } from './miniMapType';

const regionMiniMapParsers = new Map<FetchType, (result: unknown) => RegionMiniMap>();

export function registerRegionMiniMapParser(
    fetchType: FetchType,
    parse: (result: unknown) => RegionMiniMap,
): void {
    regionMiniMapParsers.set(fetchType, parse);
}

/**
 * Region minimap: route GeoJSON via getRoutes (online) or bundled local GeoJSON (offline).
 */
export abstract class RegionMiniMap extends MiniMap {
    abstract readonly fetchType: FetchType;
    readonly miniMapType = MiniMapType.Region;
    bounds: Bounds | null;

    protected constructor(bounds: Bounds | null, title: string) {
        super(title);
        this.bounds = bounds;
    }

    static fromResult(result: unknown): RegionMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('RegionMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.miniMapType !== MiniMapType.Region) {
            throw new Error(
                `RegionMiniMap.miniMapType must be "${MiniMapType.Region}", got: ${JSON.stringify(r.miniMapType)}`,
            );
        }
        const ft = r.fetchType;
        if (ft !== 'online' && ft !== 'offline') {
            throw new Error(
                `RegionMiniMap.fetchType must be "online" or "offline", got: ${JSON.stringify(ft)}`,
            );
        }
        const parser = regionMiniMapParsers.get(ft);
        if (parser == null) {
            throw new Error(
                `No RegionMiniMap parser registered for fetchType ${JSON.stringify(ft)}`,
            );
        }
        return parser(result);
    }
}
