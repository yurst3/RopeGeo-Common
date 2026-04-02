import { Cursor, CursorType } from './cursor';

export type SearchCursorType = 'page' | 'region';

/**
 * Cursor for search API pagination. Encodes to base64url for the nextCursor string.
 */
export class SearchCursor extends Cursor {
    readonly cursorType = CursorType.Search;

    constructor(
        public readonly sortKey: number,
        public readonly type: SearchCursorType,
        public readonly id: string,
    ) {
        super();
    }

    protected toPayload(): Record<string, unknown> {
        return { sortKey: this.sortKey, type: this.type, id: this.id };
    }

    /**
     * Decodes a base64url-encoded cursor string. Throws if the string is invalid
     * or does not represent a valid SearchCursor.
     */
    static decodeBase64(encoded: string): SearchCursor {
        const obj = Cursor.parseBase64Url(encoded, 'search cursor');
        Cursor.validateCursorType(obj, CursorType.Search, 'Search cursor');

        if (!('sortKey' in obj) || !('type' in obj) || !('id' in obj)) {
            throw new Error('Search cursor must be an object with sortKey, type, and id');
        }
        const type = obj.type;
        if (type !== 'page' && type !== 'region') {
            throw new Error(`Search cursor type must be "page" or "region", got: ${JSON.stringify(type)}`);
        }
        if (typeof obj.id !== 'string') {
            throw new Error(`Search cursor id must be a string, got: ${typeof obj.id}`);
        }
        const sortKey = Number(obj.sortKey);
        if (Number.isNaN(sortKey)) {
            throw new Error(`Search cursor sortKey must be a number, got: ${JSON.stringify(obj.sortKey)}`);
        }
        return new SearchCursor(sortKey, type as SearchCursorType, obj.id);
    }
}
