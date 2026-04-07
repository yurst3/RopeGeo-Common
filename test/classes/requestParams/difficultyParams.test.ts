import { describe, it, expect } from '@jest/globals';
import {
    AcaDifficultyParams,
    AcaRiskRating,
    AcaTechnicalRating,
    AcaTimeRating,
    AcaWaterRating,
    DifficultyParams,
    DifficultyType,
    isDifficultyParamsActive,
    Q_ACA_TECHNICAL,
} from '../../../src/classes';

describe('DifficultyParams', () => {
    describe('fromQueryStringParams', () => {
        it('returns null when no difficulty keys', () => {
            expect(DifficultyParams.fromQueryStringParams({})).toBeNull();
        });

        it('parses explicit difficulty-type=aca', () => {
            const d = DifficultyParams.fromQueryStringParams({
                'difficulty-type': 'aca',
                'aca-technical-rating': '1|2',
            });
            expect(d).toBeInstanceOf(AcaDifficultyParams);
            expect((d as AcaDifficultyParams).technical).toEqual([
                AcaTechnicalRating.One,
                AcaTechnicalRating.Two,
            ]);
        });

        it('accepts Difficulty-Type alias', () => {
            const d = DifficultyParams.fromQueryStringParams({
                'Difficulty-Type': 'ACA',
                'aca-water-rating': 'c',
            }) as AcaDifficultyParams;
            expect(d.water).toEqual([AcaWaterRating.C]);
        });

        it('infers ACA when difficulty-type omitted but an aca axis is set', () => {
            const d = DifficultyParams.fromQueryStringParams({
                [Q_ACA_TECHNICAL]: '3',
            }) as AcaDifficultyParams;
            expect(d.technical).toEqual([AcaTechnicalRating.Three]);
        });

        it('accepts PascalCase aca rating keys when type is explicit', () => {
            const d = DifficultyParams.fromQueryStringParams({
                'difficulty-type': 'aca',
                'Aca-Time-Rating': 'I|II',
            }) as AcaDifficultyParams;
            expect(d.time).toEqual([AcaTimeRating.I, AcaTimeRating.II]);
        });

        it('dedupes and sorts pipe tokens', () => {
            const d = DifficultyParams.fromQueryStringParams({
                'aca-risk-rating': 'R|PG|r',
            }) as AcaDifficultyParams;
            expect(d.effectiveRisk).toEqual([AcaRiskRating.PG, AcaRiskRating.R]);
        });

        it('throws on invalid difficulty-type value', () => {
            expect(() =>
                DifficultyParams.fromQueryStringParams({
                    'difficulty-type': 'yds',
                }),
            ).toThrow(/must be "aca"/);
        });

        it('throws on invalid enum token', () => {
            expect(() =>
                DifficultyParams.fromQueryStringParams({
                    'aca-technical-rating': '99',
                }),
            ).toThrow(/Invalid aca-technical-rating token/);
        });
    });

    describe('fromResult', () => {
        it('parses aca object with difficultyType', () => {
            const d = DifficultyParams.fromResult({
                difficultyType: 'ACA',
                'aca-technical-rating': '1',
            }) as AcaDifficultyParams;
            expect(d.technical).toEqual([AcaTechnicalRating.One]);
        });

        it('infers ACA when keys present without difficultyType', () => {
            const d = DifficultyParams.fromResult({
                'aca-risk-rating': 'G',
            }) as AcaDifficultyParams;
            expect(d.effectiveRisk).toEqual([AcaRiskRating.G]);
        });

        it('returns null when empty difficulty object', () => {
            expect(DifficultyParams.fromResult({})).toBeNull();
        });

        it('throws when result is not an object', () => {
            expect(() => DifficultyParams.fromResult(null)).toThrow(
                /must be an object/,
            );
        });

        it('throws on non-aca difficulty-type', () => {
            expect(() =>
                DifficultyParams.fromResult({ difficultyType: 'SPORT' }),
            ).toThrow(/must be "aca"/);
        });
    });

    describe('appendToUrlSearchParams', () => {
        it('merges active difficulty into URLSearchParams', () => {
            const diff = new AcaDifficultyParams(
                [AcaTechnicalRating.One],
                [],
                [],
                [],
            );
            const target = new URLSearchParams();
            target.set('region', 'x');
            DifficultyParams.appendToUrlSearchParams(target, diff);
            expect(target.get('region')).toBe('x');
            expect(target.get('difficulty-type')).toBe('aca');
            expect(target.get('aca-technical-rating')).toBe('1');
        });

        it('no-ops for null or inactive params', () => {
            const target = new URLSearchParams();
            DifficultyParams.appendToUrlSearchParams(target, null);
            expect([...target.keys()].length).toBe(0);
            const empty = new AcaDifficultyParams([], [], [], []);
            DifficultyParams.appendToUrlSearchParams(target, empty);
            expect([...target.keys()].length).toBe(0);
        });
    });
});

describe('isDifficultyParamsActive', () => {
    it('returns false for null, undefined, or inactive', () => {
        expect(isDifficultyParamsActive(null)).toBe(false);
        expect(isDifficultyParamsActive(undefined)).toBe(false);
        expect(
            isDifficultyParamsActive(new AcaDifficultyParams([], [], [], [])),
        ).toBe(false);
    });

    it('returns true when any axis is non-empty', () => {
        expect(
            isDifficultyParamsActive(
                new AcaDifficultyParams([AcaTechnicalRating.One], [], [], []),
            ),
        ).toBe(true);
    });
});

describe('AcaDifficultyParams', () => {
    it('isActive is false when all axes empty', () => {
        const p = new AcaDifficultyParams([], [], [], []);
        expect(p.isActive()).toBe(false);
        expect(p.difficultyType).toBe(DifficultyType.ACA);
    });

    it('toQueryString omits empty axes', () => {
        const p = new AcaDifficultyParams(
            [AcaTechnicalRating.Two],
            [],
            [],
            [AcaRiskRating.PG13],
        );
        const q = new URLSearchParams(p.toQueryString());
        expect(q.get('difficulty-type')).toBe('aca');
        expect(q.get('aca-technical-rating')).toBe('2');
        expect(q.get('aca-risk-rating')).toBe('pg13');
        expect(q.has('aca-water-rating')).toBe(false);
    });

    describe('fromResult', () => {
        it('reads Aca-* key aliases', () => {
            const p = AcaDifficultyParams.fromResult({
                'Aca-Water-Rating': 'a',
                'Aca-Time-Rating': 'III',
            });
            expect(p.water).toEqual([AcaWaterRating.A]);
            expect(p.time).toEqual([AcaTimeRating.III]);
        });
    });

    describe('normalizeEmpty', () => {
        it('returns null for null or inactive', () => {
            expect(AcaDifficultyParams.normalizeEmpty(null)).toBeNull();
            expect(
                AcaDifficultyParams.normalizeEmpty(
                    new AcaDifficultyParams([], [], [], []),
                ),
            ).toBeNull();
        });

        it('returns same instance when active', () => {
            const p = new AcaDifficultyParams(
                [AcaTechnicalRating.Four],
                [],
                [],
                [],
            );
            expect(AcaDifficultyParams.normalizeEmpty(p)).toBe(p);
        });
    });
});
