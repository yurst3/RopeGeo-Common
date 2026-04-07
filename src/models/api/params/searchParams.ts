import { CursorPaginationParams } from './cursorPaginationParams';
import { SearchCursor } from './cursors/searchCursor';
import { PageDataSource } from '../../pageDataSource';
import './registerDifficultyParamsParsers';
import { DifficultyParams } from './difficultyParams';

export type SearchOrder = 'similarity' | 'quality' | 'distance';

const DEFAULT_LIMIT = 20;

/** UUID v4 format */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SearchParamsPosition = { lat: number; lon: number };

/**
 * Validated search parameters. `name` may be empty (trimmed); semantics depend on `order`.
 * `regionId` removed in favor of optional `source` allow-list (empty/absent = all sources).
 */
export class SearchParams extends CursorPaginationParams<SearchCursor> {
    /** Trimmed search string; may be empty when order is `quality` or `distance`. */
    public readonly name: string;
    public readonly similarityThreshold: number;
    public readonly includePages: boolean;
    public readonly includeRegions: boolean;
    public readonly includeAka: boolean;
    public readonly order: SearchOrder;
    /** Required when `order === 'distance'`; otherwise null. */
    public readonly currentPosition: SearchParamsPosition | null;
    /** Null or empty after parse = all sources; otherwise allow-list. */
    public readonly source: PageDataSource[] | null;
    public readonly difficulty: DifficultyParams | null;

