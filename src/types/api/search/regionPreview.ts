import { PageDataSource } from '../../pageDataSource';

export interface RegionPreview {
    id: string;
    name: string;
    parents: string[];
    pageCount: number;
    imageUrl: string | null;
    source: PageDataSource;
}
