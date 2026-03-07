import { RegionPreviewsCursor } from './regionPreviewsCursor';

const DEFAULT_LIMIT = 20;

/**
 * Validated params for getRopewikiRegionPreviews (GET /ropewiki/region/{id}/previews).
 * Cursor is stored decoded (RegionPreviewsCursor | null).
 * The constructor accepts an encoded cursor string and decodes it.
 */
export class RopewikiRegionPreviewsParams {
    public readonly limit: number;
    public readonly cursor: RegionPreviewsCursor | null;

    constructor(limit: number, cursorEncoded: string | null) {
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

        this.limit = limit;
        if (cursorEncoded === null || cursorEncoded === '') {
            this.cursor = null;
        } else {
            try {
                this.cursor = RegionPreviewsCursor.decodeBase64(cursorEncoded);
            } catch {
                throw new Error(
                    'Invalid or malformed query parameter: cursor',
                );
            }
        }
    }

    /**
     * Returns an object suitable for use as query string parameters.
     * Cursor is encoded for the query string.
     */
    toQueryStringParams(): Record<string, string> {
        const params: Record<string, string> = {
            limit: String(this.limit),
        };
        if (this.cursor !== null) {
            params.cursor = this.cursor.encodeBase64();
        }
        return params;
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
        const cursorEncoded = cursorRaw === '' ? null : cursorRaw;
        return new RopewikiRegionPreviewsParams(limit, cursorEncoded);
    }
}
