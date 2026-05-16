import '../difficulty/registerDifficultyRatingParsers';
import {
    DifficultyRating,
    resolveDifficultyRatingFromRecord,
} from '../difficulty/difficultyRating';
import { AcaDifficultyRating } from '../difficulty/acaDifficultyRating';
import { PermitStatus } from '../permitStatus';
import { PageDataSource } from '../pageDataSource';
import { FetchType } from '../fetchType';
import { Preview, PreviewType, registerPreviewParser } from './preview';

const pagePreviewParsers = new Map<FetchType, (result: unknown) => PagePreview>();

export function registerPagePreviewParser(
    fetchType: FetchType,
    parse: (result: unknown) => PagePreview,
): void {
    pagePreviewParsers.set(fetchType, parse);
}

/**
 * Row shape returned by the getRopewikiPagePreview query.
 * Used when building a PagePreview from Ropewiki data via PagePreview.fromDbRow.
 */
export interface GetRopewikiPagePreviewRow {
    pageId: string;
    title: string;
    quality: number | null;
    userVotes: number | null;
    technicalRating: string | null;
    timeRating: string | null;
    waterRating: string | null;
    riskRating: string | null;
    regionId: string;
    regionName: string;
    bannerFileUrl: string | null;
    url: string | null;
    permits: string | null;
}

/**
 * Preview of a page linked to a route (e.g. Ropewiki page).
 * Used by GET /route/{routeId}/preview.
 */
export abstract class PagePreview extends Preview {
    /** Discriminator for search results: always 'page' */
    readonly previewType = PreviewType.Page;
    abstract readonly fetchType: FetchType;
    /** Page identifier (e.g. RopewikiPage id) */
    id: string;
    /** Source of the page (e.g. ropewiki) */
    source: PageDataSource;
    /** Numeric rating (e.g. quality for Ropewiki) */
    rating: number | null;
    /** Number of votes (e.g. userVotes for Ropewiki) */
    ratingCount: number | null;
    /** Display title */
    title: string;
    /** Region names (not ids) */
    regions: string[];
    /** AKA (also-known-as) names */
    aka: string[];
    /** ACA (or future) difficulty rating; use {@link AcaDifficultyRating.effectiveRisk} for display when applicable. */
    difficultyRating: DifficultyRating;
    /** Map data id for the page route, or null if none */
    mapData: string | null;
    /** External link to the page (e.g. Ropewiki page URL) */
    externalLink: string | null;
    /** Permit status: Yes, No, Restricted, Closed, or null */
    permit: PermitStatus | null;

    constructor(
        id: string,
        source: PageDataSource,
        rating: number | null,
        ratingCount: number | null,
        title: string,
        regions: string[],
        aka: string[],
        difficultyRating: DifficultyRating,
        mapData: string | null,
        externalLink: string | null,
        permit: PermitStatus | null,
    ) {
        super();
        this.id = id;
        this.source = source;
        this.rating = rating;
        this.ratingCount = ratingCount;
        this.title = title;
        this.regions = regions;
        this.aka = aka;
        this.difficultyRating = difficultyRating;
        this.mapData = mapData;
        this.externalLink = externalLink;
        this.permit = permit;
    }

    /**
     * Builds a PagePreview from a getRopewikiPagePreview query row.
     */
    static fromDbRow(
        row: GetRopewikiPagePreviewRow,
        mapData: string | null,
        regions?: string[],
        aka?: string[],
    ): import('./onlinePagePreview').OnlinePagePreview {
        const difficultyRating = new AcaDifficultyRating(
            row.technicalRating,
            row.waterRating,
            row.timeRating,
            row.riskRating,
        );
        return PagePreview.fromResult(
            {
                previewType: PreviewType.Page,
                fetchType: 'online',
                id: row.pageId,
                source: PageDataSource.Ropewiki,
                imageUrl: row.bannerFileUrl ?? null,
                rating: row.quality != null ? Number(row.quality) : null,
                ratingCount: row.userVotes ?? null,
                title: row.title,
                regions: regions ?? [row.regionName],
                aka: aka ?? [],
                difficultyRating,
                mapData,
                externalLink: row.url ?? null,
                permit: PagePreview.parsePermit(row.permits),
            },
            'online',
        ) as import('./onlinePagePreview').OnlinePagePreview;
    }

