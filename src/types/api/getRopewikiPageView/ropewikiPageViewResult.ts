import { Result, ResultType } from '../../results/result';
import { RopewikiPageView } from './ropewikiPageView';

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
