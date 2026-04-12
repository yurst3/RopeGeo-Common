import { MiniMapType } from './miniMapType';

/** `MiniMap.fromResult` accepts only wire shapes produced by the WebScraper API. */
const API_MINI_MAP_TYPES: ReadonlySet<string> = new Set([
    MiniMapType.GeoJson,
    MiniMapType.TilesTemplate,
    MiniMapType.CenteredGeojson,
]);

/**
 * Base type for region/page minimap payloads. Use {@link MiniMap.fromResult} to parse API `miniMapType` values.
 * Persisted {@link MiniMapType.DownloadedTilesTemplate} / {@link MiniMapType.DownloadedCenteredGeojson} objects
 * are parsed only via {@link SavedPage} / their concrete `fromResult` methods.
 */
export abstract class MiniMap {
    abstract readonly miniMapType: MiniMapType;
    readonly title: string;

    protected constructor(title: string) {
        MiniMap.assertNonEmptyTitle(title, 'MiniMap.title');
        this.title = title;
    }

    static assertNonEmptyTitle(value: unknown, context: string): string {
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`${context} must be a non-empty string`);
        }
        return value;
    }

    /**
     * Validates `miniMapType` and delegates to the matching API minimap parser.
     */
    static fromResult(result: unknown): MiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('MiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        const t = r.miniMapType;
        if (typeof t !== 'string') {
            throw new Error(
                `MiniMap.miniMapType must be a string, got: ${JSON.stringify(t)}`,
            );
        }
        if (!API_MINI_MAP_TYPES.has(t)) {
            const all = Object.values(MiniMapType) as string[];
            if (all.includes(t)) {
                throw new Error(
                    `MiniMap.fromResult does not accept miniMapType ${JSON.stringify(t)}; use the concrete class fromResult or SavedPage`,
                );
            }
            throw new Error(
                `MiniMap.miniMapType must be one of [${[...API_MINI_MAP_TYPES].join(', ')}], got: ${JSON.stringify(t)}`,
            );
        }
        switch (t as MiniMapType) {
            case MiniMapType.GeoJson: {
                const { RegionMiniMap } =
                    require('./regionMiniMap') as typeof import('./regionMiniMap');
                return RegionMiniMap.fromResult(result);
            }
            case MiniMapType.TilesTemplate: {
                const { PageMiniMap } =
                    require('./pageMiniMap') as typeof import('./pageMiniMap');
                return PageMiniMap.fromResult(result);
            }
            case MiniMapType.CenteredGeojson: {
                const { CenteredRegionMiniMap } =
                    require('./centeredRegionMiniMap') as typeof import('./centeredRegionMiniMap');
                return CenteredRegionMiniMap.fromResult(result);
            }
            default: {
                throw new Error(`MiniMap.fromResult: unhandled API miniMapType ${JSON.stringify(t)}`);
            }
        }
    }
}
