/**
 * Generic beta section image (e.g. order, url, linkUrl, caption, latestRevisionDate).
 */
export class BetaSectionImage {
    order: number;
    url: string;
    linkUrl: string;
    caption: string;
    latestRevisionDate: Date;

    constructor(
        order: number,
        url: string,
        linkUrl: string,
        caption: string,
        latestRevisionDate: Date,
    ) {
        this.order = order;
        this.url = url;
        this.linkUrl = linkUrl;
        this.caption = caption;
        this.latestRevisionDate = new Date(latestRevisionDate);
    }

    /**
     * Validates response body has BetaSectionImage fields and returns a BetaSectionImage instance.
     */
    static fromResponseBody(body: unknown): BetaSectionImage {
        if (body == null || typeof body !== 'object') {
            throw new Error('BetaSectionImage body must be an object');
        }
        const r = body as Record<string, unknown>;
        BetaSectionImage.assertNumber(r, 'order');
        BetaSectionImage.assertString(r, 'url');
        BetaSectionImage.assertString(r, 'linkUrl');
        BetaSectionImage.assertString(r, 'caption');
        BetaSectionImage.assertIso8601DateString(r, 'latestRevisionDate');
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

    private static assertString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(
                `BetaSectionImage.${key} must be a string, got: ${typeof v}`,
            );
        }
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
