import { describe, it, expect } from '@jest/globals';
import { RoutePreviewResult } from '../../../../src/models/api/results/routePreviewResult';
import { PagePreview } from '../../../../src/models/previews/pagePreview';
import { OnlinePagePreview } from '../../../../src/models/previews/onlinePagePreview';
import { ResultType } from '../../../../src/models/api/results/result';
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

describe('RoutePreviewResult', () => {
    describe('constructor', () => {
        it('sets result and resultType', () => {
            const previews: OnlinePagePreview[] = [];
            const r = new RoutePreviewResult(previews);
            expect(r.result).toBe(previews);
            expect(r.resultType).toBe(ResultType.RoutePreview);
        });
    });

    describe('fromResult', () => {
        it('parses valid result array and returns RoutePreviewResult with PagePreview[]', () => {
            const result = [validPagePreviewItem];
            const parsed = RoutePreviewResult.fromResult(result);
            expect(parsed).toBeInstanceOf(RoutePreviewResult);
            expect(parsed.resultType).toBe(ResultType.RoutePreview);
            expect(Array.isArray(parsed.result)).toBe(true);
            expect(parsed.result).toHaveLength(1);
            expect(parsed.result[0]).toBeInstanceOf(PagePreview);
            expect(parsed.result[0].id).toBe('p1');
            expect(parsed.result[0].title).toBe('Page 1');
            expect(parsed.result[0].source).toBe('ropewiki');
        });

        it('parses empty array', () => {
            const parsed = RoutePreviewResult.fromResult([]);
            expect(parsed.result).toEqual([]);
        });

        it('parses multiple page previews', () => {
            const result = [
                validPagePreviewItem,
                { ...validPagePreviewItem, id: 'p2', title: 'Page 2' },
            ];
            const parsed = RoutePreviewResult.fromResult(result);
            expect(parsed.result).toHaveLength(2);
            expect(parsed.result[0].id).toBe('p1');
            expect(parsed.result[1].id).toBe('p2');
            expect(parsed.result[1].title).toBe('Page 2');
        });

        it('throws when result is not an array', () => {
            expect(() => RoutePreviewResult.fromResult(null)).toThrow(
                /RoutePreviewResult\.result must be an array/,
            );
            expect(() => RoutePreviewResult.fromResult('string')).toThrow(
                'RoutePreviewResult.result must be an array, got: string',
            );
            expect(() => RoutePreviewResult.fromResult(42)).toThrow(
                'RoutePreviewResult.result must be an array, got: number',
            );
        });

        it('throws when array element is invalid', () => {
            expect(() =>
                RoutePreviewResult.fromResult([{ ...validPagePreviewItem, id: 1 }]),
            ).toThrow(/PagePreview\.id must be a string/);
        });
    });
});
