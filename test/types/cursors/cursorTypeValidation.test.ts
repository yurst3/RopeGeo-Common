import { describe, it, expect } from '@jest/globals';
import { CursorType } from '../../../src/types/cursors/cursor';
import { SearchCursor } from '../../../src/types/cursors/searchCursor';
import { RegionPreviewsCursor } from '../../../src/types/cursors/regionPreviewsCursor';
import { RegionImagesCursor } from '../../../src/types/cursors/regionImagesCursor';

function encode(obj: Record<string, unknown>): string {
    return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
}

describe('cursor type validation', () => {
    describe('SearchCursor', () => {
        it('decodes when cursorType is "search"', () => {
            const encoded = encode({
                cursorType: CursorType.Search,
                sortKey: 0.9,
                type: 'page',
                id: 'item-id',
            });
            const c = SearchCursor.decodeBase64(encoded);
            expect(c).toBeInstanceOf(SearchCursor);
            expect(c.cursorType).toBe(CursorType.Search);
            expect(c.sortKey).toBe(0.9);
            expect(c.type).toBe('page');
            expect(c.id).toBe('item-id');
        });

        it('throws when cursorType is missing', () => {
            const encoded = encode({ sortKey: 0, type: 'page', id: 'x' });
            expect(() => SearchCursor.decodeBase64(encoded)).toThrow(
                'Search cursor must have a cursorType property',
            );
        });

        it('throws when cursorType is wrong (region_previews)', () => {
            const encoded = encode({
                cursorType: CursorType.RegionPreviews,
                sortKey: 0,
                type: 'page',
                id: 'x',
            });
            expect(() => SearchCursor.decodeBase64(encoded)).toThrow(
                'Search cursor cursorType must be "search", got: "region_previews"',
            );
        });

        it('throws when cursorType is wrong (region_images)', () => {
            const encoded = encode({
                cursorType: CursorType.RegionImages,
                sortKey: 0,
                type: 'page',
                id: 'x',
            });
            expect(() => SearchCursor.decodeBase64(encoded)).toThrow(
                'Search cursor cursorType must be "search", got: "region_images"',
            );
        });

        it('encodeBase64 includes cursorType in payload', () => {
            const c = new SearchCursor(0.5, 'region', 'abc');
            const encoded = c.encodeBase64();
            const decoded = SearchCursor.decodeBase64(encoded);
            expect(decoded.cursorType).toBe(CursorType.Search);
        });
    });

    describe('RegionPreviewsCursor', () => {
        it('decodes when cursorType is "region_previews"', () => {
            const encoded = encode({
                cursorType: CursorType.RegionPreviews,
                sortKey: 0.8,
                type: 'page',
                id: 'item-id',
            });
            const c = RegionPreviewsCursor.decodeBase64(encoded);
            expect(c).toBeInstanceOf(RegionPreviewsCursor);
            expect(c.cursorType).toBe(CursorType.RegionPreviews);
            expect(c.sortKey).toBe(0.8);
            expect(c.type).toBe('page');
            expect(c.id).toBe('item-id');
        });

        it('throws when cursorType is missing', () => {
            const encoded = encode({ sortKey: 0, type: 'page', id: 'x' });
            expect(() => RegionPreviewsCursor.decodeBase64(encoded)).toThrow(
                'Region previews cursor must have a cursorType property',
            );
        });

        it('throws when cursorType is wrong (search)', () => {
            const encoded = encode({
                cursorType: CursorType.Search,
                sortKey: 0,
                type: 'page',
                id: 'x',
            });
            expect(() => RegionPreviewsCursor.decodeBase64(encoded)).toThrow(
                'Region previews cursor cursorType must be "region_previews", got: "search"',
            );
        });

        it('encodeBase64 includes cursorType in payload', () => {
            const c = new RegionPreviewsCursor(0.5, 'region', 'abc');
            const encoded = c.encodeBase64();
            const decoded = RegionPreviewsCursor.decodeBase64(encoded);
            expect(decoded.cursorType).toBe(CursorType.RegionPreviews);
        });
    });

    describe('RegionImagesCursor', () => {
        it('decodes when cursorType is "region_images"', () => {
            const encoded = encode({
                cursorType: CursorType.RegionImages,
                sortKey: 0.7,
                pageId: 'page-uuid',
                imageId: 'image-uuid',
            });
            const c = RegionImagesCursor.decodeBase64(encoded);
            expect(c).toBeInstanceOf(RegionImagesCursor);
            expect(c.cursorType).toBe(CursorType.RegionImages);
            expect(c.sortKey).toBe(0.7);
            expect(c.pageId).toBe('page-uuid');
            expect(c.imageId).toBe('image-uuid');
        });

        it('throws when cursorType is missing', () => {
            const encoded = encode({
                sortKey: 0,
                pageId: 'p',
                imageId: 'i',
            });
            expect(() => RegionImagesCursor.decodeBase64(encoded)).toThrow(
                'Region images cursor must have a cursorType property',
            );
        });

        it('throws when cursorType is wrong (search)', () => {
            const encoded = encode({
                cursorType: CursorType.Search,
                sortKey: 0,
                pageId: 'p',
                imageId: 'i',
            });
            expect(() => RegionImagesCursor.decodeBase64(encoded)).toThrow(
                'Region images cursor cursorType must be "region_images", got: "search"',
            );
        });

        it('encodeBase64 includes cursorType in payload', () => {
            const c = new RegionImagesCursor(0.5, 'page-1', 'img-1');
            const encoded = c.encodeBase64();
            const decoded = RegionImagesCursor.decodeBase64(encoded);
            expect(decoded.cursorType).toBe(CursorType.RegionImages);
        });
    });
});
