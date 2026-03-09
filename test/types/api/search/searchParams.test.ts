import { describe, it, expect } from '@jest/globals';
import { SearchCursor } from '../../../../src/types/cursors/searchCursor';
import { SearchParams } from '../../../../src/types/api/search/searchParams';

const validUuid = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

/** Base64url-encoded cursor: SearchCursor(0.9, 'page', 'a123') including cursorType */
const validCursorEncoded = new SearchCursor(0.9, 'page', 'a123').encodeBase64();

function validConstructorArgs(overrides: Partial<{
    name: string;
    similarityThreshold: number;
    includePages: boolean;
    includeRegions: boolean;
    includeAka: boolean;
    regionId: string | null;
    order: 'similarity' | 'quality';
    limit: number;
    cursorEncoded: string | undefined;
}> = {}) {
    return {
        name: 'Imlay',
        similarityThreshold: 0.5,
        includePages: true,
        includeRegions: true,
        includeAka: true,
        regionId: null as string | null,
        order: 'similarity' as const,
        limit: 20,
        cursorEncoded: undefined as string | undefined,
        ...overrides,
    };
}

describe('SearchParams', () => {
    describe('constructor', () => {
        it('accepts valid minimal params', () => {
            const args = validConstructorArgs();
            const p = new SearchParams(
                args.name,
                args.similarityThreshold,
                args.includePages,
                args.includeRegions,
                args.includeAka,
                args.regionId,
                args.order,
                args.limit,
                args.cursorEncoded,
            );
            expect(p.name).toBe('Imlay');
            expect(p.similarityThreshold).toBe(0.5);
            expect(p.includePages).toBe(true);
            expect(p.includeRegions).toBe(true);
            expect(p.includeAka).toBe(true);
            expect(p.regionId).toBeNull();
            expect(p.order).toBe('similarity');
            expect(p.limit).toBe(20);
            expect(p.cursor).toBeNull();
        });

        it('accepts valid params with regionId (UUID) and cursor', () => {
            const p = new SearchParams(
                'Test',
                0.3,
                true,
                false,
                true,
                validUuid,
                'quality',
                10,
                validCursorEncoded,
            );
            expect(p.regionId).toBe(validUuid);
            expect(p.cursor).toBeInstanceOf(SearchCursor);
            expect(p.cursor!.type).toBe('page');
            expect(p.cursor!.id).toBe('a123');
        });

        it('throws when name is empty string', () => {
            const args = validConstructorArgs({ name: '' });
            expect(() =>
                new SearchParams(
                    args.name,
                    args.similarityThreshold,
                    args.includePages,
                    args.includeRegions,
                    args.includeAka,
                    args.regionId,
                    args.order,
                    args.limit,
                    args.cursorEncoded,
                ),
            ).toThrow('Missing or empty required query parameter: name');
        });

        it('throws when name is whitespace only', () => {
            const args = validConstructorArgs({ name: '   ' });
            expect(() =>
                new SearchParams(
                    args.name,
                    args.similarityThreshold,
                    args.includePages,
                    args.includeRegions,
                    args.includeAka,
                    args.regionId,
                    args.order,
                    args.limit,
                    args.cursorEncoded,
                ),
            ).toThrow('Missing or empty required query parameter: name');
        });

        it('throws when similarityThreshold is NaN', () => {
            const args = validConstructorArgs({ similarityThreshold: Number.NaN });
            expect(() =>
                new SearchParams(
                    args.name,
                    args.similarityThreshold,
                    args.includePages,
                    args.includeRegions,
                    args.includeAka,
                    args.regionId,
                    args.order,
                    args.limit,
                    args.cursorEncoded,
                ),
            ).toThrow(
                'Query parameter "similarity" must be a number between 0 and 1',
            );
        });

        it('throws when similarityThreshold is less than 0', () => {
            const args = validConstructorArgs({ similarityThreshold: -0.1 });
            expect(() =>
                new SearchParams(
                    args.name,
                    args.similarityThreshold,
                    args.includePages,
                    args.includeRegions,
                    args.includeAka,
                    args.regionId,
                    args.order,
                    args.limit,
                    args.cursorEncoded,
                ),
            ).toThrow(
                'Query parameter "similarity" must be a number between 0 and 1',
            );
        });

        it('throws when similarityThreshold is greater than 1', () => {
            const args = validConstructorArgs({ similarityThreshold: 1.1 });
            expect(() =>
                new SearchParams(
                    args.name,
                    args.similarityThreshold,
                    args.includePages,
                    args.includeRegions,
                    args.includeAka,
                    args.regionId,
                    args.order,
                    args.limit,
                    args.cursorEncoded,
                ),
            ).toThrow(
                'Query parameter "similarity" must be a number between 0 and 1',
            );
        });

        it('throws when includeAka is true and includePages is false', () => {
            const args = validConstructorArgs({
                includePages: false,
                includeRegions: true,
                includeAka: true,
            });
            expect(() =>
                new SearchParams(
                    args.name,
                    args.similarityThreshold,
                    args.includePages,
                    args.includeRegions,
                    args.includeAka,
                    args.regionId,
                    args.order,
                    args.limit,
                    args.cursorEncoded,
                ),
            ).toThrow(
                'include-aka cannot be true when include-pages is false',
            );
        });

        it('throws when both includePages and includeRegions are false', () => {
            const args = validConstructorArgs({
                includePages: false,
                includeRegions: false,
                includeAka: false,
            });
            expect(() =>
                new SearchParams(
                    args.name,
                    args.similarityThreshold,
                    args.includePages,
                    args.includeRegions,
                    args.includeAka,
                    args.regionId,
                    args.order,
                    args.limit,
                    args.cursorEncoded,
                ),
            ).toThrow(
                'At least one of include-pages or include-regions must be true',
            );
        });

        it('throws when order is invalid', () => {
            const args = validConstructorArgs({
                order: 'popularity' as 'similarity' | 'quality',
            });
            expect(() =>
                new SearchParams(
                    args.name,
                    args.similarityThreshold,
                    args.includePages,
                    args.includeRegions,
                    args.includeAka,
                    args.regionId,
                    args.order,
                    args.limit,
                    args.cursorEncoded,
                ),
            ).toThrow(
                'Query parameter "order" must be one of: similarity, quality',
            );
        });

        it('throws when limit is NaN', () => {
            const args = validConstructorArgs({ limit: Number.NaN });
            expect(() =>
                new SearchParams(
                    args.name,
                    args.similarityThreshold,
                    args.includePages,
                    args.includeRegions,
                    args.includeAka,
                    args.regionId,
                    args.order,
                    args.limit,
                    args.cursorEncoded,
                ),
            ).toThrow(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        });

        it('throws when limit is not an integer', () => {
            const args = validConstructorArgs({ limit: 20.5 });
            expect(() =>
                new SearchParams(
                    args.name,
                    args.similarityThreshold,
                    args.includePages,
                    args.includeRegions,
                    args.includeAka,
                    args.regionId,
                    args.order,
                    args.limit,
                    args.cursorEncoded,
                ),
            ).toThrow(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        });

        it('throws when limit is less than 1', () => {
            const args = validConstructorArgs({ limit: 0 });
            expect(() =>
                new SearchParams(
                    args.name,
                    args.similarityThreshold,
                    args.includePages,
                    args.includeRegions,
                    args.includeAka,
                    args.regionId,
                    args.order,
                    args.limit,
                    args.cursorEncoded,
                ),
            ).toThrow(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        });

        it('throws when regionId is not a valid UUID', () => {
            const args = validConstructorArgs({ regionId: 'not-a-uuid' });
            expect(() =>
                new SearchParams(
                    args.name,
                    args.similarityThreshold,
                    args.includePages,
                    args.includeRegions,
                    args.includeAka,
                    args.regionId,
                    args.order,
                    args.limit,
                    args.cursorEncoded,
                ),
            ).toThrow('Query parameter "region" must be a valid UUID');
        });

        it('throws when regionId is partial UUID', () => {
            const args = validConstructorArgs({
                regionId: 'c3d4e5f6-a7b8-9012',
            });
            expect(() =>
                new SearchParams(
                    args.name,
                    args.similarityThreshold,
                    args.includePages,
                    args.includeRegions,
                    args.includeAka,
                    args.regionId,
                    args.order,
                    args.limit,
                    args.cursorEncoded,
                ),
            ).toThrow('Query parameter "region" must be a valid UUID');
        });

        it('accepts null regionId', () => {
            const p = new SearchParams(
                'x',
                0.5,
                true,
                true,
                true,
                null,
                'similarity',
                1,
            );
            expect(p.regionId).toBeNull();
        });

        it('accepts empty string regionId (treated as null)', () => {
            const p = new SearchParams(
                'x',
                0.5,
                true,
                true,
                true,
                '',
                'similarity',
                1,
            );
            expect(p.regionId).toBeNull();
        });

        it('throws when cursor is invalid base64', () => {
            const args = validConstructorArgs({ cursorEncoded: '!!!invalid!!!' });
            expect(() =>
                new SearchParams(
                    args.name,
                    args.similarityThreshold,
                    args.includePages,
                    args.includeRegions,
                    args.includeAka,
                    args.regionId,
                    args.order,
                    args.limit,
                    args.cursorEncoded,
                ),
            ).toThrow(/Invalid search cursor encoding/);
        });
    });

    describe('fromQueryStringParams', () => {
        it('parses minimal valid params (name only)', () => {
            const p = SearchParams.fromQueryStringParams({ name: 'Imlay' });
            expect(p.name).toBe('Imlay');
            expect(p.similarityThreshold).toBe(0.5);
            expect(p.includePages).toBe(true);
            expect(p.includeRegions).toBe(true);
            expect(p.includeAka).toBe(true);
            expect(p.regionId).toBeNull();
            expect(p.order).toBe('similarity');
            expect(p.limit).toBe(20);
            expect(p.cursor).toBeNull();
        });

        it('parses all params with region and cursor', () => {
            const p = SearchParams.fromQueryStringParams({
                name: 'Test',
                similarity: '0.3',
                'include-pages': 'true',
                'include-regions': 'false',
                'include-aka': 'false',
                region: validUuid,
                order: 'quality',
                limit: '10',
                cursor: validCursorEncoded,
            });
            expect(p.name).toBe('Test');
            expect(p.similarityThreshold).toBe(0.3);
            expect(p.includePages).toBe(true);
            expect(p.includeRegions).toBe(false);
            expect(p.includeAka).toBe(false);
            expect(p.regionId).toBe(validUuid);
            expect(p.order).toBe('quality');
            expect(p.limit).toBe(10);
            expect(p.cursor).toBeInstanceOf(SearchCursor);
        });

        it('throws when name is missing', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({}),
            ).toThrow('Missing or empty required query parameter: name');
        });

        it('throws when name is empty string', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({ name: '' }),
            ).toThrow('Missing or empty required query parameter: name');
        });

        it('throws when name is whitespace', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({ name: '   ' }),
            ).toThrow('Missing or empty required query parameter: name');
        });

        it('uses Name (capital N) when name key is present', () => {
            const p = SearchParams.fromQueryStringParams({ Name: 'Canyon' });
            expect(p.name).toBe('Canyon');
        });

        it('throws when limit is not a whole number', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({
                    name: 'x',
                    limit: '20.5',
                }),
            ).toThrow(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        });

        it('throws when limit is zero', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({
                    name: 'x',
                    limit: '0',
                }),
            ).toThrow(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        });

        it('throws when limit is negative', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({
                    name: 'x',
                    limit: '-1',
                }),
            ).toThrow(
                'Query parameter "limit" must be a whole number greater than 0',
            );
        });

        it('throws when order is invalid', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({
                    name: 'x',
                    order: 'popularity',
                }),
            ).toThrow(
                'Query parameter "order" must be one of: similarity, quality',
            );
        });

        it('throws when include-pages is invalid boolean', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({
                    name: 'x',
                    'include-pages': 'yes',
                }),
            ).toThrow(/Query parameter value must be true, false, 1, or 0/);
        });

        it('throws when include-regions is invalid boolean', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({
                    name: 'x',
                    'include-regions': 'maybe',
                }),
            ).toThrow(/Query parameter value must be true, false, 1, or 0/);
        });

        it('throws when include-aka is invalid boolean', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({
                    name: 'x',
                    'include-aka': 'nope',
                }),
            ).toThrow(/Query parameter value must be true, false, 1, or 0/);
        });

        it('throws when include-aka is true and include-pages is false', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({
                    name: 'x',
                    'include-pages': 'false',
                    'include-aka': 'true',
                }),
            ).toThrow(
                'include-aka cannot be true when include-pages is false',
            );
        });

        it('sets includeAka to false when include-aka not provided and include-pages is false', () => {
            const p = SearchParams.fromQueryStringParams({
                name: 'x',
                'include-pages': 'false',
                'include-regions': 'true',
            });
            expect(p.includePages).toBe(false);
            expect(p.includeRegions).toBe(true);
            expect(p.includeAka).toBe(false);
        });

        it('accepts when include-pages and include-aka are false', () => {
            const p = SearchParams.fromQueryStringParams({
                name: 'x',
                'include-pages': 'false',
                'include-regions': 'true',
                'include-aka': 'false',
            });
            expect(p.includePages).toBe(false);
            expect(p.includeAka).toBe(false);
        });

        it('throws when both include-pages and include-regions are false', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({
                    name: 'x',
                    'include-pages': 'false',
                    'include-regions': 'false',
                }),
            ).toThrow(
                'At least one of include-pages or include-regions must be true',
            );
        });

        it('throws when region is not a valid UUID', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({
                    name: 'x',
                    region: 'not-a-uuid',
                }),
            ).toThrow('Query parameter "region" must be a valid UUID');
        });

        it('throws when cursor is invalid', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({
                    name: 'x',
                    cursor: '!!!invalid!!!',
                }),
            ).toThrow(/Invalid search cursor encoding/);
        });

        it('accepts similarity 0 and 1', () => {
            const p0 = SearchParams.fromQueryStringParams({
                name: 'x',
                similarity: '0',
            });
            expect(p0.similarityThreshold).toBe(0);
            const p1 = SearchParams.fromQueryStringParams({
                name: 'x',
                similarity: '1',
            });
            expect(p1.similarityThreshold).toBe(1);
        });

        it('accepts include-pages and include-regions as "1" and "0"', () => {
            const p = SearchParams.fromQueryStringParams({
                name: 'x',
                'include-pages': '1',
                'include-regions': '0',
            });
            expect(p.includePages).toBe(true);
            expect(p.includeRegions).toBe(false);
        });

        it('accepts include-aka as "1" and "0"', () => {
            const p = SearchParams.fromQueryStringParams({
                name: 'x',
                'include-aka': '0',
            });
            expect(p.includeAka).toBe(false);
            const p2 = SearchParams.fromQueryStringParams({
                name: 'x',
                'include-aka': '1',
            });
            expect(p2.includeAka).toBe(true);
        });

        it('uses Include-Aka (capital A) when include-aka key is present', () => {
            const p = SearchParams.fromQueryStringParams({
                name: 'x',
                'Include-Aka': 'false',
            });
            expect(p.includeAka).toBe(false);
        });
    });

    describe('toQueryString', () => {
        it('returns URL-encoded string with all params and cursor', () => {
            const p = new SearchParams(
                'Test',
                0.4,
                true,
                false,
                true,
                validUuid,
                'quality',
                15,
                validCursorEncoded,
            );
            const q = p.toQueryString();
            expect(typeof q).toBe('string');
            const params = new URLSearchParams(q);
            expect(params.get('name')).toBe('Test');
            expect(params.get('similarity')).toBe('0.4');
            expect(params.get('include-pages')).toBe('true');
            expect(params.get('include-regions')).toBe('false');
            expect(params.get('include-aka')).toBe('true');
            expect(params.get('region')).toBe(validUuid);
            expect(params.get('order')).toBe('quality');
            expect(params.get('limit')).toBe('15');
            expect(params.get('cursor')).toBe(validCursorEncoded);
        });

        it('omits region when regionId is null', () => {
            const p = new SearchParams(
                'x',
                0.5,
                true,
                true,
                true,
                null,
                'similarity',
                20,
            );
            const q = p.toQueryString();
            const params = new URLSearchParams(q);
            expect(params.has('region')).toBe(false);
        });

        it('omits cursor when cursor is omitted', () => {
            const p = new SearchParams(
                'x',
                0.5,
                true,
                true,
                true,
                null,
                'similarity',
                20,
            );
            const q = p.toQueryString();
            const params = new URLSearchParams(q);
            expect(params.has('cursor')).toBe(false);
        });

        it('round-trips with fromQueryStringParams', () => {
            const input = {
                name: 'RoundTrip',
                similarity: '0.7',
                'include-pages': 'false',
                'include-regions': 'true',
                'include-aka': 'false',
                region: validUuid,
                order: 'quality',
                limit: '5',
            };
            const p = SearchParams.fromQueryStringParams(input);
            const q = p.toQueryString();
            const params = new URLSearchParams(q);
            expect(params.get('name')).toBe(input.name);
            expect(params.get('similarity')).toBe(input.similarity);
            expect(params.get('include-pages')).toBe(input['include-pages']);
            expect(params.get('include-regions')).toBe(input['include-regions']);
            expect(params.get('include-aka')).toBe(input['include-aka']);
            expect(params.get('region')).toBe(input.region);
            expect(params.get('order')).toBe(input.order);
            expect(params.get('limit')).toBe(input.limit);
        });
    });

    describe('withCursor', () => {
        it('returns new instance with null cursor when passed null', () => {
            const p = new SearchParams(
                'q',
                0.5,
                true,
                true,
                true,
                null,
                'quality',
                10,
            );
            const next = p.withCursor(null);
            expect(next).not.toBe(p);
            expect(next.cursor).toBeNull();
            expect(next.name).toBe(p.name);
            expect(next.limit).toBe(p.limit);
        });

        it('returns new instance with encoded cursor for next page', () => {
            const p = new SearchParams(
                'q',
                0.5,
                true,
                true,
                true,
                null,
                'quality',
                10,
            );
            const next = p.withCursor(validCursorEncoded);
            expect(next).not.toBe(p);
            expect(next.cursor).toBeInstanceOf(SearchCursor);
            expect(next.cursor!.encodeBase64()).toBe(validCursorEncoded);
        });
    });
});
