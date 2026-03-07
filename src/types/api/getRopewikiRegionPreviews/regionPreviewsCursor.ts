/// <reference types="node" />

const ENCODING = 'utf8';
const BASE64URL = 'base64url';

/**
 * Cursor for region previews pagination. Encodes to base64url for the nextCursor string.
 */
export class RegionPreviewsCursor {
    constructor(
        public readonly sortKey: number,
        public readonly type: string,
        public readonly id: string,
    ) {}

    encodeBase64(): string {
        return Buffer.from(
            JSON.stringify({
                sortKey: this.sortKey,
                type: this.type,
                id: this.id,
            }),
            ENCODING,
        ).toString(BASE64URL);
    }

    /**
     * Decodes a base64url-encoded cursor string. Throws if the string is invalid
     * or does not represent a valid RegionPreviewsCursor shape.
     */
    static decodeBase64(encoded: string): RegionPreviewsCursor {
        if (typeof encoded !== 'string' || encoded === '') {
            throw new Error('Region previews cursor must be a non-empty string');
        }
        let decoded: unknown;
        try {
            const json = Buffer.from(encoded, BASE64URL).toString(ENCODING);
            decoded = JSON.parse(json);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(`Invalid region previews cursor encoding: ${message}`);
        }
        if (
            decoded == null ||
            typeof decoded !== 'object' ||
            !('sortKey' in decoded) ||
            !('type' in decoded) ||
            !('id' in decoded)
        ) {
            throw new Error(
                'Region previews cursor must be an object with sortKey, type, and id',
            );
        }
        const obj = decoded as Record<string, unknown>;
        const sortKey = Number(obj.sortKey);
        if (Number.isNaN(sortKey)) {
            throw new Error(
                `Region previews cursor sortKey must be a number, got: ${JSON.stringify(obj.sortKey)}`,
            );
        }
        if (typeof obj.type !== 'string') {
            throw new Error(
                `Region previews cursor type must be a string, got: ${typeof obj.type}`,
            );
        }
        if (typeof obj.id !== 'string') {
            throw new Error(
                `Region previews cursor id must be a string, got: ${typeof obj.id}`,
            );
        }
        return new RegionPreviewsCursor(sortKey, obj.type, obj.id);
    }
}
