/// <reference types="node" />

const ENCODING = 'utf8';
const BASE64URL = 'base64url';

/**
 * Cursor for region images pagination. Encodes to base64url for the nextCursor string.
 */
export class RegionImagesCursor {
    constructor(
        public readonly sortKey: number,
        public readonly pageId: string,
        public readonly imageId: string,
    ) {}

    encodeBase64(): string {
        return Buffer.from(
            JSON.stringify({
                sortKey: this.sortKey,
                pageId: this.pageId,
                imageId: this.imageId,
            }),
            ENCODING,
        ).toString(BASE64URL);
    }

    /**
     * Decodes a base64url-encoded cursor string. Throws if the string is invalid
     * or does not represent a valid RegionImagesCursor shape.
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
        if (
            decoded == null ||
            typeof decoded !== 'object' ||
            !('sortKey' in decoded) ||
            !('pageId' in decoded) ||
            !('imageId' in decoded)
        ) {
            throw new Error(
                'Region images cursor must be an object with sortKey, pageId, and imageId',
            );
        }
        const obj = decoded as Record<string, unknown>;
        const sortKey = Number(obj.sortKey);
        if (Number.isNaN(sortKey)) {
            throw new Error(
                `Region images cursor sortKey must be a number, got: ${JSON.stringify(obj.sortKey)}`,
            );
        }
        if (typeof obj.pageId !== 'string') {
            throw new Error(
                `Region images cursor pageId must be a string, got: ${typeof obj.pageId}`,
            );
        }
        if (typeof obj.imageId !== 'string') {
            throw new Error(
                `Region images cursor imageId must be a string, got: ${typeof obj.imageId}`,
            );
        }
        return new RegionImagesCursor(sortKey, obj.pageId, obj.imageId);
    }
}
