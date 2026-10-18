import { describe, it, expect } from '@jest/globals';
import { PagePreviewsResult } from '../../../../src/models/api/results/pagePreviewsResult';
import { OnlinePagePreview } from '../../../../src/models/previews/onlinePagePreview';
import { Result, ResultType } from '../../../../src/models/api/results/result';
import '../../../../src/models/previews/registerPreviewParsers';

const validPagePreviewItem = {
    previewType: 'page' as const,
    fetchType: 'online' as const,
    id: 'p1',
    title: 'Page 1',
    source: 'ropewiki' as const,
    regions: [] as string[],
    aka: [] as string[],
    difficulty: {},
    mapData: null as string | null,
    externalLink: null as string | null,
    imageUrl: null as string | null,
    rating: null as number | null,
    ratingCount: null as number | null,
    permit: null as string | null,
};

describe('PagePreviewsResult', () => {
    describe('constructor', () => {
        it('sets result and resultType', () => {
            const previews: OnlinePagePreview[] = [];
            const r = new PagePreviewsResult(previews);
            expect(r.result).toBe(previews);
            expect(r.resultType).toBe(ResultType.PagePreviews);
        });
    });

    describe('fromResult', () => {
        it('parses multiple page previews in order', () => {
            const parsed = PagePreviewsResult.fromResult([
                validPagePreviewItem,
                { ...validPagePreviewItem, id: 'p2', title: 'Page 2' },
            ]);
            expect(parsed).toBeInstanceOf(PagePreviewsResult);
            expect(parsed.result).toHaveLength(2);
            expect(parsed.result[0]).toBeInstanceOf(OnlinePagePreview);
            expect(parsed.result[0].id).toBe('p1');
            expect(parsed.result[1].id).toBe('p2');
            expect(parsed.result[1].title).toBe('Page 2');
        });

        it('parses empty array', () => {
            expect(PagePreviewsResult.fromResult([]).result).toEqual([]);
        });

        it('throws when result is not an array', () => {
            expect(() => PagePreviewsResult.fromResult(null)).toThrow(
                /PagePreviewsResult\.result must be an array/,
            );
            expect(() => PagePreviewsResult.fromResult({})).toThrow(
                'PagePreviewsResult.result must be an array, got: object',
            );
        });

        it('throws when array element is invalid', () => {
            expect(() =>
                PagePreviewsResult.fromResult([{ ...validPagePreviewItem, id: 1 }]),
            ).toThrow(/PagePreview\.id must be a string/);
        });
    });

    describe('Result.fromResponseBody', () => {
        it('routes resultType pagePreviews to PagePreviewsResult', () => {
            const parsed = Result.fromResponseBody({
                resultType: 'pagePreviews',
                result: [validPagePreviewItem],
            });
            expect(parsed).toBeInstanceOf(PagePreviewsResult);
            expect((parsed as PagePreviewsResult).result[0].id).toBe('p1');
        });
    });
});
