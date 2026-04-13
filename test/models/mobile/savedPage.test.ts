import { describe, it, expect } from '@jest/globals';
import { PageDataSource } from '../../../src/models/pageDataSource';
import { SavedPage } from '../../../src/models/mobile/savedPage';
import '../../../src/models/previews/registerPreviewParsers';

const onlinePreviewWire = {
    previewType: 'page',
    fetchType: 'online',
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

const offlinePreviewWire = {
    ...onlinePreviewWire,
    fetchType: 'offline',
    downloadedImagePath: '/tmp/preview.avif',
    imageUrl: undefined,
};

describe('SavedPage', () => {
    it('round-trips online preview', () => {
        const original = SavedPage.fromJsonString(
            JSON.stringify({
                preview: onlinePreviewWire,
                savedAt: 1700000000000,
                downloadedPageViewPath: null,
            }),
        );
        const again = SavedPage.fromJsonString(original.toString());
        expect(again.preview.id).toBe('page-1');
        expect(again.preview.fetchType).toBe('online');
        expect(again.savedAt).toBe(1700000000000);
        expect(again.downloadedPageViewPath).toBeNull();
    });

    it('round-trips offline preview and downloadedPageViewPath', () => {
        const sp = SavedPage.fromJsonString(
            JSON.stringify({
                preview: offlinePreviewWire,
                savedAt: 1700000000000,
                downloadedPageViewPath: '/tmp/page-view.json',
            }),
        );
        const again = SavedPage.fromJsonString(sp.toString());
        expect(again.preview.fetchType).toBe('offline');
        expect(again.downloadedPageViewPath).toBe('/tmp/page-view.json');
    });

    it('throws on invalid JSON', () => {
        expect(() => SavedPage.fromJsonString('{')).toThrow();
    });

    it('throws when preview is missing', () => {
        expect(() =>
            SavedPage.fromJsonString(
                JSON.stringify({ savedAt: 1 }),
            ),
        ).toThrow(/missing key/);
    });
});
