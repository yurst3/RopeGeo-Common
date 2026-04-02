import { describe, it, expect } from '@jest/globals';
import {
    AcaDifficulty,
    AcaRiskRating,
    AcaTechnicalRating,
    AcaWaterRating,
    AcaTimeRating,
    Difficulty,
} from '../../src/classes';

describe('AcaDifficulty', () => {
    describe('constructor', () => {
        it('parses null and empty ratings as null', () => {
            const d = new AcaDifficulty(null, undefined, '', null);
            expect(d.technical).toBeNull();
            expect(d.water).toBeNull();
            expect(d.time).toBeNull();
            expect(d.risk).toBeNull();
            expect(d.effectiveRisk).toBeNull();
        });

        it('parses valid technical ratings', () => {
            expect(new AcaDifficulty('1', null, null, null).technical).toBe(
                AcaTechnicalRating.One,
            );
            expect(new AcaDifficulty('4', null, null, null).technical).toBe(
                AcaTechnicalRating.Four,
            );
        });

        it('trims whitespace when parsing', () => {
            const d = new AcaDifficulty('  2  ', '  C  ', '  III  ', '  PG  ');
            expect(d.technical).toBe(AcaTechnicalRating.Two);
            expect(d.water).toBe(AcaWaterRating.C);
            expect(d.time).toBe(AcaTimeRating.III);
            expect(d.risk).toBe(AcaRiskRating.PG);
            expect(d.effectiveRisk).toBe(AcaRiskRating.PG);
        });

        it('throws on invalid technical rating', () => {
            expect(() => new AcaDifficulty('5', null, null, null)).toThrow(
                'Invalid difficulty technical:',
            );
        });

        it('effectiveRisk defaults from technical when risk is null', () => {
            expect(new AcaDifficulty('1', null, null, null).effectiveRisk).toBe(
                AcaRiskRating.G,
            );
            expect(new AcaDifficulty('2', null, null, null).effectiveRisk).toBe(
                AcaRiskRating.PG,
            );
            expect(new AcaDifficulty('3', null, null, null).effectiveRisk).toBe(
                AcaRiskRating.PG13,
            );
        });

        it('keeps explicit risk when not milder than default', () => {
            const d = new AcaDifficulty('1', null, null, 'PG');
            expect(d.risk).toBe(AcaRiskRating.PG);
            expect(d.effectiveRisk).toBe(AcaRiskRating.PG);
        });

        it('upgrades effectiveRisk when explicit risk is milder than default', () => {
            const d = new AcaDifficulty('3', null, null, 'G');
            expect(d.risk).toBe(AcaRiskRating.G);
            expect(d.effectiveRisk).toBe(AcaRiskRating.PG13);
        });

        it('keeps explicit risk when no default (technical null)', () => {
            const d = new AcaDifficulty(null, null, null, 'R');
            expect(d.risk).toBe(AcaRiskRating.R);
            expect(d.effectiveRisk).toBe(AcaRiskRating.R);
        });
    });

    describe('fromResult', () => {
        it('parses via Difficulty.fromResult with difficultyType ACA', () => {
            const d = Difficulty.fromResult({
                difficultyType: 'ACA',
                technical: '2',
                water: null,
                time: null,
                risk: 'PG',
            }) as AcaDifficulty;
            expect(d.technical).toBe(AcaTechnicalRating.Two);
            expect(d.risk).toBe(AcaRiskRating.PG);
        });

        it('defaults missing difficultyType to ACA', () => {
            const d = Difficulty.fromResult({
                technical: '1',
                risk: null,
            }) as AcaDifficulty;
            expect(d.technical).toBe(AcaTechnicalRating.One);
        });

        it('applies explicit effectiveRisk override', () => {
            const d = AcaDifficulty.fromResult({
                difficultyType: 'ACA',
                technical: '3',
                risk: 'G',
                effectiveRisk: 'R',
            });
            expect(d.risk).toBe(AcaRiskRating.G);
            expect(d.effectiveRisk).toBe(AcaRiskRating.R);
        });

        it('throws on unsupported difficultyType for AcaDifficulty.fromResult', () => {
            expect(() =>
                AcaDifficulty.fromResult({ difficultyType: 'SPORT' }),
            ).toThrow(/Unsupported difficultyType/);
        });

        it('throws when field is non-string', () => {
            expect(() =>
                AcaDifficulty.fromResult({ technical: 1 }),
            ).toThrow(/must be string or null/);
        });
    });
});
