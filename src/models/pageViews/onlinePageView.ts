import { OfflinePageView } from './offlinePageView';
import { PageViewType } from './pageViewType';
import { SavedPage } from '../mobile/savedPage';
import { PagePreview } from '../previews/pagePreview';
import { RouteType } from '../routes/routeType';
import type { DownloadPhase } from '../../download/downloadPhase';
import type { DownloadJob } from '../../download/downloadJob';
import type { DownloadJobConfig, DownloadPlatformHarness, DownloadTaskDependency } from '../../download/types';
import type { OnlineMiniMap } from '../minimap/abstract/onlineMiniMap';
import type { OnlineBetaSection } from '../betaSections/onlineBetaSection';
import type { OnlineBetaSectionImage } from '../betaSections/onlineBetaSectionImage';

/** Relevant-context section lookup keyed by non-null beta-section id. */
export type OnlineBetaSectionLookup = Record<string, OnlineBetaSection>;

export type OnlineImageLookupEntry = {
    image: OnlineBetaSectionImage;
    /** Omitted for page-level banner images. */
    betaSectionId?: string;
};

/** Image id → image (+ optional owning beta section). */
export type OnlineImageLookup = Record<string, OnlineImageLookupEntry>;

export interface OnlinePageView {
    readonly fetchType: 'online';
    readonly id: string;
    readonly routeType: RouteType;
    readonly pageViewType: PageViewType;
    readonly miniMap: OnlineMiniMap | null;
    readonly downloadFolder: string | null;
    toBetaSectionLookup(): OnlineBetaSectionLookup;
    toImageLookup(): OnlineImageLookup;
    planDownloadPhases(): DownloadPhase[];
    getDependenciesForPhases(phases: DownloadPhase[]): Record<string, DownloadTaskDependency>;
    toOfflineFromExtractedBundle(
        pageRoot: string,
        platformHarness: DownloadPlatformHarness,
    ): Promise<OfflinePageView>;
    toOffline(
        downloadedImageVersions: Record<string, import('../mobile/imageVersions').ImageVersions>,
        downloadedMiniMap?: import('../minimap/concrete/offlinePageMiniMap').OfflinePageMiniMap | import('../minimap/concrete/offlineCenteredRegionMiniMap').OfflineCenteredRegionMiniMap | null,
    ): OfflinePageView;
    toPagePreview(): PagePreview;
    toSavedPage(downloadJob: DownloadJob, config: DownloadJobConfig): SavedPage;
}
