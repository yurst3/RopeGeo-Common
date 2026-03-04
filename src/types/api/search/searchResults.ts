import { PagePreview } from '../getRoutePreview/pagePreview';
import { RegionPreview } from './regionPreview';

export interface SearchResults {
    results: (PagePreview | RegionPreview)[];
    nextCursor: string;
}
