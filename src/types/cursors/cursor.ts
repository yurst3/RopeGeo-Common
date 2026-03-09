export enum CursorType {
    Search = 'search',
    RegionPreviews = 'region_previews',
    RegionImages = 'region_images',
}

/**
 * Base64url encode/decode that works in Node (Buffer) and in React Native/browser (atob/btoa + TextEncoder/TextDecoder).
 * Avoids relying on Node's Buffer so cursor parsing works in RN.
 */
function base64UrlEncode(utf8: string): string {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(utf8, 'utf8').toString('base64url');
    }
    const bytes = new TextEncoder().encode(utf8);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]!);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(encoded: string): string {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (encoded.length % 4)) % 4);
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(base64, 'base64').toString('utf8');
    }
    const binary = atob(base64);
    return new TextDecoder().decode(Uint8Array.from(binary, (c) => (c as string).charCodeAt(0)));
}

/**
 * Base class for pagination cursors. Each cursor encodes to base64url JSON
 * including cursorType so decoding can validate the correct cursor kind.
 */
export abstract class Cursor {
    abstract readonly cursorType: CursorType;

    /** Subclasses return their payload (without cursorType; base adds it). */
    protected abstract toPayload(): Record<string, unknown>;

    encodeBase64(): string {
        return base64UrlEncode(
            JSON.stringify({ cursorType: this.cursorType, ...this.toPayload() }),
        );
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
            const json = base64UrlDecode(encoded);
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
