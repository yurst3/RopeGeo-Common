import { describe, it, expect } from '@jest/globals';
import { MiniMapType } from '../../../src/models/minimap/abstract/miniMapType';
import { Bounds } from '../../../src/models/minimap/bounds';
import { RoutesParams } from '../../../src/models/api/params/routesParams';
import { PageDataSource } from '../../../src/models/pageDataSource';
import { PageViewType } from '../../../src/models/pageViews/pageViewType';
import { FetchPageJsonTaskDependency } from '../../../src/download/dependencies/fetchPageJsonTaskDependency';
import { FetchImageFilesTaskDependency } from '../../../src/download/dependencies/fetchImageFilesTaskDependency';
import { FetchMapboxPackTaskDependency } from '../../../src/download/dependencies/fetchMapboxPackTaskDependency';
import { FetchRopeGeoTileListTaskDependency } from '../../../src/download/dependencies/fetchRopeGeoTileListTaskDependency';
import { FetchRopeGeoTileFilesTaskDependency } from '../../../src/download/dependencies/fetchRopeGeoTileFilesTaskDependency';
import { FetchRegionRouteListTaskDependency } from '../../../src/download/dependencies/fetchRegionRouteListTaskDependency';
import { SaveOfflinePageViewTaskDependency } from '../../../src/download/dependencies/saveOfflinePageViewTaskDependency';
import { SaveOfflinePageImagesTaskDependency } from '../../../src/download/dependencies/saveOfflinePageImagesTaskDependency';
import { SaveOfflinePageMiniMapTaskDependency } from '../../../src/download/dependencies/saveOfflinePageMiniMapTaskDependency';
import { OnlinePagePreview } from '../../../src/models/previews/onlinePagePreview';
import { AcaDifficultyRating } from '../../../src/models/difficulty/acaDifficultyRating';
import { downloadConfig, MAP_DATA_ID, PAGE_ID, REGION_ID } from '../helpers/mockPlatformHarness';

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

function roundTrip(
    Class: { fromStoredState(raw: unknown): { toStoredState(): unknown } },
    instance: { toStoredState(): unknown },
): void {
    const stored = instance.toStoredState();
    const restored = Class.fromStoredState(stored);
    expect(restored.toStoredState()).toEqual(stored);
}

describe('DownloadTaskDependency round-trips', () => {
    it('FetchPageJsonTaskDependency', () => {
        const preview = new OnlinePagePreview(
            PAGE_ID,
            PageDataSource.Ropewiki,
            null,
            null,
            null,
            'Title',
            [],
            [],
            new AcaDifficultyRating(null, null, null, null),
            null,
            'https://ropewiki.com',
            null,
        );
        const dep = FetchPageJsonTaskDependency.fromPreview(preview, downloadConfig);
        expect(dep.pageViewType).toBe(PageViewType.Ropewiki);
        expect(dep.pageUrl).toContain(PAGE_ID);
        roundTrip(FetchPageJsonTaskDependency, dep);
    });

    it('FetchImageFilesTaskDependency', () => {
        const dep = new FetchImageFilesTaskDependency([
            {
                imageId: 'img-1',
                versions: { banner: 'https://x/b.avif', full: null },
            },
        ]);
        roundTrip(FetchImageFilesTaskDependency, dep);
    });

    it('FetchMapboxPackTaskDependency', () => {
        const dep = new FetchMapboxPackTaskDependency(
            Bounds.fromResult({ north: 1, south: 0, east: 1, west: 0 }),
        );
        roundTrip(FetchMapboxPackTaskDependency, dep);
    });

    it('FetchRopeGeoTileListTaskDependency', () => {
        const dep = new FetchRopeGeoTileListTaskDependency({
            mapDataId: MAP_DATA_ID,
            tileCount: 5,
            tileTotalBytes: 5000,
            listPageLimit: 100,
            pageMiniMapWire,
        });
        roundTrip(FetchRopeGeoTileListTaskDependency, dep);
    });

    it('FetchRopeGeoTileFilesTaskDependency', () => {
        const dep = new FetchRopeGeoTileFilesTaskDependency({
            mapDataId: MAP_DATA_ID,
            tileUrls: ['https://api.example.com/tiles/0/0/0.pbf'],
            tileTotalBytes: 100,
            pageMiniMapWire,
        });
        roundTrip(FetchRopeGeoTileFilesTaskDependency, dep);
    });

    it('FetchRegionRouteListTaskDependency', () => {
        const routesParams = RoutesParams.fromResult(
            { region: { id: REGION_ID, name: 'Region', source: 'ropewiki' }, limit: 50 },
            true,
        );
        const dep = new FetchRegionRouteListTaskDependency({
            routesParams,
            routeCount: 10,
            totalBytes: 9000,
            regionId: REGION_ID,
            centeredRouteId: PAGE_ID,
            miniMapTitle: 'Routes',
        });
        roundTrip(FetchRegionRouteListTaskDependency, dep);
    });

    it('SaveOfflinePageViewTaskDependency', () => {
        const dep = new SaveOfflinePageViewTaskDependency({ id: PAGE_ID, name: 'Page' });
        roundTrip(SaveOfflinePageViewTaskDependency, dep);
    });

    it('SaveOfflinePageImagesTaskDependency', () => {
        const dep = new SaveOfflinePageImagesTaskDependency({
            'img-1': { banner: '/tmp/b.avif', full: null },
        });
        roundTrip(SaveOfflinePageImagesTaskDependency, dep);
    });

    it('SaveOfflinePageMiniMapTaskDependency', () => {
        const dep = new SaveOfflinePageMiniMapTaskDependency({
            miniMapType: MiniMapType.Page,
            fetchType: 'offline',
            title: 'Map',
            offlineTilesTemplate: '/tiles/{z}/{x}/{y}.pbf',
            polyLineLayerId: 'PolyLines',
            pointLayerId: 'Points',
            bounds: { north: 1, south: 0, east: 1, west: 0 },
        });
        roundTrip(SaveOfflinePageMiniMapTaskDependency, dep);
    });
});
