import { describe, it, expect } from '@jest/globals';
import {
    CursorPaginationResults,
    CursorPaginationResultType,
} from '../../../src/types/results/cursorPaginationResults';
import { SearchResults } from '../../../src/types/api/search/searchResults';
import { RopewikiRegionPreviewsResult } from '../../../src/types/api/getRopewikiRegionPreviews/ropewikiRegionPreviewsResult';
import { RopewikiRegionImagesResult } from '../../../src/types/api/getRopewikiRegionImages/ropewikiRegionImagesResult';
import { Preview } from '../../../src/types/previews/preview';
import { RopewikiRegionImageView } from '../../../src/types/api/getRopewikiRegionImages/ropewikiRegionImageView';
import { SearchCursor } from '../../../src/types/cursors/searchCursor';

const validPageItem = {
    previewType: 'page',
    id: 'p1',
    title: 'Page 1',
    source: 'ropewiki',
    regions: [],
    aka: [],
    difficulty: {},
    mapData: null,
    externalLink: null,
    imageUrl: null,
    rating: null,
    ratingCount: null,
    permit: null,
};

const validRegionItem = {
    previewType: 'region',
    id: 'r1',
    name: 'Region 1',
    parents: [],
    pageCount: 0,
    regionCount: 0,
    imageUrl: null,
    source: 'ropewiki',
};

const validImageItem = {
    id: 'img-1',
    pageId: 'p1',
    pageName: 'Page',
    bannerUrl: 'https://example.com/banner.jpg',
    fullUrl: 'https://example.com/full.jpg',
    externalLink: 'https://example.com',
    caption: undefined,
};

