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
     * Returns an object suitable for use as query string parameters.
     */
    toQueryStringParams(): Record<string, string> {
        if (this.region === null) {
            return {};
        }
        return {
            source: this.region.source,
            region: this.region.id,
        };
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

    private static parseSource(value: string): PageDataSource {
        if (value === PageDataSource.Ropewiki) {
            return PageDataSource.Ropewiki;
        }
        throw new Error(
            `Query parameter "source" must be one of: ${Object.values(PageDataSource).join(', ')}`,
        );
    }
}
