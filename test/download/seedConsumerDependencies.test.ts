import { describe, it, expect } from '@jest/globals';
import { MiniMapType } from '../../src/models/minimap/abstract/miniMapType';
import { OnlineRopewikiPageView } from '../../src/models/pageViews/onlineRopewikiPageView';
import { DownloadDependencyKeys } from '../../src/download/dependencies/downloadDependencyKeys';
import { seedConsumerDependencies } from '../../src/download/helpers/seedConsumerDependencies';
import { planDownloadPhases } from '../../src/download/helpers/planDownloadPhases';
import { MAP_DATA_ID, PAGE_ID, REGION_ID } from './helpers/mockPlatformHarness';
import '../../src/models/pageViews/registerPageViewParsers';
import '../../src/models/betaSections/registerBetaSectionParsers';
import '../../src/models/minimap/registerMiniMapParsers';

function onlineViewWire(
    miniMap: Record<string, unknown> | null = null,
    mapDataId: string | null = null,
): Record<string, unknown> {
    return {
        id: PAGE_ID,
        routeType: 'Canyon',
        pageViewType: 'ropewiki',
        fetchType: 'online',
        name: 'Test Page',
        aka: [],
        url: 'https://ropewiki.com/page',
        quality: 4,
        userVotes: 10,
        regions: [{ id: REGION_ID, name: 'Region' }],
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
        mapDataId,
        bannerImage: {
            fetchType: 'online',
            order: 0,
            id: '550e8400-e29b-41d4-a716-446655440000',
            bannerUrl: 'https://example.com/banner.avif',
            fullUrl: 'https://example.com/full.avif',
            linkUrl: 'https://example.com',
            caption: null,
            latestRevisionDate: '2024-01-01T00:00:00.000Z',
            downloadBytes: { preview: 1, banner: 2, full: 3 },
        },
        betaSections: [],
        miniMap,
        coordinates: null,
    };
}

describe('seedConsumerDependencies', () => {
    it('seeds dependencies matching tasks in the phase plan', () => {
        const view = OnlineRopewikiPageView.fromResult(
            onlineViewWire(
                {
                    miniMapType: MiniMapType.Page,
                    fetchType: 'online',
                    title: 'Map',
                    polyLineLayerId: 'PolyLines',
                    pointLayerId: 'Points',
                    onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                    bounds: { north: 1, south: 0, east: 1, west: 0 },
                    tileCount: 3,
                    tileTotalBytes: 3000,
                },
                MAP_DATA_ID,
            ),
        );
        const phases = planDownloadPhases(view);
        const tasks = phases.flatMap((phase) => phase.tasks);
        const deps = seedConsumerDependencies(view, tasks);

        expect(deps[DownloadDependencyKeys.FetchImageFiles]).toBeDefined();
        expect(deps[DownloadDependencyKeys.FetchMapboxPack]).toBeDefined();
        expect(deps[DownloadDependencyKeys.FetchRopeGeoTileList]).toBeDefined();
        expect(deps[DownloadDependencyKeys.SaveOfflinePageView]).toBeDefined();
    });

    it('seeds only save view dependency for save-only plan', () => {
        const view = OnlineRopewikiPageView.fromResult({
            ...onlineViewWire(),
            bannerImage: null,
        });
        const phases = planDownloadPhases(view);
        const deps = seedConsumerDependencies(view, phases.flatMap((p) => p.tasks));
        expect(Object.keys(deps)).toEqual([DownloadDependencyKeys.SaveOfflinePageView]);
    });
});
