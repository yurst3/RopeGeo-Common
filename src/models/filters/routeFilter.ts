import { PageDataSource } from '../pageDataSource';
import { RouteType } from '../routes/routeType';
import { RoutesParams } from '../api/params/routesParams';
import './registerDifficultyFilterOptionsParsers';
import { DifficultyFilterOptions } from './difficultyFilterOptions';

/**
 * Persisted explore / minimap route filter. Null fields mean “no constraint” on that axis.
 */
export class RouteFilter {
    source: PageDataSource[] | null;
    regionId: string | null;
    routeType: RouteType | null;
    difficultyOptions: DifficultyFilterOptions | null;

    constructor(
        source: PageDataSource[] | null = null,
        regionId: string | null = null,
        routeType: RouteType | null = null,
        difficultyOptions: DifficultyFilterOptions | null = null,
    ) {
        this.source = source;
        this.regionId = regionId;
        this.routeType = routeType;
        this.difficultyOptions = difficultyOptions;
    }

    toRoutesParams(): RoutesParams {
        const rid =
            this.regionId != null && this.regionId.trim() !== ''
                ? this.regionId.trim()
                : null;
        if (rid === null) {
            if (this.source != null && this.source.length > 0) {
                throw new Error(
                    'RouteFilter: source allow-list requires a non-empty regionId',
                );
            }
            return new RoutesParams({
                region: null,
                routeTypes:
                    this.routeType !== null ? [this.routeType] : null,
                difficulty:
                    this.difficultyOptions !== null
                        ? this.difficultyOptions.toDifficultyParams()
                        : null,
            });
        }
        const src =
            this.source == null || this.source.length === 0
                ? null
                : [...this.source];
        return new RoutesParams({
            region: { id: rid, source: src },
            routeTypes:
                this.routeType !== null ? [this.routeType] : null,
            difficulty:
                this.difficultyOptions !== null
                    ? this.difficultyOptions.toDifficultyParams()
                    : null,
        });
    }

    toJSON(): Record<string, unknown> {
        return {
            source: this.source,
            regionId: this.regionId,
            routeType: this.routeType,
            difficultyOptions:
                this.difficultyOptions !== null
                    ? this.difficultyOptions.toJSON()
                    : null,
        };
    }

    toString(): string {
        return JSON.stringify(this.toJSON());
    }

    static fromJsonString(json: string): RouteFilter {
        let parsed: unknown;
        try {
            parsed = JSON.parse(json);
        } catch (e) {
            throw new Error(
                `RouteFilter.fromJsonString: invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
            );
        }
        return RouteFilter.fromJSON(parsed);
    }

    static fromJSON(parsed: unknown): RouteFilter {
        if (parsed == null || typeof parsed !== 'object') {
            throw new Error('RouteFilter must be a JSON object');
        }
        const o = parsed as Record<string, unknown>;
        const source = RouteFilter.parseSourceField(o.source);
        const regionId =
            o.regionId === null || o.regionId === undefined
                ? null
                : String(o.regionId);
        const routeType =
            o.routeType === null || o.routeType === undefined
                ? null
                : RouteFilter.parseRouteType(o.routeType);
        let difficultyOptions: DifficultyFilterOptions | null = null;
        if (o.difficultyOptions != null && typeof o.difficultyOptions === 'object') {
            difficultyOptions = DifficultyFilterOptions.fromResult(o.difficultyOptions);
        }
        return new RouteFilter(source, regionId, routeType, difficultyOptions);
    }

    private static parseSourceField(v: unknown): PageDataSource[] | null {
        if (v === null || v === undefined) return null;
        if (!Array.isArray(v)) {
            throw new Error('RouteFilter.source must be an array or null');
        }
        const out: PageDataSource[] = [];
        for (const item of v) {
            if (typeof item !== 'string') {
                throw new Error('RouteFilter.source entries must be strings');
            }
            if (!Object.values(PageDataSource).includes(item as PageDataSource)) {
                throw new Error(`Invalid PageDataSource: ${JSON.stringify(item)}`);
            }
            if (!out.includes(item as PageDataSource)) {
                out.push(item as PageDataSource);
            }
        }
        return out.length === 0 ? null : out;
    }

    private static parseRouteType(v: unknown): RouteType {
        if (typeof v !== 'string' || !Object.values(RouteType).includes(v as RouteType)) {
            throw new Error(`Invalid RouteType: ${JSON.stringify(v)}`);
        }
        return v as RouteType;
    }
}
