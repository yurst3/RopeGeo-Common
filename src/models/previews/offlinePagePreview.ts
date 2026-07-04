import { PagePreview, registerPagePreviewParser } from './pagePreview';
import { DownloadJob } from '../../download/downloadJob';
import type { DownloadJobConfig } from '../../download/types';
import { DownloadPhase } from '../../download/downloadPhase';
import { buildDeleteStoredPagePhase, titleForPhase } from '../../download/helpers/downloadPhaseTitles';
import { DownloadDependencyKeys } from '../../download/dependencies/downloadDependencyKeys';
import { FetchPageJsonTaskDependency } from '../../download/dependencies/fetchPageJsonTaskDependency';
import { FetchPageJsonTask } from '../../download/tasks/fetchPageJsonTask';
import { PageDataSource } from '../pageDataSource';
import { PageViewType } from '../pageViews/pageViewType';

export class OfflinePagePreview extends PagePreview {
    readonly fetchType = 'offline' as const;
    downloadedImagePath: string | null;

    constructor(
        id: string,
        source: import('../pageDataSource').PageDataSource,
        downloadedImagePath: string | null,
        rating: number | null,
        ratingCount: number | null,
        title: string,
        regions: string[],
        aka: string[],
        difficultyRating: import('../difficulty/difficultyRating').DifficultyRating,
        mapData: string | null,
        externalLink: string | null,
        permit: import('../permitStatus').PermitStatus | null,
    ) {
        super(
            id,
            source,
            rating,
            ratingCount,
            title,
            regions,
            aka,
            difficultyRating,
            mapData,
            externalLink,
            permit,
        );
        this.downloadedImagePath = downloadedImagePath;
    }

    /**
     * Re-downloads the page bundle by id/source (fetch-page-json path). Offline previews carry no
     * `downloadFolder`, so this always uses the page-JSON fetch phase. Enables re-downloading a saved
     * page whose bundle was removed (its preview stays offline while `downloadedPageViewPath` is null).
     */
    toDownloadJob(config: DownloadJobConfig): DownloadJob {
        const pageViewType =
            this.source === PageDataSource.Ropewiki
                ? PageViewType.Ropewiki
                : null;
        if (pageViewType == null) {
            throw new Error(`Unsupported page preview source "${String(this.source)}"`);
        }
        const fetchPageTask = new FetchPageJsonTask();
        const fetchPagePhase = new DownloadPhase({
            title: titleForPhase([fetchPageTask]),
            tasks: [fetchPageTask],
        });
        return new DownloadJob({
            pageId: this.id,
            pageViewType,
            config,
            phases: [buildDeleteStoredPagePhase(), fetchPagePhase],
            taskDependencies: {
                [DownloadDependencyKeys.FetchPageJson]:
                    FetchPageJsonTaskDependency.fromPreview(this, config),
            },
        });
    }

    static fromResult(result: unknown): OfflinePagePreview {
        if (result == null || typeof result !== 'object') {
            throw new Error('OfflinePagePreview result must be an object');
        }
        const r = result as Record<string, unknown>;
        PagePreview.validateCommonFields(r, 'offline', 'OfflinePagePreview');
        PagePreview.assertNullableString(r, 'downloadedImagePath');
        Object.setPrototypeOf(r, OfflinePagePreview.prototype);
        return r as unknown as OfflinePagePreview;
    }
}

registerPagePreviewParser('offline', (result) =>
    OfflinePagePreview.fromResult(result),
);

