import { CursorPaginationParams } from '../../params/cursorPaginationParams';
import { RegionPreviewsCursor } from '../../cursors/regionPreviewsCursor';

const DEFAULT_LIMIT = 20;

/**
 * Validated params for getRopewikiRegionPreviews (GET /ropewiki/region/{id}/previews).
 * Cursor is stored decoded (RegionPreviewsCursor | null).
 * The constructor accepts an encoded cursor string and decodes it.
 */
export class RopewikiRegionPreviewsParams extends CursorPaginationParams<RegionPreviewsCursor> {
    constructor(limit: number, cursorEncoded?: string) {
        const limitNum = Number(limit);
        if (
            Number.isNaN(limitNum) ||
            !Number.isInteger(limitNum) ||
            limitNum < 1
        ) {
            throw new Error(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        }
        const cursorNorm =
            cursorEncoded === undefined || cursorEncoded === null || cursorEncoded === ''
                ? null
                : cursorEncoded;
        let cursor: RegionPreviewsCursor | null = null;
        if (cursorNorm !== null) {
            cursor = RegionPreviewsCursor.decodeBase64(cursorNorm);
        }
        super(limitNum, cursor);
    }

    withCursor(cursorEncoded: string | null): RopewikiRegionPreviewsParams {
        return new RopewikiRegionPreviewsParams(
            this.limit,
            cursorEncoded === null || cursorEncoded === '' ? undefined : cursorEncoded,
        );
    }

    /**
     * Parses query string parameters and returns validated params.
     * Validation is performed by the constructor.
     */
    static fromQueryStringParams(
        q: Record<string, string | undefined>,
    ): RopewikiRegionPreviewsParams {
        const limitParam = q.limit ?? q.Limit ?? '';
        const limit = limitParam === '' ? DEFAULT_LIMIT : Number(limitParam);
        const cursorRaw = (q.cursor ?? q.Cursor ?? '').trim();
        const cursorEncoded = cursorRaw === '' ? undefined : cursorRaw;
        return new RopewikiRegionPreviewsParams(limit, cursorEncoded);
    }
}
