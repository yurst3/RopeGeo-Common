import { Cursor, CursorType } from './cursor';

/**
 * Cursor for region images pagination. Encodes to base64url for the nextCursor string.
 */
export class RegionImagesCursor extends Cursor {
    readonly cursorType = CursorType.RegionImages;

    constructor(
        public readonly sortKey: number,
        public readonly pageId: string,
        public readonly imageId: string,
    ) {
        super();
    }

    protected toPayload(): Record<string, unknown> {
        return { sortKey: this.sortKey, pageId: this.pageId, imageId: this.imageId };
    }

    /**
     * Decodes a base64url-encoded cursor string. Throws if the string is invalid
     * or does not represent a valid RegionImagesCursor shape.
     */
    static decodeBase64(encoded: string): RegionImagesCursor {
        const obj = Cursor.parseBase64Url(encoded, 'region images cursor');
        Cursor.validateCursorType(obj, CursorType.RegionImages, 'Region images cursor');

        if (!('sortKey' in obj) || !('pageId' in obj) || !('imageId' in obj)) {
            throw new Error('Region images cursor must be an object with sortKey, pageId, and imageId');
        }
        const sortKey = Number(obj.sortKey);
        if (Number.isNaN(sortKey)) {
            throw new Error(
                `Region images cursor sortKey must be a number, got: ${JSON.stringify(obj.sortKey)}`,
            );
        }
        if (typeof obj.pageId !== 'string') {
            throw new Error(`Region images cursor pageId must be a string, got: ${typeof obj.pageId}`);
        }
        if (typeof obj.imageId !== 'string') {
            throw new Error(`Region images cursor imageId must be a string, got: ${typeof obj.imageId}`);
        }
        return new RegionImagesCursor(sortKey, obj.pageId, obj.imageId);
    }
}
