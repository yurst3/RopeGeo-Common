import { describe, it, expect } from '@jest/globals';
import {
    AcaDifficultyRating,
    AcaRiskSubRating,
    AcaTechnicalSubRating,
    AcaTimeSubRating,
    AcaWaterSubRating,
} from '../../../src/models';
import { PermitStatus } from '../../../src/models/permitStatus';
import { PageDataSource } from '../../../src/models/pageDataSource';
import {
    PagePreview,
    type GetRopewikiPagePreviewRow,
} from '../../../src/models/previews/pagePreview';
import { OnlinePagePreview } from '../../../src/models/previews/onlinePagePreview';
import { OfflinePagePreview } from '../../../src/models/previews/offlinePagePreview';
import '../../../src/models/previews/registerPreviewParsers';

describe('PagePreview', () => {
    const baseRow: GetRopewikiPagePreviewRow = {
        pageId: 'page-1',
        title: 'Test Page',
        quality: 4.5,
        userVotes: 10,
        technicalRating: '2',
        timeRating: 'III',
        waterRating: 'C',
        riskRating: 'PG',
        regionId: 'region-1',
        regionName: 'Test Region',
        bannerFileUrl: 'https://example.com/banner.jpg',
        url: 'https://ropewiki.com/page',
        permits: 'Yes',
    };

    describe('fromDbRow', () => {
        it('builds PagePreview with mapped row fields and AcaDifficulty', () => {
            const preview = PagePreview.fromDbRow(baseRow, null);
            expect(preview.previewType).toBe('page');
            expect(preview.id).toBe('page-1');
            expect(preview.source).toBe(PageDataSource.Ropewiki);
            expect(preview.title).toBe('Test Page');
            expect(preview.rating).toBe(4.5);
            expect(preview.ratingCount).toBe(10);
            expect(preview.regions).toEqual(['Test Region']);
            expect(preview.aka).toEqual([]);
            expect(preview.imageUrl).toBe('https://example.com/banner.jpg');
            expect(preview.externalLink).toBe('https://ropewiki.com/page');
            expect(preview.mapData).toBeNull();
            expect(preview.permit).toBe(PermitStatus.Yes);
            expect(preview.difficultyRating).toBeInstanceOf(AcaDifficultyRating);
            const d = preview.difficultyRating as AcaDifficultyRating;
            expect(d.technical).toBe(AcaTechnicalSubRating.Two);
            expect(d.water).toBe(AcaWaterSubRating.C);
            expect(d.time).toBe(AcaTimeSubRating.III);
            expect(d.additionalRisk).toBe(AcaRiskSubRating.PG);
            expect(d.effectiveRisk).toBe(AcaRiskSubRating.PG);
        });

        it('uses optional regions override when provided', () => {
            const preview = PagePreview.fromDbRow(baseRow, null, ['Region A', 'Region B']);
            expect(preview.regions).toEqual(['Region A', 'Region B']);
        });

        it('uses optional aka when provided', () => {
            const preview = PagePreview.fromDbRow(baseRow, null, undefined, ['Imlay', 'Imlay Canyon']);
            expect(preview.aka).toEqual(['Imlay', 'Imlay Canyon']);
        });

        it('parses null permit as null', () => {
            const row = { ...baseRow, permits: null };
            const preview = PagePreview.fromDbRow(row, null);
            expect(preview.permit).toBeNull();
        });

        it('parses empty permit string as null', () => {
            const row = { ...baseRow, permits: '' };
            const preview = PagePreview.fromDbRow(row, null);
            expect(preview.permit).toBeNull();
        });

        it('parses valid permit values', () => {
            expect(PagePreview.fromDbRow({ ...baseRow, permits: 'No' }, null).permit).toBe(PermitStatus.No);
            expect(PagePreview.fromDbRow({ ...baseRow, permits: 'Restricted' }, null).permit).toBe(
                PermitStatus.Restricted,
            );
            expect(PagePreview.fromDbRow({ ...baseRow, permits: 'Closed' }, null).permit).toBe(PermitStatus.Closed);
        });

        it('sets effectiveRisk from technical when additionalRisk not in row', () => {
            const row = { ...baseRow, riskRating: null };
            const preview = PagePreview.fromDbRow(row, null);
            const d = preview.difficultyRating as AcaDifficultyRating;
            expect(d.additionalRisk).toBeNull();
            expect(d.effectiveRisk).toBe(AcaRiskSubRating.PG);
        });

        it('passes mapData through', () => {
            const preview = PagePreview.fromDbRow(baseRow, 'map-data-id');
            expect(preview.mapData).toBe('map-data-id');
        });
    });

    describe('fromResult', () => {
        const basePreview = {
            previewType: 'page' as const,
            id: 'page-1',
            source: PageDataSource.Ropewiki,
            rating: 4.5,
            ratingCount: 10,
            title: 'Test Page',
            regions: ['Region'],
            aka: [],
            difficulty: {
                technical: '2',
                water: 'C',
                time: 'III',
                additionalRisk: 'PG',
            },
            mapData: null,
            externalLink: 'https://ropewiki.com/page',
            permit: null,
        };

        it('parses online preview when fetchType is online', () => {
            const preview = PagePreview.fromResult({
                ...basePreview,
                fetchType: 'online',
                imageUrl: null,
            });
            expect(preview).toBeInstanceOf(OnlinePagePreview);
        });

        it('parses offline preview when fetchType is offline', () => {
            const preview = PagePreview.fromResult({
                ...basePreview,
                fetchType: 'offline',
                downloadedImagePath: '/tmp/preview.avif',
            });
            expect(preview).toBeInstanceOf(OfflinePagePreview);
        });

        it('throws on fetchType mismatch when explicit fetchType is provided', () => {
            expect(() =>
                PagePreview.fromResult(
                    {
                        ...basePreview,
                        fetchType: 'offline',
                        downloadedImagePath: null,
                    },
                    'online',
                ),
            ).toThrow(/fetchType mismatch/);
        });

        it('throws when offline downloadedImagePath is wrong type', () => {
            expect(() =>
                PagePreview.fromResult({
                    ...basePreview,
                    fetchType: 'offline',
                    downloadedImagePath: 42,
                }),
            ).toThrow(/downloadedImagePath must be string or null/);
        });
    });
});
