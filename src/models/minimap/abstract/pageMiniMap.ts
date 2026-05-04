import type { FetchType } from '../../fetchType';
import { Bounds } from '../bounds';
import { LegendItem } from '../legend/abstract/legendItem';
import '../legend/concrete/lineLegendItem';
import '../legend/concrete/pointLegendItem';
import '../legend/concrete/polygonLegendItem';
import { MiniMap } from './miniMap';
import { MiniMapType } from './miniMapType';

const pageMiniMapParsers = new Map<FetchType, (result: unknown) => PageMiniMap>();

export function registerPageMiniMapParser(
    fetchType: FetchType,
    parse: (result: unknown) => PageMiniMap,
): void {
    pageMiniMapParsers.set(fetchType, parse);
}

/**
 * Page minimap: vector tiles for a single route/page.
 */
export abstract class PageMiniMap extends MiniMap {
    abstract readonly fetchType: FetchType;
    readonly miniMapType = MiniMapType.Page;
    /** Vector tile source-layer id for line and polygon features. */
    polyLineLayerId: string;
    /** Vector tile source-layer id for point features. */
    pointLayerId: string;
    bounds: Bounds;
    legend?: Record<string, LegendItem>;

    protected constructor(
        polyLineLayerId: string,
        pointLayerId: string,
        bounds: Bounds,
        title: string,
        legend?: Record<string, LegendItem>,
    ) {
        super(title);
        this.polyLineLayerId = polyLineLayerId;
        this.pointLayerId = pointLayerId;
        this.bounds = bounds;
        this.legend = legend;
    }

    static fromResult(result: unknown): PageMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('PageMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.miniMapType !== MiniMapType.Page) {
            throw new Error(
                `PageMiniMap.miniMapType must be "${MiniMapType.Page}", got: ${JSON.stringify(r.miniMapType)}`,
            );
        }
        const ft = r.fetchType;
        if (ft !== 'online' && ft !== 'offline') {
            throw new Error(
                `PageMiniMap.fetchType must be "online" or "offline", got: ${JSON.stringify(ft)}`,
            );
        }
        const parser = pageMiniMapParsers.get(ft);
        if (parser == null) {
            throw new Error(`No PageMiniMap parser registered for fetchType ${JSON.stringify(ft)}`);
        }
        return parser(result);
    }

    protected static validateCommonFields(
        r: Record<string, unknown>,
        expectedFetchType: FetchType,
        context: string,
    ): void {
        if (r.miniMapType !== MiniMapType.Page) {
            throw new Error(
                `${context}.miniMapType must be "${MiniMapType.Page}", got: ${JSON.stringify(r.miniMapType)}`,
            );
        }
        if (r.fetchType !== expectedFetchType) {
            throw new Error(
                `${context}.fetchType must be "${expectedFetchType}", got: ${JSON.stringify(r.fetchType)}`,
            );
        }
        const title = MiniMap.assertNonEmptyTitle(r.title, `${context}.title`);
        const polyLineLayerId = r.polyLineLayerId;
        if (typeof polyLineLayerId !== 'string' || polyLineLayerId.length === 0) {
            throw new Error(
                `${context}.polyLineLayerId must be a non-empty string, got: ${typeof polyLineLayerId}`,
            );
        }
        const pointLayerId = r.pointLayerId;
        if (typeof pointLayerId !== 'string' || pointLayerId.length === 0) {
            throw new Error(`${context}.pointLayerId must be a non-empty string, got: ${typeof pointLayerId}`);
        }
        r.title = title;
        r.bounds = Bounds.fromResult(r.bounds);
        if ('legend' in r && r.legend !== undefined) {
            r.legend = LegendItem.legendRecordFromResult(r.legend, `${context}.legend`);
        }
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
