import { describe, it, expect } from '@jest/globals';
import { SearchCursor } from '../../../../src/models/api/params/cursors/searchCursor';
import { SearchParams } from '../../../../src/models/api/params/searchParams';
import {
    AcaDifficultyParams,
    AcaTechnicalSubRating,
    AcaWaterSubRating,
} from '../../../../src/models';
import { PageDataSource } from '../../../../src/models/pageDataSource';

const validCursorEncoded = new SearchCursor(0.9, 'page', 'a123').encodeBase64();

describe('SearchParams', () => {
    describe('constructor', () => {
        it('accepts valid minimal params', () => {
            const x = new SearchParams(
                'Imlay',
                0.5,
                true,
                true,
                true,
                'similarity',
                20,
            );
            expect(x.name).toBe('Imlay');
            expect(x.order).toBe('similarity');
            expect(x.currentPosition).toBeNull();
            expect(x.source).toBeNull();
        });

        it('allows empty name', () => {
            const x = new SearchParams(
                '',
                0.5,
                true,
                true,
                true,
                'quality',
                20,
            );
            expect(x.name).toBe('');
        });

        it('accepts distance order with lat/lon and includeRegions false', () => {
            const x = new SearchParams(
                '',
                0.5,
                true,
                false,
                false,
                'distance',
                20,
                undefined,
                { lat: 37.1, lon: -113.1 },
            );
            expect(x.order).toBe('distance');
            expect(x.currentPosition).toEqual({ lat: 37.1, lon: -113.1 });
        });

        it('throws when order is distance without position', () => {
            expect(
                () =>
                    new SearchParams(
                        '',
                        0.5,
                        true,
                        false,
                        false,
                        'distance',
                        20,
                    ),
            ).toThrow(/lat.*lon/);
        });

        it('throws when order is distance and includeRegions true', () => {
            expect(
                () =>
                    new SearchParams(
                        'x',
                        0.5,
                        true,
                        true,
                        false,
                        'distance',
                        20,
                        undefined,
                        { lat: 1, lon: 2 },
                    ),
            ).toThrow(/include-regions must be false/);
        });

        it('throws when difficulty active and includePages false', () => {
            const diff = new AcaDifficultyParams([AcaTechnicalSubRating.One], [], [], []);
            expect(
                () =>
                    new SearchParams(
                        'x',
                        0.5,
                        false,
                        true,
                        false,
                        'similarity',
                        20,
                        undefined,
                        null,
                        null,
                        diff,
                    ),
            ).toThrow(/difficulty filter is active/);
        });

        it('throws when order invalid', () => {
            expect(
                () =>
                    new SearchParams(
                        'x',
                        0.5,
                        true,
                        true,
                        true,
                        'popularity' as 'similarity',
                        1,
                    ),
            ).toThrow(/similarity, quality, distance/);
        });
    });

    describe('fromQueryStringParams', () => {
        it('parses query with empty name', () => {
            const x = SearchParams.fromQueryStringParams({
                order: 'quality',
            });
            expect(x.name).toBe('');
            expect(x.order).toBe('quality');
        });

        it('parses distance with lat lon', () => {
            const x = SearchParams.fromQueryStringParams({
                order: 'distance',
                lat: '37',
                lon: '-120',
                'include-regions': 'false',
            });
            expect(x.order).toBe('distance');
            expect(x.currentPosition).toEqual({ lat: 37, lon: -120 });
        });

        it('parses source pipe-list', () => {
            const x = SearchParams.fromQueryStringParams({
                name: 'x',
                source: 'ropewiki',
            });
            expect(x.source).toEqual([PageDataSource.Ropewiki]);
        });

        it('throws when only one of lat/lon set', () => {
            expect(() =>
                SearchParams.fromQueryStringParams({ name: 'x', lat: '1' }),
            ).toThrow(/lat.*lon/);
        });

        it('round-trips toQueryString for named search', () => {
            const x = SearchParams.fromQueryStringParams({
                name: 'RoundTrip',
                similarity: '0.7',
                'include-pages': 'false',
                'include-regions': 'true',
                'include-aka': 'false',
                order: 'quality',
                limit: '5',
            });
            const q = x.toQueryString();
            const params = new URLSearchParams(q);
            expect(params.get('name')).toBe('RoundTrip');
            expect(params.get('order')).toBe('quality');
        });

        it('parses and round-trips ACA difficulty query params', () => {
            const x = SearchParams.fromQueryStringParams({
                name: 'canyon',
                order: 'quality',
                'difficulty-type': 'aca',
                'aca-technical-rating': '1|2',
                'aca-water-rating': 'b',
            });
            expect(x.difficulty).toBeInstanceOf(AcaDifficultyParams);
            const d = x.difficulty as AcaDifficultyParams;
            expect(d.technical).toEqual([
                AcaTechnicalSubRating.One,
                AcaTechnicalSubRating.Two,
            ]);
            expect(d.water).toEqual([AcaWaterSubRating.B]);
            const again = SearchParams.fromQueryStringParams(
                Object.fromEntries(new URLSearchParams(x.toQueryString())),
            );
            expect(again.difficulty?.toQueryString()).toBe(d.toQueryString());
        });
    });

    describe('withCursor', () => {
        it('returns new instance with encoded cursor', () => {
            const base = new SearchParams(
                'q',
                0.5,
                true,
                true,
                true,
                'quality',
                10,
            );
            const next = base.withCursor(validCursorEncoded);
            expect(next.cursor).toBeInstanceOf(SearchCursor);
        });
    });
});
