import { Bounds } from './bounds';
import { MiniMapType } from './miniMapType';
import { PageMiniMap, registerPageMiniMapParser } from './pageMiniMap';

export class OfflinePageMiniMap extends PageMiniMap {
    readonly fetchType = 'offline' as const;
    readonly miniMapType = MiniMapType.OfflineTilesTemplate;
    offlineTilesTemplate: string;

    constructor(layerId: string, offlineTilesTemplate: string, bounds: Bounds, title: string) {
        super(layerId, bounds, title);
        this.offlineTilesTemplate = offlineTilesTemplate;
    }

    toPlain(): Record<string, unknown> {
        return {
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
    }

    static fromResult(result: unknown): OfflinePageMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('OfflinePageMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        PageMiniMap.validateCommonFields(
            r,
            MiniMapType.OfflineTilesTemplate,
            'offline',
            'OfflinePageMiniMap',
        );
        PageMiniMap.assertTemplate(r.offlineTilesTemplate, 'OfflinePageMiniMap.offlineTilesTemplate');
        Object.setPrototypeOf(r, OfflinePageMiniMap.prototype);
        return r as unknown as OfflinePageMiniMap;
    }
}

registerPageMiniMapParser(MiniMapType.OfflineTilesTemplate, (result) =>
    OfflinePageMiniMap.fromResult(result),
);

