import { DownloadBytes } from './downloadBytes';

/**
 * Generic beta section image (e.g. order, id, bannerUrl, fullUrl, linkUrl, caption, latestRevisionDate, downloadBytes).
 */
export class BetaSectionImage {
    order: number;
    /** Ropewiki image row UUID; keys offline file maps. */
    id: string;
    bannerUrl: string | null;
    fullUrl: string | null;
    linkUrl: string;
    caption: string | null;
    latestRevisionDate: Date;
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
        this.order = order;
        this.id = id;
        this.bannerUrl = bannerUrl;
        this.fullUrl = fullUrl;
        this.linkUrl = linkUrl;
        this.caption = caption;
        this.latestRevisionDate = new Date(latestRevisionDate);
        this.downloadBytes = downloadBytes;
    }

    /**
     * Validates result has BetaSectionImage fields and returns a BetaSectionImage instance.
     */
    static fromResult(result: unknown): BetaSectionImage {
        if (result == null || typeof result !== 'object') {
            throw new Error('BetaSectionImage result must be an object');
        }
        const r = result as Record<string, unknown>;
        BetaSectionImage.assertNumber(r, 'order');
        BetaSectionImage.assertNonEmptyString(r, 'id');
        BetaSectionImage.assertStringOrNull(r, 'bannerUrl');
        BetaSectionImage.assertStringOrNull(r, 'fullUrl');
        BetaSectionImage.assertString(r, 'linkUrl');
        BetaSectionImage.assertStringOrNull(r, 'caption');
        BetaSectionImage.assertIso8601DateString(r, 'latestRevisionDate');
        BetaSectionImage.assertDownloadBytesOrNull(r, 'downloadBytes');
        (r as Record<string, unknown>).latestRevisionDate = new Date(
            r.latestRevisionDate as string,
        );
        Object.setPrototypeOf(r, BetaSectionImage.prototype);
        return r as unknown as BetaSectionImage;
    }

    private static assertNumber(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'number' || Number.isNaN(v)) {
            throw new Error(
                `BetaSectionImage.${key} must be a number, got: ${typeof v}`,
            );
        }
    }

    private static assertNonEmptyString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string' || v.trim() === '') {
            throw new Error(
                `BetaSectionImage.${key} must be a non-empty string, got: ${JSON.stringify(v)}`,
            );
        }
    }

    private static assertString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(
                `BetaSectionImage.${key} must be a string, got: ${typeof v}`,
            );
        }
    }

    private static assertStringOrNull(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (v !== null && typeof v !== 'string') {
            throw new Error(
                `BetaSectionImage.${key} must be a string or null, got: ${typeof v}`,
            );
        }
    }

    private static assertDownloadBytesOrNull(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (v === undefined || v === null) {
            (obj as Record<string, unknown>)[key] = null;
            return;
        }
        (obj as Record<string, unknown>)[key] = DownloadBytes.fromResult(v);
    }

    private static assertIso8601DateString(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(
                `BetaSectionImage.${key} must be an ISO 8601 date string, got: ${typeof v}`,
            );
        }
        const date = new Date(v);
        if (Number.isNaN(date.getTime())) {
            throw new Error(
                `BetaSectionImage.${key} must be a valid ISO 8601 date string, got: ${v}`,
            );
        }
    }
}
