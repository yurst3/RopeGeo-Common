import { OfflinePagePreview } from './offlinePagePreview';
import { PagePreview, registerPagePreviewParser } from './pagePreview';

export class OnlinePagePreview extends PagePreview {
    readonly fetchType = 'online' as const;
    imageUrl: string | null;

    constructor(
        id: string,
        source: import('../pageDataSource').PageDataSource,
        imageUrl: string | null,
        rating: number | null,
        ratingCount: number | null,
        title: string,
        regions: string[],
        aka: string[],
        difficulty: import('../difficulty/difficulty').Difficulty,
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
            difficulty,
            mapData,
            externalLink,
            permit,
        );
        this.imageUrl = imageUrl;
    }

    toOffline(downloadedImagePath: string | null): OfflinePagePreview {
        return new OfflinePagePreview(
            this.id,
            this.source,
            downloadedImagePath,
            this.rating,
            this.ratingCount,
            this.title,
            this.regions,
            this.aka,
            this.difficulty,
            this.mapData,
            this.externalLink,
            this.permit,
        );
    }

    static fromResult(result: unknown): OnlinePagePreview {
        if (result == null || typeof result !== 'object') {
            throw new Error('OnlinePagePreview result must be an object');
        }
        const r = result as Record<string, unknown>;
        PagePreview.validateCommonFields(r, 'online', 'OnlinePagePreview');
        PagePreview.assertNullableString(r, 'imageUrl');
        Object.setPrototypeOf(r, OnlinePagePreview.prototype);
        return r as unknown as OnlinePagePreview;
    }
}

registerPagePreviewParser('online', (result) => OnlinePagePreview.fromResult(result));

