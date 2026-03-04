import { PageDataSource } from '../../pageDataSource';

export interface RegionPreview {
    id: string;
    name: string;
    parents: string[];
    imageUrl: string | null;
    source: PageDataSource;
}
