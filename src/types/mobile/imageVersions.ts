/**
 * Encoded image rendition keys stored for a Ropewiki image (URLs or local paths).
 */
export enum ImageVersion {
    preview = 'preview',
    linkPreview = 'linkPreview',
    banner = 'banner',
    full = 'full',
    lossless = 'lossless',
}

/** MIME type for each encoded version (single source of truth for container/codec). */
export const VERSION_FORMAT: Record<ImageVersion, string> = {
    [ImageVersion.preview]: 'image/avif',
    [ImageVersion.linkPreview]: 'image/jpeg',
    [ImageVersion.banner]: 'image/avif',
    [ImageVersion.full]: 'image/avif',
    [ImageVersion.lossless]: 'image/avif',
};

const IMAGE_VERSION_VALUES = new Set<string>(Object.values(ImageVersion));

/**
 * Local filesystem paths for downloaded image renditions (per Ropewiki image id).
 * Use bracket access, e.g. `iv[ImageVersion.banner]`.
 */
export interface ImageVersions extends Partial<Record<ImageVersion, string | null>> {}

export class ImageVersions {
    constructor(init: Partial<Record<ImageVersion, string | null>> = {}) {
        const self = this as Partial<Record<ImageVersion, string | null>>;
        for (const v of Object.values(ImageVersion)) {
            if (Object.prototype.hasOwnProperty.call(init, v)) {
                const val = init[v];
                if (val !== undefined) {
                    self[v] = val;
                }
            }
        }
    }

    static fromResult(result: unknown): ImageVersions {
        if (result == null || typeof result !== 'object') {
            throw new Error('ImageVersions result must be an object');
        }
        const r = result as Record<string, unknown>;
        for (const key of Object.keys(r)) {
            if (!IMAGE_VERSION_VALUES.has(key)) {
                throw new Error(`ImageVersions: unknown key "${key}"`);
            }
            ImageVersions.assertStringOrNull(r, key);
        }
        const init: Partial<Record<ImageVersion, string | null>> = {};
        for (const v of Object.values(ImageVersion)) {
            if (v in r) {
                init[v] = r[v] as string | null;
            }
        }
        return new ImageVersions(init);
    }

    private static assertStringOrNull(obj: Record<string, unknown>, key: string): void {
        const val = obj[key];
        if (val !== null && typeof val !== 'string') {
            throw new Error(`ImageVersions.${key} must be a string or null, got: ${typeof val}`);
        }
    }

    toPlain(): Record<ImageVersion, string | null> {
        return {
            [ImageVersion.preview]: this[ImageVersion.preview] ?? null,
            [ImageVersion.linkPreview]: this[ImageVersion.linkPreview] ?? null,
            [ImageVersion.banner]: this[ImageVersion.banner] ?? null,
            [ImageVersion.full]: this[ImageVersion.full] ?? null,
            [ImageVersion.lossless]: this[ImageVersion.lossless] ?? null,
        };
    }
}
