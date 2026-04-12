import { describe, it, expect } from '@jest/globals';
import { PageDataSource } from '../../../src/models/pageDataSource';
import { Bounds } from '../../../src/models/minimap/bounds';
import { DownloadedPageMiniMap } from '../../../src/models/minimap/downloadedPageMiniMap';
import { MiniMapType } from '../../../src/models/minimap/miniMapType';
import { RouteType } from '../../../src/models/routes/route';
import { RopewikiPageView } from '../../../src/models/api/endpoints/ropewikiPageView';
import { SavedPage } from '../../../src/models/mobile/savedPage';

const validPreviewWire = {
    id: 'page-1',
    source: PageDataSource.Ropewiki,
    imageUrl: null,
    rating: 4.5,
    ratingCount: 10,
    title: 'Test Canyon',
    regions: ['Zion'],
    aka: [],
    difficulty: {
        technical: '3',
        water: 'B',
        time: 'III',
        additionalRisk: 'PG',
    },
    mapData: null,
    externalLink: 'https://ropewiki.com/x',
    permit: null,
};

const validPageViewWire = {
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
    bannerImage: null,
    betaSections: [],
    miniMap: null,
    coordinates: null,
};

function freshValidPageViewWire(): Record<string, unknown> {
    return JSON.parse(JSON.stringify(validPageViewWire)) as Record<string, unknown>;
}

describe('SavedPage', () => {
    it('round-trips toString / fromJsonString', () => {
        const original = SavedPage.fromJsonString(
            JSON.stringify({
                preview: validPreviewWire,
                routeType: RouteType.Canyon,
                savedAt: 1700000000000,
            }),
        );
        const again = SavedPage.fromJsonString(original.toString());
        expect(again.preview.id).toBe('page-1');
        expect(again.preview.title).toBe('Test Canyon');
        expect(again.routeType).toBe(RouteType.Canyon);
        expect(again.savedAt).toBe(1700000000000);
        expect(again.downloadedPageView).toBeNull();
        expect(again.downloadedImages).toBeNull();
        expect(again.downloadedMiniMap).toBeNull();
    });

    it('round-trips downloadedMiniMap', () => {
        const dm = new DownloadedPageMiniMap(
            'layer-1',
            'file:///tiles/{z}/{x}/{y}.pbf',
            new Bounds(40, 39, -110, -111),
            'Offline route',
        );
        const base = SavedPage.fromJsonString(
            JSON.stringify({
                preview: validPreviewWire,
                routeType: RouteType.Canyon,
                savedAt: 1700000000000,
            }),
        );
        const sp = new SavedPage(
            base.preview,
            base.routeType,
            base.savedAt,
            base.downloadedPageView,
            base.downloadedImages,
            dm,
        );
        const again = SavedPage.fromJsonString(sp.toString());
        expect(again.downloadedMiniMap).toBeInstanceOf(DownloadedPageMiniMap);
        expect(again.downloadedMiniMap!.miniMapType).toBe(MiniMapType.DownloadedTilesTemplate);
        expect(again.downloadedMiniMap!.title).toBe('Offline route');
    });

    it('throws on legacy downloadedMapData string', () => {
        expect(() =>
            SavedPage.fromJsonString(
                JSON.stringify({
                    preview: validPreviewWire,
                    routeType: RouteType.Canyon,
                    savedAt: 1,
                    downloadedMapData: '/old/path',
                }),
            ),
        ).toThrow(/legacy key "downloadedMapData"/);
    });

    it('throws on invalid JSON', () => {
        expect(() => SavedPage.fromJsonString('{')).toThrow();
    });

    it('throws when preview is missing', () => {
        expect(() =>
            SavedPage.fromJsonString(
                JSON.stringify({ routeType: RouteType.Canyon, savedAt: 1 }),
            ),
        ).toThrow(/missing key/);
    });

    it('throws on bad routeType', () => {
        expect(() =>
            SavedPage.fromJsonString(
                JSON.stringify({
                    preview: validPreviewWire,
                    routeType: 'NotAType',
                    savedAt: 1,
                }),
            ),
        ).toThrow();
    });

    it('builds from RopewikiPageView using instance toPagePreview method', () => {
        const view = RopewikiPageView.fromResult(freshValidPageViewWire());
        const saved = SavedPage.fromRopewikiPageView(view, RouteType.Canyon, 'page-abc');
        expect(saved.preview.id).toBe('page-abc');
        expect(saved.preview.title).toBe('Test Page');
        expect(saved.preview.source).toBe(PageDataSource.Ropewiki);
    });

    it('returns same page view when no downloaded images are present', () => {
        const view = RopewikiPageView.fromResult(freshValidPageViewWire());
        const saved = SavedPage.fromRopewikiPageView(view, RouteType.Canyon, 'page-abc');
        expect(saved.applyDownloadedImagesToPageView(view)).toBe(view);
    });

    it('applyDownloadedImagesToPageView preserves coordinates', () => {
        const wire = freshValidPageViewWire();
        wire.coordinates = { lat: 40.1, lon: -111.2 };
        const view = RopewikiPageView.fromResult(wire);
        const saved = new SavedPage(
            view.toPagePreview('page-abc'),
            RouteType.Canyon,
            1,
            null,
            {},
        );
        const patched = saved.applyDownloadedImagesToPageView(view);
        expect(patched.coordinates).toEqual({ lat: 40.1, lon: -111.2 });
    });
});
