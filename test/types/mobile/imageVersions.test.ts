import { describe, it, expect } from '@jest/globals';
import { PageDataSource } from '../../../src/types/pageDataSource';
import { RouteType } from '../../../src/types/routes/route';
import {
    ImageVersion,
    VERSION_FORMAT,
    ImageVersions,
} from '../../../src/types/mobile/imageVersions';
import { SavedPage } from '../../../src/types/mobile/savedPage';

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
        risk: 'PG',
    },
    mapData: null,
    externalLink: 'https://ropewiki.com/x',
    permit: null,
};

describe('VERSION_FORMAT', () => {
    it('maps linkPreview to JPEG and other versions to AVIF', () => {
        expect(VERSION_FORMAT[ImageVersion.linkPreview]).toBe('image/jpeg');
        expect(VERSION_FORMAT[ImageVersion.preview]).toBe('image/avif');
        expect(VERSION_FORMAT[ImageVersion.banner]).toBe('image/avif');
        expect(VERSION_FORMAT[ImageVersion.full]).toBe('image/avif');
        expect(VERSION_FORMAT[ImageVersion.lossless]).toBe('image/avif');
    });
});

describe('ImageVersions', () => {
    it('rejects unknown keys in fromResult', () => {
        expect(() =>
            ImageVersions.fromResult({ preview: null, extra: null }),
        ).toThrow(/unknown key "extra"/);
    });

    it('round-trips sparse nulls via SavedPage', () => {
        const json = JSON.stringify({
            preview: validPreviewWire,
            routeType: RouteType.Canyon,
            savedAt: 1700000000000,
            downloadedPageView: '/tmp/page.json',
            downloadedImages: {
                'img-1': { preview: null, banner: '/a/b.jpg', full: null },
            },
            downloadedMapData: '/tmp/map/',
        });
        const sp = SavedPage.fromJsonString(json);
        expect(sp.downloadedImages?.['img-1']).toBeInstanceOf(ImageVersions);
        expect(sp.downloadedImages?.['img-1'][ImageVersion.banner]).toBe('/a/b.jpg');
        expect(sp.downloadedImages?.['img-1'][ImageVersion.preview] ?? null).toBeNull();
        const again = SavedPage.fromJsonString(sp.toString());
        expect(again.downloadedImages?.['img-1'][ImageVersion.banner]).toBe('/a/b.jpg');
    });

    it('migrates legacy string map values to ImageVersions', () => {
        const json = JSON.stringify({
            preview: validPreviewWire,
            routeType: RouteType.Canyon,
            savedAt: 1,
            downloadedImages: { 'img-1': '/old/path.jpg' },
        });
        const sp = SavedPage.fromJsonString(json);
        expect(sp.downloadedImages?.['img-1'][ImageVersion.banner]).toBe('/old/path.jpg');
        expect(sp.downloadedImages?.['img-1'][ImageVersion.preview] ?? null).toBeNull();
    });
});
