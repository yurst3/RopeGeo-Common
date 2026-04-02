import { registerResultParser, Result, ResultType } from '../../results/result';
import { RopewikiRegionView } from './ropewikiRegionView';

/**
 * Result of getRopewikiRegionView (GET /ropewiki/region/{id}).
 */
export class RopewikiRegionViewResult extends Result<RopewikiRegionView> {
    constructor(public readonly result: RopewikiRegionView) {
        super(result, ResultType.RopewikiRegionView);
    }

    /**
     * Validates and parses result via RopewikiRegionView.fromResult.
     */
    static fromResult(result: unknown): RopewikiRegionViewResult {
        const parsed = RopewikiRegionView.fromResult(result);
        return new RopewikiRegionViewResult(parsed);
    }
}

// Side-effect registration so the base `Result` class does not import this subclass to route
// `fromResponseBody` → `fromResult` (that would be a circular dependency).
registerResultParser(ResultType.RopewikiRegionView, (v) => RopewikiRegionViewResult.fromResult(v));
