import { BetaSection, registerBetaSectionParser } from './betaSection';
import { OfflineBetaSection } from './offlineBetaSection';
import { OnlineBetaSectionImage } from './onlineBetaSectionImage';

export class OnlineBetaSection extends BetaSection {
    readonly fetchType = 'online' as const;
    images: OnlineBetaSectionImage[];

    constructor(
        order: number,
        title: string,
        text: string,
        latestRevisionDate: Date,
        images?: OnlineBetaSectionImage[],
        id: string | null = null,
    ) {
        super(order, title, text, latestRevisionDate, id);
        this.images = Array.isArray(images) ? images : [];
    }

    toOffline(
        downloadedImages: Record<
            string,
            { preview?: string | null; banner: string | null; full: string | null }
        >,
    ): OfflineBetaSection {
        return new OfflineBetaSection(
            this.order,
            this.title,
            this.text,
            this.latestRevisionDate,
            this.images.map((image) =>
                image.toOffline(
                    downloadedImages[image.id]?.banner ?? null,
                    downloadedImages[image.id]?.full ?? null,
                    downloadedImages[image.id]?.preview ?? null,
                ),
            ),
            this.id,
        );
    }

    static fromResponseBody(body: unknown): OnlineBetaSection {
        if (body == null || typeof body !== 'object') {
            throw new Error('OnlineBetaSection body must be an object');
        }
        const r = body as Record<string, unknown>;
        BetaSection.normalizeCommonFields(r, 'OnlineBetaSection', 'online');
        r.images = BetaSection.parseImagesArray(r, 'images', 'online');
        Object.setPrototypeOf(r, OnlineBetaSection.prototype);
        return r as unknown as OnlineBetaSection;
    }
}

registerBetaSectionParser('online', (body) => OnlineBetaSection.fromResponseBody(body));