describe('CursorPaginationResults', () => {
    describe('fromResponseBody', () => {
        describe('invalid body shape', () => {
            it('throws if body is null or undefined', () => {
                expect(() =>
                    CursorPaginationResults.fromResponseBody(null),
                ).toThrow('Response body must be an object');
                expect(() =>
                    CursorPaginationResults.fromResponseBody(undefined),
                ).toThrow('Response body must be an object');
            });

            it('throws if body is a primitive (string, number, boolean)', () => {
                expect(() =>
                    CursorPaginationResults.fromResponseBody(''),
                ).toThrow('Response body must be an object');
                expect(() =>
                    CursorPaginationResults.fromResponseBody(0),
                ).toThrow('Response body must be an object');
                expect(() =>
                    CursorPaginationResults.fromResponseBody(true),
                ).toThrow('Response body must be an object');
            });

            it('throws if body is an array', () => {
                expect(() =>
                    CursorPaginationResults.fromResponseBody([]),
                ).toThrow('Response body must have resultType');
            });

            it('throws if resultType is missing', () => {
                expect(() =>
                    CursorPaginationResults.fromResponseBody({
                        results: [],
                        nextCursor: null,
                    }),
                ).toThrow('Response body must have resultType');
            });

            it('throws if resultType is not a string', () => {
                expect(() =>
                    CursorPaginationResults.fromResponseBody({
                        resultType: 123,
                        results: [],
                        nextCursor: null,
                    }),
                ).toThrow(/resultType must be one of/);
                expect(() =>
                    CursorPaginationResults.fromResponseBody({
                        resultType: true,
                        results: [],
                        nextCursor: null,
                    }),
                ).toThrow(/resultType must be one of/);
                expect(() =>
                    CursorPaginationResults.fromResponseBody({
                        resultType: {},
                        results: [],
                        nextCursor: null,
                    }),
                ).toThrow(/resultType must be one of/);
            });

            it('throws if resultType is not a valid enum value', () => {
                expect(() =>
                    CursorPaginationResults.fromResponseBody({
                        resultType: 'other',
                        results: [],
                        nextCursor: null,
                    }),
                ).toThrow(/resultType must be one of/);
                expect(() =>
                    CursorPaginationResults.fromResponseBody({
                        resultType: '',
                        results: [],
                        nextCursor: null,
                    }),
                ).toThrow(/resultType must be one of/);
            });

            it('throws if results is missing', () => {
                expect(() =>
                    CursorPaginationResults.fromResponseBody({
                        resultType: CursorPaginationResultType.Search,
                        nextCursor: null,
                    }),
                ).toThrow('Response body must have results');
            });

            it('throws if results is not an array', () => {
                expect(() =>
                    CursorPaginationResults.fromResponseBody({
                        resultType: CursorPaginationResultType.Search,
                        results: 'not-array',
                        nextCursor: null,
                    }),
                ).toThrow('Response body.results must be an array');
                expect(() =>
                    CursorPaginationResults.fromResponseBody({
                        resultType: CursorPaginationResultType.Search,
                        results: null,
                        nextCursor: null,
                    }),
                ).toThrow('Response body.results must be an array');
                expect(() =>
                    CursorPaginationResults.fromResponseBody({
                        resultType: CursorPaginationResultType.Search,
                        results: {},
                        nextCursor: null,
                    }),
                ).toThrow('Response body.results must be an array');
            });

            it('throws if nextCursor is present but not a string or null', () => {
                expect(() =>
                    CursorPaginationResults.fromResponseBody({
                        resultType: CursorPaginationResultType.Search,
                        results: [],
                        nextCursor: 123,
                    }),
                ).toThrow('Response body.nextCursor must be a string or null');
                expect(() =>
                    CursorPaginationResults.fromResponseBody({
                        resultType: CursorPaginationResultType.Search,
                        results: [],
                        nextCursor: true,
                    }),
                ).toThrow('Response body.nextCursor must be a string or null');
                expect(() =>
                    CursorPaginationResults.fromResponseBody({
                        resultType: CursorPaginationResultType.Search,
                        results: [],
                        nextCursor: {},
                    }),
                ).toThrow('Response body.nextCursor must be a string or null');
            });
        });

        describe('valid body shape', () => {
            it('delegates to SearchResults when resultType is search', () => {
                const body = {
                    resultType: CursorPaginationResultType.Search,
                    results: [validPageItem],
                    nextCursor: null,
                };
                const result = CursorPaginationResults.fromResponseBody(body);
                expect(result).toBeInstanceOf(SearchResults);
                expect(result.resultType).toBe(CursorPaginationResultType.Search);
                expect(result.results).toHaveLength(1);
                expect(result.results[0]).toBeInstanceOf(Preview);
            });

            it('delegates to RopewikiRegionPreviewsResult when resultType is ropewikiRegionPreviews', () => {
                const body = {
                    resultType: CursorPaginationResultType.RopewikiRegionPreviews,
                    results: [validRegionItem],
                    nextCursor: null,
                };
                const result = CursorPaginationResults.fromResponseBody(body);
                expect(result).toBeInstanceOf(RopewikiRegionPreviewsResult);
                expect(result.resultType).toBe(CursorPaginationResultType.RopewikiRegionPreviews);
                expect(result.results).toHaveLength(1);
                expect(result.results[0]).toBeInstanceOf(Preview);
            });

            it('delegates to RopewikiRegionImagesResult when resultType is ropewikiRegionImages', () => {
                const body = {
                    resultType: CursorPaginationResultType.RopewikiRegionImages,
                    results: [validImageItem],
                    nextCursor: null,
                };
                const result = CursorPaginationResults.fromResponseBody(body);
                expect(result).toBeInstanceOf(RopewikiRegionImagesResult);
                expect(result.resultType).toBe(CursorPaginationResultType.RopewikiRegionImages);
                expect(result.results).toHaveLength(1);
                expect(result.results[0]).toBeInstanceOf(RopewikiRegionImageView);
            });

            it('treats omitted nextCursor as null', () => {
                const body = {
                    resultType: CursorPaginationResultType.Search,
                    results: [],
                };
                const result = CursorPaginationResults.fromResponseBody(body);
                expect(result.nextCursor).toBeNull();
            });

            it('accepts valid nextCursor string and passes through to specific parser', () => {
                const cursor = new SearchCursor(0.5, 'page', 'id');
                const encoded = cursor.encodeBase64();
                const body = {
                    resultType: CursorPaginationResultType.Search,
                    results: [],
                    nextCursor: encoded,
                };
                const result = CursorPaginationResults.fromResponseBody(body);
                expect(result.nextCursor).toBe(encoded);
            });
        });
    });
});
