/**
 * Local filesystem paths for downloaded image renditions (per Ropewiki image id).
 */
export class ImageVersions {
    readonly preview: string | null;

    readonly banner: string | null;

    readonly full: string | null;

    constructor(preview: string | null, banner: string | null, full: string | null) {
        this.preview = preview;
        this.banner = banner;
        this.full = full;
    }

    static fromResult(result: unknown): ImageVersions {
        if (result == null || typeof result !== 'object') {
            throw new Error('ImageVersions result must be an object');
        }
        const r = result as Record<string, unknown>;
        ImageVersions.assertStringOrNull(r, 'preview');
        ImageVersions.assertStringOrNull(r, 'banner');
        ImageVersions.assertStringOrNull(r, 'full');
        return new ImageVersions(
            r.preview as string | null,
            r.banner as string | null,
            r.full as string | null,
        );
    }

    private static assertStringOrNull(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (v !== null && typeof v !== 'string') {
            throw new Error(`ImageVersions.${key} must be a string or null, got: ${typeof v}`);
        }
    }

    toPlain(): { preview: string | null; banner: string | null; full: string | null } {
        return {
            preview: this.preview,
            banner: this.banner,
            full: this.full,
        };
    }
}
