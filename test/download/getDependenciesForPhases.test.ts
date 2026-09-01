import { describe, it, expect } from '@jest/globals';
import { MiniMapType } from '../../src/models/minimap/abstract/miniMapType';
import { DownloadDependencyKeys } from '../../src/download/dependencies/downloadDependencyKeys';
import { OnlineRopewikiPageView } from '../../src/models/pageViews/onlineRopewikiPageView';
import { FetchImageFilesTask } from '../../src/download/tasks/fetchImageFilesTask';
import { FetchMapboxPackTask } from '../../src/download/tasks/fetchMapboxPackTask';
import { FetchRopeGeoTileListTask } from '../../src/download/tasks/fetchRopeGeoTileListTask';
import { FetchRegionRouteListTask } from '../../src/download/tasks/fetchRegionRouteListTask';
import { SaveOfflinePageTask } from '../../src/download/tasks/saveOfflinePageTask';
import '../../src/models/pageViews/registerPageViewParsers';
import '../../src/models/betaSections/registerBetaSectionParsers';
import '../../src/models/minimap/registerMiniMapParsers';

const MAP_DATA_ID = '550e8400-e29b-41d4-a716-446655440002';
const REGION_ID = 'a1b2c3d4-e29b-41d4-a716-446655440099';

function onlineViewWire(
    miniMap: Record<string, unknown> | null = null,
    mapDataId: string | null = null,
): Record<string, unknown> {
    const miniMapWire =
        miniMap ??
        (mapDataId != null
            ? {
                  fetchType: 'online',
                  miniMapType: MiniMapType.Page,
                  mapDataId,
                  polyLineLayerId: 'PolyLines',
                  pointLayerId: 'Points',
                  onlineTilesTemplate: 'https://cdn.example.com/tiles/{z}/{x}/{y}.pbf',
                  bounds: { north: 1, south: 0, east: 1, west: 0 },
                  title: 'Map',
                  tileCount: 2,
                  tileTotalBytes: 100,
              }
            : null);
    return {
        id: '38f5c3fa-7248-41ed-815e-8b9e6aae5d61',
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
        bannerImage: {
            fetchType: 'online',
            order: 0,
            id: '550e8400-e29b-41d4-a716-446655440000',
            bannerUrl: 'https://example.com/banner.avif',
            fullUrl: 'https://example.com/full.avif',
            linkUrl: 'https://example.com',
            caption: null,
            latestRevisionDate: '2024-01-01T00:00:00.000Z',
            downloadBytes: null,
        },
        betaSections: [],
        miniMap: miniMapWire,
        coordinates: null,
        downloadFolder: null,
    };
}

describe('OnlineRopewikiPageView.getDependenciesForPhases', () => {
    it('seeds image, mapbox, tile list, and save dependencies for page minimap legacy plan', () => {
        const view = OnlineRopewikiPageView.fromResult(onlineViewWire(null, MAP_DATA_ID));
        const phases = view.planDownloadPhases();
        const tasks = phases.flatMap((phase) => phase.tasks);
        const deps = view.getDependenciesForPhases(phases);

        expect(tasks.some((task) => task instanceof FetchImageFilesTask)).toBe(true);
        expect(tasks.some((task) => task instanceof FetchMapboxPackTask)).toBe(true);
        expect(tasks.filter((task) => task instanceof FetchMapboxPackTask)).toHaveLength(2);
        expect(tasks.some((task) => task instanceof FetchRopeGeoTileListTask)).toBe(true);
        expect(tasks.some((task) => task instanceof SaveOfflinePageTask)).toBe(true);
        expect(deps[DownloadDependencyKeys.FetchImageFiles]).toBeDefined();
        expect(deps[DownloadDependencyKeys.FetchMapboxPack]).toBeDefined();
        expect(deps[DownloadDependencyKeys.FetchRopeGeoTileList]).toBeDefined();
        expect(deps[DownloadDependencyKeys.SaveOfflinePageView]).toBeDefined();
    });

    it('seeds only save dependency when no images or minimap assets', () => {
        const view = OnlineRopewikiPageView.fromResult({
            ...onlineViewWire(null, null),
            bannerImage: null,
        });
        const phases = view.planDownloadPhases();
        const deps = view.getDependenciesForPhases(phases);
        expect(Object.keys(deps)).toEqual([DownloadDependencyKeys.SaveOfflinePageView]);
    });
});
