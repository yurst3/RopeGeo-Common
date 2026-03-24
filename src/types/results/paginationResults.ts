/**
 * Discriminator for page-based paginated result types. Used in response body so
 * PaginationResults.fromResponseBody can route to the correct parser.
 */
export enum PaginationResultType {
    MapDataTileKeys = 'mapDataTileKeys',
}

/**
 * Validated shape (results + total + page) passed to a specific Result class's
 * fromResponseBody after PaginationResults.fromResponseBody has validated the wrapper.
 */
export type ValidatedPaginationResponse = {
    results: unknown[];
    total: number;
    page: number;
};

/**
 * Base type for page-paginated API results (results array + total + page + resultType).
 * fromResponseBody validates body then delegates to the corresponding Result class.
 */
export abstract class PaginationResults<R = unknown> {
    constructor(
        public readonly results: R[],
        public readonly total: number,
        public readonly page: number,
        public readonly resultType: PaginationResultType,
        /** Sum of byte sizes for all items across the paginated set (e.g. tile bytes); only some endpoints send this. */
        public readonly totalBytes?: number,
    ) {}

    /**
     * Validates body (object, resultType, results array, total, page), then delegates to
     * the corresponding Result class's fromResponseBody with the validated shape.
     */
    static fromResponseBody(body: unknown): PaginationResults {
        if (body == null || typeof body !== 'object') {
            throw new Error('Response body must be an object');
        }
        const b = body as Record<string, unknown>;
        if (!('resultType' in b)) {
            throw new Error('Response body must have resultType');
        }
        const resultType = b.resultType;
        const valid = Object.values(PaginationResultType) as string[];
        if (typeof resultType !== 'string' || !valid.includes(resultType)) {
            throw new Error(
                `Response body.resultType must be one of [${valid.join(', ')}], got: ${JSON.stringify(resultType)}`,
            );
        }
        if (!('results' in b)) {
            throw new Error('Response body must have results');
        }
        const resultsRaw = b.results;
        if (!Array.isArray(resultsRaw)) {
            throw new Error('Response body.results must be an array');
        }
        if (!('total' in b)) {
            throw new Error('Response body must have total');
        }
        const total = b.total;
        if (typeof total !== 'number' || Number.isNaN(total) || !Number.isFinite(total)) {
            throw new Error('Response body.total must be a finite number');
        }
        if (total < 0) {
            throw new Error('Response body.total must be non-negative');
        }
        if (!('page' in b)) {
            throw new Error('Response body must have page');
        }
        const page = b.page;
        if (typeof page !== 'number' || Number.isNaN(page) || !Number.isFinite(page)) {
            throw new Error('Response body.page must be a finite number');
        }
        if (page < 1 || !Number.isInteger(page)) {
            throw new Error('Response body.page must be a positive integer (1-based)');
        }
        const validated: ValidatedPaginationResponse = {
            results: resultsRaw,
            total,
            page,
        };
        switch (resultType as PaginationResultType) {
            case PaginationResultType.MapDataTileKeys: {
                const { MapDataTileKeysResults } = require('../api/listMapDataTileKeys/mapDataTileKeysResults');
                return MapDataTileKeysResults.fromResponseBodyInner(b, validated);
            }
        }
    }
}
