import { describe, it, expect } from '@jest/globals';
import { PageDataSource } from '../../../src/models/pageDataSource';
import {
    ImageVersion,
    VERSION_FORMAT,
    ImageVersions,
} from '../../../src/models/mobile/imageVersions';
import { SavedPage } from '../../../src/models/mobile/savedPage';
import '../../../src/models/previews/registerPreviewParsers';

const validPreviewWire = {
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

    it('round-trips sparse nulls via ImageVersions.toPlain/fromResult', () => {
        const iv = ImageVersions.fromResult({
            preview: null,
            banner: '/a/b.jpg',
            full: null,
        });
        expect(iv[ImageVersion.banner]).toBe('/a/b.jpg');
        expect(iv[ImageVersion.preview] ?? null).toBeNull();
        const again = ImageVersions.fromResult(iv.toPlain());
        expect(again[ImageVersion.banner]).toBe('/a/b.jpg');
    });

    it('SavedPage round-trip preserves preview schema', () => {
        const json = JSON.stringify({
            preview: validPreviewWire,
            savedAt: 1700000000000,
            downloadedPageViewPath: '/tmp/page.json',
        });
        const sp = SavedPage.fromJsonString(json);
        expect(sp.downloadedPageViewPath).toBe('/tmp/page.json');
        const again = SavedPage.fromJsonString(sp.toString());
        expect(again.preview.id).toBe('page-1');
    });
});
