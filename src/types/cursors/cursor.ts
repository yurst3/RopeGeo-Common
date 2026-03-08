/// <reference types="node" />

export enum CursorType {
    Search = 'search',
    RegionPreviews = 'region_previews',
    RegionImages = 'region_images',
}

const ENCODING = 'utf8';
const BASE64URL = 'base64url';

/**
 * Base class for pagination cursors. Each cursor encodes to base64url JSON
 * including cursorType so decoding can validate the correct cursor kind.
 */
export abstract class Cursor {
    abstract readonly cursorType: CursorType;

    /** Subclasses return their payload (without cursorType; base adds it). */
    protected abstract toPayload(): Record<string, unknown>;

    encodeBase64(): string {
        return Buffer.from(
            JSON.stringify({ cursorType: this.cursorType, ...this.toPayload() }),
            ENCODING,
        ).toString(BASE64URL);
    }

    /**
     * Decodes a base64url-encoded cursor string to a plain object.
     * Subclasses should call this then validate cursorType and required keys.
     */
    protected static parseBase64Url(encoded: string, errorLabel: string): Record<string, unknown> {
        if (typeof encoded !== 'string' || encoded === '') {
            throw new Error(`${errorLabel} must be a non-empty string`);
        }
        let decoded: unknown;
        try {
            const json = Buffer.from(encoded, BASE64URL).toString(ENCODING);
            decoded = JSON.parse(json);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(`Invalid ${errorLabel} encoding: ${message}`);
        }
        if (decoded == null || typeof decoded !== 'object') {
            throw new Error(`${errorLabel} must be an object`);
        }
        return decoded as Record<string, unknown>;
    }

    /**
     * Validates that the decoded object has the expected cursorType.
     * @throws if cursorType is missing or does not match
     */
    protected static validateCursorType(
        obj: Record<string, unknown>,
        expected: CursorType,
        errorLabel: string,
    ): void {
        if (!('cursorType' in obj)) {
            throw new Error(`${errorLabel} must have a cursorType property`);
        }
        if (obj.cursorType !== expected) {
            throw new Error(
                `${errorLabel} cursorType must be "${expected}", got: ${JSON.stringify(obj.cursorType)}`,
            );
        }
    }
}
