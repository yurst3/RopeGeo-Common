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

/** Permit status: Yes, No, Restricted, Closed, or null. */
export enum PermitStatus {
    Yes = 'Yes',
    No = 'No',
    Restricted = 'Restricted',
    Closed = 'Closed',
}

/** Technical difficulty: 1–4 */
export enum DifficultyTechnical {
    One = '1',
    Two = '2',
    Three = '3',
    Four = '4',
}

/** Water difficulty: A, B, C, or C1–C4 */
export enum DifficultyWater {
    A = 'A',
    B = 'B',
    C = 'C',
    C1 = 'C1',
    C2 = 'C2',
    C3 = 'C3',
    C4 = 'C4',
}

/** Time difficulty: I–VI (Roman numerals) */
export enum DifficultyTime {
    I = 'I',
    II = 'II',
    III = 'III',
    IV = 'IV',
    V = 'V',
    VI = 'VI',
}

/** Risk rating: G, PG, PG13, R, X, XX */
export enum DifficultyRisk {
    G = 'G',
    PG = 'PG',
    PG13 = 'PG13',
    R = 'R',
    X = 'X',
    XX = 'XX',
}

/**
 * Difficulty ratings for a page (e.g. Ropewiki technical, water, time, risk).
 * Each property is nullable; the object is always present on PagePreview.
 * Throws if a non-empty rating string is not one of the allowed enum values.
 */
export class Difficulty {
    technical: DifficultyTechnical | null;
    water: DifficultyWater | null;
    time: DifficultyTime | null;
    risk: DifficultyRisk | null;

    constructor(
        technicalRating: string | null | undefined,
        waterRating: string | null | undefined,
        timeRating: string | null | undefined,
        riskRating: string | null | undefined,
    ) {
        this.technical = Difficulty.parseDifficultyField(
            technicalRating,
            Object.values(DifficultyTechnical),
            'technical',
        );
        this.water = Difficulty.parseDifficultyField(
            waterRating,
            Object.values(DifficultyWater),
            'water',
        );
        this.time = Difficulty.parseDifficultyField(
            timeRating,
            Object.values(DifficultyTime),
            'time',
        );
        this.risk = Difficulty.parseDifficultyField(
            riskRating,
            Object.values(DifficultyRisk),
            'risk',
        );
    }

    private static parseDifficultyField<T extends string>(
        value: string | null | undefined,
        allowed: readonly T[],
        fieldName: string,
    ): T | null {
        if (value == null || value === '') return null;
        const trimmed = value.trim();
        if (!(allowed as readonly string[]).includes(trimmed)) {
            throw new Error(
                `Invalid difficulty ${fieldName}: "${value}" is not one of [${(allowed as readonly string[]).join(', ')}]`,
            );
        }
        return trimmed as T;
    }
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
