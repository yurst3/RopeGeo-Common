import { PagePreview } from '../getRoutePreview/pagePreview';
import { RegionPreview } from '../search/regionPreview';
import { RegionPreviewsCursor } from './regionPreviewsCursor';

/**
 * Result of getRopewikiRegionPreviews (GET /ropewiki/region/{id}/previews).
 */
export class RopewikiRegionPreviewsResult {
    results: (PagePreview | RegionPreview)[];
    nextCursor: string | null;

    constructor(
        results: (PagePreview | RegionPreview)[],
        nextCursor: RegionPreviewsCursor | null,
    ) {
        this.results = results;
        this.nextCursor = nextCursor !== null ? nextCursor.encodeBase64() : null;
    }
}
