import { registerResultParser, Result, ResultType } from './result';
import { OnlinePagePreview } from '../../previews/onlinePagePreview';

/**
 * Result of getPagePreviews (GET /page/preview?ids=...).
 * result is the page previews for the requested ids, in request order.
 * Ids with no matching page are omitted.
 */
export class PagePreviewsResult extends Result<OnlinePagePreview[]> {
    constructor(public readonly result: OnlinePagePreview[]) {
        super(result, ResultType.PagePreviews);
    }

    /**
     * Validates result is an array and parses each item via OnlinePagePreview.fromResult.
     */
    static fromResult(result: unknown): PagePreviewsResult {
        if (!Array.isArray(result)) {
            throw new Error(
                `PagePreviewsResult.result must be an array, got: ${typeof result}`,
            );
        }
        const parsed = result.map((item) => OnlinePagePreview.fromResult(item));
        return new PagePreviewsResult(parsed);
    }
}

// Side-effect registration so the base `Result` class does not import this subclass to route
// `fromResponseBody` → `fromResult` (that would be a circular dependency).
registerResultParser(ResultType.PagePreviews, (v) => PagePreviewsResult.fromResult(v));
