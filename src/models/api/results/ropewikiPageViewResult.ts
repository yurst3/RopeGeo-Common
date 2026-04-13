import { registerResultParser, Result, ResultType } from './result';
import { OnlineRopewikiPageView } from '../../pageViews/onlineRopewikiPageView';

/**
 * Result of getRopewikiPageView (GET /ropewiki/page/{id} or equivalent).
 */
export class RopewikiPageViewResult extends Result<OnlineRopewikiPageView> {
    constructor(public readonly result: OnlineRopewikiPageView) {
        super(result, ResultType.RopewikiPageView);
    }

    /**
     * Validates and parses result via RopewikiPageView.fromResult.
     */
    static fromResult(result: unknown): RopewikiPageViewResult {
        const parsed = OnlineRopewikiPageView.fromResult(result);
        return new RopewikiPageViewResult(parsed);
    }
}

// Side-effect registration so the base `Result` class does not import this subclass to route
// `fromResponseBody` → `fromResult` (that would be a circular dependency).
registerResultParser(ResultType.RopewikiPageView, (v) => RopewikiPageViewResult.fromResult(v));
