import { describe, it, expect } from '@jest/globals';
import type { PagePreview } from '../../../../src/types/previews/pagePreview';
import { Preview } from '../../../../src/types/previews/preview';
import type { RegionPreview } from '../../../../src/types/previews/regionPreview';
import { RegionPreviewsCursor } from '../../../../src/types/cursors/regionPreviewsCursor';
import { RopewikiRegionPreviewsResult } from '../../../../src/types/api/getRopewikiRegionPreviews/ropewikiRegionPreviewsResult';

describe('RopewikiRegionPreviewsResult', () => {
    describe('constructor', () => {
        it('sets results and nextCursor to null when cursor is null', () => {
            const result = new RopewikiRegionPreviewsResult([], null);
            expect(result.results).toEqual([]);
            expect(result.nextCursor).toBeNull();
        });

        it('sets results and nextCursor from cursor.encodeBase64() when cursor provided', () => {
            const cursor = new RegionPreviewsCursor(0.7, 'page', 'next-id');
            const results: Preview[] = [];
            const r = new RopewikiRegionPreviewsResult(results, cursor);
            expect(r.results).toBe(results);
            expect(r.nextCursor).toBe(cursor.encodeBase64());
            expect(r.nextCursor).not.toBeNull();
        });

        it('round-trip: nextCursor can be decoded back to RegionPreviewsCursor', () => {
            const cursor = new RegionPreviewsCursor(0.75, 'region', 'page-2');
            const r = new RopewikiRegionPreviewsResult([], cursor);
            const decoded = RegionPreviewsCursor.decodeBase64(r.nextCursor!);
            expect(decoded.sortKey).toBe(0.75);
            expect(decoded.type).toBe('region');
            expect(decoded.id).toBe('page-2');
        });

        it('fromResponseBody validates body and applies Preview.prototype', () => {
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
            const r = RopewikiRegionPreviewsResult.fromResponseBody({
                results: [plain],
                nextCursor: null,
            });
            expect(r.results[0]).toBe(plain);
            expect(plain).toBeInstanceOf(Preview);
            expect((plain as unknown as Preview).isRegionPreview()).toBe(true);
        });

        it('accepts nextCursor as string', () => {
            const cursor = new RegionPreviewsCursor(0.5, 'page', 'id');
            const r = new RopewikiRegionPreviewsResult([], cursor.encodeBase64());
            expect(r.nextCursor).not.toBeNull();
        });
    });
});
