import { PageDataSource } from '../pageDataSource';
import { RouteType } from '../routes/routeType';
import './registerDifficultyParamsParsers';
import { DifficultyParams } from './difficultyParams';

/** UUID v4 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validated params for getRoutes (GET /routes).
 * Global request: no `region` query param. Region-scoped: `region` id required; optional `source`
 * pipe-list (omit or empty = all sources). `source` must not appear without `region`.
 */
export class RoutesParams {
    /**
     * Null when not region-scoped. When set, `source` null or empty list means all sources
     * for that region.
     */
    public readonly region: { id: string; source: PageDataSource[] | null } | null;
    public readonly routeType: RouteType | null;
    public readonly difficulty: DifficultyParams | null;

    constructor(options: {
        region: { id: string; source: PageDataSource[] | null } | null;
        routeType?: RouteType | null;
        difficulty?: DifficultyParams | null;
    }) {
        const routeType = options.routeType ?? null;
        if (routeType !== null && !Object.values(RouteType).includes(routeType)) {
            throw new Error(
                `Invalid route type: ${JSON.stringify(routeType)}`,
            );
        }

        const diffRaw = options.difficulty ?? null;
        const diff =
            diffRaw !== null && diffRaw.isActive() ? diffRaw : null;

        const reg = options.region;
        if (reg === null) {
            this.region = null;
        } else {
            const id = reg.id.trim();
            if (id === '') {
                throw new Error('RoutesParams.region.id must be non-empty when region is set');
            }
            if (!UUID_REGEX.test(id)) {
                throw new Error('Query parameter "region" must be a valid UUID');
            }
            const src = RoutesParams.normalizeSourceList(reg.source);
            this.region = { id, source: src };
        }

        this.routeType = routeType;
        this.difficulty = diff;
    }

    /** Null = all sources; non-empty = allow-list. */
    private static normalizeSourceList(
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
        const p = new URLSearchParams();
        if (this.region !== null) {
            p.set('region', this.region.id);
            if (this.region.source != null && this.region.source.length > 0) {
                p.set('source', this.region.source.join('|'));
            }
        }
        if (this.routeType != null) {
            p.set('route-type', this.routeType);
        }
        DifficultyParams.appendToUrlSearchParams(p, this.difficulty);
        return p.toString();
    }

    static fromQueryStringParams(
        q: Record<string, string | undefined>,
    ): RoutesParams {
        const regionRaw = (q.region ?? q.Region ?? '').trim();
        const sourceRaw = (q.source ?? q.Source ?? '').trim();
        const routeTypeStr = (q['route-type'] ?? q['Route-Type'] ?? '').trim();
        const routeType =
            routeTypeStr === ''
                ? null
                : RoutesParams.parseRouteType(routeTypeStr);
        const difficulty = RoutesParams.normalizeDifficulty(
            DifficultyParams.fromQueryStringParams(q),
        );

        if (regionRaw === '') {
            if (sourceRaw !== '') {
                throw new Error(
                    'Query parameter "source" must not be set without "region"',
                );
            }
            return new RoutesParams({
                region: null,
                routeType,
                difficulty,
            });
        }

        const sources =
            sourceRaw === ''
                ? null
                : RoutesParams.parseSourcePipe(sourceRaw);
        return new RoutesParams({
            region: { id: regionRaw, source: sources },
            routeType,
            difficulty,
        });
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
            `Query parameter "route-type" must be one of: ${Object.values(RouteType).join(', ')}`,
        );
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
            `Query parameter "source" token must be one of: ${Object.values(PageDataSource).join(', ')}`,
        );
    }

    /**
     * Validates a JSON-like object: optional `region` null or `{ id, source }` where `source`
     * is `PageDataSource[]`, null, or a single `PageDataSource` string (legacy).
     */
    static fromResult(result: unknown, requiredRegion = false): RoutesParams {
        if (result == null || typeof result !== 'object') {
            throw new Error('RoutesParams result must be an object');
        }
        const r = result as Record<string, unknown>;
        const raw = r.region ?? r.Region;

        if (typeof raw === 'string') {
            throw new Error(
                'RoutesParams.region must be an object { id, source? } or null, not a string',
            );
        }

        if (raw === null || raw === undefined) {
            if (requiredRegion) {
                throw new Error(
                    'RoutesParams: region must be a non-null { id, source? } object when requiredRegion is true',
                );
            }
            const routeType = RoutesParams.optionalRouteTypeFromResult(r);
            const difficulty = RoutesParams.normalizeDifficulty(
                RoutesParams.optionalDifficultyFromResult(r),
            );
            return new RoutesParams({ region: null, routeType, difficulty });
        }

        if (typeof raw !== 'object') {
            throw new Error(
                'RoutesParams.region must be an object or null, got: ' + typeof raw,
            );
        }

        const reg = raw as Record<string, unknown>;
        const idStr = RoutesParams.coerceTrimmedString(reg.id ?? reg.Id, 'region.id');
        if (idStr === '') {
            throw new Error('RoutesParams.region must include non-empty id');
        }
        if (!UUID_REGEX.test(idStr)) {
            throw new Error('RoutesParams.region.id must be a valid UUID');
        }

        const sourceRaw = reg.source ?? reg.Source;
        let sourceList: PageDataSource[] | null = null;
        if (sourceRaw === null || sourceRaw === undefined) {
            sourceList = null;
        } else if (Array.isArray(sourceRaw)) {
            sourceList = sourceRaw.map((item, i) => {
                if (typeof item !== 'string') {
                    throw new Error(`RoutesParams.region.source[${i}] must be a string`);
                }
                return RoutesParams.parseSourceToken(item);
            });
        } else if (typeof sourceRaw === 'string') {
            if (sourceRaw.trim() !== '') {
                sourceList = [RoutesParams.parseSourceToken(sourceRaw.trim())];
            }
        } else {
            throw new Error('RoutesParams.region.source must be string, string[], or null');
        }

        const routeType = RoutesParams.optionalRouteTypeFromResult(r);
        const difficulty = RoutesParams.normalizeDifficulty(
            RoutesParams.optionalDifficultyFromResult(r),
        );

        return new RoutesParams({
            region: {
                id: idStr,
                source: RoutesParams.normalizeSourceList(sourceList),
            },
            routeType,
            difficulty,
        });
    }

    private static optionalRouteTypeFromResult(
        r: Record<string, unknown>,
    ): RouteType | null {
        const v = r.routeType ?? r['route-type'] ?? r.RouteType;
        if (v === null || v === undefined || v === '') return null;
        if (typeof v !== 'string') {
            throw new Error('RoutesParams.routeType must be a string or null');
        }
        return RoutesParams.parseRouteType(v);
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
        const source =
            nested !== null && nested !== undefined
                ? (nested as Record<string, unknown>)
                : r;
        return DifficultyParams.fromResult(source);
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
