import { PageDataSource } from '../../pageDataSource';

/**
 * Validated params for getRoutes (GET /routes).
 * source and region are optional with no defaults; if one is present the other must also be present.
 */
export class RoutesParams {
    public readonly source: PageDataSource | undefined;
    public readonly region: string | undefined;

    constructor(source: PageDataSource | undefined, region: string | undefined) {
        const sourcePresent = source !== undefined;
        const regionPresent =
            region !== undefined && typeof region === 'string' && region !== '';
        if (sourcePresent !== regionPresent) {
            throw new Error(
                'Query parameters "source" and "region" must both be present or both be absent',
            );
        }
        this.source = sourcePresent ? source : undefined;
        this.region = regionPresent ? region : undefined;
    }

    /**
     * Returns an object suitable for use as query string parameters.
     */
    toQueryStringParams(): Record<string, string> {
        const params: Record<string, string> = {};
        if (this.source !== undefined) {
            params.source = this.source;
        }
        if (this.region !== undefined) {
            params.region = this.region;
        }
        return params;
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
