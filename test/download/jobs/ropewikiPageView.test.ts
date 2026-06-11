import { describe, it, expect } from '@jest/globals';
import { MiniMapType } from '../../../src/models/minimap/abstract/miniMapType';
import { OnlineRopewikiPageView } from '../../../src/models/pageViews/onlineRopewikiPageView';
import { planDownloadPhases } from '../../../src/download/helpers/planDownloadPhases';
import { DownloadDependencyKeys } from '../../../src/download/dependencies/downloadDependencyKeys';
import { DeleteStoredPageTask } from '../../../src/download/tasks/deleteStoredPageTask';
import { FetchPageJsonTask } from '../../../src/download/tasks/fetchPageJsonTask';
import type { DownloadJob } from '../../../src/download/downloadJob';
import type { DownloadJobConfig } from '../../../src/download/types';
import '../../../src/models/pageViews/registerPageViewParsers';
import '../../../src/models/betaSections/registerBetaSectionParsers';
import '../../../src/models/minimap/registerMiniMapParsers';

const ROUTE_ID = '38f5c3fa-7248-41ed-815e-8b9e6aae5d61';
const REGION_ID = 'a1b2c3d4-e29b-41d4-a716-446655440099';
const IMAGE_ID_A = '550e8400-e29b-41d4-a716-446655440000';
const IMAGE_ID_B = '550e8400-e29b-41d4-a716-446655440001';

const downloadConfig: DownloadJobConfig = {
    savedAt: 1_700_000_000_000,
    mapboxStyleUrl: 'mapbox://styles/example',
    webScraperBaseUrl: 'https://api.example.com/',
};

function onlineResult(miniMap: Record<string, unknown> | null = null): Record<string, unknown> {
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
        mapDataId: null,
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
        betaSections: [
            {
                fetchType: 'online',
                order: 1,
                title: 'Beta',
                text: 'Some beta',
                latestRevisionDate: '2024-01-01T00:00:00.000Z',
                images: [
                    {
                        fetchType: 'online',
                        order: 1,
                        id: IMAGE_ID_B,
                        bannerUrl: 'https://example.com/banner2.avif',
                        fullUrl: 'https://example.com/full2.avif',
                        linkUrl: 'https://example.com',
                        caption: null,
                        latestRevisionDate: '2024-01-01T00:00:00.000Z',
                        downloadBytes: { preview: 2, banner: 3, full: 4 },
                    },
                ],
            },
        ],
        miniMap,
        coordinates: null,
    };
}

function pageMiniMap(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        miniMapType: MiniMapType.Page,
        fetchType: 'online',
        title: 'Map',
        polyLineLayerId: 'PolyLines',
        pointLayerId: 'Points',
        onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
        bounds: { north: 1, south: 0, east: 1, west: 0 },
        tileCount: 0,
        tileTotalBytes: 0,
        ...overrides,
    };
}

function centeredRegionMiniMap(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        miniMapType: MiniMapType.CenteredRegion,
        fetchType: 'online',
        centeredRouteId: ROUTE_ID,
        title: 'Region routes',
        routesParams: { region: { id: REGION_ID, name: 'Region', source: 'ropewiki' } },
        routeCount: 0,
        totalBytes: 0,
        ...overrides,
    };
}

function taskKinds(job: DownloadJob): string[][] {
    return job.phases.map((phase) => phase.tasks.map((task) => task.taskKind));
}

function phaseTitles(job: DownloadJob): string[] {
    return job.phases.map((phase) => phase.title);
}

