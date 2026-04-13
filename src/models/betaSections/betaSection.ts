import { FetchType } from '../fetchType';
import { BetaSectionImage } from './betaSectionImage';

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

    protected constructor(
        order: number,
        title: string,
        text: string,
        latestRevisionDate: Date,
    ) {
        this.order = order;
        this.title = title;
        this.text = text;
        this.latestRevisionDate = new Date(latestRevisionDate);
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
        if (obj.fetchType !== expectedFetchType) {
            throw new Error(
                `${context}.fetchType must be "${expectedFetchType}", got: ${JSON.stringify(obj.fetchType)}`,
            );
        }
        obj.latestRevisionDate = new Date(obj.latestRevisionDate as string);
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
        return v.map((item) => BetaSectionImage.fromResult(item, expectedFetchType));
    }
}
