import { RopewikiRegionImageView } from './ropewikiRegionImageView';
import { RegionImagesCursor } from '../../cursors/regionImagesCursor';
import {
    CursorPaginationResults,
    type CursorPaginationResponseParsed,
    ResultType,
} from '../../results/cursorPaginationResults';

/**
 * Result of getRopewikiRegionImages (GET /ropewiki/region/{id}/images).
 */
export class RopewikiRegionImagesResult extends CursorPaginationResults<RopewikiRegionImageView> {
    constructor(
        results: RopewikiRegionImageView[],
        nextCursor: RegionImagesCursor | string | null,
    ) {
        const nextCursorStr =
            nextCursor === null
                ? null
                : typeof nextCursor === 'string'
                  ? nextCursor
                  : nextCursor.encodeBase64();
        super(results, nextCursorStr, ResultType.RopewikiRegionImages);
    }

    /**
     * Build from validated { results, nextCursor }. Decodes nextCursor to ensure valid.
     * Each result is validated via RopewikiRegionImageView.fromResult.
     */
    static fromResponseBody(
        body: CursorPaginationResponseParsed,
    ): RopewikiRegionImagesResult {
        const { results: resultsRaw, nextCursor } = body;
        if (nextCursor != null) {
            RegionImagesCursor.decodeBase64(nextCursor);
        }
        const results = resultsRaw.map((r) => RopewikiRegionImageView.fromResult(r));
        return new RopewikiRegionImagesResult(results, nextCursor);
    }
}
