import type { Bounds } from '../bounds';
import type { MiniMapType } from './miniMapType';
import type { OfflineCenteredRegionMiniMap } from '../concrete/offlineCenteredRegionMiniMap';
import type { OfflinePageMiniMap } from '../concrete/offlinePageMiniMap';
import type { OfflineRegionMiniMap } from '../concrete/offlineRegionMiniMap';

export interface OnlineMiniMap {
    readonly fetchType: 'online';
    readonly miniMapType: MiniMapType;
    getBounds(): Bounds | null;
    toOffline(
        downloadedAssetPath: string,
    ): OfflinePageMiniMap | OfflineCenteredRegionMiniMap | OfflineRegionMiniMap;
}
