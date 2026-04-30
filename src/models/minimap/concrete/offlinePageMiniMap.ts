import { Bounds } from '../bounds';
import type { OfflineMiniMap } from '../abstract/offlineMiniMap';
import { PageMiniMap, registerPageMiniMapParser } from '../abstract/pageMiniMap';
import type { LegendItem } from '../legend/abstract/legendItem';

export class OfflinePageMiniMap extends PageMiniMap implements OfflineMiniMap {
    readonly fetchType = 'offline' as const;
    offlineTilesTemplate: string;

    constructor(
        layerId: string,
        offlineTilesTemplate: string,
        bounds: Bounds,
        title: string,
        legend?: Record<string, LegendItem>,
    ) {
        super(layerId, bounds, title, legend);
        this.offlineTilesTemplate = offlineTilesTemplate;
    }

    toPlain(): Record<string, unknown> {
        const plain: Record<string, unknown> = {
            fetchType: this.fetchType,
            miniMapType: this.miniMapType,
            layerId: this.layerId,
            offlineTilesTemplate: this.offlineTilesTemplate,
            bounds: {
                north: this.bounds.north,
                south: this.bounds.south,
                east: this.bounds.east,
                west: this.bounds.west,
            },
            title: this.title,
        };
        if (this.legend !== undefined) {
            plain.legend = Object.fromEntries(
                Object.entries(this.legend).map(([key, item]) => [key, item.toPlain()]),
            );
        }
        return plain;
    }

    static fromResult(result: unknown): OfflinePageMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('OfflinePageMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        PageMiniMap.validateCommonFields(r, 'offline', 'OfflinePageMiniMap');
        PageMiniMap.assertTemplate(r.offlineTilesTemplate, 'OfflinePageMiniMap.offlineTilesTemplate');
        Object.setPrototypeOf(r, OfflinePageMiniMap.prototype);
        return r as unknown as OfflinePageMiniMap;
    }
}

registerPageMiniMapParser('offline', (res) => OfflinePageMiniMap.fromResult(res));
