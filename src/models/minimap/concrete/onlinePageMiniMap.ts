import { Bounds } from '../bounds';
import type { OnlineMiniMap } from '../abstract/onlineMiniMap';
import { PageMiniMap, registerPageMiniMapParser } from '../abstract/pageMiniMap';
import { OfflinePageMiniMap } from './offlinePageMiniMap';

export class OnlinePageMiniMap extends PageMiniMap implements OnlineMiniMap {
    readonly fetchType = 'online' as const;
    onlineTilesTemplate: string;

    constructor(layerId: string, onlineTilesTemplate: string, bounds: Bounds, title: string) {
        super(layerId, bounds, title);
        this.onlineTilesTemplate = onlineTilesTemplate;
    }

    toOffline(offlineTilesTemplate: string): OfflinePageMiniMap {
        return new OfflinePageMiniMap(this.layerId, offlineTilesTemplate, this.bounds, this.title);
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
