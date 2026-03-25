/**
 * Discriminator for cursor-paginated result types. Used in response body so
 * CursorPaginationResults.fromResponseBody can route to the correct parser.
 */
export enum CursorPaginationResultType {
    Search = 'search',
    RopewikiRegionImages = 'ropewikiRegionImages',
    RopewikiRegionPreviews = 'ropewikiRegionPreviews',
}

/**
 * Validated shape (results + nextCursor) passed to specific Result class's fromResponseBody
 * after CursorPaginationResults.fromResponseBody has validated the full body.
 */
export type ValidatedCursorPaginationResponse = {
    results: unknown[];
    nextCursor: string | null;
};

type CursorPaginationParserFn = (
    validated: ValidatedCursorPaginationResponse,
) => CursorPaginationResults;

const cursorPaginationParsers = new Map<
    CursorPaginationResultType,
    CursorPaginationParserFn
>();

/**
 * Registers the parser for {@link CursorPaginationResults.fromResponseBody} for a given type.
 * Call once per type from the corresponding result module at load time.
 */
export function registerCursorPaginationParser(
    type: CursorPaginationResultType,
    parse: CursorPaginationParserFn,
): void {
    cursorPaginationParsers.set(type, parse);
}

/**
 * Base type for cursor-paginated API results (results array + nextCursor + resultType).
 * fromResponseBody validates body (resultType, results, nextCursor) then delegates to
 * the corresponding Result class's fromResponseBody with the validated shape.
 */
export abstract class CursorPaginationResults<R = unknown> {
    constructor(
        public readonly results: R[],
        public readonly nextCursor: string | null,
        public readonly resultType: CursorPaginationResultType,
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
        const valid = Object.values(CursorPaginationResultType) as string[];
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
        const validated: ValidatedCursorPaginationResponse = {
            results: resultsRaw,
            nextCursor,
        };
        const parser = cursorPaginationParsers.get(resultType as CursorPaginationResultType);
        if (parser === undefined) {
            throw new Error(
                `No cursor pagination parser registered for resultType ${JSON.stringify(resultType)}`,
            );
        }
        return parser(validated);
    }
}