describe('OnlineRopewikiPageView download job planning', () => {
    it('phase 1 is always DeleteStoredPageTask', () => {
        const view = OnlineRopewikiPageView.fromResult(onlineResult());
        const job = view.toDownloadJob(downloadConfig);
        expect(job.phases[0]?.tasks).toHaveLength(1);
        expect(job.phases[0]?.tasks[0]).toBeInstanceOf(DeleteStoredPageTask);
        expect(job.phases[0]?.title).toBe('Deleting stored page');
    });

    it('does not include FetchPageJsonTask on the explore path', () => {
        const view = OnlineRopewikiPageView.fromResult(onlineResult());
        const job = view.toDownloadJob(downloadConfig);
        const kinds = taskKinds(job).flat();
        expect(kinds).not.toContain('fetchPageJson');
    });

    it('plans save-only content when there are no images and no minimap', () => {
        const view = OnlineRopewikiPageView.fromResult({
            ...onlineResult(),
            bannerImage: null,
            betaSections: [],
        });
        const job = view.toDownloadJob(downloadConfig);
        expect(taskKinds(job)).toEqual([
            ['deleteStoredPage'],
            ['saveOfflinePage'],
        ]);
        expect(phaseTitles(job)).toEqual(['Deleting stored page', 'Saving page']);
    });

    it('plans image download and save when images exist', () => {
        const view = OnlineRopewikiPageView.fromResult(onlineResult());
        const job = view.toDownloadJob(downloadConfig);
        expect(taskKinds(job)).toEqual([
            ['deleteStoredPage'],
            ['fetchImageFiles'],
            ['saveOfflinePage'],
        ]);
        expect(phaseTitles(job)).toEqual([
            'Deleting stored page',
            'Downloading Media',
            'Saving page',
        ]);
        expect(job.taskDependencies[DownloadDependencyKeys.FetchImageFiles]).toBeDefined();
    });

    it('plans page minimap with mapbox pack but omits tile phases when tileCount is 0', () => {
        const view = OnlineRopewikiPageView.fromResult({
            ...onlineResult(pageMiniMap()),
            mapDataId: ROUTE_ID,
        });
        const job = view.toDownloadJob(downloadConfig);
        expect(taskKinds(job)).toEqual([
            ['deleteStoredPage'],
            ['fetchImageFiles', 'fetchMapboxPack'],
            ['saveOfflinePage'],
        ]);
        expect(phaseTitles(job)[1]).toBe('Downloading Media');
    });

    it('plans tile list and tile file phases when tileCount is greater than 0', () => {
        const view = OnlineRopewikiPageView.fromResult({
            ...onlineResult(pageMiniMap({ tileCount: 5, tileTotalBytes: 5000 })),
            mapDataId: ROUTE_ID,
        });
        const job = view.toDownloadJob(downloadConfig);
        expect(taskKinds(job)).toEqual([
            ['deleteStoredPage'],
            ['fetchImageFiles', 'fetchMapboxPack', 'fetchRopeGeoTileList'],
            ['fetchRopeGeoTileFiles'],
            ['saveOfflinePage'],
        ]);
        expect(phaseTitles(job)).toEqual([
            'Deleting stored page',
            'Downloading Media',
            'Downloading map data',
            'Saving page',
        ]);
        expect(job.taskDependencies[DownloadDependencyKeys.FetchRopeGeoTileList]).toBeDefined();
    });

    it('plans centered region route list when routeCount is greater than 0', () => {
        const view = OnlineRopewikiPageView.fromResult({
            ...onlineResult(centeredRegionMiniMap({ routeCount: 12, totalBytes: 9000 })),
        });
        const job = view.toDownloadJob(downloadConfig);
        expect(taskKinds(job)).toEqual([
            ['deleteStoredPage'],
            ['fetchImageFiles', 'fetchRegionRouteList'],
            ['saveOfflinePage'],
        ]);
        expect(phaseTitles(job)[1]).toBe('Downloading Media');
        expect(job.taskDependencies[DownloadDependencyKeys.FetchRegionRouteList]).toBeDefined();
    });

    it('omits route list when centered region routeCount is 0', () => {
        const view = OnlineRopewikiPageView.fromResult({
            ...onlineResult(centeredRegionMiniMap()),
        });
        const job = view.toDownloadJob(downloadConfig);
        expect(taskKinds(job)).toEqual([
            ['deleteStoredPage'],
            ['fetchImageFiles'],
            ['saveOfflinePage'],
        ]);
    });

    it('planDownloadPhases matches content phases from toDownloadJob', () => {
        const view = OnlineRopewikiPageView.fromResult({
            ...onlineResult(pageMiniMap({ tileCount: 3, tileTotalBytes: 3000 })),
            mapDataId: ROUTE_ID,
        });
        const job = view.toDownloadJob(downloadConfig);
        const planned = planDownloadPhases(view);
        expect(taskKinds(job).slice(1)).toEqual(planned.map((phase) => phase.tasks.map((task) => task.taskKind)));
    });
});
