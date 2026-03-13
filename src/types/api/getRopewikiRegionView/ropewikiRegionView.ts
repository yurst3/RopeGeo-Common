/**
 * Region view for getRopewikiRegionView (GET /ropewiki/region/{id}).
 * Contains all RopewikiRegion info for the region except the region's id.
 */
export class RopewikiRegionView {
    name: string;
    /** Full lineage of parent regions from immediate parent up to root (same shape as RopewikiPageView.regions). */
    regions: { name: string; id: string }[];
    /** Actual number of pages in this region (computed). Default 0. */
    regionCount: number;
    /** Pages in this region only (computed). Default 0. */
    topLevelPageCount: number;
    /** Raw page count from getRegions API (rawPageCount). Default 0. */
    pageCount: number;
    /** Pages in this region and all descendants (truePageCountWithDescendents). Default 0. */
    totalPageCount: number;
    overview: string | null;
    bestMonths: string[];
    isMajorRegion: boolean;
    latestRevisionDate: Date;
    /** When the region was last synced (from updatedAt). */
    syncDate: Date;
    externalLink: string;

    constructor(
        name: string,
        latestRevisionDate: Date,
        url: string,
        updatedAt: Date,
        regions?: { name: string; id: string }[],
        rawPageCount?: number | null,
        truePageCount?: number | null,
        trueRegionCount?: number | null,
        truePageCountWithDescendents?: number | null,
        overview?: string | null,
        bestMonths?: string[] | null,
        isMajorRegion?: boolean | null,
    ) {
        this.name = name;
        this.regions = Array.isArray(regions) ? regions.slice() : [];
        this.regionCount = trueRegionCount ?? 0;
        this.topLevelPageCount = truePageCount ?? 0;
        this.pageCount = rawPageCount ?? 0;
        this.totalPageCount = truePageCountWithDescendents ?? 0;
        this.overview = overview ?? null;
        this.bestMonths = Array.isArray(bestMonths) ? bestMonths : [];
        this.isMajorRegion = isMajorRegion ?? false;
        this.latestRevisionDate = new Date(latestRevisionDate);
        this.syncDate = new Date(updatedAt);
        this.externalLink = url;
    }

    /**
     * Validates response body has RopewikiRegionView fields and returns a RopewikiRegionView instance.
     * Mutates the body (parses latestRevisionDate to Date) and sets RopewikiRegionView.prototype.
     */
    static fromResponseBody(body: unknown): RopewikiRegionView {
        if (body == null || typeof body !== 'object') {
            throw new Error('RopewikiRegionView body must be an object');
        }
        const r = body as Record<string, unknown>;
        RopewikiRegionView.assertString(r, 'name');
        RopewikiRegionView.assertRegionsArray(r, 'regions');
        RopewikiRegionView.assertNonNegativeNumber(r, 'regionCount');
        RopewikiRegionView.assertNonNegativeNumber(r, 'topLevelPageCount');
        RopewikiRegionView.assertNonNegativeNumber(r, 'pageCount');
        RopewikiRegionView.assertNonNegativeNumber(r, 'totalPageCount');
        RopewikiRegionView.assertNullableString(r, 'overview');
        RopewikiRegionView.assertStringArray(r, 'bestMonths');
        RopewikiRegionView.assertBoolean(r, 'isMajorRegion');
        RopewikiRegionView.assertIso8601DateString(r, 'latestRevisionDate');
        RopewikiRegionView.assertIso8601DateString(r, 'syncDate');
        RopewikiRegionView.assertValidUrl(r, 'externalLink');
        (r as Record<string, unknown>).latestRevisionDate = new Date(
            r.latestRevisionDate as string,
        );
        (r as Record<string, unknown>).syncDate = new Date(r.syncDate as string);
        Object.setPrototypeOf(r, RopewikiRegionView.prototype);
        return r as unknown as RopewikiRegionView;
    }

    private static assertString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(
                `RopewikiRegionView.${key} must be a string, got: ${typeof v}`,
            );
        }
    }

    private static assertNullableString(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (v !== null && v !== undefined && typeof v !== 'string') {
            throw new Error(
                `RopewikiRegionView.${key} must be string or null, got: ${typeof v}`,
            );
        }
    }

    private static assertNonNegativeNumber(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (typeof v !== 'number' || Number.isNaN(v) || v < 0) {
            throw new Error(
                `RopewikiRegionView.${key} must be a number >= 0, got: ${typeof v}`,
            );
        }
    }

    private static assertRegionsArray(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (!Array.isArray(v)) {
            throw new Error(
                `RopewikiRegionView.${key} must be an array, got: ${typeof v}`,
            );
        }
        for (let i = 0; i < v.length; i++) {
            const item = v[i];
            if (item == null || typeof item !== 'object') {
                throw new Error(
                    `RopewikiRegionView.${key}[${i}] must be an object with id and name`,
                );
            }
            const o = item as Record<string, unknown>;
            if (typeof o.id !== 'string') {
                throw new Error(
                    `RopewikiRegionView.${key}[${i}].id must be a string, got: ${typeof o.id}`,
                );
            }
            if (typeof o.name !== 'string') {
                throw new Error(
                    `RopewikiRegionView.${key}[${i}].name must be a string, got: ${typeof o.name}`,
                );
            }
        }
    }

    private static assertStringArray(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (!Array.isArray(v)) {
            throw new Error(
                `RopewikiRegionView.${key} must be an array, got: ${typeof v}`,
            );
        }
        for (let i = 0; i < v.length; i++) {
            if (typeof v[i] !== 'string') {
                throw new Error(
                    `RopewikiRegionView.${key}[${i}] must be a string`,
                );
            }
        }
    }

    private static assertBoolean(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (typeof v !== 'boolean') {
            throw new Error(
                `RopewikiRegionView.${key} must be a boolean, got: ${typeof v}`,
            );
        }
    }

    private static assertIso8601DateString(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(
                `RopewikiRegionView.${key} must be an ISO 8601 date string, got: ${typeof v}`,
            );
        }
        const date = new Date(v);
        if (Number.isNaN(date.getTime())) {
            throw new Error(
                `RopewikiRegionView.${key} must be a valid ISO 8601 date string, got: ${v}`,
            );
        }
    }

    private static assertValidUrl(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(
                `RopewikiRegionView.${key} must be a string (valid URL), got: ${typeof v}`,
            );
        }
        try {
            new URL(v);
        } catch {
            throw new Error(
                `RopewikiRegionView.${key} must be a valid URL, got: ${v}`,
            );
        }
    }
}
