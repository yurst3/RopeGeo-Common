import { MiniMapType } from './miniMapType';

/**
 * Base type for region/page minimap payloads. Use {@link MiniMap.fromResult} to parse by `miniMapType`.
 */
export abstract class MiniMap {
    abstract readonly miniMapType: MiniMapType;

    /**
     * Validates `miniMapType` and delegates to {@link RegionMiniMap.fromResult} or
     * {@link PageMiniMap.fromResult}.
     */
    static fromResult(result: unknown): MiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('MiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        const t = r.miniMapType;
        const valid = Object.values(MiniMapType) as string[];
        if (typeof t !== 'string' || !valid.includes(t)) {
            throw new Error(
                `MiniMap.miniMapType must be one of [${valid.join(', ')}], got: ${JSON.stringify(t)}`,
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
        }
    }
}
