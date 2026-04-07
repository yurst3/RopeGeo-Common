import { describe, it, expect } from '@jest/globals';
import {
    AcaDifficulty,
    AcaRiskRating,
    AcaTechnicalRating,
    AcaTimeRating,
    AcaWaterRating,
} from '../../../src/models';
import { PermitStatus } from '../../../src/models/permitStatus';
import { PageDataSource } from '../../../src/models/pageDataSource';
import {
    PagePreview,
    type GetRopewikiPagePreviewRow,
} from '../../../src/models/previews/pagePreview';

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
            expect(preview.difficulty).toBeInstanceOf(AcaDifficulty);
            const d = preview.difficulty as AcaDifficulty;
            expect(d.technical).toBe(AcaTechnicalRating.Two);
            expect(d.water).toBe(AcaWaterRating.C);
            expect(d.time).toBe(AcaTimeRating.III);
            expect(d.additionalRisk).toBe(AcaRiskRating.PG);
            expect(d.effectiveRisk).toBe(AcaRiskRating.PG);
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
            const d = preview.difficulty as AcaDifficulty;
            expect(d.additionalRisk).toBeNull();
            expect(d.effectiveRisk).toBe(AcaRiskRating.PG);
        });

        it('passes mapData through', () => {
            const preview = PagePreview.fromDbRow(baseRow, 'map-data-id');
            expect(preview.mapData).toBe('map-data-id');
        });
    });
});
