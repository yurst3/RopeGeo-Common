import { describe, it, expect } from '@jest/globals';
import { Preview, PreviewType } from '../../../src/models/previews/preview';
import { OnlinePagePreview } from '../../../src/models/previews/onlinePagePreview';
import { RegionPreview } from '../../../src/models/previews/regionPreview';
import { AcaDifficultyRating } from '../../../src/models';
import { PageDataSource } from '../../../src/models/pageDataSource';
import '../../../src/models/previews/registerPreviewParsers';

function samplePagePreview(): OnlinePagePreview {
    const difficulty = new AcaDifficultyRating(null, null, null, null);
    return new OnlinePagePreview(
        'page-id',
        PageDataSource.Ropewiki,
        null,
        null,
        null,
        'Page Title',
        [],
        [],
        difficulty,
        null,
        null,
        null,
    );
}

function sampleRegionPreview(): RegionPreview {
    return new RegionPreview('region-id', 'Region Name', [], 0, 0, null, PageDataSource.Ropewiki);
}

describe('Preview', () => {
    describe('isPagePreview', () => {
        it('returns true for PagePreview', () => {
            const preview = samplePagePreview();
            expect(preview.isPagePreview()).toBe(true);
        });

        it('returns false for RegionPreview', () => {
            const preview = sampleRegionPreview();
            expect(preview.isPagePreview()).toBe(false);
        });

        it('narrows type so PagePreview-specific properties are accessible', () => {
            const preview: Preview = samplePagePreview();
            if (preview.isPagePreview()) {
                expect(preview.title).toBe('Page Title');
                expect(preview.regions).toEqual([]);
                expect(preview.difficultyRating).toBeInstanceOf(AcaDifficultyRating);
            }
        });
    });

    describe('isRegionPreview', () => {
        it('returns true for RegionPreview', () => {
            const preview = sampleRegionPreview();
            expect(preview.isRegionPreview()).toBe(true);
        });

        it('returns false for PagePreview', () => {
            const preview = samplePagePreview();
            expect(preview.isRegionPreview()).toBe(false);
        });

        it('narrows type so RegionPreview-specific properties are accessible', () => {
            const preview: Preview = sampleRegionPreview();
            if (preview.isRegionPreview()) {
                expect(preview.name).toBe('Region Name');
                expect(preview.parents).toEqual([]);
                expect(preview.pageCount).toBe(0);
                expect(preview.regionCount).toBe(0);
            }
        });
    });

    describe('previewType discrimination', () => {
        it('PagePreview has previewType Page', () => {
            const preview = samplePagePreview();
            expect(preview.previewType).toBe(PreviewType.Page);
        });

        it('RegionPreview has previewType Region', () => {
            const preview = sampleRegionPreview();
            expect(preview.previewType).toBe(PreviewType.Region);
        });
    });

    describe('fromResult', () => {
        it('validates and returns PagePreview for previewType page', () => {
            const plain = {
                previewType: 'page',
                fetchType: 'online',
                id: 'p1',
                title: 'Page 1',
                source: 'ropewiki',
                regions: [],
                aka: [],
                difficulty: {},
                mapData: null,
                externalLink: null,
                imageUrl: null,
                rating: null,
                ratingCount: null,
                permit: null,
            };
            const preview = Preview.fromResult(plain);
            expect(preview).toBe(plain);
            expect(preview.isPagePreview()).toBe(true);
            expect(preview.previewType).toBe(PreviewType.Page);
        });

        it('validates and returns RegionPreview for previewType region', () => {
            const plain = {
                previewType: 'region',
                id: 'r1',
                name: 'Region 1',
                parents: [],
                pageCount: 0,
                regionCount: 0,
                imageUrl: null,
                source: 'ropewiki',
            };
            const preview = Preview.fromResult(plain);
            expect(preview).toBe(plain);
            expect(preview.isRegionPreview()).toBe(true);
            expect(preview.previewType).toBe(PreviewType.Region);
        });

        it('throws if result is not an object', () => {
            expect(() => Preview.fromResult(null)).toThrow(
                'Preview result must be an object',
            );
            expect(() => Preview.fromResult('string')).toThrow(
                'Preview result must be an object',
            );
        });

        it('throws if previewType is missing or invalid', () => {
            expect(() => Preview.fromResult({})).toThrow(
                /previewType "page" or "region"/,
            );
            expect(() =>
                Preview.fromResult({ previewType: 'other' }),
            ).toThrow(/previewType "page" or "region"/);
        });
    });
});
