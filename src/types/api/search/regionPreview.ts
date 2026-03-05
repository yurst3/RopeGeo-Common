import { PageDataSource } from '../../pageDataSource';

export class RegionPreview {
    readonly previewType = 'region' as const;
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
        pageCount: number | null,
        regionCount: number | null,
        imageUrl: string | null,
        source: PageDataSource,
    ) {
        this.id = id;
        this.name = name;
        this.parents = parents;
        this.pageCount = pageCount ?? 0;
        this.regionCount = regionCount ?? 0;
        this.imageUrl = imageUrl;
        this.source = source;
    }
}
