/**
 * Discriminator for cursor-paginated result types. Used in response body so
 * CursorPaginationResults.fromResponseBody can route to the correct parser.
 */
export enum ResultType {
    Search = 'search',
    RopewikiRegionImages = 'ropewikiRegionImages',
    RopewikiRegionPreviews = 'ropewikiRegionPreviews',
}

/**
 * Validated shape (results + nextCursor) passed to specific Result class's fromResponseBody
 * after CursorPaginationResults.fromResponseBody has validated the full body.
 */
export type CursorPaginationResponseParsed = {
    results: unknown[];
    nextCursor: string | null;
};

/**
 * Base type for cursor-paginated API results (results array + nextCursor + resultType).
 * fromResponseBody validates body (resultType, results, nextCursor) then delegates to
 * the corresponding Result class's fromResponseBody with the validated shape.
 */
export abstract class CursorPaginationResults<R = unknown> {
    constructor(
        public readonly results: R[],
        public readonly nextCursor: string | null,
        public readonly resultType: ResultType,
    ) {}

    /**
     * Validates body (object, resultType, results array, nextCursor), then delegates to
     * the corresponding Result class's fromResponseBody with { results, nextCursor }.
     */
    static fromResponseBody(body: unknown): CursorPaginationResults {
        if (body == null || typeof body !== 'object') {
            throw new Error('Response body must be an object');
        }
        const b = body as Record<string, unknown>;
        if (!('resultType' in b)) {
            throw new Error('Response body must have resultType');
        }
        const resultType = b.resultType;
        const valid = Object.values(ResultType) as string[];
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
        let nextCursor: string | null = null;
        if ('nextCursor' in b && b.nextCursor != null) {
            if (typeof b.nextCursor !== 'string') {
                throw new Error('Response body.nextCursor must be a string or null');
            }
            nextCursor = b.nextCursor;
        }
        const validated: CursorPaginationResponseParsed = {
            results: resultsRaw,
            nextCursor,
        };
        switch (resultType as ResultType) {
            case ResultType.Search: {
                const { SearchResults } = require('../api/search/searchResults');
                return SearchResults.fromResponseBody(validated);
            }
            case ResultType.RopewikiRegionPreviews: {
                const { RopewikiRegionPreviewsResult } = require('../api/getRopewikiRegionPreviews/ropewikiRegionPreviewsResult');
                return RopewikiRegionPreviewsResult.fromResponseBody(validated);
            }
            case ResultType.RopewikiRegionImages: {
                const { RopewikiRegionImagesResult } = require('../api/getRopewikiRegionImages/ropewikiRegionImagesResult');
                return RopewikiRegionImagesResult.fromResponseBody(validated);
            }
        }
    }
}
