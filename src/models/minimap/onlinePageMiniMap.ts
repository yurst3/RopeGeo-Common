import { Bounds } from './bounds';
import { registerMiniMapParser } from './miniMap';
import { MiniMapType } from './miniMapType';
import { OfflinePageMiniMap } from './offlinePageMiniMap';
import { PageMiniMap, registerPageMiniMapParser } from './pageMiniMap';

export class OnlinePageMiniMap extends PageMiniMap {
    readonly fetchType = 'online' as const;
    readonly miniMapType = MiniMapType.OnlineTilesTemplate;
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
        PageMiniMap.validateCommonFields(
            r,
            MiniMapType.OnlineTilesTemplate,
            'online',
            'OnlinePageMiniMap',
        );
        PageMiniMap.assertTemplate(r.onlineTilesTemplate, 'OnlinePageMiniMap.onlineTilesTemplate');
        Object.setPrototypeOf(r, OnlinePageMiniMap.prototype);
        return r as unknown as OnlinePageMiniMap;
    }
}

registerPageMiniMapParser(MiniMapType.OnlineTilesTemplate, (result) =>
    OnlinePageMiniMap.fromResult(result),
);
registerMiniMapParser(MiniMapType.OnlineTilesTemplate, (result) =>
    OnlinePageMiniMap.fromResult(result),
);

