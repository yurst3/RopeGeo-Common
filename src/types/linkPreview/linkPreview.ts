import { LinkPreviewImage } from './linkPreviewImage';

/**
 * Social / crawler link preview payload for a Ropewiki page (GET link-preview).
 */
export class LinkPreview {
    constructor(
        public readonly title: string,
        public readonly description: string,
        public readonly image: LinkPreviewImage | null,
        public readonly siteName: string,
        public readonly type: string,
    ) {}

    /**
     * Validates result has LinkPreview fields and returns a LinkPreview instance.
     */
    static fromResult(result: unknown): LinkPreview {
        if (result == null || typeof result !== 'object' || Array.isArray(result)) {
            throw new Error('LinkPreview result must be a non-array object');
        }
        const r = result as Record<string, unknown>;
        LinkPreview.assertStringField(r, 'title');
        LinkPreview.assertStringField(r, 'description');
        LinkPreview.assertStringField(r, 'siteName');
        LinkPreview.assertStringField(r, 'type');

        let image: LinkPreviewImage | null;
        if (!('image' in r)) {
            throw new Error('LinkPreview.image is required (use null when absent)');
        }
        const imgRaw = r.image;
        if (imgRaw === null) {
            image = null;
        } else if (imgRaw === undefined) {
            throw new Error('LinkPreview.image must be null or an object, got: undefined');
        } else {
            image = LinkPreviewImage.fromResult(imgRaw);
        }

        return new LinkPreview(
            r.title as string,
            r.description as string,
            image,
            r.siteName as string,
            r.type as string,
        );
    }

    private static assertStringField(obj: Record<string, unknown>, key: string): void {
        if (!(key in obj)) {
            throw new Error(`LinkPreview.${key} is required`);
        }
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(`LinkPreview.${key} must be a string, got: ${typeof v}`);
        }
    }
}
