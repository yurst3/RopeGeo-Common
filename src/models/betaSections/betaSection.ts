import { FetchType } from '../fetchType';
import { BetaSectionExcerpt } from './betaSectionExcerpt';
import { BetaSectionImage } from './betaSectionImage';
import {
    isSafeTextBoundary,
    listContext,
    nextSentenceEnd,
    previousSentenceStart,
    visibleCharacters,
} from './formatExcerptHtml';
import { normalizeExcerptListHtmlParts } from './normalizeExcerptHtml';

/**
 * An excerpt split into its verbatim `body` and the surrounding section
 * context. Consumers render `before` and `after` de-emphasized (e.g. faded)
 * relative to `body`; concatenating the three yields well-formed HTML.
 */
export type ExcerptHtml = {
    before: string;
    body: string;
    after: string;
};

const betaSectionParsers = new Map<FetchType, (body: unknown) => BetaSection>();

export function registerBetaSectionParser(
    fetchType: FetchType,
    parse: (body: unknown) => BetaSection,
): void {
    betaSectionParsers.set(fetchType, parse);
}

export abstract class BetaSection {
    abstract readonly fetchType: FetchType;
    order: number;
    title: string;
    text: string;
    latestRevisionDate: Date;
    /** Stable database identity when supplied by the page-view API. */
    id: string | null;

    protected constructor(
        order: number,
        title: string,
        text: string,
        latestRevisionDate: Date,
        id: string | null = null,
    ) {
        this.order = order;
        this.title = title;
        this.text = text;
        this.latestRevisionDate = new Date(latestRevisionDate);
        this.id = id;
    }

    /**
     * Builds a {@link BetaSectionExcerpt} for a verbatim excerpt from this section's text.
     * When the excerpt cannot be located, `start` and `end` are left undefined.
     */
    toExcerpt(excerptText: string, confidence: number): BetaSectionExcerpt {
        if (excerptText.length === 0) {
            return new BetaSectionExcerpt(undefined, undefined, undefined, confidence);
        }
        const start = this.text.indexOf(excerptText);
        if (start === -1) {
            return new BetaSectionExcerpt(excerptText, undefined, undefined, confidence);
        }
        return new BetaSectionExcerpt(excerptText, start, start + excerptText.length, confidence);
    }

    /**
     * Renders an excerpt with nearby section context when its offsets still
     * match this section, otherwise falls back to the excerpt alone.
     */
    toExcerptHtml(excerpt: BetaSectionExcerpt): ExcerptHtml {
        const validOffsets =
            excerpt.text != null &&
            Number.isInteger(excerpt.start) &&
            Number.isInteger(excerpt.end) &&
            (excerpt.start as number) >= 0 &&
            (excerpt.end as number) > (excerpt.start as number) &&
            (excerpt.end as number) <= this.text.length &&
            this.text.slice(excerpt.start, excerpt.end) === excerpt.text &&
            isSafeTextBoundary(this.text, excerpt.start as number) &&
            isSafeTextBoundary(this.text, excerpt.end as number);
        if (!validOffsets) return { before: '', body: excerpt.toHtml(), after: '' };

        const excerptStart = excerpt.start as number;
        const excerptEnd = excerpt.end as number;
        const characters = visibleCharacters(this.text);
        const structuredContext = listContext(
            this.text,
            excerptStart,
            excerptEnd,
            characters,
        );
        const before =
            structuredContext?.before ??
            this.text.slice(
                previousSentenceStart(this.text, excerptStart, characters),
                excerptStart,
            );
        const after =
            structuredContext?.after ??
            this.text.slice(
                excerptEnd,
                nextSentenceEnd(this.text, excerptEnd, characters),
            );

        return normalizeExcerptListHtmlParts({
            before,
            body: excerpt.text as string,
            after,
        });
    }

    static fromResponseBody(body: unknown, fetchType?: FetchType): BetaSection {
        if (body == null || typeof body !== 'object') {
            throw new Error('BetaSection body must be an object');
        }
        const r = body as Record<string, unknown>;
        const rawFetchType = r.fetchType;
        const resolvedFetchType = fetchType ?? rawFetchType;
        if (resolvedFetchType !== 'online' && resolvedFetchType !== 'offline') {
            throw new Error(
                `BetaSection.fetchType must be "online" or "offline", got: ${JSON.stringify(rawFetchType)}`,
            );
        }
        if (fetchType != null && rawFetchType !== undefined && rawFetchType !== fetchType) {
            throw new Error(
                `BetaSection.fetchType mismatch: expected ${JSON.stringify(fetchType)}, got: ${JSON.stringify(rawFetchType)}`,
            );
        }
        const parser = betaSectionParsers.get(resolvedFetchType);
        if (parser == null) {
            throw new Error(
                `No BetaSection parser registered for fetchType ${JSON.stringify(resolvedFetchType)}`,
            );
        }
        return parser(body);
    }

    protected static assertNumber(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'number' || Number.isNaN(v)) {
            throw new Error(
                `BetaSection.${key} must be a number, got: ${typeof v}`,
            );
        }
    }

    protected static assertString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(
                `BetaSection.${key} must be a string, got: ${typeof v}`,
            );
        }
    }

    protected static assertIso8601DateString(
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

    protected static normalizeCommonFields(
        obj: Record<string, unknown>,
        context: string,
        expectedFetchType: FetchType,
    ): void {
        BetaSection.assertNumber(obj, 'order');
        BetaSection.assertString(obj, 'title');
        BetaSection.assertString(obj, 'text');
        BetaSection.assertIso8601DateString(obj, 'latestRevisionDate');
        BetaSection.assertNullableNonEmptyString(obj, 'id');
        if (obj.fetchType !== expectedFetchType) {
            throw new Error(
                `${context}.fetchType must be "${expectedFetchType}", got: ${JSON.stringify(obj.fetchType)}`,
            );
        }
        obj.latestRevisionDate = new Date(obj.latestRevisionDate as string);
    }

    private static assertNullableNonEmptyString(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const value = obj[key];
        if (value === undefined || value === null) {
            obj[key] = null;
            return;
        }
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(
                `BetaSection.${key} must be a non-empty string or null, got: ${JSON.stringify(value)}`,
            );
        }
    }

    protected static parseImagesArray(
        obj: Record<string, unknown>,
        key: string,
        expectedFetchType: FetchType,
    ): BetaSectionImage[] {
        const v = obj[key];
        if (!Array.isArray(v)) {
            throw new Error(`BetaSection.${key} must be an array, got: ${typeof v}`);
        }
        const images = v.map((item) =>
            BetaSectionImage.fromResult(item, expectedFetchType),
        );
        BetaSection.assertUniqueImageIds(images, obj.id);
        return images;
    }

    protected static assertUniqueImageIds(
        images: BetaSectionImage[],
        sectionId: unknown,
    ): void {
        const seen = new Set<string>();
        for (const image of images) {
            if (seen.has(image.id)) {
                const sectionLabel =
                    typeof sectionId === 'string' && sectionId.length > 0
                        ? sectionId
                        : 'unknown';
                throw new Error(
                    `Duplicate image id ${image.id} in beta section ${sectionLabel}`,
                );
            }
            seen.add(image.id);
        }
    }
}
