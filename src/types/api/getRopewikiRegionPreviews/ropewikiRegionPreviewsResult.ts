import { Preview } from '../../previews/preview';
import { RegionPreviewsCursor } from '../../cursors/regionPreviewsCursor';
import {
    CursorPaginationResults,
    type CursorPaginationResponseParsed,
    ResultType,
} from '../../results/cursorPaginationResults';

/**
 * Result of getRopewikiRegionPreviews (GET /ropewiki/region/{id}/previews).
 */
export class RopewikiRegionPreviewsResult extends CursorPaginationResults<Preview> {
    constructor(
        results: Preview[],
        nextCursor: RegionPreviewsCursor | string | null,
    ) {
        const nextCursorStr =
            nextCursor === null
                ? null
                : typeof nextCursor === 'string'
                  ? nextCursor
                  : nextCursor.encodeBase64();
        super(results, nextCursorStr, ResultType.RopewikiRegionPreviews);
    }

    /**
     * Build from validated { results, nextCursor }. Decodes nextCursor to ensure valid.
     * Each result is validated via Preview.fromResult.
     */
    static fromResponseBody(
        body: CursorPaginationResponseParsed,
    ): RopewikiRegionPreviewsResult {
        const { results: resultsRaw, nextCursor } = body;
        if (nextCursor != null) {
            RegionPreviewsCursor.decodeBase64(nextCursor);
        }
        const results = resultsRaw.map((r) => Preview.fromResult(r));
        return new RopewikiRegionPreviewsResult(results, nextCursor);
    }
}
