import { describe, it, expect } from '@jest/globals';
import {
    AcaDifficultyRating,
    AcaRiskSubRating,
    AcaTechnicalSubRating,
    AcaWaterSubRating,
    AcaTimeSubRating,
    DifficultyRating,
} from '../../src/models';

describe('AcaDifficultyRating', () => {
    describe('constructor', () => {
        it('parses null and empty ratings as null', () => {
            const d = new AcaDifficultyRating(null, undefined, '', null);
            expect(d.technical).toBeNull();
            expect(d.water).toBeNull();
            expect(d.time).toBeNull();
            expect(d.additionalRisk).toBeNull();
            expect(d.effectiveRisk).toBeNull();
        });

        it('parses valid technical ratings', () => {
            expect(new AcaDifficultyRating('1', null, null, null).technical).toBe(
                AcaTechnicalSubRating.One,
            );
            expect(new AcaDifficultyRating('4', null, null, null).technical).toBe(
                AcaTechnicalSubRating.Four,
            );
        });

        it('trims whitespace when parsing', () => {
            const d = new AcaDifficultyRating('  2  ', '  C  ', '  III  ', '  PG  ');
            expect(d.technical).toBe(AcaTechnicalSubRating.Two);
            expect(d.water).toBe(AcaWaterSubRating.C);
            expect(d.time).toBe(AcaTimeSubRating.III);
            expect(d.additionalRisk).toBe(AcaRiskSubRating.PG);
            expect(d.effectiveRisk).toBe(AcaRiskSubRating.PG);
        });

        it('throws on invalid technical rating', () => {
            expect(() => new AcaDifficultyRating('5', null, null, null)).toThrow(
                'Invalid difficulty technical:',
            );
        });

        it('effectiveRisk defaults from technical when additionalRisk is null', () => {
            expect(new AcaDifficultyRating('1', null, null, null).effectiveRisk).toBe(
                AcaRiskSubRating.G,
            );
            expect(new AcaDifficultyRating('2', null, null, null).effectiveRisk).toBe(
                AcaRiskSubRating.PG,
            );
            expect(new AcaDifficultyRating('3', null, null, null).effectiveRisk).toBe(
                AcaRiskSubRating.PG13,
            );
        });

        it('keeps explicit additionalRisk when not milder than default', () => {
            const d = new AcaDifficultyRating('1', null, null, 'PG');
            expect(d.additionalRisk).toBe(AcaRiskSubRating.PG);
            expect(d.effectiveRisk).toBe(AcaRiskSubRating.PG);
        });

        it('upgrades effectiveRisk when explicit additionalRisk is milder than default', () => {
            const d = new AcaDifficultyRating('3', null, null, 'G');
            expect(d.additionalRisk).toBe(AcaRiskSubRating.G);
            expect(d.effectiveRisk).toBe(AcaRiskSubRating.PG13);
        });

        it('keeps explicit additionalRisk when no default (technical null)', () => {
            const d = new AcaDifficultyRating(null, null, null, 'R');
            expect(d.additionalRisk).toBe(AcaRiskSubRating.R);
            expect(d.effectiveRisk).toBe(AcaRiskSubRating.R);
        });
    });

    describe('fromResult', () => {
        it('parses via DifficultyRating.fromResult with difficultyType ACA', () => {
            const d = DifficultyRating.fromResult({
                difficultyType: 'ACA',
                technical: '2',
                water: null,
                time: null,
                additionalRisk: 'PG',
            }) as AcaDifficultyRating;
            expect(d.technical).toBe(AcaTechnicalSubRating.Two);
            expect(d.additionalRisk).toBe(AcaRiskSubRating.PG);
        });

        it('defaults missing difficultyType to ACA', () => {
            const d = DifficultyRating.fromResult({
                technical: '1',
                additionalRisk: null,
            }) as AcaDifficultyRating;
            expect(d.technical).toBe(AcaTechnicalSubRating.One);
        });

        it('applies explicit effectiveRisk override', () => {
            const d = AcaDifficultyRating.fromResult({
                difficultyType: 'ACA',
                technical: '3',
                additionalRisk: 'G',
                effectiveRisk: 'R',
            });
            expect(d.additionalRisk).toBe(AcaRiskSubRating.G);
            expect(d.effectiveRisk).toBe(AcaRiskSubRating.R);
        });

        it('throws on unsupported difficultyType for AcaDifficultyRating.fromResult', () => {
            expect(() =>
                AcaDifficultyRating.fromResult({ difficultyType: 'SPORT' }),
            ).toThrow(/Unsupported difficultyRatingSystem/);
        });

        it('throws when field is non-string', () => {
            expect(() =>
                AcaDifficultyRating.fromResult({ technical: 1 }),
            ).toThrow(/must be string or null/);
        });
    });
});
