import { PageDataSource } from '../../pageDataSource';

export interface RegionPreview {
    id: string;
    name: string;
    parents: string[];
    bannerUrl: string | null;
    source: PageDataSource;
}
