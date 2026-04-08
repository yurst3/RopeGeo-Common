import { PaginationParams } from './paginationParams';
import { PageDataSource } from '../../pageDataSource';
import { RouteType } from '../../routes/routeType';
import './registerDifficultyParamsParsers';
import { DifficultyParams } from './difficultyParams';

/** UUID v4 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validated params for getRoutes (GET /routes).
 * Either a region scope (`region-id` + `region-source`) or a global source allow-list (`sources`),
 * never both. Optional `route-types` query param is a pipe-list of {@link RouteType} values.
 * Includes page-based `limit` and `page` (defaults {@link PaginationParams.DEFAULT_LIMIT} / {@link PaginationParams.DEFAULT_PAGE}).
 */
export class RoutesParams extends PaginationParams {
    /**
     * Null when not region-scoped. When set, `source` is the single catalogue for that region.
     */
    public readonly region: { id: string; source: PageDataSource } | null;
    /** Global source allow-list when not region-scoped; null = all sources. Mutually exclusive with `region`. */
    public readonly sources: PageDataSource[] | null;
    /** Null = no route-type filter; non-empty = allow-list (pipe-encoded in query strings as `route-types`). */
    public readonly routeTypes: RouteType[] | null;
    public readonly difficulty: DifficultyParams | null;

    constructor(options: {
        region: { id: string; source: PageDataSource } | null;
        sources?: PageDataSource[] | null;
        routeTypes?: RouteType[] | null;
        difficulty?: DifficultyParams | null;
        limit?: number;
        page?: number;
    }) {
        const limit = options.limit ?? PaginationParams.DEFAULT_LIMIT;
        const page = options.page ?? PaginationParams.DEFAULT_PAGE;

        const routeTypes = RoutesParams.normalizeRouteTypeList(
            options.routeTypes ?? null,
        );

        const diffRaw = options.difficulty ?? null;
        const diff =
            diffRaw !== null && diffRaw.isActive() ? diffRaw : null;

        const reg = options.region;
        let regionNorm: { id: string; source: PageDataSource } | null;
        if (reg === null) {
            regionNorm = null;
        } else {
            const id = reg.id.trim();
            if (id === '') {
                throw new Error('RoutesParams.region.id must be non-empty when region is set');
            }
            if (!UUID_REGEX.test(id)) {
                throw new Error('Query parameter "region-id" must be a valid UUID');
            }
            if (!Object.values(PageDataSource).includes(reg.source)) {
                throw new Error(`Invalid PageDataSource for region: ${JSON.stringify(reg.source)}`);
            }
            regionNorm = { id, source: reg.source };
        }

        const sourcesNorm = RoutesParams.normalizeSourcesList(options.sources ?? null);

        if (
            regionNorm !== null &&
            sourcesNorm !== null &&
            sourcesNorm.length > 0
        ) {
            throw new Error(
                'RoutesParams: region and sources cannot both be set',
            );
        }

        super(limit, page);
        this.region = regionNorm;
        this.sources = sourcesNorm;
        this.routeTypes = routeTypes;
        this.difficulty = diff;
    }

    withPage(page: number): RoutesParams {
        return new RoutesParams({
            region: this.region,
            sources: this.sources,
            routeTypes: this.routeTypes,
            difficulty: this.difficulty,
            limit: this.limit,
            page,
        });
    }

    /** Null = all sources; non-empty = allow-list. */
    private static normalizeSourcesList(
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
        const p = new URLSearchParams(super.toQueryString());
        if (this.region !== null) {
            p.set('region-id', this.region.id);
            p.set('region-source', this.region.source);
        }
        if (this.sources != null && this.sources.length > 0) {
            p.set('sources', this.sources.join('|'));
        }
        if (this.routeTypes != null && this.routeTypes.length > 0) {
            p.set('route-types', this.routeTypes.join('|'));
        }
        DifficultyParams.appendToUrlSearchParams(p, this.difficulty);
        return p.toString();
    }

