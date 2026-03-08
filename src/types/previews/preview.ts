import { PagePreview } from './pagePreview';
import { RegionPreview } from './regionPreview';

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
}
