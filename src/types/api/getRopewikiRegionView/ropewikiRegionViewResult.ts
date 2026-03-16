import { Result, ResultType } from '../../results/result';
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
