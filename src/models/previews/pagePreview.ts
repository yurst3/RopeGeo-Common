import '../difficulty/registerDifficultyParsers';
import { Difficulty } from '../difficulty/difficulty';
import { AcaDifficulty } from '../difficulty/acaDifficulty';
import { PermitStatus } from '../permitStatus';
import { PageDataSource } from '../pageDataSource';
import { Preview, PreviewType } from './preview';

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
export class PagePreview extends Preview {
    /** Discriminator for search results: always 'page' */
    readonly previewType = PreviewType.Page;
    /** Page identifier (e.g. RopewikiPage id) */
    id: string;
    /** Source of the page (e.g. ropewiki) */
    source: PageDataSource;
    /** Banner image URL (e.g. first non–beta-section image for Ropewiki) */
    imageUrl: string | null;
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
    /** ACA (or future) difficulty; use {@link AcaDifficulty.effectiveRisk} for display when applicable. */
    difficulty: Difficulty;
    /** Map data id for the page route, or null if none */
    mapData: string | null;
    /** External link to the page (e.g. Ropewiki page URL) */
    externalLink: string | null;
    /** Permit status: Yes, No, Restricted, Closed, or null */
    permit: PermitStatus | null;

    constructor(
        id: string,
        source: PageDataSource,
        imageUrl: string | null,
        rating: number | null,
        ratingCount: number | null,
        title: string,
        regions: string[],
        aka: string[],
        difficulty: Difficulty,
        mapData: string | null,
        externalLink: string | null,
        permit: PermitStatus | null,
    ) {
        super();
        this.id = id;
        this.source = source;
        this.imageUrl = imageUrl;
        this.rating = rating;
        this.ratingCount = ratingCount;
        this.title = title;
        this.regions = regions;
        this.aka = aka;
        this.difficulty = difficulty;
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
    ): PagePreview {
        const difficulty = new AcaDifficulty(
            row.technicalRating,
            row.waterRating,
            row.timeRating,
            row.riskRating,
        );
        return new PagePreview(
            row.pageId,
            PageDataSource.Ropewiki,
            row.bannerFileUrl ?? null,
            row.quality != null ? Number(row.quality) : null,
            row.userVotes ?? null,
            row.title,
            regions ?? [row.regionName],
            aka ?? [],
            difficulty,
            mapData,
            row.url ?? null,
            PagePreview.parsePermit(row.permits),
        );
    }

    /**
     * Validates result has page preview fields and applies PagePreview.prototype.
     * Expects difficulty as plain object with technical, water, time, additionalRisk (optional).
     */
    static fromResult(result: unknown): PagePreview {
        if (result == null || typeof result !== 'object') {
            throw new Error('PagePreview result must be an object');
        }
        const r = result as Record<string, unknown>;
        PagePreview.assertString(r, 'id');
        PagePreview.assertString(r, 'title');
        PagePreview.assertSource(r, 'source');
        PagePreview.assertStringArray(r, 'regions');
        PagePreview.assertStringArray(r, 'aka');
        PagePreview.assertDifficulty(r, 'difficulty');
        PagePreview.assertNullableString(r, 'mapData');
        PagePreview.assertNullableString(r, 'externalLink');
        PagePreview.assertNullableString(r, 'imageUrl');
        PagePreview.assertNullableNumber(r, 'rating');
        PagePreview.assertNullableNumber(r, 'ratingCount');
        PagePreview.assertPermit(r, 'permit');
        (r as Record<string, unknown>).difficulty = Difficulty.fromResult(
            r.difficulty,
        );
        Object.setPrototypeOf(r, PagePreview.prototype);
        return r as unknown as PagePreview;
    }

    private static assertString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(`PagePreview.${key} must be a string, got: ${typeof v}`);
        }
    }

    private static assertNullableString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (v !== null && v !== undefined && typeof v !== 'string') {
            throw new Error(`PagePreview.${key} must be string or null, got: ${typeof v}`);
        }
    }

    private static assertNullableNumber(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (v !== null && v !== undefined && (typeof v !== 'number' || Number.isNaN(v))) {
            throw new Error(`PagePreview.${key} must be number or null, got: ${typeof v}`);
        }
    }

    private static assertSource(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (v !== PageDataSource.Ropewiki) {
            throw new Error(
                `PagePreview.${key} must be PageDataSource, got: ${JSON.stringify(v)}`,
            );
        }
    }

    private static assertStringArray(obj: Record<string, unknown>, key: string): void {
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

    private static assertDifficulty(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (v == null || typeof v !== 'object') {
            throw new Error(`PagePreview.${key} must be an object`);
        }
        const d = v as Record<string, unknown>;
        const strOrNull = (x: unknown, field: string) => {
            if (x !== undefined && x !== null && typeof x !== 'string') {
                throw new Error(`PagePreview.difficulty.${field} must be string or null`);
            }
        };
        strOrNull(d.technical, 'technical');
        strOrNull(d.water, 'water');
        strOrNull(d.time, 'time');
        strOrNull(d.additionalRisk, 'additionalRisk');
        strOrNull(d.effectiveRisk, 'effectiveRisk');
        const dtype = d.difficultyType ?? d.DifficultyType;
        if (
            dtype !== undefined &&
            dtype !== null &&
            typeof dtype !== 'string'
        ) {
            throw new Error('PagePreview.difficulty.difficultyType must be a string or null');
        }
    }

    private static assertPermit(obj: Record<string, unknown>, key: string): void {
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
