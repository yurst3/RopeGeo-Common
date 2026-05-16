import { AcaDifficultyRating } from '../difficulty/acaDifficultyRating';
import { OfflinePagePreview } from '../previews/offlinePagePreview';
import { OnlinePagePreview } from '../previews/onlinePagePreview';
import { PagePreview } from '../previews/pagePreview';

/** AsyncStorage key for the saved-pages map (see {@link SavedPagesStorageMap}). */
export const SAVED_PAGES_STORAGE_KEY = 'ropegeo:savedPages';

/**
 * AsyncStorage key for offline route preview rows keyed by route id
 * (see {@link DownloadedRoutePreviewsStorageMap}).
 */
export const DOWNLOADED_ROUTE_PREVIEWS_STORAGE_KEY = 'ropegeo:downloadedRoutePreviews';

/**
 * Persisted value for {@link SAVED_PAGES_STORAGE_KEY}: page id → JSON string from {@link SavedPage#toString}.
 */
export type SavedPagesStorageMap = Record<string, string>;

/**
 * Persisted value for {@link DOWNLOADED_ROUTE_PREVIEWS_STORAGE_KEY}. Entries are removed when a route
 * has no previews; array elements are validated with {@link OfflinePagePreview.fromResult}.
 */
export type DownloadedRoutePreviewsStorageMap = Record<string, unknown[]>;

const STORAGE_KEYS = ['preview', 'savedAt'] as const;

function assertFiniteNumber(value: unknown, name: string): asserts value is number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`SavedPage.${name} must be a finite number`);
    }
}

function pagePreviewToPlain(p: OnlinePagePreview | OfflinePagePreview): Record<string, unknown> {
    const difficultyRatingPlain =
        p.difficultyRating instanceof AcaDifficultyRating
            ? {
                  difficultyRatingSystem: p.difficultyRating.difficultyRatingSystem,
                  technical: p.difficultyRating.technical,
                  water: p.difficultyRating.water,
                  time: p.difficultyRating.time,
                  additionalRisk: p.difficultyRating.additionalRisk,
                  effectiveRisk: p.difficultyRating.effectiveRisk,
              }
            : {
                  difficultyRatingSystem: p.difficultyRating.difficultyRatingSystem,
              };

    const imageFields =
        p.fetchType === 'online'
            ? { imageUrl: p.imageUrl }
            : { downloadedImagePath: p.downloadedImagePath };

    return {
        previewType: p.previewType,
        fetchType: p.fetchType,
        id: p.id,
        source: p.source,
        ...imageFields,
        rating: p.rating,
        ratingCount: p.ratingCount,
        title: p.title,
        regions: p.regions,
        aka: p.aka,
        difficultyRating: difficultyRatingPlain,
        mapData: p.mapData,
        externalLink: p.externalLink,
        permit: p.permit,
    };
}

export class SavedPage {
    readonly preview: OnlinePagePreview | OfflinePagePreview;
    readonly savedAt: number;
    readonly downloadedPageViewPath: string | null;

    constructor(
        preview: OnlinePagePreview | OfflinePagePreview,
        savedAt: number,
        downloadedPageViewPath: string | null = null,
    ) {
        this.preview = preview;
        this.savedAt = savedAt;
        this.downloadedPageViewPath = downloadedPageViewPath;
    }

    static fromJsonString(jsonString: string): SavedPage {
        let parsed: unknown;
        try {
            parsed = JSON.parse(jsonString);
        } catch (e) {
            throw new Error(
                `SavedPage.fromJsonString: invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
            );
        }
        if (parsed == null || typeof parsed !== 'object') {
            throw new Error('SavedPage.fromJsonString: top-level value must be an object');
        }

        const o = parsed as Record<string, unknown>;
        for (const key of STORAGE_KEYS) {
            if (!(key in o)) {
                throw new Error(`SavedPage.fromJsonString: missing key "${key}"`);
            }
        }

        assertFiniteNumber(o.savedAt, 'savedAt');
        const preview = PagePreview.fromResult(o.preview) as OnlinePagePreview | OfflinePagePreview;
        const downloadedPageViewPath =
            'downloadedPageViewPath' in o && o.downloadedPageViewPath != null
                ? String(o.downloadedPageViewPath)
                : null;

        return new SavedPage(preview, o.savedAt as number, downloadedPageViewPath);
    }

    toString(): string {
        return JSON.stringify({
            preview: pagePreviewToPlain(this.preview),
            savedAt: this.savedAt,
            downloadedPageViewPath: this.downloadedPageViewPath,
        });
    }
}
