import { RoutesParams } from '../../api/params/routesParams';
import type { FetchType } from '../../fetchType';
import { MiniMap } from './miniMap';
import { MiniMapType } from './miniMapType';

/** UUID v4 (same rule as {@link RoutesParams} region id). */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const centeredRegionMiniMapParsers = new Map<FetchType, (result: unknown) => CenteredRegionMiniMap>();

export function registerCenteredRegionMiniMapParser(
    fetchType: FetchType,
    parse: (result: unknown) => CenteredRegionMiniMap,
): void {
    centeredRegionMiniMapParsers.set(fetchType, parse);
}

/**
 * Page fallback minimap: centered route GeoJSON via getRoutes (online) or bundled local GeoJSON (offline).
 */
export abstract class CenteredRegionMiniMap extends MiniMap {
    abstract readonly fetchType: FetchType;
    readonly miniMapType = MiniMapType.CenteredRegion;
    centeredRouteId: string;

    protected constructor(centeredRouteId: string, title: string) {
        super(title);
        this.centeredRouteId = centeredRouteId;
    }

    static fromResult(result: unknown): CenteredRegionMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('CenteredRegionMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.miniMapType !== MiniMapType.CenteredRegion) {
            throw new Error(
                `CenteredRegionMiniMap.miniMapType must be "${MiniMapType.CenteredRegion}", got: ${JSON.stringify(r.miniMapType)}`,
            );
        }
        const ft = r.fetchType;
        if (ft !== 'online' && ft !== 'offline') {
            throw new Error(
                `CenteredRegionMiniMap.fetchType must be "online" or "offline", got: ${JSON.stringify(ft)}`,
            );
        }
        const parser = centeredRegionMiniMapParsers.get(ft);
        if (parser == null) {
            throw new Error(
                `No CenteredRegionMiniMap parser registered for fetchType ${JSON.stringify(ft)}`,
            );
        }
        return parser(result);
    }

    protected static validateCommonFields(
        r: Record<string, unknown>,
        expectedFetchType: FetchType,
        context: string,
    ): void {
        if (r.miniMapType !== MiniMapType.CenteredRegion) {
            throw new Error(
                `${context}.miniMapType must be "${MiniMapType.CenteredRegion}", got: ${JSON.stringify(r.miniMapType)}`,
            );
        }
        if (r.fetchType !== expectedFetchType) {
            throw new Error(
                `${context}.fetchType must be "${expectedFetchType}", got: ${JSON.stringify(r.fetchType)}`,
            );
        }
        const title = MiniMap.assertNonEmptyTitle(r.title, `${context}.title`);
        const rid = r.centeredRouteId;
        if (typeof rid !== 'string' || !UUID_REGEX.test(rid)) {
            throw new Error(`${context}.centeredRouteId must be a UUID string, got: ${JSON.stringify(rid)}`);
        }
        r.title = title;
    }

    protected static parseRoutesParams(
        r: Record<string, unknown>,
        context: string,
    ): RoutesParams {
        const rp = r.routesParams;
        if (rp == null || typeof rp !== 'object') {
            throw new Error(`${context}.routesParams must be an object, got: ${typeof rp}`);
        }
        return RoutesParams.fromResult(rp, true);
    }
}
