import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { MiniMapType } from '../../../src/models/minimap/abstract/miniMapType';
import { OnlinePagePreview } from '../../../src/models/previews/onlinePagePreview';
import { OnlineRopewikiPageView } from '../../../src/models/pageViews/onlineRopewikiPageView';
import { PageDataSource } from '../../../src/models/pageDataSource';
import { AcaDifficultyRating } from '../../../src/models/difficulty/acaDifficultyRating';
import { DownloadDependencyKeys } from '../../../src/download/dependencies/downloadDependencyKeys';
import { DeleteStoredPageTask } from '../../../src/download/tasks/deleteStoredPageTask';
import { FetchPageJsonTask } from '../../../src/download/tasks/fetchPageJsonTask';
import { DownloadJob } from '../../../src/download/downloadJob';
import type { DownloadJobConfig } from '../../../src/download/types';
import type { DownloadPlatformHarness } from '../../../src/download/types';
import '../../../src/models/pageViews/registerPageViewParsers';
import '../../../src/models/betaSections/registerBetaSectionParsers';
import '../../../src/models/minimap/registerMiniMapParsers';
import '../../../src/models/previews/registerPreviewParsers';

jest.mock('../../../src/helpers/httpRequest', () => ({
    httpRequest: jest.fn(),
}));

import { httpRequest } from '../../../src/helpers/httpRequest';

const mockHttpRequest = jest.mocked(httpRequest);

const ROUTE_ID = '38f5c3fa-7248-41ed-815e-8b9e6aae5d61';
const IMAGE_ID_A = '550e8400-e29b-41d4-a716-446655440000';

const downloadConfig: DownloadJobConfig = {
    savedAt: 1_700_000_000_000,
    mapboxStyleUrl: 'mapbox://styles/example',
    webScraperBaseUrl: 'https://api.example.com/',
};

function onlinePageJson(): Record<string, unknown> {
    return {
        id: ROUTE_ID,
        routeType: 'Canyon',
        pageViewType: 'ropewiki',
        fetchType: 'online',
        name: 'Test Page',
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
        mapDataId: ROUTE_ID,
        bannerImage: {
            fetchType: 'online',
            order: 0,
            id: IMAGE_ID_A,
            bannerUrl: 'https://example.com/banner.avif',
            fullUrl: 'https://example.com/full.avif',
            linkUrl: 'https://example.com',
            caption: null,
            latestRevisionDate: '2024-01-01T00:00:00.000Z',
            downloadBytes: { preview: 1, banner: 2, full: 3 },
        },
        betaSections: [],
        miniMap: {
            miniMapType: MiniMapType.Page,
            fetchType: 'online',
            title: 'Map',
            polyLineLayerId: 'PolyLines',
            pointLayerId: 'Points',
            onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
            bounds: { north: 1, south: 0, east: 1, west: 0 },
            tileCount: 2,
            tileTotalBytes: 2000,
        },
        coordinates: null,
    };
}

function createPreview(): OnlinePagePreview {
    return new OnlinePagePreview(
        ROUTE_ID,
        PageDataSource.Ropewiki,
        'https://example.com/thumb.jpg',
        4,
        10,
        'Test Page',
        ['Region'],
        [],
        new AcaDifficultyRating(null, null, null, null),
        null,
        'https://ropewiki.com/page',
        null,
    );
}

function createMockHarness(): DownloadPlatformHarness {
    return {
        downloadFile: jest.fn(async () => undefined),
        fileExists: jest.fn(async () => ({ exists: false })),
        readTextFile: jest.fn(async () => ''),
        writeTextFile: jest.fn(async () => undefined),
        ensureParentDir: jest.fn(async () => undefined),
        deletePageBundle: jest.fn(async () => undefined),
        gunzipTileIfNeeded: jest.fn(async () => undefined),
        paths: {
            pageRoot: () => '/pages/x',
            pageJson: () => '/pages/x/page.json',
            pageJsonTemp: () => '/pages/x/page.json.tmp',
            imageDest: () => '/pages/x/img',
            tileDest: () => '/pages/x/tile',
            regionGeojson: () => '/pages/x/routes.geojson',
        },
        mapbox: {
            startPack: jest.fn(async () => undefined),
            getPackProgress: jest.fn(async () => 1),
            deletePack: jest.fn(async () => undefined),
        },
        loadJobStore: jest.fn(async () => null),
        saveJobStore: jest.fn(async () => undefined),
        setRoutePreviewsForPage: jest.fn(async () => undefined),
    };
}

function taskKinds(job: { phases: { tasks: { taskKind: string }[] }[] }): string[][] {
    return job.phases.map((phase) => phase.tasks.map((task) => task.taskKind));
}

describe('OnlinePagePreview download job planning', () => {
    beforeEach(() => {
        mockHttpRequest.mockReset();
    });

    it('starts with delete then fetch page JSON phases only', () => {
        const job = createPreview().toDownloadJob(downloadConfig);
        expect(job.phases).toHaveLength(2);
        expect(job.phases[0]?.tasks[0]).toBeInstanceOf(DeleteStoredPageTask);
        expect(job.phases[1]?.tasks[0]).toBeInstanceOf(FetchPageJsonTask);
        expect(job.phases[0]?.title).toBe('Deleting stored page');
        expect(job.phases[1]?.title).toBe('Downloading page');
        expect(job.toUISnapshot().displayTotal).toBe(2);
    });

    it('seeds only fetchPageJson dependency at enqueue', () => {
        const job = createPreview().toDownloadJob(downloadConfig);
        expect(Object.keys(job.taskDependencies)).toEqual([DownloadDependencyKeys.FetchPageJson]);
    });

    it('appends explore-path content phases after FetchPageJsonTask completes', async () => {
        mockHttpRequest.mockResolvedValue({
            text: async () =>
                JSON.stringify({
                    resultType: 'ropewikiPageView',
                    result: onlinePageJson(),
                }),
        } as Response);

        const job = createPreview().toDownloadJob(downloadConfig);
        const harness = createMockHarness();
        const signal = new AbortController().signal;

        await job.runTick(harness, signal);
        expect(harness.deletePageBundle).toHaveBeenCalledWith(ROUTE_ID);
        expect(job.currentPhaseIndex).toBe(1);

        await job.runTick(harness, signal);

        const exploreJob = OnlineRopewikiPageView.fromResult(onlinePageJson()).toDownloadJob(downloadConfig);
        expect(taskKinds(job).slice(2)).toEqual(taskKinds(exploreJob).slice(1));
        expect(job.toUISnapshot().displayTotal).toBeGreaterThan(2);
        expect(job.taskDependencies[DownloadDependencyKeys.FetchImageFiles]).toBeDefined();
    });

    it('round-trips expanded job through stored state', async () => {
        mockHttpRequest.mockResolvedValue({
            text: async () =>
                JSON.stringify({
                    resultType: 'ropewikiPageView',
                    result: onlinePageJson(),
                }),
        } as Response);

        const job = createPreview().toDownloadJob(downloadConfig);
        const harness = createMockHarness();
        const signal = new AbortController().signal;

        await job.runTick(harness, signal);
        await job.runTick(harness, signal);

        const restored = DownloadJob.fromStoredState(job.toStoredState());
        expect(restored.phases.length).toBe(job.phases.length);
        expect(restored.toUISnapshot().displayTotal).toBe(job.phases.length);
    });
});
