/**
 * Abstract base for params that paginate with a limit and a 1-based page index.
 */
export abstract class PaginationParams {
    /** Default page size for GET /routes; must not exceed {@link PaginationParams.MAX_LIMIT}. */
    static readonly DEFAULT_LIMIT = 500;

    static readonly DEFAULT_PAGE = 1;

    /** Maximum allowed `limit` (client and server should align). */
    static readonly MAX_LIMIT = 500;

    constructor(
        public readonly limit: number,
        public readonly page: number,
    ) {
        PaginationParams.assertValidLimitPage(limit, page);
    }

    static assertValidLimitPage(limit: number, page: number): void {
        if (!Number.isInteger(page) || page < 1) {
            throw new Error('page must be a positive integer');
        }
        if (!Number.isInteger(limit) || limit < 1) {
            throw new Error('limit must be a positive integer');
        }
        if (limit > PaginationParams.MAX_LIMIT) {
            throw new Error(`limit must not exceed ${PaginationParams.MAX_LIMIT}`);
        }
    }

    /**
     * Returns a URL-encoded query string for `limit` and `page` only.
     * Subclasses with extra params override and append.
     */
    toQueryString(): string {
        return new URLSearchParams({
            limit: String(this.limit),
            page: String(this.page),
        }).toString();
    }

    abstract withPage(page: number): PaginationParams;
}
