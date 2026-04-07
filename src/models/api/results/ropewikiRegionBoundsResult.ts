import { Bounds } from '../../minimap/bounds';
import { registerResultParser, Result, ResultType } from './result';

/**
 * Result of GET /ropewiki/region/{id}/bounds (bounding box over route coordinates).
 */
export class RopewikiRegionBoundsResult extends Result<Bounds> {
    constructor(public readonly result: Bounds) {
        super(result, ResultType.RopewikiRegionBounds);
    }

    static fromResult(value: unknown): RopewikiRegionBoundsResult {
        return new RopewikiRegionBoundsResult(Bounds.fromResult(value));
    }
}

registerResultParser(ResultType.RopewikiRegionBounds, (v) =>
    RopewikiRegionBoundsResult.fromResult(v),
);
