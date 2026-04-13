import { AcaDifficulty } from '../difficulty/acaDifficulty';
import { OfflinePagePreview } from '../previews/offlinePagePreview';
import { OnlinePagePreview } from '../previews/onlinePagePreview';
import { PagePreview } from '../previews/pagePreview';

const STORAGE_KEYS = ['preview', 'savedAt'] as const;

function assertFiniteNumber(value: unknown, name: string): asserts value is number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`SavedPage.${name} must be a finite number`);
    }
}

function pagePreviewToPlain(p: OnlinePagePreview | OfflinePagePreview): Record<string, unknown> {
    const diffPlain =
        p.difficulty instanceof AcaDifficulty
            ? {
                  difficultyType: p.difficulty.difficultyType,
                  technical: p.difficulty.technical,
                  water: p.difficulty.water,
                  time: p.difficulty.time,
                  additionalRisk: p.difficulty.additionalRisk,
                  effectiveRisk: p.difficulty.effectiveRisk,
              }
            : {
                  difficultyType: p.difficulty.difficultyType,
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
        difficulty: diffPlain,
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
