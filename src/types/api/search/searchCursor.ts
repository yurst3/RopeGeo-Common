/// <reference types="node" />

const ENCODING = 'utf8';
const BASE64URL = 'base64url';

export type SearchCursorType = 'page' | 'region';

/**
 * Cursor for search API pagination. Encodes to base64url for the nextCursor string.
 */
export class SearchCursor {
    constructor(
        public readonly sortKey: number,
        public readonly type: SearchCursorType,
        public readonly id: string,
    ) {}

    encodeBase64(): string {
        return Buffer.from(JSON.stringify({ sortKey: this.sortKey, type: this.type, id: this.id }), ENCODING).toString(
            BASE64URL,
        );
    }

    /**
     * Decodes a base64url-encoded cursor string. Throws if the string is invalid
     * or does not represent a valid SearchCursor.
     */
    static decodeBase64(encoded: string): SearchCursor {
        if (typeof encoded !== 'string' || encoded === '') {
            throw new Error('Search cursor must be a non-empty string');
        }
        let decoded: unknown;
        try {
            const json = Buffer.from(encoded, BASE64URL).toString(ENCODING);
            decoded = JSON.parse(json);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(`Invalid search cursor encoding: ${message}`);
        }
        if (
            decoded == null ||
            typeof decoded !== 'object' ||
            !('sortKey' in decoded) ||
            !('type' in decoded) ||
            !('id' in decoded)
        ) {
            throw new Error('Search cursor must be an object with sortKey, type, and id');
        }
        const obj = decoded as Record<string, unknown>;
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
