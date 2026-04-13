import { FetchType } from '../fetchType';
import { DownloadBytes } from './downloadBytes';

const betaSectionImageParsers = new Map<FetchType, (result: unknown) => BetaSectionImage>();

export function registerBetaSectionImageParser(
    fetchType: FetchType,
    parse: (result: unknown) => BetaSectionImage,
): void {
    betaSectionImageParsers.set(fetchType, parse);
}

export abstract class BetaSectionImage {
    abstract readonly fetchType: FetchType;
    order: number;
    /** Ropewiki image row UUID; keys offline file maps. */
    id: string;
    linkUrl: string;
    caption: string | null;
    latestRevisionDate: Date;

    protected constructor(
        order: number,
        id: string,
        linkUrl: string,
        caption: string | null,
        latestRevisionDate: Date,
    ) {
        this.order = order;
        this.id = id;
        this.linkUrl = linkUrl;
        this.caption = caption;
        this.latestRevisionDate = new Date(latestRevisionDate);
    }

    static fromResult(result: unknown, fetchType?: FetchType): BetaSectionImage {
        if (result == null || typeof result !== 'object') {
            throw new Error('BetaSectionImage result must be an object');
        }
        const r = result as Record<string, unknown>;
        const rawFetchType = r.fetchType;
        const resolvedFetchType = fetchType ?? rawFetchType;
        if (resolvedFetchType !== 'online' && resolvedFetchType !== 'offline') {
            throw new Error(
                `BetaSectionImage.fetchType must be "online" or "offline", got: ${JSON.stringify(rawFetchType)}`,
            );
        }
        if (fetchType != null && rawFetchType !== undefined && rawFetchType !== fetchType) {
            throw new Error(
                `BetaSectionImage.fetchType mismatch: expected ${JSON.stringify(fetchType)}, got: ${JSON.stringify(rawFetchType)}`,
            );
        }
        const parser = betaSectionImageParsers.get(resolvedFetchType);
        if (parser == null) {
            throw new Error(
                `No BetaSectionImage parser registered for fetchType ${JSON.stringify(resolvedFetchType)}`,
            );
        }
        return parser(result);
    }

    protected static assertNumber(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'number' || Number.isNaN(v)) {
            throw new Error(
                `BetaSectionImage.${key} must be a number, got: ${typeof v}`,
            );
        }
    }

    protected static assertNonEmptyString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string' || v.trim() === '') {
            throw new Error(
                `BetaSectionImage.${key} must be a non-empty string, got: ${JSON.stringify(v)}`,
            );
        }
    }

    protected static assertString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(
                `BetaSectionImage.${key} must be a string, got: ${typeof v}`,
            );
        }
    }

    protected static assertStringOrNull(
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

    protected static assertDownloadBytesOrNull(
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

    protected static assertIso8601DateString(
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

    protected static normalizeCommonFields(
        obj: Record<string, unknown>,
        context: string,
        expectedFetchType: FetchType,
    ): void {
        BetaSectionImage.assertNumber(obj, 'order');
        BetaSectionImage.assertNonEmptyString(obj, 'id');
        BetaSectionImage.assertString(obj, 'linkUrl');
        BetaSectionImage.assertStringOrNull(obj, 'caption');
        BetaSectionImage.assertIso8601DateString(obj, 'latestRevisionDate');
        const rawFetchType = obj.fetchType;
        if (rawFetchType !== expectedFetchType) {
            throw new Error(
                `${context}.fetchType must be "${expectedFetchType}", got: ${JSON.stringify(rawFetchType)}`,
            );
        }
        obj.latestRevisionDate = new Date(obj.latestRevisionDate as string);
    }
}
