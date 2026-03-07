/**
 * Row shape from the database (or join) for building a RopewikiRegionView.
 * Column names match the RopewikiRegion schema; parentRegionId/parentRegionName
 * come from a join when loading the parent region.
 */
export interface RopewikiRegionViewRow {
    name: string;
    parentRegionId?: string | null;
    parentRegionName?: string | null;
    rawPageCount?: number | null;
    truePageCount?: number | null;
    trueRegionCount?: number | null;
    truePageCountWithDescendents?: number | null;
    overview?: string | null;
    bestMonths?: string[] | null;
    isMajorRegion?: boolean | null;
    latestRevisionDate: Date;
    url: string;
}

/**
 * Region view for getRopewikiRegionView (GET /ropewiki/region/{id}).
 * Contains all RopewikiRegion info for the region except the region's id.
 */
export class RopewikiRegionView {
    name: string;
    parentRegion: { id: string; name: string } | null;
    /** Actual number of pages in this region (computed). Default 0. */
    regionCount: number;
    /** Pages in this region only (computed). Default 0. */
    topLevelPageCount: number;
    /** Raw page count from getRegions API (rawPageCount). Default 0. */
    pageCount: number;
    overview: string | null;
    bestMonths: string[];
    isMajorRegion: boolean;
    latestRevisionDate: Date;
    externalLink: string;

    constructor(row: RopewikiRegionViewRow) {
        this.name = row.name;
        this.parentRegion =
            row.parentRegionId != null && row.parentRegionName != null
                ? { id: row.parentRegionId, name: row.parentRegionName }
                : null;
        this.regionCount = row.trueRegionCount ?? 0;
        this.topLevelPageCount = row.truePageCount ?? 0;
        this.pageCount = row.rawPageCount ?? 0;
        this.overview = row.overview ?? null;
        this.bestMonths = Array.isArray(row.bestMonths) ? row.bestMonths : [];
        this.isMajorRegion = row.isMajorRegion ?? false;
        this.latestRevisionDate = new Date(row.latestRevisionDate);
        this.externalLink = row.url;
    }
}
