import type { RopewikiRegionImageView } from './ropewikiRegionImageView';
import { RegionImagesCursor } from '../../cursors/regionImagesCursor';

/**
 * Result of getRopewikiRegionImages (GET /ropewiki/region/{id}/images).
 */
export class RopewikiRegionImagesResult {
    results: RopewikiRegionImageView[];
    nextCursor: string | null;

    constructor(
        results: RopewikiRegionImageView[],
        nextCursor: RegionImagesCursor | null,
    ) {
        this.results = results;
        this.nextCursor = nextCursor !== null ? nextCursor.encodeBase64() : null;
    }
}
