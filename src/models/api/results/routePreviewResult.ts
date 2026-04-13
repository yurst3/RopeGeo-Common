import { registerResultParser, Result, ResultType } from './result';
import { OnlinePagePreview } from '../../previews/onlinePagePreview';

/**
 * Result of getRoutePreview (GET /route/{routeId}/preview).
 * result is the array of page previews for the route.
 */
export class RoutePreviewResult extends Result<OnlinePagePreview[]> {
    constructor(public readonly result: OnlinePagePreview[]) {
        super(result, ResultType.RoutePreview);
    }

    /**
     * Validates result is an array and parses each item via PagePreview.fromResult.
     */
    static fromResult(result: unknown): RoutePreviewResult {
        if (!Array.isArray(result)) {
            throw new Error(
                `RoutePreviewResult.result must be an array, got: ${typeof result}`,
            );
        }
        const parsed = result.map((item) => OnlinePagePreview.fromResult(item));
        return new RoutePreviewResult(parsed);
    }
}

// Side-effect registration so the base `Result` class does not import this subclass to route
// `fromResponseBody` → `fromResult` (that would be a circular dependency).
registerResultParser(ResultType.RoutePreview, (v) => RoutePreviewResult.fromResult(v));
