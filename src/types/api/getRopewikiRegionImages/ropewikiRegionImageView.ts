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
}