    static fromQueryStringParams(
        q: Record<string, string | undefined>,
    ): RoutesParams {
        const limit = RoutesParams.parseLimitQuery(q);
        const page = RoutesParams.parsePageQuery(q);
        const regionIdRaw = (q['region-id'] ?? q['Region-Id'] ?? '').trim();
        const regionSourceRaw = (
            q['region-source'] ??
            q['Region-Source'] ??
            ''
        ).trim();
        const sourcesRaw = (q.sources ?? q.Sources ?? '').trim();
        const routeTypesStr = (q['route-types'] ?? q['Route-Types'] ?? '').trim();
        const routeTypes =
            routeTypesStr === ''
                ? null
                : RoutesParams.parseRouteTypePipe(routeTypesStr);
        const difficulty = RoutesParams.normalizeDifficulty(
            DifficultyParams.fromQueryStringParams(q),
        );

        const sourcesParsed =
            sourcesRaw === ''
                ? null
                : RoutesParams.parseSourcePipe(sourcesRaw);

        if (regionIdRaw === '') {
            if (regionSourceRaw !== '') {
                throw new Error(
                    'Query parameter "region-source" must not be set without "region-id"',
                );
            }
            return new RoutesParams({
                region: null,
                sources: sourcesParsed,
                routeTypes,
                difficulty,
                limit,
                page,
            });
        }

        if (!UUID_REGEX.test(regionIdRaw)) {
            throw new Error('Query parameter "region-id" must be a valid UUID');
        }
        if (regionSourceRaw === '') {
            throw new Error(
                'Query parameter "region-source" is required when "region-id" is set',
            );
        }
        if (sourcesParsed != null && sourcesParsed.length > 0) {
            throw new Error(
                'Query parameters "region-id" / "region-source" cannot be combined with "sources"',
            );
        }
        const regionSource = RoutesParams.parseSourceToken(regionSourceRaw);
        return new RoutesParams({
            region: { id: regionIdRaw, source: regionSource },
            sources: null,
            routeTypes,
            difficulty,
            limit,
            page,
        });
    }