    constructor(
        name: string | null | undefined,
        similarityThreshold: number,
        includePages: boolean,
        includeRegions: boolean,
        includeAka: boolean,
        order: SearchOrder,
        limit: number,
        cursorEncoded?: string,
        currentPosition?: SearchParamsPosition | null,
        source?: PageDataSource[] | null,
        difficulty?: DifficultyParams | null,
    ) {
        const nameNorm =
            name === null || name === undefined ? '' : name.trim();

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
        if (order !== 'similarity' && order !== 'quality' && order !== 'distance') {
            throw new Error(
                'Query parameter "order" must be one of: similarity, quality, distance',
            );
        }
        if (order === 'distance') {
            if (
                currentPosition == null ||
                typeof currentPosition.lat !== 'number' ||
                typeof currentPosition.lon !== 'number' ||
                Number.isNaN(currentPosition.lat) ||
                Number.isNaN(currentPosition.lon)
            ) {
                throw new Error(
                    'When order is "distance", query parameters "lat" and "lon" must be valid numbers',
                );
            }
            if (includeRegions) {
                throw new Error(
                    'When order is "distance", include-regions must be false',
                );
            }
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

        const diff =
            difficulty !== null &&
            difficulty !== undefined &&
            difficulty.isActive()
                ? difficulty
                : null;
        if (diff !== null && !includePages) {
            throw new Error(
                'When a difficulty filter is active, include-pages must be true',
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
        this.name = nameNorm;
        this.similarityThreshold = similarityThreshold;
        this.includePages = includePages;
        this.includeRegions = includeRegions;
        this.includeAka = includeAka;
        this.order = order;
        this.currentPosition =
            order === 'distance' && currentPosition != null
                ? {
                      lat: currentPosition.lat,
                      lon: currentPosition.lon,
                  }
                : null;
        this.source = SearchParams.normalizeSources(source);
        this.difficulty = diff;
    }

    private static normalizeSources(
        list: PageDataSource[] | null | undefined,
    ): PageDataSource[] | null {
        if (list == null || list.length === 0) return null;
        const out: PageDataSource[] = [];
        for (const s of list) {
            if (!Object.values(PageDataSource).includes(s)) {
                throw new Error(`Invalid PageDataSource: ${JSON.stringify(s)}`);
            }
            if (!out.includes(s)) out.push(s);
        }
        return out;
    }

    toQueryString(): string {
        const params: Record<string, string> = {
            similarity: String(this.similarityThreshold),
            'include-pages': String(this.includePages),
            'include-regions': String(this.includeRegions),
            'include-aka': String(this.includeAka),
            order: this.order,
            limit: String(this.limit),
        };
        if (this.name !== '') {
            params.name = this.name;
        }
        if (this.cursor !== null) {
            params.cursor = this.cursor.encodeBase64();
        }
        if (this.currentPosition !== null) {
            params.lat = String(this.currentPosition.lat);
            params.lon = String(this.currentPosition.lon);
        }
        if (this.source != null && this.source.length > 0) {
            params.source = this.source.join('|');
        }
        const usp = new URLSearchParams(params);
        DifficultyParams.appendToUrlSearchParams(usp, this.difficulty);
        return usp.toString();
    }

    withCursor(cursorEncoded: string | null): SearchParams {
        return new SearchParams(
            this.name,
            this.similarityThreshold,
            this.includePages,
            this.includeRegions,
            this.includeAka,
            this.order,
            this.limit,
            cursorEncoded === null || cursorEncoded === '' ? undefined : cursorEncoded,
            this.currentPosition,
            this.source,
            this.difficulty,
        );
    }

    static fromQueryStringParams(
        q: Record<string, string | undefined>,
    ): SearchParams {
        const nameRaw = q.name ?? q.Name ?? '';
        const name = nameRaw.trim() === '' ? '' : nameRaw.trim();
        const limitParam = q.limit ?? q.Limit ?? '';
        const limit = limitParam === '' ? DEFAULT_LIMIT : Number(limitParam);
        const cursorRaw = (q.cursor ?? q.Cursor ?? '').trim();
        const cursorEncoded = cursorRaw === '' ? undefined : cursorRaw;
        const similarityParam = q.similarity ?? q.Similarity ?? '';
        const similarity =
            similarityParam === '' ? 0.5 : Number(similarityParam);
        const orderParam = (q.order ?? q.Order ?? '').trim().toLowerCase();
        let order: SearchOrder;
        if (orderParam === 'quality') order = 'quality';
        else if (orderParam === 'distance') order = 'distance';
        else if (orderParam === 'similarity' || orderParam === '') order = 'similarity';
        else {
            throw new Error(
                'Query parameter "order" must be one of: similarity, quality, distance',
            );
        }
        const includePages = SearchParams.parseBoolean(
            q['include-pages'] ?? q['Include-Pages'],
            true,
        );
        const includeRegions = SearchParams.parseBoolean(
            q['include-regions'] ?? q['Include-Regions'],
            order === 'distance' ? false : true,
        );
        const includeAkaParam = q['include-aka'] ?? q['Include-Aka'];
        const includeAkaExplicit = (includeAkaParam ?? '').trim() !== '';
        let includeAka = includeAkaExplicit
            ? SearchParams.parseBoolean(includeAkaParam, true)
            : includePages;

        if (order === 'distance' && !includeAkaExplicit) {
            includeAka = false;
        }

        const latStr = (q.lat ?? q.Lat ?? '').trim();
        const lonStr = (q.lon ?? q.Lon ?? '').trim();
        let currentPosition: SearchParamsPosition | null = null;
        if (latStr !== '' || lonStr !== '') {
            if (latStr === '' || lonStr === '') {
                throw new Error(
                    'Query parameters "lat" and "lon" must both be set or both be absent',
                );
            }
            const lat = Number(latStr);
            const lon = Number(lonStr);
            if (Number.isNaN(lat) || Number.isNaN(lon)) {
                throw new Error(
                    'Query parameters "lat" and "lon" must be valid numbers',
                );
            }
            currentPosition = { lat, lon };
        }

        const sourceRaw = (q.source ?? q.Source ?? '').trim();
        const source =
            sourceRaw === ''
                ? null
                : SearchParams.parseSourcePipe(sourceRaw);

        const difficulty = SearchParams.normalizeDifficultyFromQuery(q);

        return new SearchParams(
            name,
            similarity,
            includePages,
            includeRegions,
            includeAka,
            order,
            limit,
            cursorEncoded,
            currentPosition,
            source,
            difficulty,
        );
    }

    private static normalizeDifficultyFromQuery(
        q: Record<string, string | undefined>,
    ): DifficultyParams | null {
        const d = DifficultyParams.fromQueryStringParams(q);
        if (d === null || !d.isActive()) return null;
        return d;
    }

    private static parseSourcePipe(raw: string): PageDataSource[] | null {
        const parts = raw
            .split('|')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        if (parts.length === 0) return null;
        return parts.map((p) => SearchParams.parseSourceToken(p));
    }

    private static parseSourceToken(value: string): PageDataSource {
        const lower = value.toLowerCase();
        for (const s of Object.values(PageDataSource)) {
            if (s === lower || s === value) return s;
        }
        throw new Error(
            `Query parameter "source" token must be one of: ${Object.values(PageDataSource).join(', ')}`,
        );
    }

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
