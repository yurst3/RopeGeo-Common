import { Preview } from '../../previews/preview';
import { RegionPreviewsCursor } from '../../cursors/regionPreviewsCursor';

/**
 * Result of getRopewikiRegionPreviews (GET /ropewiki/region/{id}/previews).
 */
export class RopewikiRegionPreviewsResult {
    results: Preview[];
    nextCursor: string | null;

    constructor(
        results: Preview[],
        nextCursor: RegionPreviewsCursor | null,
    ) {
        this.results = results;
        this.nextCursor = nextCursor !== null ? nextCursor.encodeBase64() : null;
    }
}
