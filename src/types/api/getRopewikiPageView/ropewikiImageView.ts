/**
 * Image view for getRopewikiPageView (banner or beta-section image).
 */
export interface RopewikiImageView {
    order: number;
    url: string;
    linkUrl: string;
    caption: string;
    latestRevisionDate: Date;
}
