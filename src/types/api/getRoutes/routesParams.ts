import { PageDataSource } from '../../pageDataSource';

/**
 * Validated params for getRoutes (GET /routes).
 * region is null when neither source nor region id are in the query; if one query param is present the other must also be present.
 */
export class RoutesParams {
    /** When set, both source and region id were provided in the query. */
    public readonly region: { source: PageDataSource; id: string } | null;

    constructor(source: PageDataSource | undefined, regionId: string | undefined) {
        const sourcePresent = source !== undefined;
        const regionPresent =
            regionId !== undefined &&
            typeof regionId === 'string' &&
            regionId !== '';
        if (sourcePresent !== regionPresent) {
            throw new Error(
                'Query parameters "source" and "region" must both be present or both be absent',
            );
        }
        this.region =
            sourcePresent && regionPresent
                ? { source: source!, id: regionId! }
                : null;
    }

    /**
     * Returns a URL-encoded query string.
     */
    toQueryString(): string {
        if (this.region === null) {
            return '';
        }
        return new URLSearchParams({
            source: this.region.source,
            region: this.region.id,
        }).toString();
    }

    /**
     * Parses query string parameters and returns validated params.
     * Validation is performed by the constructor.
     */
    static fromQueryStringParams(
        q: Record<string, string | undefined>,
    ): RoutesParams {
        const sourceRaw = (q.source ?? q.Source ?? '').trim();
        const regionRaw = (q.region ?? q.Region ?? '').trim();
        const source =
            sourceRaw === ''
                ? undefined
                : RoutesParams.parseSource(sourceRaw);
        const region = regionRaw === '' ? undefined : regionRaw;
        return new RoutesParams(source, region);
    }

    /**
     * Validates a JSON-like object with optional `source` / `region` (or `Source` / `Region`).
     * @param requiredRegion - If true, both source and region must be non-empty; if false, both may be absent (region null), and the usual both-or-neither rule applies when partially set.
     */
    static fromResult(result: unknown, requiredRegion = false): RoutesParams {
        if (result == null || typeof result !== 'object') {
            throw new Error('RoutesParams result must be an object');
        }
        const r = result as Record<string, unknown>;
        const sourceRaw = r.source ?? r.Source;
        const regionRaw = r.region ?? r.Region;
        const sourceStr = RoutesParams.coerceTrimmedString(sourceRaw, 'source');
        const regionStr = RoutesParams.coerceTrimmedString(regionRaw, 'region');
        const source =
            sourceStr === '' ? undefined : RoutesParams.parseSource(sourceStr);
        const regionId = regionStr === '' ? undefined : regionStr;
        if (requiredRegion) {
            if (source === undefined || regionId === undefined) {
                throw new Error(
                    'RoutesParams: source and region must both be non-empty strings when requiredRegion is true',
                );
            }
        }
        return new RoutesParams(source, regionId);
    }

    private static coerceTrimmedString(
        v: unknown,
        key: string,
    ): string {
        if (v === null || v === undefined) {
            return '';
        }
        if (typeof v !== 'string') {
            throw new Error(
                `RoutesParams.${key} must be a string, got: ${typeof v}`,
            );
        }
        return v.trim();
    }

    private static parseSource(value: string): PageDataSource {
        if (value === PageDataSource.Ropewiki) {
            return PageDataSource.Ropewiki;
        }
        throw new Error(
            `Query parameter "source" must be one of: ${Object.values(PageDataSource).join(', ')}`,
        );
    }
}
