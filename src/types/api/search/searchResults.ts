import { PagePreview } from '../getRoutePreview/pagePreview';
import { RegionPreview } from './regionPreview';
import { SearchCursor } from './searchCursor';

export class SearchResults {
    results: (PagePreview | RegionPreview)[];
    nextCursor: string;

    constructor(results: (PagePreview | RegionPreview)[], nextCursorCursor: SearchCursor | null) {
        this.results = results;
        this.nextCursor = nextCursorCursor !== null ? nextCursorCursor.encodeBase64() : '';
    }
}
