import { describe, it, expect } from '@jest/globals';
import { RopewikiRegionImageView } from '../../../../src/types/api/getRopewikiRegionImages/ropewikiRegionImageView';
import { RegionImagesCursor } from '../../../../src/types/api/getRopewikiRegionImages/regionImagesCursor';
import { RopewikiRegionImagesResult } from '../../../../src/types/api/getRopewikiRegionImages/ropewikiRegionImagesResult';
import type { RopewikiRegionImageViewRow } from '../../../../src/types/api/getRopewikiRegionImages/ropewikiRegionImageView';

function sampleImageView(): RopewikiRegionImageView {
    const row: RopewikiRegionImageViewRow = {
        id: 'img-1',
        ropewikiPage: 'page-1',
        pageName: 'Test Page',
        fileUrl: 'https://example.com/img.jpg',
        linkUrl: 'https://ropewiki.com/Page',
    };
    return new RopewikiRegionImageView(row);
}

describe('RopewikiRegionImagesResult', () => {
    describe('constructor', () => {
        it('sets results and nextCursor to null when cursor is null', () => {
            const result = new RopewikiRegionImagesResult([], null);
            expect(result.results).toEqual([]);
            expect(result.nextCursor).toBeNull();
        });

        it('sets results and nextCursor from cursor.encodeBase64() when cursor provided', () => {
            const cursor = new RegionImagesCursor(0.7, 'page-1', 'next-id');
            const results = [sampleImageView()];
            const r = new RopewikiRegionImagesResult(results, cursor);
            expect(r.results).toBe(results);
            expect(r.nextCursor).toBe(cursor.encodeBase64());
            expect(r.nextCursor).not.toBeNull();
        });

        it('round-trip: nextCursor can be decoded back to RegionImagesCursor', () => {
            const cursor = new RegionImagesCursor(0.75, 'page-2', 'image-2');
            const r = new RopewikiRegionImagesResult([], cursor);
            const decoded = RegionImagesCursor.decodeBase64(r.nextCursor!);
            expect(decoded.sortKey).toBe(0.75);
            expect(decoded.pageId).toBe('page-2');
            expect(decoded.imageId).toBe('image-2');
        });
    });
});
