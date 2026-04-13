import { Bounds } from './bounds';
import { FetchType } from '../fetchType';
import { MiniMap } from './miniMap';
import { MiniMapType } from './miniMapType';

const pageMiniMapParsers = new Map<
    MiniMapType.OnlineTilesTemplate | MiniMapType.OfflineTilesTemplate,
    (result: unknown) => PageMiniMap
>();

export function registerPageMiniMapParser(
    miniMapType: MiniMapType.OnlineTilesTemplate | MiniMapType.OfflineTilesTemplate,
    parse: (result: unknown) => PageMiniMap,
): void {
    pageMiniMapParsers.set(miniMapType, parse);
}

/**
 * Page minimap: vector tiles for a single route/page.
 */
export abstract class PageMiniMap extends MiniMap {
    abstract readonly fetchType: FetchType;
    abstract readonly miniMapType: MiniMapType.OnlineTilesTemplate | MiniMapType.OfflineTilesTemplate;
    layerId: string;
    bounds: Bounds;

    protected constructor(layerId: string, bounds: Bounds, title: string) {
        super(title);
        this.layerId = layerId;
        this.bounds = bounds;
    }

    static fromResult(result: unknown): PageMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('PageMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (
            r.miniMapType !== MiniMapType.OnlineTilesTemplate &&
            r.miniMapType !== MiniMapType.OfflineTilesTemplate
        ) {
            throw new Error(
                `PageMiniMap.miniMapType must be "${MiniMapType.OnlineTilesTemplate}" or "${MiniMapType.OfflineTilesTemplate}", got: ${JSON.stringify(r.miniMapType)}`,
            );
        }
        const parser = pageMiniMapParsers.get(
            r.miniMapType as MiniMapType.OnlineTilesTemplate | MiniMapType.OfflineTilesTemplate,
        );
        if (parser == null) {
            throw new Error(
                `No PageMiniMap parser registered for miniMapType ${JSON.stringify(r.miniMapType)}`,
            );
        }
        return parser(result);
    }

    protected static validateCommonFields(
        r: Record<string, unknown>,
        expectedType: MiniMapType.OnlineTilesTemplate | MiniMapType.OfflineTilesTemplate,
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
        const layerId = r.layerId;
        if (typeof layerId !== 'string' || layerId.length === 0) {
            throw new Error(`${context}.layerId must be a non-empty string, got: ${typeof layerId}`);
        }
        r.title = title;
        r.bounds = Bounds.fromResult(r.bounds);
    }

    protected static assertTemplate(value: unknown, keyName: string): void {
        if (typeof value !== 'string') {
            throw new Error(`${keyName} must be a string, got: ${typeof value}`);
        }
        if (!value.includes('{z}') || !value.includes('{x}') || !value.includes('{y}')) {
            throw new Error(`${keyName} must contain {z}, {x}, and {y} placeholders, got: ${value}`);
        }
    }
}
