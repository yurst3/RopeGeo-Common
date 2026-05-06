import { Cursor } from './cursors/cursor';

/**
 * Abstract base for params that paginate with a limit and an optional cursor.
 * Subclasses specify their own cursor type via the generic.
 */
export abstract class CursorPaginationParams<C extends Cursor = Cursor> {
    constructor(
        public readonly limit: number,
        public readonly cursor: C | null,
    ) {}

    /**
     * Returns a URL-encoded query string (e.g. "limit=10" or "limit=10&cursor=...").
     * Default implementation uses limit and cursor; subclasses with extra params override.
     */
    toQueryString(): string {
        const params: Record<string, string> = {
            limit: String(this.limit),
        };
        if (this.cursor != null) {
            params.cursor = (this.cursor as Cursor).encodeBase64();
        }
        return new URLSearchParams(params).toString();
    }

    /**
     * Returns a new params instance with the given cursor (for the next page).
     * Each subclass implements this.
     */
    abstract withCursor(cursorEncoded: string | null): CursorPaginationParams;

    /**
     * Query identity for reconnect dirty detection: same as {@link toQueryString} but without
     * `limit` and `cursor` so cursor pagination position does not count as semantic drift while offline.
     */
    reconnectIdentityQueryString(): string {
        const p = new URLSearchParams(this.toQueryString());
        p.delete('limit');
        p.delete('cursor');
        return p.toString();
    }
}
