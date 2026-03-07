/// <reference types="node" />

const ENCODING = 'utf8';
const BASE64URL = 'base64url';

/**
 * Stub cursor for region images pagination. Encodes to base64url for the nextCursor string.
 * Cursor logic will be implemented in Webscraper.
 */
export class RegionImagesCursor {
    constructor(public readonly value: string) {}

    encodeBase64(): string {
        return Buffer.from(JSON.stringify({ value: this.value }), ENCODING).toString(BASE64URL);
    }

    /**
     * Decodes a base64url-encoded cursor string. Throws if the string is invalid.
     */
    static decodeBase64(encoded: string): RegionImagesCursor {
        if (typeof encoded !== 'string' || encoded === '') {
            throw new Error('Region images cursor must be a non-empty string');
        }
        let decoded: unknown;
        try {
            const json = Buffer.from(encoded, BASE64URL).toString(ENCODING);
            decoded = JSON.parse(json);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(`Invalid region images cursor encoding: ${message}`);
        }
        if (decoded == null || typeof decoded !== 'object' || !('value' in decoded)) {
            throw new Error('Region images cursor must be an object with value');
        }
        const obj = decoded as Record<string, unknown>;
        return new RegionImagesCursor(String(obj.value ?? ''));
    }
}
