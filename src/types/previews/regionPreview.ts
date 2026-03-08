import { PageDataSource } from '../pageDataSource';
import { Preview, PreviewType } from './preview';

export class RegionPreview extends Preview {
    readonly previewType = PreviewType.Region;
    id: string;
    name: string;
    parents: string[];
    pageCount: number;
    regionCount: number;
    imageUrl: string | null;
    source: PageDataSource;

    constructor(
        id: string,
        name: string,
        parents: string[],
        pageCount: number,
        regionCount: number,
        imageUrl: string | null,
        source: PageDataSource,
    ) {
        super();
        this.id = id;
        this.name = name;
        this.parents = parents;
        this.pageCount = pageCount;
        this.regionCount = regionCount;
        this.imageUrl = imageUrl;
        this.source = source;
    }
}
