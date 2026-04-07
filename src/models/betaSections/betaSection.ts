import { BetaSectionImage } from './betaSectionImage';

/**
 * Generic beta section (e.g. order, title, text, images, latestRevisionDate).
 */
export class BetaSection {
    order: number;
    title: string;
    text: string;
    images: BetaSectionImage[];
    latestRevisionDate: Date;

    constructor(
        order: number,
        title: string,
        text: string,
        latestRevisionDate: Date,
        images?: BetaSectionImage[],
    ) {
        this.order = order;
        this.title = title;
        this.text = text;
        this.images = Array.isArray(images) ? images : [];
        this.latestRevisionDate = new Date(latestRevisionDate);
    }

    /**
     * Validates response body has BetaSection fields and returns a BetaSection instance.
     */
    static fromResponseBody(body: unknown): BetaSection {
        if (body == null || typeof body !== 'object') {
            throw new Error('BetaSection body must be an object');
        }
        const r = body as Record<string, unknown>;
        BetaSection.assertNumber(r, 'order');
        BetaSection.assertString(r, 'title');
        BetaSection.assertString(r, 'text');
        BetaSection.assertImagesArray(r, 'images');
        BetaSection.assertIso8601DateString(r, 'latestRevisionDate');
        (r as Record<string, unknown>).latestRevisionDate = new Date(
            r.latestRevisionDate as string,
        );
        Object.setPrototypeOf(r, BetaSection.prototype);
        return r as unknown as BetaSection;
    }

    private static assertNumber(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'number' || Number.isNaN(v)) {
            throw new Error(
                `BetaSection.${key} must be a number, got: ${typeof v}`,
            );
        }
    }

    private static assertString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(
                `BetaSection.${key} must be a string, got: ${typeof v}`,
            );
        }
    }

    private static assertImagesArray(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (!Array.isArray(v)) {
            throw new Error(
                `BetaSection.${key} must be an array, got: ${typeof v}`,
            );
        }
        (obj as Record<string, unknown>)[key] = v.map((item) =>
            BetaSectionImage.fromResult(item),
        );
    }

    private static assertIso8601DateString(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(
                `BetaSection.${key} must be an ISO 8601 date string, got: ${typeof v}`,
            );
        }
        const date = new Date(v);
        if (Number.isNaN(date.getTime())) {
            throw new Error(
                `BetaSection.${key} must be a valid ISO 8601 date string, got: ${v}`,
            );
        }
    }
}
