/**
 * Row shape from the database (or join) for building a RopewikiRegionImageView.
 * Column names match RopewikiImage; pageName typically comes from a join with RopewikiPage.
 */
export interface RopewikiRegionImageViewRow {
    id: string;
    ropewikiPage: string;
    pageName: string;
    fileUrl: string;
    linkUrl: string;
    caption?: string | null;
}

/**
 * Image view item for getRopewikiRegionImages (GET /ropewiki/region/{id}/images).
 */
export class RopewikiRegionImageView {
    id: string;
    pageId: string;
    pageName: string;
    url: string;
    externalLink: string;
    caption: string | undefined;

    constructor(row: RopewikiRegionImageViewRow) {
        this.id = row.id;
        this.pageId = row.ropewikiPage;
        this.pageName = row.pageName;
        this.url = row.fileUrl;
        this.externalLink = row.linkUrl;
        this.caption = row.caption ?? undefined;
    }

    /**
     * Validates result has image view fields and applies RopewikiRegionImageView.prototype.
     */
    static fromResult(result: unknown): RopewikiRegionImageView {
        if (result == null || typeof result !== 'object') {
            throw new Error('RopewikiRegionImageView result must be an object');
        }
        const r = result as Record<string, unknown>;
        RopewikiRegionImageView.assertString(r, 'id');
        RopewikiRegionImageView.assertString(r, 'pageId');
        RopewikiRegionImageView.assertString(r, 'pageName');
        RopewikiRegionImageView.assertString(r, 'url');
        RopewikiRegionImageView.assertString(r, 'externalLink');
        RopewikiRegionImageView.assertOptionalString(r, 'caption');
        Object.setPrototypeOf(r, RopewikiRegionImageView.prototype);
        return r as unknown as RopewikiRegionImageView;
    }

    private static assertString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(
                `RopewikiRegionImageView.${key} must be a string, got: ${typeof v}`,
            );
        }
    }

    private static assertOptionalString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (
            v !== null &&
            v !== undefined &&
            typeof v !== 'string'
        ) {
            throw new Error(
                `RopewikiRegionImageView.${key} must be string or undefined, got: ${typeof v}`,
            );
        }
    }
}
