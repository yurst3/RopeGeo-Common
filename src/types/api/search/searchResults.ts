import { Preview } from '../../previews/preview';
import { SearchCursor } from '../../cursors/searchCursor';

export class SearchResults {
    results: Preview[];
    nextCursor: string | null;

    constructor(results: Preview[], nextCursor: SearchCursor | null) {
        this.results = results;
        this.nextCursor = nextCursor !== null ? nextCursor.encodeBase64() : null;
    }
}
