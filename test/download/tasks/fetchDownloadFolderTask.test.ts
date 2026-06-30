import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { MiniMapType } from '../../../src/models/minimap/abstract/miniMapType';
import { DownloadDependencyKeys } from '../../../src/download/dependencies/downloadDependencyKeys';
import { FetchDownloadFolderTaskDependency } from '../../../src/download/dependencies/fetchDownloadFolderTaskDependency';
import { FetchDownloadFolderTask } from '../../../src/download/tasks/fetchDownloadFolderTask';
import { FetchMapboxPackTask } from '../../../src/download/tasks/fetchMapboxPackTask';
import { DownloadJob } from '../../../src/download/downloadJob';
import { DownloadPhase } from '../../../src/download/downloadPhase';
import { PageViewType } from '../../../src/models/pageViews/pageViewType';
import type { DownloadJobContext } from '../../../src/download/types';
import {
    createMockPlatformHarness,
    downloadConfig,
    PAGE_ID,
} from '../helpers/mockPlatformHarness';
import '../../../src/models/pageViews/registerPageViewParsers';
import '../../../src/models/betaSections/registerBetaSectionParsers';
import '../../../src/models/minimap/registerMiniMapParsers';

const MAP_DATA_ID = 'map-data-1';

const onlinePageJson = {
    id: PAGE_ID,
    routeType: 'Canyon',
    pageViewType: 'ropewiki',
    fetchType: 'online',
    name: 'Online Page',
    aka: [],
    url: 'https://ropewiki.com/page',
    quality: 4,
    userVotes: 10,
    regions: [{ id: 'r1', name: 'Region' }],
    difficulty: { technical: null, water: null, time: null, additionalRisk: null },
    permit: null,
    rappelCount: null,
    jumps: null,
    vehicle: null,
    rappelLongest: null,
    shuttleTime: null,
    overallLength: null,
    descentLength: null,
    exitLength: null,
    approachLength: null,
    overallTime: null,
    approachTime: null,
    descentTime: null,
    exitTime: null,
    approachElevGain: null,
    descentElevGain: null,
    exitElevGain: null,
    months: [],
    latestRevisionDate: '2024-01-01T00:00:00.000Z',
    bannerImage: null,
    betaSections: [],
    miniMap: {
        fetchType: 'online',
        miniMapType: MiniMapType.Page,
        polyLineLayerId: 'PolyLines',
        pointLayerId: 'Points',
        onlineTilesTemplate: 'https://cdn.example.com/tiles/{z}/{x}/{y}.pbf',
        bounds: { north: 1, south: 0, east: 1, west: 0 },
        title: 'Map',
        mapDataId: MAP_DATA_ID,
        tileCount: 1,
        tileTotalBytes: 100,
    },
    coordinates: null,
};

function createContext(
    deps: DownloadJobContext['taskDependencies'],
    appendPhases: DownloadJobContext['appendPhases'],
): DownloadJobContext {
    return {
        pageId: PAGE_ID,
        pageViewType: PageViewType.Ropewiki,
        config: downloadConfig,
        taskDependencies: deps,
        getDependency: (key) => deps[key]!,
        setDependency: (key, dep) => {
            deps[key] = dep;
        },
        appendPhases,
    };
}

describe('FetchDownloadFolderTask', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('downloads, extracts, converts online page JSON to offline, and sets route previews', async () => {
        const harness = createMockPlatformHarness();
        const pageRoot = harness.paths.pageRoot(PAGE_ID);
        jest.mocked(harness.readTextFile).mockResolvedValue(JSON.stringify(onlinePageJson));
        jest.mocked(harness.writeTextFile).mockImplementation(async (_path, content) => {
            jest.mocked(harness.readTextFile).mockResolvedValue(content);
        });

        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.FetchDownloadFolder]: new FetchDownloadFolderTaskDependency({
                downloadFolderUrl: 'https://cdn.example.com/page-zips/a.zip',
                parallelMapbox: true,
            }),
        };
        const task = new FetchDownloadFolderTask();
        const result = await task.runTick(
            createContext(deps, () => undefined),
            harness,
            new AbortController().signal,
        );

        expect(result.done).toBe(true);
        expect(harness.downloadFile).toHaveBeenCalledWith(
            expect.objectContaining({
                url: 'https://cdn.example.com/page-zips/a.zip',
            }),
        );
        expect(harness.extractZipArchive).toHaveBeenCalled();
        expect(harness.writeTextFile).toHaveBeenCalledWith(
            harness.paths.pageJson(PAGE_ID),
            expect.stringContaining('"fetchType":"offline"'),
        );
        const writtenJson = JSON.parse(
            jest.mocked(harness.writeTextFile).mock.calls[0]![1] as string,
        ) as Record<string, unknown>;
        const miniMap = writtenJson.miniMap as Record<string, string>;
        expect(miniMap.offlineTilesTemplate).toBe(
            `${pageRoot}mapdata/tiles/${MAP_DATA_ID}/{z}/{x}/{y}.pbf`,
        );
        expect(harness.setRoutePreviewsForPage).toHaveBeenCalled();
        expect(task.completed).toBe(1);
    });

    it('appends Mapbox phase after extract when parallelMapbox is false and page minimap exists', async () => {
        const harness = createMockPlatformHarness();
        jest.mocked(harness.readTextFile).mockResolvedValue(JSON.stringify(onlinePageJson));
        jest.mocked(harness.writeTextFile).mockImplementation(async (_path, content) => {
            jest.mocked(harness.readTextFile).mockResolvedValue(content);
        });

        const job = new DownloadJob({
            pageId: PAGE_ID,
            pageViewType: PageViewType.Ropewiki,
            config: downloadConfig,
            phases: [
                new DownloadPhase({
                    title: 'Downloading page bundle',
                    tasks: [new FetchDownloadFolderTask()],
                }),
            ],
            taskDependencies: {
                [DownloadDependencyKeys.FetchDownloadFolder]: new FetchDownloadFolderTaskDependency({
                    downloadFolderUrl: 'https://cdn.example.com/page-zips/a.zip',
                    parallelMapbox: false,
                }),
            },
        });

        await job.runTick(harness, new AbortController().signal);

        expect(job.phases).toHaveLength(2);
        expect(job.phases[1]?.tasks[0]).toBeInstanceOf(FetchMapboxPackTask);
        expect(job.taskDependencies[DownloadDependencyKeys.FetchMapboxPack]).toBeDefined();
    });

    it('propagates download errors', async () => {
        const harness = createMockPlatformHarness();
        jest.mocked(harness.downloadFile).mockRejectedValue(new Error('ZIP download failed'));

        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.FetchDownloadFolder]: new FetchDownloadFolderTaskDependency({
                downloadFolderUrl: 'https://cdn.example.com/page-zips/a.zip',
            }),
        };
        const task = new FetchDownloadFolderTask();

        await expect(
            task.runTick(
                createContext(deps, () => undefined),
                harness,
                new AbortController().signal,
            ),
        ).rejects.toThrow('ZIP download failed');
    });
});
