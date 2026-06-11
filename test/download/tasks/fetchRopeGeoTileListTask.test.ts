import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../../../src/download/helpers/downloadHttpRequest', () => ({
    downloadHttpRequest: jest.fn(),
}));

import '../helpers/preloadDownloadTasks';
import { MiniMapType } from '../../../src/models/minimap/abstract/miniMapType';
import { PaginationResultType } from '../../../src/models/api/results/paginationResults';
import { DownloadDependencyKeys } from '../../../src/download/dependencies/downloadDependencyKeys';
import { FetchRopeGeoTileListTaskDependency } from '../../../src/download/dependencies/fetchRopeGeoTileListTaskDependency';
import { FetchRopeGeoTileFilesTaskDependency } from '../../../src/download/dependencies/fetchRopeGeoTileFilesTaskDependency';
import { FetchRopeGeoTileListTask } from '../../../src/download/tasks/fetchRopeGeoTileListTask';
import { PageViewType } from '../../../src/models/pageViews/pageViewType';
import type { DownloadJobContext } from '../../../src/download/types';
import {
    createMockPlatformHarness,
    downloadConfig,
    MAP_DATA_ID,
    PAGE_ID,
} from '../helpers/mockPlatformHarness';
import { downloadHttpRequest } from '../../../src/download/helpers/downloadHttpRequest';

const mockDownloadHttpRequest = jest.mocked(downloadHttpRequest);

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

function tileListResponse(urls: string[], total = urls.length): Response {
    return {
        text: async () =>
            JSON.stringify({
                resultType: PaginationResultType.MapDataTileKeys,
                results: urls,
                total,
                page: 1,
                totalBytes: 1000,
            }),
    } as Response;
}

describe('FetchRopeGeoTileListTask', () => {
    beforeEach(() => {
        mockDownloadHttpRequest.mockReset();
    });

    it('completes immediately when tileCount is 0', async () => {
        const harness = createMockPlatformHarness();
        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.FetchRopeGeoTileList]: new FetchRopeGeoTileListTaskDependency({
                mapDataId: MAP_DATA_ID,
                tileCount: 0,
                tileTotalBytes: 0,
                listPageLimit: 100,
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
        const task = new FetchRopeGeoTileListTask(0);
        const result = await task.runTick(ctx, harness, new AbortController().signal);
        expect(result.done).toBe(true);
        expect(mockDownloadHttpRequest).not.toHaveBeenCalled();
        const filesDep = deps[DownloadDependencyKeys.FetchRopeGeoTileFiles] as FetchRopeGeoTileFilesTaskDependency;
        expect(filesDep.tileUrls).toEqual([]);
    });

    it('fetches tile URLs and seeds tile files dependency', async () => {
        mockDownloadHttpRequest.mockResolvedValue(
            tileListResponse([
                'https://api.example.com/tiles/0/0/0.pbf',
                'https://api.example.com/tiles/0/0/1.pbf',
            ]),
        );
        const harness = createMockPlatformHarness();
        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.FetchRopeGeoTileList]: new FetchRopeGeoTileListTaskDependency({
                mapDataId: MAP_DATA_ID,
                tileCount: 2,
                tileTotalBytes: 2000,
                listPageLimit: 100,
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
        const task = new FetchRopeGeoTileListTask(2);
        const result = await task.runTick(ctx, harness, new AbortController().signal);
        expect(result.done).toBe(true);
        expect(mockDownloadHttpRequest).toHaveBeenCalledTimes(1);
        const filesDep = deps[DownloadDependencyKeys.FetchRopeGeoTileFiles] as FetchRopeGeoTileFilesTaskDependency;
        expect(filesDep.tileUrls).toHaveLength(2);
    });
});
