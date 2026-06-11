import { MiniMapType } from '../../models/minimap/abstract/miniMapType';
import { OnlinePageMiniMap } from '../../models/minimap/concrete/onlinePageMiniMap';
import { DownloadDependencyKeys } from '../dependencies/downloadDependencyKeys';
import { FetchRopeGeoTileFilesTaskDependency } from '../dependencies/fetchRopeGeoTileFilesTaskDependency';
import { SaveOfflinePageMiniMapTaskDependency } from '../dependencies/saveOfflinePageMiniMapTaskDependency';
import { TILE_FILE_BATCH_SIZE } from '../helpers/downloadConstants';
import type { DownloadJobContext, DownloadPlatformHarness, DownloadTaskStoredState, TaskTickResult } from '../types';
import { DownloadTask } from './abstractDownloadTask';

function relativePathFromTileUrl(tileUrl: string): string {
    try {
        const parsed = new URL(tileUrl);
        const marker = '/tiles/';
        const markerIndex = parsed.pathname.indexOf(marker);
        if (markerIndex >= 0) {
            return parsed.pathname.slice(markerIndex + marker.length).replace(/^\/+/, '');
        }
        return parsed.pathname.replace(/^\/+/, '');
    } catch {
        return tileUrl;
    }
}

export class FetchRopeGeoTileFilesTask extends DownloadTask {
    readonly taskKind = 'fetchRopeGeoTileFiles';
    readonly dependencyKeys = [DownloadDependencyKeys.FetchRopeGeoTileFiles] as const;
    total: number;
    private cursor: number;

    constructor(total: number, completed = 0, cursor = 0) {
        super(completed);
        this.total = total;
        this.cursor = cursor;
    }

    async runTick(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
        signal: AbortSignal,
    ): Promise<TaskTickResult> {
        this.requireAllDependencies(ctx);
        const dep = this.requireDependency<FetchRopeGeoTileFilesTaskDependency>(
            ctx,
            DownloadDependencyKeys.FetchRopeGeoTileFiles,
        );

        if (dep.tileUrls.length === 0 || this.total === 0) {
            this.completed = 0;
            await this.publishOfflineMiniMap(ctx, platformHarness, dep);
            return { done: true };
        }

        const end = Math.min(dep.tileUrls.length, this.cursor + TILE_FILE_BATCH_SIZE);
        const chunk = dep.tileUrls.slice(this.cursor, end);
        await Promise.all(
            chunk.map(async (tileUrl) => {
                if (signal.aborted) {
                    return;
                }
                const relativePath = relativePathFromTileUrl(tileUrl);
                const destPath = platformHarness.paths.tileDest(ctx.pageId, relativePath);
                await platformHarness.ensureParentDir(destPath);
                await platformHarness.downloadFile({
                    url: tileUrl,
                    destPath,
                    background: true,
                });
                await platformHarness.gunzipTileIfNeeded(destPath);
            }),
        );
        this.cursor = end;
        this.completed = Math.max(this.completed, end);

        if (this.completed >= this.total) {
            await this.publishOfflineMiniMap(ctx, platformHarness, dep);
            return { done: true };
        }
        return { done: false };
    }

    private async publishOfflineMiniMap(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
        dep: FetchRopeGeoTileFilesTaskDependency,
    ): Promise<void> {
        const wire = dep.pageMiniMapWire;
        if (wire.miniMapType !== MiniMapType.Page) {
            throw new Error('FetchRopeGeoTileFilesTask expects a page minimap wire payload');
        }
        const onlineMiniMap = OnlinePageMiniMap.fromResult(wire);
        const offlineTemplate = platformHarness.paths.tileDest(
            ctx.pageId,
            `${dep.mapDataId}/{z}/{x}/{y}.pbf`,
        );
        const offlineMiniMap = onlineMiniMap.toOffline(offlineTemplate);
        ctx.setDependency(
            DownloadDependencyKeys.SaveOfflinePageMiniMap,
            new SaveOfflinePageMiniMapTaskDependency(offlineMiniMap.toPlain()),
        );
    }

    toStoredState(): DownloadTaskStoredState {
        return {
            taskKind: this.taskKind,
            completed: this.completed,
            total: this.total,
            cursor: this.cursor,
        };
    }

    static fromStoredState(raw: unknown): FetchRopeGeoTileFilesTask {
        const value = raw as DownloadTaskStoredState & { cursor?: unknown };
        return new FetchRopeGeoTileFilesTask(
            value.total,
            value.completed,
            typeof value.cursor === 'number' ? value.cursor : 0,
        );
    }
}
