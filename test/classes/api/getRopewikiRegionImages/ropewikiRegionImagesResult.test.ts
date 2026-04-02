import { describe, it, expect } from '@jest/globals';
import { RopewikiRegionImageView } from '../../../../src/classes/api/getRopewikiRegionImages/ropewikiRegionImageView';
import { RegionImagesCursor } from '../../../../src/classes/cursors/regionImagesCursor';
import { RopewikiRegionImagesResult } from '../../../../src/classes/api/getRopewikiRegionImages/ropewikiRegionImagesResult';
import type { RopewikiRegionImageViewRow } from '../../../../src/classes/api/getRopewikiRegionImages/ropewikiRegionImageView';

function sampleImageView(): RopewikiRegionImageView {
    const row: RopewikiRegionImageViewRow = {
        id: 'img-1',
        ropewikiPage: 'page-1',
        pageName: 'Test Page',
        bannerUrl: 'https://example.com/banner.jpg',
        fullUrl: 'https://example.com/full.jpg',
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

        it('fromResponseBody validates body and applies RopewikiRegionImageView.prototype', () => {
            const plain = {
                id: 'img-1',
                pageId: 'p1',
                pageName: 'Page',
                bannerUrl: 'https://example.com/banner.jpg',
                fullUrl: 'https://example.com/full.jpg',
                externalLink: 'https://example.com',
                caption: undefined,
            };
            const r = RopewikiRegionImagesResult.fromResponseBody({
                results: [plain],
                nextCursor: null,
            });
            expect(r.results[0]).toBe(plain);
            expect(plain).toBeInstanceOf(RopewikiRegionImageView);
        });

        it('accepts nextCursor as string', () => {
            const cursor = new RegionImagesCursor(0.5, 'page-1', 'img-1');
            const r = new RopewikiRegionImagesResult([], cursor.encodeBase64());
            expect(r.nextCursor).not.toBeNull();
        });
    });
});
