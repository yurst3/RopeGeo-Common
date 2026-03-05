import { PagePreview } from '../getRoutePreview/pagePreview';
import { RegionPreview } from './regionPreview';
import { SearchCursor } from './searchCursor';

export class SearchResults {
    results: (PagePreview | RegionPreview)[];
    nextCursor: string | null;

    constructor(results: (PagePreview | RegionPreview)[], nextCursor: SearchCursor | null) {
        this.results = results;
        this.nextCursor = nextCursor !== null ? nextCursor.encodeBase64() : null;
    }
}
