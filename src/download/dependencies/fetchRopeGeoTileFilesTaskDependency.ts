import type { DownloadTaskDependency } from '../types';

export class FetchRopeGeoTileFilesTaskDependency implements DownloadTaskDependency {
    readonly dependencyKind = 'fetchRopeGeoTileFiles' as const;
    readonly mapDataId: string;
    readonly tileUrls: string[];
    readonly tileTotalBytes: number;
    readonly pageMiniMapWire: Record<string, unknown>;

    constructor(args: {
        mapDataId: string;
        tileUrls: string[];
        tileTotalBytes: number;
        pageMiniMapWire: Record<string, unknown>;
    }) {
        this.mapDataId = args.mapDataId;
        this.tileUrls = args.tileUrls;
        this.tileTotalBytes = args.tileTotalBytes;
        this.pageMiniMapWire = args.pageMiniMapWire;
    }

    toStoredState(): unknown {
        return {
            dependencyKind: this.dependencyKind,
            mapDataId: this.mapDataId,
            tileUrls: this.tileUrls,
            tileTotalBytes: this.tileTotalBytes,
            pageMiniMapWire: this.pageMiniMapWire,
        };
    }

    static fromStoredState(raw: unknown): FetchRopeGeoTileFilesTaskDependency {
        if (raw == null || typeof raw !== 'object') {
            throw new Error('FetchRopeGeoTileFilesTaskDependency must be an object');
        }
        const value = raw as Record<string, unknown>;
        if (typeof value.mapDataId !== 'string' || value.mapDataId.length === 0) {
            throw new Error('FetchRopeGeoTileFilesTaskDependency.mapDataId must be a non-empty string');
        }
        if (!Array.isArray(value.tileUrls) || value.tileUrls.some((url) => typeof url !== 'string')) {
            throw new Error('FetchRopeGeoTileFilesTaskDependency.tileUrls must be string[]');
        }
        if (
            typeof value.tileTotalBytes !== 'number' ||
            !Number.isInteger(value.tileTotalBytes) ||
            value.tileTotalBytes < 0
        ) {
            throw new Error('FetchRopeGeoTileFilesTaskDependency.tileTotalBytes must be a non-negative integer');
        }
        if (value.pageMiniMapWire == null || typeof value.pageMiniMapWire !== 'object') {
            throw new Error('FetchRopeGeoTileFilesTaskDependency.pageMiniMapWire must be an object');
        }
        return new FetchRopeGeoTileFilesTaskDependency({
            mapDataId: value.mapDataId,
            tileUrls: value.tileUrls as string[],
            tileTotalBytes: value.tileTotalBytes,
            pageMiniMapWire: value.pageMiniMapWire as Record<string, unknown>,
        });
    }
}
