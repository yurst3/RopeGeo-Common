import { BetaSection, registerBetaSectionParser } from './betaSection';
import { OfflineBetaSectionImage } from './offlineBetaSectionImage';

export class OfflineBetaSection extends BetaSection {
    readonly fetchType = 'offline' as const;
    images: OfflineBetaSectionImage[];

    constructor(
        order: number,
        title: string,
        text: string,
        latestRevisionDate: Date,
        images?: OfflineBetaSectionImage[],
    ) {
        super(order, title, text, latestRevisionDate);
        this.images = Array.isArray(images) ? images : [];
    }

    static fromResponseBody(body: unknown): OfflineBetaSection {
        if (body == null || typeof body !== 'object') {
            throw new Error('OfflineBetaSection body must be an object');
        }
        const r = body as Record<string, unknown>;
        BetaSection.normalizeCommonFields(r, 'OfflineBetaSection', 'offline');
        r.images = BetaSection.parseImagesArray(r, 'images', 'offline');
        Object.setPrototypeOf(r, OfflineBetaSection.prototype);
        return r as unknown as OfflineBetaSection;
    }
}

registerBetaSectionParser('offline', (body) => OfflineBetaSection.fromResponseBody(body));

