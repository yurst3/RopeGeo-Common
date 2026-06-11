import { PageDataSource } from '../../models/pageDataSource';
import { PageViewType } from '../../models/pageViews/pageViewType';
import type { DownloadJobConfig } from '../types';
import type { DownloadTaskDependency } from '../types';

export class FetchPageJsonTaskDependency implements DownloadTaskDependency {
    readonly dependencyKind = 'fetchPageJson' as const;
    readonly pageId: string;
    readonly pageViewType: PageViewType;
    readonly pageUrl: string;

    constructor(pageId: string, pageViewType: PageViewType, pageUrl: string) {
        this.pageId = pageId;
        this.pageViewType = pageViewType;
        this.pageUrl = pageUrl;
    }

    static fromPreview(
        preview: { id: string; source: PageDataSource },
        config: DownloadJobConfig,
    ): FetchPageJsonTaskDependency {
        const pageViewType =
            preview.source === PageDataSource.Ropewiki
                ? PageViewType.Ropewiki
                : null;
        if (pageViewType == null) {
            throw new Error(`Unsupported preview source: ${String(preview.source)}`);
        }
        const pageUrl = new URL(
            `/${encodeURIComponent(pageViewType)}/page/${encodeURIComponent(preview.id)}`,
            config.webScraperBaseUrl,
        ).toString();
        return new FetchPageJsonTaskDependency(preview.id, pageViewType, pageUrl);
    }

    toStoredState(): unknown {
        return {
            dependencyKind: this.dependencyKind,
            pageId: this.pageId,
            pageViewType: this.pageViewType,
            pageUrl: this.pageUrl,
        };
    }

    static fromStoredState(raw: unknown): FetchPageJsonTaskDependency {
        if (raw == null || typeof raw !== 'object') {
            throw new Error('FetchPageJsonTaskDependency must be an object');
        }
        const value = raw as Record<string, unknown>;
        if (typeof value.pageId !== 'string' || value.pageId.length === 0) {
            throw new Error('FetchPageJsonTaskDependency.pageId must be a non-empty string');
        }
        if (
            value.pageViewType !== PageViewType.Ropewiki
        ) {
            throw new Error('FetchPageJsonTaskDependency.pageViewType is invalid');
        }
        if (typeof value.pageUrl !== 'string' || value.pageUrl.length === 0) {
            throw new Error('FetchPageJsonTaskDependency.pageUrl must be a non-empty string');
        }
        return new FetchPageJsonTaskDependency(value.pageId, value.pageViewType, value.pageUrl);
    }
}
