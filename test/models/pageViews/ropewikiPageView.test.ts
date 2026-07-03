import { describe, it, expect } from '@jest/globals';
import { DownloadDependencyKeys } from '../../../src/download/dependencies/downloadDependencyKeys';
import { FetchImageFilesTaskDependency } from '../../../src/download/dependencies/fetchImageFilesTaskDependency';
import { RopewikiPageView } from '../../../src/models/pageViews/ropewikiPageView';
import { OnlineRopewikiPageView } from '../../../src/models/pageViews/onlineRopewikiPageView';
import { OfflineRopewikiPageView } from '../../../src/models/pageViews/offlineRopewikiPageView';
import { ImageVersions } from '../../../src/models/mobile/imageVersions';
import { OfflinePageMiniMap } from '../../../src/models/minimap/concrete/offlinePageMiniMap';
import { Bounds } from '../../../src/models/minimap/bounds';
import { MiniMapType } from '../../../src/models/minimap/abstract/miniMapType';
import { OnlinePagePreview } from '../../../src/models/previews/onlinePagePreview';
import { LengthMeasurement } from '../../../src/models/measurements/lengthMeasurement';
import { TimeMeasurement } from '../../../src/models/measurements/timeMeasurement';
import { MinMax } from '../../../src/models/measurements/minMax';
import '../../../src/models/pageViews/registerPageViewParsers';
import '../../../src/models/betaSections/registerBetaSectionParsers';
import '../../../src/models/minimap/registerMiniMapParsers';
import '../../../src/models/previews/registerPreviewParsers';

const ROUTE_ID = '38f5c3fa-7248-41ed-815e-8b9e6aae5d61';
const IMAGE_ID_A = '550e8400-e29b-41d4-a716-446655440000';
const IMAGE_ID_B = '550e8400-e29b-41d4-a716-446655440001';

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

