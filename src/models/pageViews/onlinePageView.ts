import { OfflinePageView } from './offlinePageView';
import { PageViewType } from './pageViewType';
import { SavedPage } from '../mobile/savedPage';
import { PagePreview } from '../previews/pagePreview';
import { RouteType } from '../routes/routeType';
import type { DownloadJob } from '../../download/downloadJob';
import type { DownloadJobConfig } from '../../download/types';
import type { FetchImageFilesTaskDependency } from '../../download/dependencies/fetchImageFilesTaskDependency';

export interface OnlinePageView {
    readonly fetchType: 'online';
    readonly id: string;
    readonly routeType: RouteType;
    readonly pageViewType: PageViewType;
    getFetchImagesTaskDependency(): FetchImageFilesTaskDependency;
    toDownloadJob(config: DownloadJobConfig): DownloadJob;
    toOffline(
        downloadedImageVersions: Record<string, import('../mobile/imageVersions').ImageVersions>,
        downloadedMiniMap?: import('../minimap/concrete/offlinePageMiniMap').OfflinePageMiniMap | import('../minimap/concrete/offlineCenteredRegionMiniMap').OfflineCenteredRegionMiniMap | null,
    ): OfflinePageView;
    toPagePreview(): PagePreview;
    toSavedPage(): SavedPage;
}

