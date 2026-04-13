import { DownloadBytes } from '../betaSections/downloadBytes';
import { OfflinePageView } from './offlinePageView';
import { PageViewType } from './pageViewType';
import { SavedPage } from '../mobile/savedPage';
import { PagePreview } from '../previews/pagePreview';
import { RouteType } from '../routes/routeType';

export interface OnlinePageView {
    readonly fetchType: 'online';
    readonly id: string;
    readonly routeType: RouteType;
    readonly pageViewType: PageViewType;
    getImageIdsToDownload(): Array<[string, DownloadBytes]>;
    toOffline(
        downloadedImageVersions: Record<string, import('../mobile/imageVersions').ImageVersions>,
        downloadedMiniMap?: import('../minimap/offlinePageMiniMap').OfflinePageMiniMap | import('../minimap/offlineCenteredRegionMiniMap').OfflineCenteredRegionMiniMap | null,
    ): OfflinePageView;
    toPagePreview(): PagePreview;
    toSavedPage(): SavedPage;
}

