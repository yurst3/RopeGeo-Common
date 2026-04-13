import { describe, it, expect } from '@jest/globals';
import { RopewikiPageView } from '../../../src/models/pageViews/ropewikiPageView';
import { OnlineRopewikiPageView } from '../../../src/models/pageViews/onlineRopewikiPageView';
import { OfflineRopewikiPageView } from '../../../src/models/pageViews/offlineRopewikiPageView';
import { ImageVersions } from '../../../src/models/mobile/imageVersions';
import { OfflinePageMiniMap } from '../../../src/models/minimap/offlinePageMiniMap';
import { Bounds } from '../../../src/models/minimap/bounds';
import { MiniMapType } from '../../../src/models/minimap/miniMapType';
import { OnlinePagePreview } from '../../../src/models/previews/onlinePagePreview';
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

    it('collects downloadable image tuples', () => {
        const page = OnlineRopewikiPageView.fromResult(onlineResult());
        const tuples = page.getImageIdsToDownload();
        expect(tuples).toHaveLength(2);
        expect(tuples.map((t) => t[0])).toEqual([IMAGE_ID_A, IMAGE_ID_B]);
    });

    it('toOffline throws when a required image is missing', () => {
        const page = OnlineRopewikiPageView.fromResult(onlineResult());
        expect(() =>
            page.toOffline({
                [IMAGE_ID_A]: new ImageVersions({ banner: '/tmp/a-banner.avif', full: '/tmp/a-full.avif' }),
            }),
        ).toThrow(/missing downloaded image/);
    });

    it('toOffline throws when minimap exists but downloaded minimap is omitted', () => {
        const page = OnlineRopewikiPageView.fromResult(
            onlineResult({
                miniMapType: MiniMapType.OnlineTilesTemplate,
                fetchType: 'online',
                title: 'Map',
                layerId: ROUTE_ID,
                onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                bounds: { north: 1, south: 0, east: 1, west: 0 },
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

    it('offline parser validates offline miniMap type', () => {
        expect(() =>
            OfflineRopewikiPageView.fromResult({
                ...onlineResult(),
                fetchType: 'offline',
                bannerImage: null,
                betaSections: [],
                miniMap: {
                    miniMapType: MiniMapType.OnlineTilesTemplate,
                    fetchType: 'online',
                    title: 'Map',
                    layerId: ROUTE_ID,
                    onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                    bounds: { north: 1, south: 0, east: 1, west: 0 },
                },
            }),
        ).toThrow(/offline page\/centered minimap/);
    });

    it('base parser rejects mismatched fetchType argument', () => {
        expect(() => RopewikiPageView.fromResult(onlineResult(), 'offline')).toThrow(
            /fetchType must be "offline"/,
        );
    });

    it('toOffline accepts downloaded minimap when online minimap exists', () => {
        const page = OnlineRopewikiPageView.fromResult(
            onlineResult({
                miniMapType: MiniMapType.OnlineTilesTemplate,
                fetchType: 'online',
                title: 'Map',
                layerId: ROUTE_ID,
                onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                bounds: { north: 1, south: 0, east: 1, west: 0 },
            }),
        );
        const offline = page.toOffline(
            {
                [IMAGE_ID_A]: new ImageVersions({ banner: '/tmp/a-banner.avif', full: '/tmp/a-full.avif' }),
                [IMAGE_ID_B]: new ImageVersions({ banner: '/tmp/b-banner.avif', full: '/tmp/b-full.avif' }),
            },
            new OfflinePageMiniMap(
                ROUTE_ID,
                'file:///tiles/{z}/{x}/{y}.pbf',
                new Bounds(1, 0, 1, 0),
                'Map',
            ),
        );
        expect(offline.miniMap).toBeInstanceOf(OfflinePageMiniMap);
    });
});

