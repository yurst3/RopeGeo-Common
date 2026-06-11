import type { DownloadTaskDependency } from '../types';

export class FetchRopeGeoTileListTaskDependency implements DownloadTaskDependency {
    readonly dependencyKind = 'fetchRopeGeoTileList' as const;
    readonly mapDataId: string;
    readonly tileCount: number;
    readonly tileTotalBytes: number;
    readonly listPageLimit: number;
    readonly pageMiniMapWire: Record<string, unknown>;

    constructor(args: {
        mapDataId: string;
        tileCount: number;
        tileTotalBytes: number;
        listPageLimit: number;
        pageMiniMapWire: Record<string, unknown>;
    }) {
        this.mapDataId = args.mapDataId;
        this.tileCount = args.tileCount;
        this.tileTotalBytes = args.tileTotalBytes;
        this.listPageLimit = args.listPageLimit;
        this.pageMiniMapWire = args.pageMiniMapWire;
    }

    toStoredState(): unknown {
        return {
            dependencyKind: this.dependencyKind,
            mapDataId: this.mapDataId,
            tileCount: this.tileCount,
            tileTotalBytes: this.tileTotalBytes,
            listPageLimit: this.listPageLimit,
            pageMiniMapWire: this.pageMiniMapWire,
        };
    }

    static fromStoredState(raw: unknown): FetchRopeGeoTileListTaskDependency {
        if (raw == null || typeof raw !== 'object') {
            throw new Error('FetchRopeGeoTileListTaskDependency must be an object');
        }
        const value = raw as Record<string, unknown>;
        if (typeof value.mapDataId !== 'string' || value.mapDataId.length === 0) {
            throw new Error('FetchRopeGeoTileListTaskDependency.mapDataId must be a non-empty string');
        }
        const tileCount = FetchRopeGeoTileListTaskDependency.toNonNegativeInt(value.tileCount, 'tileCount');
        const tileTotalBytes = FetchRopeGeoTileListTaskDependency.toNonNegativeInt(
            value.tileTotalBytes,
            'tileTotalBytes',
        );
        const listPageLimit = FetchRopeGeoTileListTaskDependency.toNonNegativeInt(
            value.listPageLimit,
            'listPageLimit',
        );
        if (value.pageMiniMapWire == null || typeof value.pageMiniMapWire !== 'object') {
            throw new Error('FetchRopeGeoTileListTaskDependency.pageMiniMapWire must be an object');
        }
        return new FetchRopeGeoTileListTaskDependency({
            mapDataId: value.mapDataId,
            tileCount,
            tileTotalBytes,
            listPageLimit,
            pageMiniMapWire: value.pageMiniMapWire as Record<string, unknown>,
        });
    }

    private static toNonNegativeInt(value: unknown, field: string): number {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
            throw new Error(`FetchRopeGeoTileListTaskDependency.${field} must be a non-negative integer`);
        }
        return value;
    }
}
