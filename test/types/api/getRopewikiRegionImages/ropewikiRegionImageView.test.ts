import { describe, it, expect } from '@jest/globals';
import {
    RopewikiRegionImageView,
    type RopewikiRegionImageViewRow,
} from '../../../../src/types/api/getRopewikiRegionImages/ropewikiRegionImageView';

function baseRow(
    overrides: Partial<RopewikiRegionImageViewRow> = {},
): RopewikiRegionImageViewRow {
    return {
        id: 'img-uuid',
        ropewikiPage: 'page-uuid',
        pageName: 'Example Page',
        fileUrl: 'https://example.com/file.jpg',
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
            expect(view.url).toBe('https://example.com/file.jpg');
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
});
