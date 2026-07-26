import { describe, it, expect, jest } from '@jest/globals';
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
const SECTION_ID = '550e8400-e29b-41d4-a716-446655440002';

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
            previewUrl: 'https://example.com/preview.avif',
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
                id: SECTION_ID,
                order: 1,
                title: 'Beta',
                text: 'Some beta',
                latestRevisionDate: '2024-01-01T00:00:00.000Z',
                images: [
                    {
                        fetchType: 'online',
                        order: 1,
                        id: IMAGE_ID_B,
                        previewUrl: 'https://example.com/preview2.avif',
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
    it('defaults authors to null when omitted from wire payload', () => {
        const view = OnlineRopewikiPageView.fromResult(onlineResult());
        expect(view.authors).toBeNull();
        expect(view.bannerImage?.authors).toBeNull();
        expect(view.betaSections[0]?.images[0]?.authors).toBeNull();
    });

    it('parses authors on page, images, and page minimap', () => {
        const wire = onlineResult({
            miniMapType: MiniMapType.Page,
            fetchType: 'online',
            title: 'Map',
            polyLineLayerId: 'PolyLines',
            pointLayerId: 'Points',
            onlineTilesTemplate: 'https://api.example.com/{z}/{x}/{y}.pbf',
            bounds: { north: 1, south: 0, east: 1, west: 0 },
            authors: ['MapAuthor'],
        });
        wire.authors = ['PageA', 'PageB'];
        (wire.bannerImage as Record<string, unknown>).authors = ['BannerAuthor'];
        const section = (wire.betaSections as Record<string, unknown>[])[0]!;
        const image = (section.images as Record<string, unknown>[])[0]!;
        image.authors = ['ImageAuthor'];

        const view = OnlineRopewikiPageView.fromResult(wire);
        expect(view.authors).toEqual(['PageA', 'PageB']);
        expect(view.bannerImage?.authors).toEqual(['BannerAuthor']);
        expect(view.betaSections[0]?.images[0]?.authors).toEqual(['ImageAuthor']);
        expect((view.miniMap as { authors: string[] | null }).authors).toEqual(['MapAuthor']);
    });

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
        expect(imageDep.slots[0]?.versions.preview).toBe(
            'https://example.com/preview.avif',
        );
        expect(imageDep.slots[1]?.versions.preview).toBe(
            'https://example.com/preview2.avif',
        );
    });

    it('rejects duplicate beta-section ids when parsing page views', () => {
        const wire = onlineResult();
        const sections = wire.betaSections as Record<string, unknown>[];
        wire.betaSections = [
            sections[0],
            { ...sections[0], order: 2, images: [] },
        ];
        expect(() => OnlineRopewikiPageView.fromResult(wire)).toThrow(
            `Duplicate beta-section id in OnlineRopewikiPageView: ${SECTION_ID}`,
        );
    });

    it('builds online and offline section and image lookups', () => {
        const page = OnlineRopewikiPageView.fromResult(onlineResult());
        const onlineLookup = page.toBetaSectionLookup();
        expect(onlineLookup['']).toBeUndefined();
        expect(onlineLookup[SECTION_ID]).toBe(page.betaSections[0]);

        const onlineImages = page.toImageLookup();
        expect(onlineImages[IMAGE_ID_A]).toEqual({ image: page.bannerImage });
        expect(onlineImages[IMAGE_ID_B]).toEqual({
            image: page.betaSections[0]?.images[0],
            betaSectionId: SECTION_ID,
        });

        const offline = page.toOffline({
            [IMAGE_ID_A]: new ImageVersions({
                preview: '/tmp/a-preview.avif',
                banner: '/tmp/a-banner.avif',
                full: '/tmp/a-full.avif',
            }),
            [IMAGE_ID_B]: new ImageVersions({
                preview: '/tmp/b-preview.avif',
                banner: '/tmp/b-banner.avif',
                full: '/tmp/b-full.avif',
            }),
        });
        const offlineLookup = offline.toBetaSectionLookup();
        expect(offlineLookup[SECTION_ID]).toBe(offline.betaSections[0]);
        expect(offline.toImageLookup()[IMAGE_ID_B]).toEqual({
            image: offline.betaSections[0]?.images[0],
            betaSectionId: SECTION_ID,
        });
    });

    it('builds measurements lookup from page stats including min/max time expansion', () => {
        const wire = onlineResult();
        wire.approachLength = 1.5;
        wire.approachElevGain = 400;
        wire.shuttleTime = 15;
        wire.approachTime = { min: 1, max: 2 };
        wire.descentTime = 3;
        const page = OnlineRopewikiPageView.fromResult(wire);
        const lookup = page.toMeasurementsLookup();

        expect(lookup.approachLength).toBeInstanceOf(LengthMeasurement);
        expect(lookup.approachLength!.value).toBe(1.5);
        expect(lookup.approachElevGain!.value).toBe(400);
        expect(lookup.shuttleTime).toBeInstanceOf(TimeMeasurement);
        expect(lookup.shuttleTime!.value).toBe(15);
        expect(lookup.minApproachTime!.value).toBe(1);
        expect(lookup.maxApproachTime!.value).toBe(2);
        expect(lookup.minDescentTime).toBe(lookup.maxDescentTime);
        expect(lookup.minDescentTime!.value).toBe(3);
        expect(lookup.descentLength).toBeUndefined();
        expect(lookup.exitElevGain).toBeUndefined();

        const offline = page.toOffline({
            [IMAGE_ID_A]: new ImageVersions({
                preview: '/tmp/a-preview.avif',
                banner: '/tmp/a-banner.avif',
                full: '/tmp/a-full.avif',
            }),
            [IMAGE_ID_B]: new ImageVersions({
                preview: '/tmp/b-preview.avif',
                banner: '/tmp/b-banner.avif',
                full: '/tmp/b-full.avif',
            }),
        });
        expect(offline.toMeasurementsLookup().approachLength!.value).toBe(1.5);
    });

    it('toOfflineFromExtractedBundle resolves preview, banner, and full files', async () => {
        const page = OnlineRopewikiPageView.fromResult({
            ...onlineResult(),
            betaSections: [],
        });
        const fileExists = jest.fn(async (path: string) => ({
            exists: path.includes('-preview.') || path.includes('-banner.'),
        }));
        const offline = (await page.toOfflineFromExtractedBundle(
            'file:///pages/root/',
            { fileExists } as never,
        )) as OfflineRopewikiPageView;
        expect(offline.bannerImage?.downloadedPreviewPath).toBe(
            `file:///pages/root/images/${IMAGE_ID_A}-preview.avif`,
        );
        expect(offline.bannerImage?.downloadedBannerPath).toBe(
            `file:///pages/root/images/${IMAGE_ID_A}-banner.avif`,
        );
        expect(offline.bannerImage?.downloadedFullPath).toBeNull();
    });

    it('toOffline maps missing image ids to null offline paths (1:1 online/offline images)', () => {
        const page = OnlineRopewikiPageView.fromResult(onlineResult());
        const offline = page.toOffline({
            [IMAGE_ID_A]: new ImageVersions({
                preview: '/tmp/a-preview.avif',
                banner: '/tmp/a-banner.avif',
                full: '/tmp/a-full.avif',
            }),
        });
        expect(offline.bannerImage?.downloadedPreviewPath).toBe(
            '/tmp/a-preview.avif',
        );
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
                    downloadedPreviewPath: 'images/a-preview.avif',
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
        expect(view.bannerImage?.downloadedPreviewPath).toBe(
            'file:///root/images/a-preview.avif',
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

