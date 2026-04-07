import { Preview } from '../../previews/preview';
import { SearchCursor } from '../params/cursors/searchCursor';
import {
    CursorPaginationResults,
    type ValidatedCursorPaginationResponse,
    CursorPaginationResultType,
    registerCursorPaginationParser,
} from './cursorPaginationResults';

export class SearchResults extends CursorPaginationResults<Preview> {
    constructor(results: Preview[], nextCursor: SearchCursor | string | null) {
        const nextCursorStr =
            nextCursor === null || typeof nextCursor === 'string'
                ? nextCursor
                : nextCursor.encodeBase64();
        super(results, nextCursorStr, CursorPaginationResultType.Search);
    }

    /**
     * Build from validated { results, nextCursor }. Decodes nextCursor to ensure valid.
     * Each result is validated via Preview.fromResult.
     */
    static fromResponseBody(body: ValidatedCursorPaginationResponse): SearchResults {
        const { results: resultsRaw, nextCursor } = body;
        if (nextCursor != null) {
            SearchCursor.decodeBase64(nextCursor);
        }
        const results = resultsRaw.map((r) => Preview.fromResult(r));
        return new SearchResults(results, nextCursor);
    }
}

// Side-effect registration so the base `CursorPaginationResults` class does not import this
// subclass to route `fromResponseBody` (that would be a circular dependency).
registerCursorPaginationParser(CursorPaginationResultType.Search, (validated) =>
    SearchResults.fromResponseBody(validated),
);
