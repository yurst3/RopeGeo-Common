import { Cursor, CursorType } from './cursor';

/**
 * Cursor for region previews pagination. Encodes to base64url for the nextCursor string.
 */
export class RegionPreviewsCursor extends Cursor {
    readonly cursorType = CursorType.RegionPreviews;

    constructor(
        public readonly sortKey: number,
        public readonly type: string,
        public readonly id: string,
    ) {
        super();
    }

    protected toPayload(): Record<string, unknown> {
        return { sortKey: this.sortKey, type: this.type, id: this.id };
    }

    /**
     * Decodes a base64url-encoded cursor string. Throws if the string is invalid
     * or does not represent a valid RegionPreviewsCursor shape.
     */
    static decodeBase64(encoded: string): RegionPreviewsCursor {
        const obj = Cursor.parseBase64Url(encoded, 'region previews cursor');
        Cursor.validateCursorType(obj, CursorType.RegionPreviews, 'Region previews cursor');

        if (!('sortKey' in obj) || !('type' in obj) || !('id' in obj)) {
            throw new Error('Region previews cursor must be an object with sortKey, type, and id');
        }
        const sortKey = Number(obj.sortKey);
        if (Number.isNaN(sortKey)) {
            throw new Error(
                `Region previews cursor sortKey must be a number, got: ${JSON.stringify(obj.sortKey)}`,
            );
        }
        if (typeof obj.type !== 'string') {
            throw new Error(`Region previews cursor type must be a string, got: ${typeof obj.type}`);
        }
        if (typeof obj.id !== 'string') {
            throw new Error(`Region previews cursor id must be a string, got: ${typeof obj.id}`);
        }
        return new RegionPreviewsCursor(sortKey, obj.type, obj.id);
    }
}
