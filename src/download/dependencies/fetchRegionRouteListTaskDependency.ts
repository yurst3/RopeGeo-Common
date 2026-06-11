import { RoutesParams } from '../../models/api/params/routesParams';
import type { DownloadTaskDependency } from '../types';

export class FetchRegionRouteListTaskDependency implements DownloadTaskDependency {
    readonly dependencyKind = 'fetchRegionRouteList' as const;
    readonly routesParams: RoutesParams;
    readonly routeCount: number;
    readonly totalBytes: number;
    readonly regionId: string;
    readonly centeredRouteId: string | null;
    readonly miniMapTitle: string;

    constructor(args: {
        routesParams: RoutesParams;
        routeCount: number;
        totalBytes: number;
        regionId: string;
        centeredRouteId: string | null;
        miniMapTitle: string;
    }) {
        this.routesParams = args.routesParams;
        this.routeCount = args.routeCount;
        this.totalBytes = args.totalBytes;
        this.regionId = args.regionId;
        this.centeredRouteId = args.centeredRouteId;
        this.miniMapTitle = args.miniMapTitle;
    }

    toStoredState(): unknown {
        return {
            dependencyKind: this.dependencyKind,
            routesParams: this.routesParams,
            routeCount: this.routeCount,
            totalBytes: this.totalBytes,
            regionId: this.regionId,
            centeredRouteId: this.centeredRouteId,
            miniMapTitle: this.miniMapTitle,
        };
    }

    static fromStoredState(raw: unknown): FetchRegionRouteListTaskDependency {
        if (raw == null || typeof raw !== 'object') {
            throw new Error('FetchRegionRouteListTaskDependency must be an object');
        }
        const value = raw as Record<string, unknown>;
        if (typeof value.regionId !== 'string' || value.regionId.length === 0) {
            throw new Error('FetchRegionRouteListTaskDependency.regionId must be a non-empty string');
        }
        if (value.centeredRouteId !== null && value.centeredRouteId !== undefined && typeof value.centeredRouteId !== 'string') {
            throw new Error('FetchRegionRouteListTaskDependency.centeredRouteId invalid');
        }
        if (typeof value.miniMapTitle !== 'string' || value.miniMapTitle.length === 0) {
            throw new Error('FetchRegionRouteListTaskDependency.miniMapTitle must be a non-empty string');
        }
        const routeCount = FetchRegionRouteListTaskDependency.toNonNegativeInt(value.routeCount, 'routeCount');
        const totalBytes = FetchRegionRouteListTaskDependency.toNonNegativeInt(value.totalBytes, 'totalBytes');
        return new FetchRegionRouteListTaskDependency({
            routesParams: RoutesParams.fromResult(value.routesParams, true),
            routeCount,
            totalBytes,
            regionId: value.regionId,
            centeredRouteId:
                typeof value.centeredRouteId === 'string' ? value.centeredRouteId : null,
            miniMapTitle: value.miniMapTitle,
        });
    }

    private static toNonNegativeInt(value: unknown, field: string): number {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
            throw new Error(`FetchRegionRouteListTaskDependency.${field} must be a non-negative integer`);
        }
        return value;
    }
}
