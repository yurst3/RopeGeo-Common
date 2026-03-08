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

    /** Type guard: narrows Preview to PagePreview. */
    static isPagePreview(value: Preview): value is PagePreview {
        return value.previewType === PreviewType.Page;
    }

    /** Type guard: narrows Preview to RegionPreview. */
    static isRegionPreview(value: Preview): value is RegionPreview {
        return value.previewType === PreviewType.Region;
    }
}
