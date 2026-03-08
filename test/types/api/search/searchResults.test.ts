import { describe, it, expect } from '@jest/globals';
import type { PagePreview } from '../../../../src/types/previews/pagePreview';
import type { Preview } from '../../../../src/types/previews/preview';
import type { RegionPreview } from '../../../../src/types/previews/regionPreview';
import { CursorType } from '../../../../src/types/cursors/cursor';
import { SearchCursor } from '../../../../src/types/cursors/searchCursor';
import { SearchResults } from '../../../../src/types/api/search/searchResults';

describe('SearchCursor', () => {
    describe('constructor', () => {
        it('sets sortKey, type, and id', () => {
            const c = new SearchCursor(0.95, 'page', 'abc-123');
            expect(c.sortKey).toBe(0.95);
            expect(c.type).toBe('page');
            expect(c.id).toBe('abc-123');
        });

        it('accepts type "region"', () => {
            const c = new SearchCursor(1, 'region', 'region-uuid');
            expect(c.type).toBe('region');
        });
    });

    describe('encodeBase64', () => {
        it('returns base64url string (no + or /)', () => {
            const c = new SearchCursor(0.9, 'page', 'id');
            const encoded = c.encodeBase64();
            expect(encoded).not.toMatch(/[+/]/);
            expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
        });

        it('round-trips with decodeBase64', () => {
            const c = new SearchCursor(0.85, 'region', 'xyz-789');
            const encoded = c.encodeBase64();
            const decoded = SearchCursor.decodeBase64(encoded);
            expect(decoded.sortKey).toBe(c.sortKey);
            expect(decoded.type).toBe(c.type);
            expect(decoded.id).toBe(c.id);
        });

        it('produces different strings for different cursors', () => {
            const a = new SearchCursor(0.5, 'page', 'a');
            const b = new SearchCursor(0.5, 'region', 'a');
            const c = new SearchCursor(0.6, 'page', 'a');
            expect(a.encodeBase64()).not.toBe(b.encodeBase64());
            expect(a.encodeBase64()).not.toBe(c.encodeBase64());
            expect(b.encodeBase64()).not.toBe(c.encodeBase64());
        });
    });

    describe('decodeBase64', () => {
        it('decodes valid page cursor', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.Search,
                    sortKey: 0.9,
                    type: 'page',
                    id: 'page-id',
                }),
                'utf8',
            ).toString('base64url');
            const c = SearchCursor.decodeBase64(encoded);
            expect(c).toBeInstanceOf(SearchCursor);
            expect(c.sortKey).toBe(0.9);
            expect(c.type).toBe('page');
            expect(c.id).toBe('page-id');
        });

        it('decodes valid region cursor', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.Search,
                    sortKey: 1,
                    type: 'region',
                    id: 'region-uuid',
                }),
                'utf8',
            ).toString('base64url');
            const c = SearchCursor.decodeBase64(encoded);
            expect(c.type).toBe('region');
            expect(c.id).toBe('region-uuid');
        });

        it('throws for empty string', () => {
            expect(() => SearchCursor.decodeBase64('')).toThrow(
                'search cursor must be a non-empty string',
            );
        });

        it('throws for non-string input', () => {
            expect(() =>
                SearchCursor.decodeBase64(null as unknown as string),
            ).toThrow('search cursor must be a non-empty string');
            expect(() =>
                SearchCursor.decodeBase64(undefined as unknown as string),
            ).toThrow('search cursor must be a non-empty string');
        });

        it('throws for invalid base64url with message including encoding error', () => {
            expect(() => SearchCursor.decodeBase64('!!!not-valid!!!')).toThrow(
                /Invalid search cursor encoding/,
            );
        });

        it('throws when decoded JSON is not an object with sortKey, type, id', () => {
            const encoded = Buffer.from('"just a string"', 'utf8').toString(
                'base64url',
            );
            expect(() => SearchCursor.decodeBase64(encoded)).toThrow(
                'search cursor must be an object',
            );
        });

        it('throws when type is not "page" or "region"', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.Search,
                    sortKey: 0,
                    type: 'invalid',
                    id: 'x',
                }),
                'utf8',
            ).toString('base64url');
            expect(() => SearchCursor.decodeBase64(encoded)).toThrow(
                /Search cursor type must be "page" or "region"/,
            );
        });

        it('throws when id is not a string', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.Search,
                    sortKey: 0,
                    type: 'page',
                    id: 123,
                }),
                'utf8',
            ).toString('base64url');
            expect(() => SearchCursor.decodeBase64(encoded)).toThrow(
                'Search cursor id must be a string',
            );
        });

        it('throws when sortKey is not a number', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.Search,
                    sortKey: 'high',
                    type: 'page',
                    id: 'x',
                }),
                'utf8',
            ).toString('base64url');
            expect(() => SearchCursor.decodeBase64(encoded)).toThrow(
                'Search cursor sortKey must be a number',
            );
        });

        it('throws when sortKey is not a valid number (yields NaN)', () => {
            const encoded = Buffer.from(
                JSON.stringify({
                    cursorType: CursorType.Search,
                    sortKey: 'not-a-number',
                    type: 'page',
                    id: 'x',
                }),
                'utf8',
            ).toString('base64url');
            expect(() => SearchCursor.decodeBase64(encoded)).toThrow(
                'Search cursor sortKey must be a number',
            );
        });
    });
});

describe('SearchResults', () => {
    describe('constructor', () => {
        it('sets results and nextCursor to null when cursor is null', () => {
            const sr = new SearchResults([], null);
            expect(sr.results).toEqual([]);
            expect(sr.nextCursor).toBeNull();
        });

        it('sets results and nextCursor from cursor.encodeBase64() when cursor provided', () => {
            const cursor = new SearchCursor(0.8, 'page', 'last-item-id');
            const results: Preview[] = [];
            const sr = new SearchResults(results, cursor);
            expect(sr.results).toBe(results);
            expect(sr.nextCursor).toBe(cursor.encodeBase64());
            expect(sr.nextCursor).not.toBeNull();
        });

        it('round-trip: nextCursor can be decoded back to SearchCursor', () => {
            const cursor = new SearchCursor(0.75, 'region', 'region-1');
            const sr = new SearchResults([], cursor);
            const decoded = SearchCursor.decodeBase64(sr.nextCursor!);
            expect(decoded.sortKey).toBe(0.75);
            expect(decoded.type).toBe('region');
            expect(decoded.id).toBe('region-1');
        });
    });
});
