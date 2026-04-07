import { RouteGeoJsonFeature } from '../../routes/route';
import {
    PaginationResults,
    PaginationResultType,
    registerPaginationParser,
    type ValidatedPaginationResponse,
} from './paginationResults';

/**
 * Page of GET /routes: GeoJSON features with page-based pagination metadata.
 */
export class RouteResult extends PaginationResults<RouteGeoJsonFeature> {
    constructor(results: RouteGeoJsonFeature[], total: number, page: number) {
        super(results, total, page, PaginationResultType.Route);
    }

    static fromResponseBodyInner(
        _body: Record<string, unknown>,
        validated: ValidatedPaginationResponse,
    ): RouteResult {
        const results = validated.results.map((raw, i) => {
            try {
                return RouteGeoJsonFeature.fromResult(raw);
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                throw new Error(`RouteResult.results[${i}]: ${msg}`);
            }
        });
        return new RouteResult(results, validated.total, validated.page);
    }
}

registerPaginationParser(PaginationResultType.Route, (body, validated) =>
    RouteResult.fromResponseBodyInner(body, validated),
);
