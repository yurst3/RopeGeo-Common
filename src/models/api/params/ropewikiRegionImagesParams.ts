import { CursorPaginationParams } from './cursorPaginationParams';
import { RegionImagesCursor } from './cursors/regionImagesCursor';

const DEFAULT_LIMIT = 20;

/**
 * Validated params for getRopewikiRegionImages (GET /ropewiki/region/{id}/images).
 * Cursor is stored decoded (RegionImagesCursor | null).
 * The constructor accepts an encoded cursor string and decodes it.
 */
export class RopewikiRegionImagesParams extends CursorPaginationParams<RegionImagesCursor> {
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
        let cursor: RegionImagesCursor | null = null;
        if (cursorNorm !== null) {
            cursor = RegionImagesCursor.decodeBase64(cursorNorm);
        }
        super(limitNum, cursor);
    }

    withCursor(cursorEncoded: string | null): RopewikiRegionImagesParams {
        return new RopewikiRegionImagesParams(
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
    ): RopewikiRegionImagesParams {
        const limitParam = q.limit ?? q.Limit ?? '';
        const limit = limitParam === '' ? DEFAULT_LIMIT : Number(limitParam);
        const cursorRaw = (q.cursor ?? q.Cursor ?? '').trim();
        const cursorEncoded = cursorRaw === '' ? undefined : cursorRaw;
        return new RopewikiRegionImagesParams(limit, cursorEncoded);
    }
}
