import { describe, it, expect } from '@jest/globals';
import { MiniMapType } from '../../../src/models/minimap/abstract/miniMapType';
import { DownloadDependencyKeys } from '../../../src/download/dependencies/downloadDependencyKeys';
import { FetchRopeGeoTileFilesTaskDependency } from '../../../src/download/dependencies/fetchRopeGeoTileFilesTaskDependency';
import { SaveOfflinePageMiniMapTaskDependency } from '../../../src/download/dependencies/saveOfflinePageMiniMapTaskDependency';
import { FetchRopeGeoTileFilesTask } from '../../../src/download/tasks/fetchRopeGeoTileFilesTask';
import { TILE_FILE_BATCH_SIZE } from '../../../src/download/helpers/downloadConstants';
import { PageViewType } from '../../../src/models/pageViews/pageViewType';
import type { DownloadJobContext } from '../../../src/download/types';
import {
    createMockPlatformHarness,
    downloadConfig,
    MAP_DATA_ID,
    PAGE_ID,
} from '../helpers/mockPlatformHarness';

const pageMiniMapWire = {
    miniMapType: MiniMapType.Page,
    fetchType: 'online',
    title: 'Map',
    polyLineLayerId: 'PolyLines',
    pointLayerId: 'Points',
    onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
    bounds: { north: 1, south: 0, east: 1, west: 0 },
    tileCount: 2,
    tileTotalBytes: 2000,
};

describe('FetchRopeGeoTileFilesTask', () => {
    it('completes immediately with no tile URLs and seeds save minimap dependency', async () => {
        const harness = createMockPlatformHarness();
        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.FetchRopeGeoTileFiles]: new FetchRopeGeoTileFilesTaskDependency({
                mapDataId: MAP_DATA_ID,
                tileUrls: [],
                tileTotalBytes: 0,
                pageMiniMapWire,
            }),
        };
        const ctx: DownloadJobContext = {
            pageId: PAGE_ID,
            pageViewType: PageViewType.Ropewiki,
            config: downloadConfig,
            taskDependencies: deps,
            getDependency: (key) => deps[key]!,
            setDependency: (key, dep) => {
                deps[key] = dep;
            },
            appendPhases: () => undefined,
        };
        const task = new FetchRopeGeoTileFilesTask(0);
        const result = await task.runTick(ctx, harness, new AbortController().signal);
        expect(result.done).toBe(true);
        expect(harness.downloadFile).not.toHaveBeenCalled();
        expect(deps[DownloadDependencyKeys.SaveOfflinePageMiniMap]).toBeDefined();
    });

    it('downloads tiles in batches and gunzips each file', async () => {
        const harness = createMockPlatformHarness();
        const tileUrls = Array.from(
            { length: TILE_FILE_BATCH_SIZE + 1 },
            (_, i) => `https://api.example.com/tiles/${MAP_DATA_ID}/0/0/${i}.pbf`,
        );
        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.FetchRopeGeoTileFiles]: new FetchRopeGeoTileFilesTaskDependency({
                mapDataId: MAP_DATA_ID,
                tileUrls,
                tileTotalBytes: 5000,
                pageMiniMapWire,
            }),
        };
        const ctx: DownloadJobContext = {
            pageId: PAGE_ID,
            pageViewType: PageViewType.Ropewiki,
            config: downloadConfig,
            taskDependencies: deps,
            getDependency: (key) => deps[key]!,
            setDependency: (key, dep) => {
                deps[key] = dep;
            },
            appendPhases: () => undefined,
        };
        const task = new FetchRopeGeoTileFilesTask(tileUrls.length);
        const signal = new AbortController().signal;

        const first = await task.runTick(ctx, harness, signal);
        expect(first.done).toBe(false);
        expect(harness.downloadFile).toHaveBeenCalledTimes(TILE_FILE_BATCH_SIZE);
        expect(harness.gunzipTileIfNeeded).toHaveBeenCalledTimes(TILE_FILE_BATCH_SIZE);

        const second = await task.runTick(ctx, harness, signal);
        expect(second.done).toBe(true);
        const miniMapDep = deps[DownloadDependencyKeys.SaveOfflinePageMiniMap] as SaveOfflinePageMiniMapTaskDependency;
        expect(miniMapDep.offlineMiniMapWire.fetchType).toBe('offline');
    });
});
