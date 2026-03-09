import { Preview } from '../../previews/preview';
import { SearchCursor } from '../../cursors/searchCursor';
import {
    CursorPaginationResults,
    type CursorPaginationResponseParsed,
    ResultType,
} from '../../results/cursorPaginationResults';

export class SearchResults extends CursorPaginationResults<Preview> {
    constructor(results: Preview[], nextCursor: SearchCursor | string | null) {
        const nextCursorStr =
            nextCursor === null || typeof nextCursor === 'string'
                ? nextCursor
                : nextCursor.encodeBase64();
        super(results, nextCursorStr, ResultType.Search);
    }

    /**
     * Build from validated { results, nextCursor }. Decodes nextCursor to ensure valid.
     * Each result is validated via Preview.fromResult.
     */
    static fromResponseBody(body: CursorPaginationResponseParsed): SearchResults {
        const { results: resultsRaw, nextCursor } = body;
        if (nextCursor != null) {
            SearchCursor.decodeBase64(nextCursor);
        }
        const results = resultsRaw.map((r) => Preview.fromResult(r));
        return new SearchResults(results, nextCursor);
    }
}
