import { BetaSectionImage, registerBetaSectionImageParser } from './betaSectionImage';

export class OfflineBetaSectionImage extends BetaSectionImage {
    readonly fetchType = 'offline' as const;
    downloadedBannerPath: string | null;
    downloadedFullPath: string | null;

    constructor(
        order: number,
        id: string,
        downloadedBannerPath: string | null,
        downloadedFullPath: string | null,
        linkUrl: string,
        caption: string | null,
        latestRevisionDate: Date,
    ) {
        super(order, id, linkUrl, caption, latestRevisionDate);
        this.downloadedBannerPath = downloadedBannerPath;
        this.downloadedFullPath = downloadedFullPath;
    }

    static fromResult(result: unknown): OfflineBetaSectionImage {
        if (result == null || typeof result !== 'object') {
            throw new Error('OfflineBetaSectionImage result must be an object');
        }
        const r = result as Record<string, unknown>;
        BetaSectionImage.normalizeCommonFields(r, 'OfflineBetaSectionImage', 'offline');
        BetaSectionImage.assertStringOrNull(r, 'downloadedBannerPath');
        BetaSectionImage.assertStringOrNull(r, 'downloadedFullPath');
        if ('downloadBytes' in r && r.downloadBytes != null) {
            throw new Error('OfflineBetaSectionImage.downloadBytes is not supported');
        }
        Object.setPrototypeOf(r, OfflineBetaSectionImage.prototype);
        return r as unknown as OfflineBetaSectionImage;
    }
}

registerBetaSectionImageParser('offline', (result) =>
    OfflineBetaSectionImage.fromResult(result),
);

