import { registerResultParser, Result, ResultType } from '../../results/result';
import { RoutesGeojson } from './routeGeojson';

/**
 * Result of getRoutes (GET /routes).
 */
export class RoutesGeojsonResult extends Result<RoutesGeojson> {
    constructor(public readonly result: RoutesGeojson) {
        super(result, ResultType.RoutesGeojson);
    }

    /**
     * Validates and parses result via RoutesGeojson.fromResult.
     */
    static fromResult(result: unknown): RoutesGeojsonResult {
        const parsed = RoutesGeojson.fromResult(result);
        return new RoutesGeojsonResult(parsed);
    }
}

// Side-effect registration so the base `Result` class does not import this subclass to route
// `fromResponseBody` → `fromResult` (that would be a circular dependency).
registerResultParser(ResultType.RoutesGeojson, (v) => RoutesGeojsonResult.fromResult(v));
