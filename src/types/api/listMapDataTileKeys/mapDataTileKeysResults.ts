import {
    PaginationResults,
    PaginationResultType,
    type ValidatedPaginationResponse,
} from '../../results/paginationResults';

/**
 * Response for GET /mapdata/{mapDataId}/tiles with page-based pagination.
 * Each result entry is a tile object key (e.g. path string).
 * {@link totalBytes} is always set: sum of byte sizes of all matching objects for this map data id.
 */
export class MapDataTileKeysResults extends PaginationResults<string> {
    declare readonly totalBytes: number;

    constructor(results: string[], total: number, page: number, totalBytes: number) {
        super(results, total, page, PaginationResultType.MapDataTileKeys, totalBytes);
    }

    /**
     * Called from {@link PaginationResults.fromResponseBody} with a validated base shape.
     * Requires `totalBytes` on the wire object and validates it is a finite non-negative number.
     */
    static fromResponseBodyInner(
        body: Record<string, unknown>,
        validated: ValidatedPaginationResponse,
    ): MapDataTileKeysResults {
        MapDataTileKeysResults.assertTotalBytes(body);
        const totalBytesRaw = body.totalBytes as number;
        const results = validated.results.map((r, i) => {
            if (typeof r !== 'string') {
                throw new Error(
                    `MapDataTileKeysResults.results[${i}] must be a string, got: ${typeof r}`,
                );
            }
            return r;
        });
        return new MapDataTileKeysResults(
            results,
            validated.total,
            validated.page,
            totalBytesRaw,
        );
    }

    private static assertTotalBytes(body: Record<string, unknown>): void {
        if (!('totalBytes' in body)) {
            throw new Error('Response body must have totalBytes');
        }
        const totalBytesRaw = body.totalBytes;
        if (
            typeof totalBytesRaw !== 'number' ||
            Number.isNaN(totalBytesRaw) ||
            !Number.isFinite(totalBytesRaw) ||
            totalBytesRaw < 0
        ) {
            throw new Error(
                'Response body.totalBytes must be a finite non-negative number',
            );
        }
    }
}
