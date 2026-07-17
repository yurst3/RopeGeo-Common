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

export type OnlineBetaSectionLookupEntry = {
    /** Null for page-level images, which use the empty relevant-context key. */
    section: OnlineBetaSection | null;
    imagesById: Record<string, OnlineBetaSectionImage>;
};

/** Relevant-context lookup keyed by beta-section id (`""` for page-level images). */
export type OnlineBetaSectionLookup = Record<string, OnlineBetaSectionLookupEntry>;

export interface OnlinePageView {
    readonly fetchType: 'online';
    readonly id: string;
    readonly routeType: RouteType;
    readonly pageViewType: PageViewType;
    readonly miniMap: OnlineMiniMap | null;
    readonly downloadFolder: string | null;
    toBetaSectionLookup(): OnlineBetaSectionLookup;
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
    toSavedPage(): SavedPage;
    toDownloadJob(config: DownloadJobConfig): DownloadJob;
}
