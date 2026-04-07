import { Bounds } from './bounds';
import { MiniMap } from './miniMap';
import { MiniMapType } from './miniMapType';

/**
 * Page minimap: vector tiles for a single route/page.
 */
export class PageMiniMap extends MiniMap {
    readonly miniMapType = MiniMapType.TilesTemplate;
    layerId: string;
    tilesTemplate: string;
    bounds: Bounds;

    constructor(layerId: string, tilesTemplate: string, bounds: Bounds) {
        super();
        this.layerId = layerId;
        this.tilesTemplate = tilesTemplate;
        this.bounds = bounds;
    }

    static fromResult(result: unknown): PageMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('PageMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.miniMapType !== MiniMapType.TilesTemplate) {
            throw new Error(
                `PageMiniMap.miniMapType must be "${MiniMapType.TilesTemplate}", got: ${JSON.stringify(r.miniMapType)}`,
            );
        }
        const layerId = r.layerId;
        if (typeof layerId !== 'string' || layerId.length === 0) {
            throw new Error(
                `PageMiniMap.layerId must be a non-empty string, got: ${typeof layerId}`,
            );
        }
        const tilesTemplate = r.tilesTemplate;
        if (typeof tilesTemplate !== 'string') {
            throw new Error(
                `PageMiniMap.tilesTemplate must be a string, got: ${typeof tilesTemplate}`,
            );
        }
        if (
            !tilesTemplate.includes('{z}') ||
            !tilesTemplate.includes('{x}') ||
            !tilesTemplate.includes('{y}')
        ) {
            throw new Error(
                `PageMiniMap.tilesTemplate must contain {z}, {x}, and {y} placeholders, got: ${tilesTemplate}`,
            );
        }
        const bounds = Bounds.fromResult(r.bounds);
        return new PageMiniMap(layerId, tilesTemplate, bounds);
    }
}
