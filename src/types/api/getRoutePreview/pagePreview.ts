import {
    Difficulty,
    DifficultyRisk,
    DifficultyTechnical,
} from '../../difficulty';
import { PermitStatus } from '../../permitStatus';
import { PageDataSource } from '../../pageDataSource';

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
export class PagePreview {
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
    /** Difficulty ratings (technical, water, time, risk); always present. risk is set to effective risk when built via fromDbRow. */
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
        difficulty: Difficulty,
        mapData: string | null,
        externalLink: string | null,
        permit: PermitStatus | null,
    ) {
        this.id = id;
        this.source = source;
        this.imageUrl = imageUrl;
        this.rating = rating;
        this.ratingCount = ratingCount;
        this.title = title;
        this.regions = regions;
        this.difficulty = difficulty;
        this.mapData = mapData;
        this.externalLink = externalLink;
        this.permit = permit;
    }

    /**
     * Builds a PagePreview from a getRopewikiPagePreview query row.
     * Sets difficulty.risk to the effective risk (derived from technical when risk is not set).
     */
    static fromDbRow(
        row: GetRopewikiPagePreviewRow,
        mapData: string | null,
        regions?: string[],
    ): PagePreview {
        const difficulty = new Difficulty(
            row.technicalRating,
            row.waterRating,
            row.timeRating,
            row.riskRating,
        );
        difficulty.risk = PagePreview.getEffectiveRisk(difficulty);
        return new PagePreview(
            row.pageId,
            PageDataSource.Ropewiki,
            row.bannerFileUrl ?? null,
            row.quality != null ? Number(row.quality) : null,
            row.userVotes ?? null,
            row.title,
            regions ?? [row.regionName],
            difficulty,
            mapData,
            row.url ?? null,
            PagePreview.parsePermit(row.permits),
        );
    }

    private static parsePermit(value: string | null | undefined): PermitStatus | null {
        if (value == null || value === '') return null;
        const trimmed = value.trim();
        return Object.values(PermitStatus).includes(trimmed as PermitStatus) ? (trimmed as PermitStatus) : null;
    }

    private static readonly RISK_ORDER: Record<DifficultyRisk, number> = {
        [DifficultyRisk.G]: 0,
        [DifficultyRisk.PG]: 1,
        [DifficultyRisk.PG13]: 2,
        [DifficultyRisk.R]: 3,
        [DifficultyRisk.X]: 4,
        [DifficultyRisk.XX]: 5,
    };

    private static getDefaultRisk(difficulty: Difficulty): DifficultyRisk | null {
        if (difficulty.technical === DifficultyTechnical.One) return DifficultyRisk.G;
        if (difficulty.technical === DifficultyTechnical.Two) return DifficultyRisk.PG;
        if (difficulty.technical === DifficultyTechnical.Three || difficulty.technical === DifficultyTechnical.Four) {
            return DifficultyRisk.PG13;
        }
        return null;
    }

    private static getEffectiveRisk(difficulty: Difficulty): DifficultyRisk | null {
        const defaultRisk = PagePreview.getDefaultRisk(difficulty);
        if (difficulty.risk != null) {
            return defaultRisk != null &&
                PagePreview.RISK_ORDER[difficulty.risk] < PagePreview.RISK_ORDER[defaultRisk]
                ? defaultRisk
                : difficulty.risk;
        }
        return defaultRisk;
    }
}
