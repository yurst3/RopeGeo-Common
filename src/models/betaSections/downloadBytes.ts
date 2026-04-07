/**
 * Byte sizes for preview / banner / full image renditions (for offline download progress).
 */
export class DownloadBytes {
    preview: number;
    banner: number;
    full: number;

    constructor(preview: number, banner: number, full: number) {
        this.preview = preview;
        this.banner = banner;
        this.full = full;
    }

    /**
     * Validates result has DownloadBytes fields and returns a DownloadBytes instance.
     */
    static fromResult(result: unknown): DownloadBytes {
        if (result == null || typeof result !== 'object') {
            throw new Error('DownloadBytes result must be an object');
        }
        const r = result as Record<string, unknown>;
        DownloadBytes.assertNonNegativeFiniteNumber(r, 'preview');
        DownloadBytes.assertNonNegativeFiniteNumber(r, 'banner');
        DownloadBytes.assertNonNegativeFiniteNumber(r, 'full');
        Object.setPrototypeOf(r, DownloadBytes.prototype);
        return r as unknown as DownloadBytes;
    }

    private static assertNonNegativeFiniteNumber(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (
            typeof v !== 'number' ||
            Number.isNaN(v) ||
            !Number.isFinite(v) ||
            v < 0
        ) {
            throw new Error(
                `DownloadBytes.${key} must be a finite non-negative number, got: ${JSON.stringify(v)}`,
            );
        }
    }
}
