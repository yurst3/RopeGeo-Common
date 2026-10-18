import { describe, it, expect } from '@jest/globals';
import { PagePreviewsParams } from '../../../../src/models/api/params/pagePreviewsParams';

const ID_A = '11111111-1111-4111-8111-111111111111';
const ID_B = '22222222-2222-4222-8222-222222222222';
const ID_C = '33333333-3333-4333-8333-333333333333';

function uuidAt(i: number): string {
    return `00000000-0000-4000-8000-${i.toString(16).padStart(12, '0')}`;
}

describe('PagePreviewsParams', () => {
    describe('constructor', () => {
        it('accepts a single id', () => {
            const p = new PagePreviewsParams([ID_A]);
            expect(p.ids).toEqual([ID_A]);
        });

        it('preserves order', () => {
            const p = new PagePreviewsParams([ID_C, ID_A, ID_B]);
            expect(p.ids).toEqual([ID_C, ID_A, ID_B]);
        });

        it('trims, drops empty entries, and dedupes preserving first-seen order', () => {
            const p = new PagePreviewsParams([` ${ID_B} `, '', ID_A, ID_B]);
            expect(p.ids).toEqual([ID_B, ID_A]);
        });

        it('accepts uppercase UUIDs', () => {
            const p = new PagePreviewsParams([ID_A.toUpperCase()]);
            expect(p.ids).toEqual([ID_A.toUpperCase()]);
        });

        it('throws when no ids remain', () => {
            expect(() => new PagePreviewsParams([])).toThrow(
                'Query parameter "ids" must contain at least one page id',
            );
            expect(() => new PagePreviewsParams(['', '  '])).toThrow(
                'Query parameter "ids" must contain at least one page id',
            );
        });

        it('throws when an id is not a UUID', () => {
            expect(() => new PagePreviewsParams([ID_A, 'not-a-uuid'])).toThrow(
                'Query parameter "ids" must only contain valid UUIDs, got: "not-a-uuid"',
            );
        });

        it('throws when an id is not a string', () => {
            expect(
                () => new PagePreviewsParams([ID_A, 42 as unknown as string]),
            ).toThrow('Query parameter "ids" must only contain strings');
        });

        it('accepts exactly MAX_IDS ids', () => {
            const ids = Array.from({ length: PagePreviewsParams.MAX_IDS }, (_, i) => uuidAt(i));
            expect(new PagePreviewsParams(ids).ids).toHaveLength(PagePreviewsParams.MAX_IDS);
        });

        it('throws when more than MAX_IDS unique ids are given', () => {
            const ids = Array.from({ length: PagePreviewsParams.MAX_IDS + 1 }, (_, i) => uuidAt(i));
            expect(() => new PagePreviewsParams(ids)).toThrow(
                `Query parameter "ids" must not contain more than ${PagePreviewsParams.MAX_IDS} page ids`,
            );
        });
    });

    describe('toQueryString', () => {
        it('encodes ids as a pipe-delimited list', () => {
            const p = new PagePreviewsParams([ID_A, ID_B]);
            const params = new URLSearchParams(p.toQueryString());
            expect(params.get('ids')).toBe(`${ID_A}|${ID_B}`);
        });

        it('round-trips through fromQueryStringParams', () => {
            const p = new PagePreviewsParams([ID_B, ID_A]);
            const params = new URLSearchParams(p.toQueryString());
            const parsed = PagePreviewsParams.fromQueryStringParams({
                ids: params.get('ids') ?? undefined,
            });
            expect(parsed.ids).toEqual([ID_B, ID_A]);
        });
    });

    describe('fromQueryStringParams', () => {
        it('parses a pipe-delimited ids param', () => {
            const p = PagePreviewsParams.fromQueryStringParams({
                ids: `${ID_A}|${ID_B}|${ID_C}`,
            });
            expect(p.ids).toEqual([ID_A, ID_B, ID_C]);
        });

        it('accepts Ids (capitalized)', () => {
            const p = PagePreviewsParams.fromQueryStringParams({ Ids: ID_A });
            expect(p.ids).toEqual([ID_A]);
        });

        it('ignores empty segments', () => {
            const p = PagePreviewsParams.fromQueryStringParams({ ids: `|${ID_A}||${ID_B}|` });
            expect(p.ids).toEqual([ID_A, ID_B]);
        });

        it('throws when ids is missing or blank', () => {
            expect(() => PagePreviewsParams.fromQueryStringParams({})).toThrow(
                'Query parameter "ids" is required',
            );
            expect(() => PagePreviewsParams.fromQueryStringParams({ ids: '   ' })).toThrow(
                'Query parameter "ids" is required',
            );
        });

        it('throws when ids contains only separators', () => {
            expect(() => PagePreviewsParams.fromQueryStringParams({ ids: '||' })).toThrow(
                'Query parameter "ids" must contain at least one page id',
            );
        });
    });
});
