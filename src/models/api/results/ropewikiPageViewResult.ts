import { registerResultParser, Result, ResultType } from './result';
import { RopewikiPageView } from '../endpoints/ropewikiPageView';

/**
 * Result of getRopewikiPageView (GET /ropewiki/page/{id} or equivalent).
 */
export class RopewikiPageViewResult extends Result<RopewikiPageView> {
    constructor(public readonly result: RopewikiPageView) {
        super(result, ResultType.RopewikiPageView);
    }

    /**
     * Validates and parses result via RopewikiPageView.fromResult.
     */
    static fromResult(result: unknown): RopewikiPageViewResult {
        const parsed = RopewikiPageView.fromResult(result);
        return new RopewikiPageViewResult(parsed);
    }
}

// Side-effect registration so the base `Result` class does not import this subclass to route
// `fromResponseBody` → `fromResult` (that would be a circular dependency).
registerResultParser(ResultType.RopewikiPageView, (v) => RopewikiPageViewResult.fromResult(v));
