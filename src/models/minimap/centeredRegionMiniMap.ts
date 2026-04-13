import { RoutesParams } from '../api/params/routesParams';
import { FetchType } from '../fetchType';
import { MiniMap } from './miniMap';
import { MiniMapType } from './miniMapType';

/** UUID v4 (same rule as {@link RoutesParams} region id). */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const centeredRegionMiniMapParsers = new Map<
    MiniMapType.OnlineCenteredGeojson | MiniMapType.OfflineCenteredGeojson,
    (result: unknown) => CenteredRegionMiniMap
>();

export function registerCenteredRegionMiniMapParser(
    miniMapType: MiniMapType.OnlineCenteredGeojson | MiniMapType.OfflineCenteredGeojson,
    parse: (result: unknown) => CenteredRegionMiniMap,
): void {
    centeredRegionMiniMapParsers.set(miniMapType, parse);
}

/**
 * Page fallback minimap: centered route GeoJSON via getRoutes using {@link RoutesParams} (region scope).
 */
export abstract class CenteredRegionMiniMap extends MiniMap {
    abstract readonly fetchType: FetchType;
    abstract readonly miniMapType:
        | MiniMapType.OnlineCenteredGeojson
        | MiniMapType.OfflineCenteredGeojson;
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
        if (
            r.miniMapType !== MiniMapType.OnlineCenteredGeojson &&
            r.miniMapType !== MiniMapType.OfflineCenteredGeojson
        ) {
            throw new Error(
                `CenteredRegionMiniMap.miniMapType must be "${MiniMapType.OnlineCenteredGeojson}" or "${MiniMapType.OfflineCenteredGeojson}", got: ${JSON.stringify(r.miniMapType)}`,
            );
        }
        const parser = centeredRegionMiniMapParsers.get(
            r.miniMapType as
                | MiniMapType.OnlineCenteredGeojson
                | MiniMapType.OfflineCenteredGeojson,
        );
        if (parser == null) {
            throw new Error(
                `No CenteredRegionMiniMap parser registered for miniMapType ${JSON.stringify(r.miniMapType)}`,
            );
        }
        return parser(result);
    }

    protected static validateCommonFields(
        r: Record<string, unknown>,
        expectedType: MiniMapType.OnlineCenteredGeojson | MiniMapType.OfflineCenteredGeojson,
        expectedFetchType: FetchType,
        context: string,
    ): void {
        if (r.miniMapType !== expectedType) {
            throw new Error(
                `${context}.miniMapType must be "${expectedType}", got: ${JSON.stringify(r.miniMapType)}`,
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
