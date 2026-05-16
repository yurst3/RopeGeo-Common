import { PagePreview, registerPagePreviewParser } from './pagePreview';

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

