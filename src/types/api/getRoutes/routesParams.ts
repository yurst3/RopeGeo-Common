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
     * Validates a JSON-like object shaped like this class: optional top-level `region` (or `Region`)
     * is either `null`/`undefined` (no filter) or `{ source, id }` with {@link PageDataSource} source
     * and region id string. Inner keys may use `Source` / `Id`.
     *
     * @param requiredRegion - If true, `region` must be a non-null object with both `source` and `id`.
     */
    static fromResult(result: unknown, requiredRegion = false): RoutesParams {
        if (result == null || typeof result !== 'object') {
            throw new Error('RoutesParams result must be an object');
        }
        const r = result as Record<string, unknown>;
        const raw = r.region ?? r.Region;

        if (typeof raw === 'string') {
            throw new Error(
                'RoutesParams.region must be an object { source, id } or null, not a string',
            );
        }

        if (raw === null || raw === undefined) {
            if (requiredRegion) {
                throw new Error(
                    'RoutesParams: region must be a non-null { source, id } object when requiredRegion is true',
                );
            }
            return new RoutesParams(undefined, undefined);
        }

        if (typeof raw !== 'object') {
            throw new Error(
                'RoutesParams.region must be an object or null, got: ' + typeof raw,
            );
        }

        const reg = raw as Record<string, unknown>;
        const sourceRaw = reg.source ?? reg.Source;
        const idRaw = reg.id ?? reg.Id;
        const sourceStr = RoutesParams.coerceTrimmedString(
            sourceRaw,
            'region.source',
        );
        const idStr = RoutesParams.coerceTrimmedString(idRaw, 'region.id');

        if (sourceStr === '' || idStr === '') {
            throw new Error(
                'RoutesParams.region must include non-empty source and id',
            );
        }
        const source = RoutesParams.parseSource(sourceStr);
        return new RoutesParams(source, idStr);
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
