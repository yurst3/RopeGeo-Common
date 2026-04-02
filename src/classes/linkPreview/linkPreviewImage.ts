/**
 * Image metadata for {@link LinkPreview} (e.g. Open Graph image).
 */
export class LinkPreviewImage {
    constructor(
        public readonly url: string,
        public readonly height: string,
        public readonly width: string,
        public readonly type: string,
        public readonly alt: string,
    ) {}

    /**
     * Validates result has LinkPreviewImage fields and returns a LinkPreviewImage instance.
     */
    static fromResult(result: unknown): LinkPreviewImage {
        if (result == null || typeof result !== 'object' || Array.isArray(result)) {
            throw new Error('LinkPreviewImage result must be a non-array object');
        }
        const r = result as Record<string, unknown>;
        LinkPreviewImage.assertStringField(r, 'url');
        LinkPreviewImage.assertStringField(r, 'height');
        LinkPreviewImage.assertStringField(r, 'width');
        LinkPreviewImage.assertStringField(r, 'type');
        LinkPreviewImage.assertStringField(r, 'alt');
        return new LinkPreviewImage(
            r.url as string,
            r.height as string,
            r.width as string,
            r.type as string,
            r.alt as string,
        );
    }

    private static assertStringField(obj: Record<string, unknown>, key: string): void {
        if (!(key in obj)) {
            throw new Error(`LinkPreviewImage.${key} is required`);
        }
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(
                `LinkPreviewImage.${key} must be a string, got: ${typeof v}`,
            );
        }
    }
}
