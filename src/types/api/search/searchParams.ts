import { CursorPaginationParams } from '../../params/cursorPaginationParams';
import { SearchCursor } from '../../cursors/searchCursor';

export type SearchOrder = 'similarity' | 'quality';

const DEFAULT_LIMIT = 20;

/** UUID v4 format: 8-4-4-4-12 hex digits */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validated search parameters. Cursor is stored decoded (SearchCursor | null).
 * The constructor accepts an encoded cursor string and decodes it.
 */
export class SearchParams extends CursorPaginationParams<SearchCursor> {
    public readonly name: string;
    public readonly similarityThreshold: number;
    public readonly includePages: boolean;
    public readonly includeRegions: boolean;
    public readonly includeAka: boolean;
    public readonly regionId: string | null;
    public readonly order: SearchOrder;

    constructor(
        name: string,
        similarityThreshold: number,
        includePages: boolean,
        includeRegions: boolean,
        includeAka: boolean,
        regionId: string | null,
        order: SearchOrder,
        limit: number,
        cursorEncoded?: string,
    ) {
        if (typeof name !== 'string' || name.trim() === '') {
            throw new Error('Missing or empty required query parameter: name');
        }
        if (
            typeof similarityThreshold !== 'number' ||
            Number.isNaN(similarityThreshold) ||
            similarityThreshold < 0 ||
            similarityThreshold > 1
        ) {
            throw new Error(
                'Query parameter "similarity" must be a number between 0 and 1',
            );
        }
        if (!includePages && !includeRegions) {
            throw new Error(
                'At least one of include-pages or include-regions must be true',
            );
        }
        if (includeAka && !includePages) {
            throw new Error(
                'include-aka cannot be true when include-pages is false',
            );
        }
        if (order !== 'similarity' && order !== 'quality') {
            throw new Error(
                'Query parameter "order" must be one of: similarity, quality',
            );
        }
        const limitNum = Number(limit);
        if (
            Number.isNaN(limitNum) ||
            !Number.isInteger(limitNum) ||
            limitNum < 1
        ) {
            throw new Error(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        }
        const trimmedRegionId =
            (regionId !== null && regionId !== '' ? regionId.trim() : null) || null;
        if (trimmedRegionId !== null && !UUID_REGEX.test(trimmedRegionId)) {
            throw new Error(
                'Query parameter "region" must be a valid UUID',
            );
        }
        const cursorNorm =
            cursorEncoded === undefined || cursorEncoded === null || cursorEncoded === ''
                ? null
                : cursorEncoded;
        let cursor: SearchCursor | null = null;
        if (cursorNorm !== null) {
            cursor = SearchCursor.decodeBase64(cursorNorm);
        }

        super(limitNum, cursor);
        this.name = name;
        this.similarityThreshold = similarityThreshold;
        this.includePages = includePages;
        this.includeRegions = includeRegions;
        this.includeAka = includeAka;
        this.regionId = trimmedRegionId;
        this.order = order;
    }

    /**
     * Returns a URL-encoded query string. Cursor is encoded for the query string.
     */
    toQueryString(): string {
        const params: Record<string, string> = {
            name: this.name,
            similarity: String(this.similarityThreshold),
            'include-pages': String(this.includePages),
            'include-regions': String(this.includeRegions),
            'include-aka': String(this.includeAka),
            order: this.order,
            limit: String(this.limit),
        };
        if (this.regionId !== null && this.regionId !== '') {
            params.region = this.regionId;
        }
        if (this.cursor !== null) {
            params.cursor = this.cursor.encodeBase64();
        }
        return new URLSearchParams(params).toString();
    }

    withCursor(cursorEncoded: string | null): SearchParams {
        return new SearchParams(
            this.name,
            this.similarityThreshold,
            this.includePages,
            this.includeRegions,
            this.includeAka,
            this.regionId,
            this.order,
            this.limit,
            cursorEncoded === null || cursorEncoded === '' ? undefined : cursorEncoded,
        );
    }

    /**
     * Parses query string parameters and returns validated params.
     * Validation is performed by the constructor.
     */
    static fromQueryStringParams(
        q: Record<string, string | undefined>,
    ): SearchParams {
        const name = (q.name ?? q.Name ?? '').trim();
        const limitParam = q.limit ?? q.Limit ?? '';
        const limit = limitParam === '' ? DEFAULT_LIMIT : Number(limitParam);
        const cursorRaw = (q.cursor ?? q.Cursor ?? '').trim();
        const cursorEncoded = cursorRaw === '' ? undefined : cursorRaw;
        const similarityParam = q.similarity ?? q.Similarity ?? '';
        const similarity =
            similarityParam === '' ? 0.5 : Number(similarityParam);
        const orderParam = (q.order ?? q.Order ?? '').trim().toLowerCase();
        const order = (orderParam === 'quality'
            ? 'quality'
            : orderParam === 'similarity'
              ? 'similarity'
              : orderParam || 'similarity') as SearchOrder;
        const includePages = SearchParams.parseBoolean(
            q['include-pages'] ?? q['Include-Pages'],
            true,
        );
        const includeRegions = SearchParams.parseBoolean(
            q['include-regions'] ?? q['Include-Regions'],
            true,
        );
        const includeAkaParam = q['include-aka'] ?? q['Include-Aka'];
        const includeAkaExplicit = (includeAkaParam ?? '').trim() !== '';
        const includeAka = includeAkaExplicit
            ? SearchParams.parseBoolean(includeAkaParam, true)
            : includePages;
        const region = (q.region ?? q.Region ?? '').trim() || null;

        return new SearchParams(
            name,
            similarity,
            includePages,
            includeRegions,
            includeAka,
            region,
            order,
            limit,
            cursorEncoded,
        );
    }

    /**
     * Parses a boolean from a query string value. Returns defaultValue when value is undefined or empty.
     * Throws when value is a non-empty string that is not "true", "false", "1", or "0" (case-insensitive).
     */
    private static parseBoolean(
        value: string | undefined,
        defaultValue: boolean,
    ): boolean {
        if (value === undefined || value === '') return defaultValue;
        const lower = value.toLowerCase().trim();
        if (lower === 'true' || lower === '1') return true;
        if (lower === 'false' || lower === '0') return false;
        throw new Error(
            `Query parameter value must be true, false, 1, or 0 (case-insensitive), got: ${JSON.stringify(value)}`,
        );
    }
}
