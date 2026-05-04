import { Bounds } from '../bounds';
import type { OnlineMiniMap } from '../abstract/onlineMiniMap';
import { PageMiniMap, registerPageMiniMapParser } from '../abstract/pageMiniMap';
import type { LegendItem } from '../legend/abstract/legendItem';
import { OfflinePageMiniMap } from './offlinePageMiniMap';

export class OnlinePageMiniMap extends PageMiniMap implements OnlineMiniMap {
    readonly fetchType = 'online' as const;
    onlineTilesTemplate: string;

    constructor(
        polyLineLayerId: string,
        pointLayerId: string,
        onlineTilesTemplate: string,
        bounds: Bounds,
        title: string,
        legend?: Record<string, LegendItem>,
    ) {
        super(polyLineLayerId, pointLayerId, bounds, title, legend);
        this.onlineTilesTemplate = onlineTilesTemplate;
    }

    toOffline(offlineTilesTemplate: string): OfflinePageMiniMap {
        return new OfflinePageMiniMap(
            this.polyLineLayerId,
            this.pointLayerId,
            offlineTilesTemplate,
            this.bounds,
            this.title,
            this.legend,
        );
    }

    static fromResult(result: unknown): OnlinePageMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('OnlinePageMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        PageMiniMap.validateCommonFields(r, 'online', 'OnlinePageMiniMap');
        PageMiniMap.assertTemplate(r.onlineTilesTemplate, 'OnlinePageMiniMap.onlineTilesTemplate');
        Object.setPrototypeOf(r, OnlinePageMiniMap.prototype);
        return r as unknown as OnlinePageMiniMap;
    }
}

registerPageMiniMapParser('online', (res) => OnlinePageMiniMap.fromResult(res));