    /**
     * Validates result has page preview fields and applies PagePreview.prototype.
     * Expects difficultyRating as plain object with technical, water, time, additionalRisk (optional).
     */
    static fromResult(result: unknown, fetchType?: FetchType): PagePreview {
        if (result == null || typeof result !== 'object') {
            throw new Error('PagePreview result must be an object');
        }
        const r = result as Record<string, unknown>;
        const rawFetchType = r.fetchType;
        const resolvedFetchType = fetchType ?? rawFetchType;
        if (resolvedFetchType !== 'online' && resolvedFetchType !== 'offline') {
            throw new Error(
                `PagePreview.fetchType must be "online" or "offline", got: ${JSON.stringify(rawFetchType)}`,
            );
        }
        if (fetchType != null && rawFetchType !== undefined && rawFetchType !== fetchType) {
            throw new Error(
                `PagePreview.fetchType mismatch: expected ${JSON.stringify(fetchType)}, got: ${JSON.stringify(rawFetchType)}`,
            );
        }
        const parser = pagePreviewParsers.get(resolvedFetchType);
        if (parser == null) {
            throw new Error(
                `No PagePreview parser registered for fetchType ${JSON.stringify(resolvedFetchType)}`,
            );
        }
        return parser(result);
    }

    protected static validateCommonFields(
        r: Record<string, unknown>,
        expectedFetchType: FetchType,
        context: string,
    ): void {
        PagePreview.assertString(r, 'id');
        PagePreview.assertString(r, 'title');
        PagePreview.assertSource(r, 'source');
        PagePreview.assertStringArray(r, 'regions');
        PagePreview.assertStringArray(r, 'aka');
        PagePreview.assertDifficultyRating(r);
        PagePreview.assertNullableString(r, 'mapData');
        PagePreview.assertNullableString(r, 'externalLink');
        PagePreview.assertNullableNumber(r, 'rating');
        PagePreview.assertNullableNumber(r, 'ratingCount');
        PagePreview.assertPermit(r, 'permit');
        if (r.fetchType !== expectedFetchType) {
            throw new Error(
                `${context}.fetchType must be "${expectedFetchType}", got: ${JSON.stringify(r.fetchType)}`,
            );
        }
        r.difficultyRating = DifficultyRating.fromResult(
            resolveDifficultyRatingFromRecord(r),
        );
    }

    protected static assertString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(`PagePreview.${key} must be a string, got: ${typeof v}`);
        }
    }

    protected static assertNullableString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (v !== null && v !== undefined && typeof v !== 'string') {
            throw new Error(`PagePreview.${key} must be string or null, got: ${typeof v}`);
        }
    }

    protected static assertNullableNumber(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (v !== null && v !== undefined && (typeof v !== 'number' || Number.isNaN(v))) {
            throw new Error(`PagePreview.${key} must be number or null, got: ${typeof v}`);
        }
    }

    protected static assertSource(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (v !== PageDataSource.Ropewiki) {
            throw new Error(
                `PagePreview.${key} must be PageDataSource, got: ${JSON.stringify(v)}`,
            );
        }
    }

    protected static assertStringArray(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (!Array.isArray(v)) {
            throw new Error(`PagePreview.${key} must be an array, got: ${typeof v}`);
        }
        for (let i = 0; i < v.length; i++) {
            if (typeof v[i] !== 'string') {
                throw new Error(`PagePreview.${key}[${i}] must be a string`);
            }
        }
    }

    protected static assertDifficultyRating(r: Record<string, unknown>): void {
        const v = resolveDifficultyRatingFromRecord(r);
        if (v == null || typeof v !== 'object') {
            throw new Error('PagePreview.difficultyRating must be an object');
        }
        const d = v as Record<string, unknown>;
        const strOrNull = (x: unknown, field: string) => {
            if (x !== undefined && x !== null && typeof x !== 'string') {
                throw new Error(`PagePreview.difficultyRating.${field} must be string or null`);
            }
        };
        strOrNull(d.technical, 'technical');
        strOrNull(d.water, 'water');
        strOrNull(d.time, 'time');
        strOrNull(d.additionalRisk, 'additionalRisk');
        strOrNull(d.effectiveRisk, 'effectiveRisk');
        const dtype =
            d.difficultyRatingSystem ??
            d.DifficultyRatingSystem ??
            d.difficultyType ??
            d.DifficultyType;
        if (
            dtype !== undefined &&
            dtype !== null &&
            typeof dtype !== 'string'
        ) {
            throw new Error(
                'PagePreview.difficultyRating.difficultyRatingSystem must be a string or null',
            );
        }
    }

    protected static assertPermit(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (v !== null && v !== undefined && typeof v !== 'string') {
            throw new Error(`PagePreview.${key} must be string or null, got: ${typeof v}`);
        }
        if (v != null && !Object.values(PermitStatus).includes(v as PermitStatus)) {
            throw new Error(`PagePreview.${key} must be PermitStatus or null, got: ${JSON.stringify(v)}`);
        }
    }

    private static parsePermit(value: string | null | undefined): PermitStatus | null {
        if (value == null || value === '') return null;
        const trimmed = value.trim();
        return Object.values(PermitStatus).includes(trimmed as PermitStatus) ? (trimmed as PermitStatus) : null;
    }
}

registerPreviewParser(PreviewType.Page, (result) => PagePreview.fromResult(result));
