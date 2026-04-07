import type { PagePreview } from './pagePreview';
import type { RegionPreview } from './regionPreview';

export enum PreviewType {
    Page = 'page',
    Region = 'region',
}

/**
 * Base type for previews (e.g. page or region).
 */
export abstract class Preview {
    abstract readonly previewType: PreviewType;

    /** Type guard: narrows this to PagePreview. */
    isPagePreview(): this is PagePreview {
        return this.previewType === PreviewType.Page;
    }

    /** Type guard: narrows this to RegionPreview. */
    isRegionPreview(): this is RegionPreview {
        return this.previewType === PreviewType.Region;
    }

    /**
     * Validates result has previewType and delegates to PagePreview.fromResult or
     * RegionPreview.fromResult. Returns the same object with the appropriate prototype.
     */
    static fromResult(result: unknown): Preview {
        if (result == null || typeof result !== 'object') {
            throw new Error('Preview result must be an object');
        }
        const obj = result as Record<string, unknown>;
        const previewType = obj.previewType;
        if (previewType !== PreviewType.Page && previewType !== PreviewType.Region) {
            throw new Error(
                `Preview result must have previewType "page" or "region", got: ${JSON.stringify(previewType)}`,
            );
        }
        if (previewType === PreviewType.Page) {
            const { PagePreview: PagePreviewClass } = require('./pagePreview');
            return PagePreviewClass.fromResult(result);
        }
        const { RegionPreview: RegionPreviewClass } = require('./regionPreview');
        return RegionPreviewClass.fromResult(result);
    }
}