    private static parseLimitQuery(q: Record<string, string | undefined>): number {
        const raw = (q.limit ?? q.Limit ?? '').trim();
        if (raw === '') {
            return PaginationParams.DEFAULT_LIMIT;
        }
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 1) {
            throw new Error('Query parameter "limit" must be a positive integer');
        }
        if (n > PaginationParams.MAX_LIMIT) {
            throw new Error(
                `Query parameter "limit" must not exceed ${PaginationParams.MAX_LIMIT}`,
            );
        }
        return n;
    }

    private static parsePageQuery(q: Record<string, string | undefined>): number {
        const raw = (q.page ?? q.Page ?? '').trim();
        if (raw === '') {
            return PaginationParams.DEFAULT_PAGE;
        }
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 1) {
            throw new Error('Query parameter "page" must be a positive integer');
        }
        return n;
    }

    private static normalizeDifficulty(
        d: DifficultyParams | null,
    ): DifficultyParams | null {
        if (d === null || !d.isActive()) return null;
        return d;
    }

    private static parseRouteType(value: string): RouteType {
        const exact = Object.values(RouteType).find((v) => v === value);
        if (exact !== undefined) return exact;
        throw new Error(
            `Query parameter "route-types" must be one of: ${Object.values(RouteType).join(', ')}`,
        );
    }

    /** Dedupes while preserving first-seen order; `null` / empty → `null`. */
    private static normalizeRouteTypeList(
        list: RouteType[] | null | undefined,
    ): RouteType[] | null {
        if (list == null || list.length === 0) return null;
        const out: RouteType[] = [];
        for (const t of list) {
            if (!Object.values(RouteType).includes(t)) {
                throw new Error(`Invalid route type: ${JSON.stringify(t)}`);
            }
            if (!out.includes(t)) out.push(t);
        }
        return out;
    }

    /** Pipe-separated tokens, same encoding as {@link RoutesParams.toQueryString}. */
    private static parseRouteTypePipe(raw: string): RouteType[] | null {
        const parts = raw
            .split('|')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        if (parts.length === 0) return null;
        const types = parts.map((p) => RoutesParams.parseRouteType(p));
        return RoutesParams.normalizeRouteTypeList(types);
    }

    private static parseSourcePipe(raw: string): PageDataSource[] | null {
        const parts = raw
            .split('|')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        if (parts.length === 0) return null;
        return parts.map((p) => RoutesParams.parseSourceToken(p));
    }

    private static parseSourceToken(value: string): PageDataSource {
        const lower = value.toLowerCase();
        for (const s of Object.values(PageDataSource)) {
            if (s === lower || s === value) return s;
        }
        throw new Error(
            `PageDataSource token must be one of: ${Object.values(PageDataSource).join(', ')}`,
        );
    }

    /**
     * Validates a JSON-like object: optional `region` null or `{ id, source }` with a single
     * `source` string, optional top-level `region-id` / `region-source`, optional `sources`
     * (string pipe-list or string array). `region` and `sources` must not both be active.
     */
    static fromResult(result: unknown, requiredRegion = false): RoutesParams {
        if (result == null || typeof result !== 'object') {
            throw new Error('RoutesParams result must be an object');
        }
        const r = result as Record<string, unknown>;
        const { limit, page } = RoutesParams.paginationFromResult(r);

        const flatId = RoutesParams.coerceTrimmedString(
            r['region-id'] ?? r['Region-Id'],
            'region-id',
        );
        const flatSource = RoutesParams.coerceTrimmedString(
            r['region-source'] ?? r['Region-Source'],
            'region-source',
        );
        const rawNested = r.region ?? r.Region;

        if (typeof rawNested === 'string') {
            throw new Error(
                'RoutesParams.region must be an object { id, source } or null, not a string',
            );
        }

        let regionNorm: { id: string; source: PageDataSource } | null = null;

        const hasFlatRegion = flatId !== '' || flatSource !== '';
        const hasNestedRegion =
            rawNested !== null &&
            rawNested !== undefined &&
            typeof rawNested === 'object';

        if (hasFlatRegion && hasNestedRegion) {
            throw new Error(
                'RoutesParams: use either nested region or region-id / region-source, not both',
            );
        }

        if (hasFlatRegion) {
            if (flatId === '') {
                throw new Error(
                    'RoutesParams.region-id must be non-empty when region-source is set',
                );
            }
            if (!UUID_REGEX.test(flatId)) {
                throw new Error('RoutesParams.region-id must be a valid UUID');
            }
            if (flatSource === '') {
                throw new Error(
                    'RoutesParams.region-source must be non-empty when region-id is set',
                );
            }
            regionNorm = {
                id: flatId,
                source: RoutesParams.parseSourceToken(flatSource),
            };
        } else if (hasNestedRegion) {
            const reg = rawNested as Record<string, unknown>;
            const idStr = RoutesParams.coerceTrimmedString(reg.id ?? reg.Id, 'region.id');
            if (idStr === '') {
                throw new Error('RoutesParams.region must include non-empty id');
            }
            if (!UUID_REGEX.test(idStr)) {
                throw new Error('RoutesParams.region.id must be a valid UUID');
            }
            const sourceRaw = reg.source ?? reg.Source;
            if (sourceRaw === null || sourceRaw === undefined) {
                throw new Error(
                    'RoutesParams.region.source must be a non-empty string',
                );
            }
            if (typeof sourceRaw !== 'string' || sourceRaw.trim() === '') {
                throw new Error(
                    'RoutesParams.region.source must be a non-empty string',
                );
            }
            regionNorm = {
                id: idStr,
                source: RoutesParams.parseSourceToken(sourceRaw.trim()),
            };
        }

        if (requiredRegion && regionNorm === null) {
            throw new Error(
                'RoutesParams: region must be set when requiredRegion is true',
            );
        }

        const sourcesNorm = RoutesParams.optionalSourcesFromResult(r);

        if (
            regionNorm !== null &&
            sourcesNorm !== null &&
            sourcesNorm.length > 0
        ) {
            throw new Error(
                'RoutesParams: region and sources cannot both be set',
            );
        }

        const routeTypes = RoutesParams.optionalRouteTypesFromResult(r);
        const difficulty = RoutesParams.normalizeDifficulty(
            RoutesParams.optionalDifficultyFromResult(r),
        );

        return new RoutesParams({
            region: regionNorm,
            sources: sourcesNorm,
            routeTypes,
            difficulty,
            limit,
            page,
        });
    }

    private static optionalSourcesFromResult(
        r: Record<string, unknown>,
    ): PageDataSource[] | null {
        const v = r.sources ?? r.Sources;
        if (v === null || v === undefined || v === '') return null;
        if (typeof v === 'string') {
            return RoutesParams.parseSourcePipe(v);
        }
        if (Array.isArray(v)) {
            const list = v.map((item, i) => {
                if (typeof item !== 'string') {
                    throw new Error(`RoutesParams.sources[${i}] must be a string`);
                }
                return RoutesParams.parseSourceToken(item);
            });
            return RoutesParams.normalizeSourcesList(list);
        }
        throw new Error(
            'RoutesParams.sources must be a string, string[], or null',
        );
    }

    private static paginationFromResult(r: Record<string, unknown>): {
        limit: number;
        page: number;
    } {
        const limit = RoutesParams.optionalPositiveInt(
            r.limit ?? r.Limit,
            'limit',
            PaginationParams.DEFAULT_LIMIT,
        );
        const page = RoutesParams.optionalPositiveInt(
            r.page ?? r.Page,
            'page',
            PaginationParams.DEFAULT_PAGE,
        );
        PaginationParams.assertValidLimitPage(limit, page);
        return { limit, page };
    }

    private static optionalPositiveInt(
        v: unknown,
        key: string,
        defaultVal: number,
    ): number {
        if (v === undefined || v === null) {
            return defaultVal;
        }
        if (typeof v !== 'number' || !Number.isInteger(v)) {
            throw new Error(`RoutesParams.${key} must be an integer when set`);
        }
        if (v < 1) {
            throw new Error(`RoutesParams.${key} must be a positive integer when set`);
        }
        if (key === 'limit' && v > PaginationParams.MAX_LIMIT) {
            throw new Error(
                `RoutesParams.limit must not exceed ${PaginationParams.MAX_LIMIT}`,
            );
        }
        return v;
    }

    private static optionalRouteTypesFromResult(
        r: Record<string, unknown>,
    ): RouteType[] | null {
        const v = r.routeTypes ?? r['route-types'] ?? r.RouteTypes;
        if (v === null || v === undefined || v === '') return null;
        if (typeof v === 'string') {
            return RoutesParams.parseRouteTypePipe(v);
        }
        if (Array.isArray(v)) {
            const types = v.map((item, i) => {
                if (typeof item !== 'string') {
                    throw new Error(
                        `RoutesParams.routeTypes[${i}] must be a string`,
                    );
                }
                return RoutesParams.parseRouteType(item);
            });
            return RoutesParams.normalizeRouteTypeList(types);
        }
        throw new Error(
            'RoutesParams.routeTypes must be a string, string[], or null',
        );
    }

    private static optionalDifficultyFromResult(
        r: Record<string, unknown>,
    ): DifficultyParams | null {
        const nested = r.difficulty ?? r.Difficulty;
        if (
            nested !== null &&
            nested !== undefined &&
            typeof nested !== 'object'
        ) {
            throw new Error('RoutesParams.difficulty must be an object or null');
        }
        const diffInput =
            nested !== null && nested !== undefined
                ? (nested as Record<string, unknown>)
                : r;
        return DifficultyParams.fromResult(diffInput);
    }

    private static coerceTrimmedString(v: unknown, key: string): string {
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
}
