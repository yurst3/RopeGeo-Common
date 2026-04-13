import { DownloadBytes } from './downloadBytes';
import { BetaSectionImage, registerBetaSectionImageParser } from './betaSectionImage';
import { OfflineBetaSectionImage } from './offlineBetaSectionImage';

export class OnlineBetaSectionImage extends BetaSectionImage {
    readonly fetchType = 'online' as const;
    bannerUrl: string | null;
    fullUrl: string | null;
    /** Byte sizes per rendition; null when not provided by API. */
    downloadBytes: DownloadBytes | null;

    constructor(
        order: number,
        id: string,
        bannerUrl: string | null,
        fullUrl: string | null,
        linkUrl: string,
        caption: string | null,
        latestRevisionDate: Date,
        downloadBytes: DownloadBytes | null,
    ) {
        super(order, id, linkUrl, caption, latestRevisionDate);
        this.bannerUrl = bannerUrl;
        this.fullUrl = fullUrl;
        this.downloadBytes = downloadBytes;
    }

    toOffline(downloadedBannerPath: string | null, downloadedFullPath: string | null): OfflineBetaSectionImage {
        return new OfflineBetaSectionImage(
            this.order,
            this.id,
            downloadedBannerPath,
            downloadedFullPath,
            this.linkUrl,
            this.caption,
            this.latestRevisionDate,
        );
    }

    static fromResult(result: unknown): OnlineBetaSectionImage {
        if (result == null || typeof result !== 'object') {
            throw new Error('OnlineBetaSectionImage result must be an object');
        }
        const r = result as Record<string, unknown>;
        BetaSectionImage.normalizeCommonFields(r, 'OnlineBetaSectionImage', 'online');
        BetaSectionImage.assertStringOrNull(r, 'bannerUrl');
        BetaSectionImage.assertStringOrNull(r, 'fullUrl');
        BetaSectionImage.assertDownloadBytesOrNull(r, 'downloadBytes');
        Object.setPrototypeOf(r, OnlineBetaSectionImage.prototype);
        return r as unknown as OnlineBetaSectionImage;
    }
}

registerBetaSectionImageParser('online', (result) => OnlineBetaSectionImage.fromResult(result));

