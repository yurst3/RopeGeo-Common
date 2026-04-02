/**
 * Discriminator for single-result API response types (e.g. getRopewikiPageView, getRoutes).
 * Used in response body so consumers can identify the result shape.
 */
export enum ResultType {
    RopewikiPageView = 'ropewikiPageView',
    RopewikiRegionView = 'ropewikiRegionView',
    RoutesGeojson = 'routesGeojson',
    RoutePreview = 'routePreview',
    RopewikiPageLinkPreview = 'ropewikiPageLinkPreview',
}

const resultParsers = new Map<ResultType, (resultValue: unknown) => Result>();

/**
 * Registers the parser for {@link Result.fromResponseBody} for a given {@link ResultType}.
 * Call once per type from the corresponding result module at load time.
 */
export function registerResultParser(
    type: ResultType,
    parse: (resultValue: unknown) => Result,
): void {
    resultParsers.set(type, parse);
}

/**
 * Base type for single-result API responses (result + resultType).
 * Each endpoint has a specific Result subclass with a typed result property.
 * fromResponseBody validates body (resultType, result) then delegates to the
 * corresponding Result class's fromResult.
 */
export abstract class Result<R = unknown> {
    constructor(
        public readonly result: R,
        public readonly resultType: ResultType,
    ) {}

    /**
     * Validates body (object, resultType, result), then delegates to the
     * corresponding Result class's fromResult with the result value.
     */
    static fromResponseBody(body: unknown): Result {
        if (body == null || typeof body !== 'object') {
            throw new Error('Response body must be an object');
        }
        const b = body as Record<string, unknown>;
        if (!('resultType' in b)) {
            throw new Error('Response body must have resultType');
        }
        const resultType = b.resultType;
        const valid = Object.values(ResultType) as string[];
        if (typeof resultType !== 'string' || !valid.includes(resultType)) {
            throw new Error(
                `Response body.resultType must be one of [${valid.join(', ')}], got: ${JSON.stringify(resultType)}`,
            );
        }
        if (!('result' in b)) {
            throw new Error('Response body must have result');
        }
        const resultValue = b.result;
        const parser = resultParsers.get(resultType as ResultType);
        if (parser === undefined) {
            throw new Error(
                `No result parser registered for resultType ${JSON.stringify(resultType)}`,
            );
        }
        return parser(resultValue);
    }
}
