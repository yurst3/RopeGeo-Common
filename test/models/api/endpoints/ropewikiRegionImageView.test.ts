import { describe, it, expect } from '@jest/globals';
import {
    RopewikiRegionImageView,
    type RopewikiRegionImageViewRow,
} from '../../../../src/models/api/endpoints/ropewikiRegionImageView';

function baseRow(
    overrides: Partial<RopewikiRegionImageViewRow> = {},
): RopewikiRegionImageViewRow {
    return {
        id: 'img-uuid',
        ropewikiPage: 'page-uuid',
        pageName: 'Example Page',
        bannerUrl: 'https://example.com/banner.jpg',
        fullUrl: 'https://example.com/full.jpg',
        linkUrl: 'https://ropewiki.com/Example_Page',
        ...overrides,
    };
}

describe('RopewikiRegionImageView', () => {
    describe('constructor', () => {
        it('maps row fields to view properties', () => {
            const row = baseRow({ caption: 'A caption' });
            const view = new RopewikiRegionImageView(row);
            expect(view.id).toBe('img-uuid');
            expect(view.pageId).toBe('page-uuid');
            expect(view.pageName).toBe('Example Page');
            expect(view.bannerUrl).toBe('https://example.com/banner.jpg');
            expect(view.fullUrl).toBe('https://example.com/full.jpg');
            expect(view.externalLink).toBe('https://ropewiki.com/Example_Page');
            expect(view.caption).toBe('A caption');
        });

        it('sets caption to undefined when missing', () => {
            const view = new RopewikiRegionImageView(baseRow());
            expect(view.caption).toBeUndefined();
        });

        it('sets caption to undefined when null', () => {
            const view = new RopewikiRegionImageView(
                baseRow({ caption: null }),
            );
            expect(view.caption).toBeUndefined();
        });
    });

    describe('fromResult', () => {
        function validResult(overrides: Record<string, unknown> = {}): Record<string, unknown> {
            return {
                id: 'img-uuid',
                pageId: 'page-uuid',
                pageName: 'Example Page',
                bannerUrl: 'https://example.com/banner.jpg',
                fullUrl: 'https://example.com/full.jpg',
                externalLink: 'https://ropewiki.com/Example_Page',
                caption: 'A caption',
                ...overrides,
            };
        }

        it('validates and applies prototype', () => {
            const raw = validResult();
            const view = RopewikiRegionImageView.fromResult(raw);
            expect(view).toBe(raw);
            expect(view).toBeInstanceOf(RopewikiRegionImageView);
            expect(view.bannerUrl).toBe('https://example.com/banner.jpg');
            expect(view.fullUrl).toBe('https://example.com/full.jpg');
        });

        it('throws when bannerUrl is not a string', () => {
            expect(() =>
                RopewikiRegionImageView.fromResult(validResult({ bannerUrl: null })),
            ).toThrow('RopewikiRegionImageView.bannerUrl must be a string');
        });

        it('throws when fullUrl is not a string', () => {
            expect(() =>
                RopewikiRegionImageView.fromResult(validResult({ fullUrl: 1 })),
            ).toThrow('RopewikiRegionImageView.fullUrl must be a string');
        });
    });
});