describe('RopewikiPageView models', () => {
    it('hydrates length/time fields from numbers, objects, and ranges, and round-trips', () => {
        const wire = {
            ...onlineResult(),
            rappelCount: { min: 1, max: 2 },
            rappelLongest: 200,
            overallLength: 5.1,
            approachElevGain: {
                value: 800,
                measurementType: 'length',
                unit: { measurementSystem: 'Imperial', name: 'feet' },
            },
            shuttleTime: 45,
            overallTime: { min: 3, max: 6 },
        };
        const page = OnlineRopewikiPageView.fromResult(wire);

        expect(page.rappelCount).toBeInstanceOf(MinMax);
        expect((page.rappelCount as MinMax<number>).toString()).toBe('1-2');
        expect(page.rappelLongest).toBeInstanceOf(LengthMeasurement);
        expect(page.rappelLongest?.toString()).toBe('200ft');
        expect(page.overallLength?.toString()).toBe('5.1mi');
        expect(page.approachElevGain).toBeInstanceOf(LengthMeasurement);
        expect(page.approachElevGain?.toString()).toBe('800ft');
        expect(page.shuttleTime).toBeInstanceOf(TimeMeasurement);
        expect(page.shuttleTime?.toString()).toBe('45min');
        expect(page.overallTime).toBeInstanceOf(MinMax);
        expect(page.overallTime?.toString()).toBe('3-6h');

        const again = OnlineRopewikiPageView.fromResult(page.toPlain());
        expect(again.overallLength).toBeInstanceOf(LengthMeasurement);
        expect(again.overallLength?.toString()).toBe('5.1mi');
        expect(again.rappelLongest?.toString()).toBe('200ft');
        expect(again.approachElevGain?.toString()).toBe('800ft');
        expect(again.overallTime).toBeInstanceOf(MinMax);
        expect(again.overallTime?.toString()).toBe('3-6h');
    });

    it('dispatches base fromResult to online/offline parsers', () => {
        const online = RopewikiPageView.fromResult(onlineResult());
        expect(online).toBeInstanceOf(OnlineRopewikiPageView);

        const offline = RopewikiPageView.fromResult({
            ...onlineResult(),
            fetchType: 'offline',
            bannerImage: {
                fetchType: 'offline',
                order: 0,
                id: IMAGE_ID_A,
                downloadedBannerPath: '/tmp/banner.avif',
                downloadedFullPath: '/tmp/full.avif',
                linkUrl: 'https://example.com',
                caption: null,
                latestRevisionDate: '2024-01-01T00:00:00.000Z',
            },
            betaSections: [],
            miniMap: null,
        });
        expect(offline).toBeInstanceOf(OfflineRopewikiPageView);
    });

    it('seeds fetch image dependency via getDependenciesForPhases', () => {
        const page = OnlineRopewikiPageView.fromResult(onlineResult());
        const phases = page.planDownloadPhases();
        const deps = page.getDependenciesForPhases(phases);
        const imageDep = deps[DownloadDependencyKeys.FetchImageFiles] as FetchImageFilesTaskDependency;
        expect(imageDep.slots).toHaveLength(2);
        expect(imageDep.slots.map((s) => s.imageId)).toEqual([IMAGE_ID_A, IMAGE_ID_B]);
    });

    it('toOffline maps missing image ids to null offline paths (1:1 online/offline images)', () => {
        const page = OnlineRopewikiPageView.fromResult(onlineResult());
        const offline = page.toOffline({
            [IMAGE_ID_A]: new ImageVersions({ banner: '/tmp/a-banner.avif', full: '/tmp/a-full.avif' }),
        });
        expect(offline.bannerImage?.downloadedBannerPath).toBe('/tmp/a-banner.avif');
        expect(offline.bannerImage?.downloadedFullPath).toBe('/tmp/a-full.avif');
        const sectionImage = offline.betaSections[0]?.images[0];
        expect(sectionImage).toBeDefined();
        expect(sectionImage?.downloadedBannerPath).toBeNull();
        expect(sectionImage?.downloadedFullPath).toBeNull();
    });

    it('toOffline throws when minimap exists but downloaded minimap is omitted', () => {
        const page = OnlineRopewikiPageView.fromResult(
            onlineResult({
                miniMapType: MiniMapType.Page,
                fetchType: 'online',
                title: 'Map',
                polyLineLayerId: 'PolyLines',
                pointLayerId: 'Points',
                onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                bounds: { north: 1, south: 0, east: 1, west: 0 },
                mapDataId: ROUTE_ID,
            }),
        );
        expect(() =>
            page.toOffline({
                [IMAGE_ID_A]: new ImageVersions({ banner: '/tmp/a-banner.avif', full: '/tmp/a-full.avif' }),
                [IMAGE_ID_B]: new ImageVersions({ banner: '/tmp/b-banner.avif', full: '/tmp/b-full.avif' }),
            }),
        ).toThrow(/requires downloadedMiniMap/);
    });

    it('toSavedPage creates online preview and null downloaded page path', () => {
        const page = OnlineRopewikiPageView.fromResult(onlineResult());
        const saved = page.toSavedPage();
        expect(saved.preview).toBeInstanceOf(OnlinePagePreview);
        expect(saved.downloadedPageViewPath).toBeNull();
    });

    it('toOffline succeeds when all required data is provided', () => {
        const page = OnlineRopewikiPageView.fromResult(onlineResult());
        const offline = page.toOffline({
            [IMAGE_ID_A]: new ImageVersions({ banner: '/tmp/a-banner.avif', full: '/tmp/a-full.avif' }),
            [IMAGE_ID_B]: new ImageVersions({ banner: '/tmp/b-banner.avif', full: '/tmp/b-full.avif' }),
        });
        expect(offline).toBeInstanceOf(OfflineRopewikiPageView);
        expect(offline.bannerImage?.downloadedBannerPath).toBe('/tmp/a-banner.avif');
    });

    it('toOffline preserves null rendition paths when download produced no file', () => {
        const page = OnlineRopewikiPageView.fromResult(onlineResult());
        const offline = page.toOffline({
            [IMAGE_ID_A]: new ImageVersions({ banner: '/tmp/a-banner.avif', full: null }),
            [IMAGE_ID_B]: new ImageVersions({ banner: null, full: '/tmp/b-full.avif' }),
        });
        expect(offline.bannerImage?.downloadedFullPath).toBeNull();
        const sectionImage = offline.betaSections[0]?.images[0];
        expect(sectionImage?.downloadedBannerPath).toBeNull();
        expect(sectionImage?.downloadedFullPath).toBe('/tmp/b-full.avif');
    });

    it('fromResult hydrates relative bundle paths when pageRoot is provided', () => {
        const view = OfflineRopewikiPageView.fromResult(
            {
                ...onlineResult(),
                fetchType: 'offline',
                bannerImage: {
                    fetchType: 'offline',
                    order: 0,
                    id: IMAGE_ID_A,
                    downloadedBannerPath: 'images/a-banner.avif',
                    downloadedFullPath: 'images/a-full.avif',
                    linkUrl: 'https://example.com',
                    caption: null,
                    latestRevisionDate: '2024-01-01T00:00:00.000Z',
                },
                betaSections: [],
                miniMap: {
                    fetchType: 'offline',
                    miniMapType: MiniMapType.Page,
                    polyLineLayerId: 'PolyLines',
                    pointLayerId: 'Points',
                    offlineTilesTemplate: 'mapdata/tiles/map-1/{z}/{x}/{y}.pbf',
                    bounds: { north: 1, south: 0, east: 1, west: 0 },
                    title: 'Map',
                },
            },
            'file:///root/',
        );
        expect(view.bannerImage?.downloadedBannerPath).toBe(
            'file:///root/images/a-banner.avif',
        );
        expect(view.bannerImage?.downloadedFullPath).toBe('file:///root/images/a-full.avif');
        const pageMiniMap = view.miniMap as OfflinePageMiniMap;
        expect(pageMiniMap.offlineTilesTemplate).toBe(
            'file:///root/mapdata/tiles/map-1/{z}/{x}/{y}.pbf',
        );
    });

    it('fromResult leaves absolute paths unchanged when pageRoot is provided', () => {
        const view = OfflineRopewikiPageView.fromResult(
            {
                ...onlineResult(),
                fetchType: 'offline',
                bannerImage: {
                    fetchType: 'offline',
                    order: 0,
                    id: IMAGE_ID_A,
                    downloadedBannerPath: 'file:///existing/banner.avif',
                    downloadedFullPath: null,
                    linkUrl: 'https://example.com',
                    caption: null,
                    latestRevisionDate: '2024-01-01T00:00:00.000Z',
                },
                betaSections: [],
                miniMap: null,
            },
            'file:///root/',
        );
        expect(view.bannerImage?.downloadedBannerPath).toBe('file:///existing/banner.avif');
    });

    it('offline parser validates offline miniMap type', () => {
        expect(() =>
            OfflineRopewikiPageView.fromResult({
                ...onlineResult(),
                fetchType: 'offline',
                bannerImage: null,
                betaSections: [],
                miniMap: {
                    miniMapType: MiniMapType.Page,
                    fetchType: 'online',
                    title: 'Map',
                    polyLineLayerId: 'PolyLines',
                    pointLayerId: 'Points',
                    onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                    bounds: { north: 1, south: 0, east: 1, west: 0 },
                },
            }),
        ).toThrow(/offline page\/centered minimap/);
    });

    it('rejects legacy top-level mapDataId on wire JSON', () => {
        expect(() =>
            OnlineRopewikiPageView.fromResult({
                ...onlineResult(),
                mapDataId: ROUTE_ID,
            }),
        ).toThrow(/must not include top-level mapDataId/);
    });

    it('base parser rejects mismatched fetchType argument', () => {
        expect(() => RopewikiPageView.fromResult(onlineResult(), 'offline')).toThrow(
            /fetchType must be "offline"/,
        );
    });

    it('toOffline accepts downloaded minimap when online minimap exists', () => {
        const page = OnlineRopewikiPageView.fromResult(
            onlineResult({
                miniMapType: MiniMapType.Page,
                fetchType: 'online',
                title: 'Map',
                polyLineLayerId: 'PolyLines',
                pointLayerId: 'Points',
                onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                bounds: { north: 1, south: 0, east: 1, west: 0 },
                mapDataId: ROUTE_ID,
            }),
        );
        const offline = page.toOffline(
            {
                [IMAGE_ID_A]: new ImageVersions({ banner: '/tmp/a-banner.avif', full: '/tmp/a-full.avif' }),
                [IMAGE_ID_B]: new ImageVersions({ banner: '/tmp/b-banner.avif', full: '/tmp/b-full.avif' }),
            },
            new OfflinePageMiniMap(
                'PolyLines',
                'Points',
                'file:///tiles/{z}/{x}/{y}.pbf',
                new Bounds(1, 0, 1, 0),
                'Map',
            ),
        );
        expect(offline.miniMap).toBeInstanceOf(OfflinePageMiniMap);
    });
});

