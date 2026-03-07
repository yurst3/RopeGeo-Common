import { describe, it, expect } from '@jest/globals';
import type { PagePreview } from '../../../../src/types/api/getRoutePreview/pagePreview';
import type { RegionPreview } from '../../../../src/types/api/search/regionPreview';
import { RegionPreviewsCursor } from '../../../../src/types/api/getRopewikiRegionPreviews/regionPreviewsCursor';
import { RopewikiRegionPreviewsResult } from '../../../../src/types/api/getRopewikiRegionPreviews/ropewikiRegionPreviewsResult';

describe('RopewikiRegionPreviewsResult', () => {
    describe('constructor', () => {
        it('sets results and nextCursor to null when cursor is null', () => {
            const result = new RopewikiRegionPreviewsResult([], null);
            expect(result.results).toEqual([]);
            expect(result.nextCursor).toBeNull();
        });

        it('sets results and nextCursor from cursor.encodeBase64() when cursor provided', () => {
            const cursor = new RegionPreviewsCursor('next-id');
            const results: (PagePreview | RegionPreview)[] = [];
            const r = new RopewikiRegionPreviewsResult(results, cursor);
            expect(r.results).toBe(results);
            expect(r.nextCursor).toBe(cursor.encodeBase64());
            expect(r.nextCursor).not.toBeNull();
        });

        it('round-trip: nextCursor can be decoded back to RegionPreviewsCursor', () => {
            const cursor = new RegionPreviewsCursor('page-2');
            const r = new RopewikiRegionPreviewsResult([], cursor);
            const decoded = RegionPreviewsCursor.decodeBase64(r.nextCursor!);
            expect(decoded.value).toBe('page-2');
        });
    });
});
