import { describe, it, expect } from '@jest/globals';
import {
    Difficulty,
    DifficultyRisk,
    DifficultyTechnical,
    DifficultyWater,
    DifficultyTime,
} from '../../src/types/difficulty';

describe('Difficulty', () => {
    describe('constructor', () => {
        it('parses null and empty ratings as null', () => {
            const d = new Difficulty(null, undefined, '', null);
            expect(d.technical).toBeNull();
            expect(d.water).toBeNull();
            expect(d.time).toBeNull();
            expect(d.risk).toBeNull();
        });

        it('parses valid technical ratings', () => {
            expect(new Difficulty('1', null, null, null).technical).toBe(DifficultyTechnical.One);
            expect(new Difficulty('2', null, null, null).technical).toBe(DifficultyTechnical.Two);
            expect(new Difficulty('3', null, null, null).technical).toBe(DifficultyTechnical.Three);
            expect(new Difficulty('4', null, null, null).technical).toBe(DifficultyTechnical.Four);
        });

        it('trims whitespace when parsing', () => {
            const d = new Difficulty('  2  ', '  C  ', '  III  ', '  PG  ');
            expect(d.technical).toBe(DifficultyTechnical.Two);
            expect(d.water).toBe(DifficultyWater.C);
            expect(d.time).toBe(DifficultyTime.III);
            expect(d.risk).toBe(DifficultyRisk.PG);
        });

        it('throws on invalid technical rating', () => {
            expect(() => new Difficulty('5', null, null, null)).toThrow(
                'Invalid difficulty technical: "5" is not one of',
            );
        });

        it('throws on invalid risk rating', () => {
            expect(() => new Difficulty(null, null, null, 'Invalid')).toThrow(
                'Invalid difficulty risk: "Invalid" is not one of',
            );
        });

        it('sets risk to default from technical when risk is null', () => {
            expect(new Difficulty('1', null, null, null).risk).toBe(DifficultyRisk.G);
            expect(new Difficulty('2', null, null, null).risk).toBe(DifficultyRisk.PG);
            expect(new Difficulty('3', null, null, null).risk).toBe(DifficultyRisk.PG13);
            expect(new Difficulty('4', null, null, null).risk).toBe(DifficultyRisk.PG13);
        });

        it('sets risk to default from technical when risk is empty string', () => {
            expect(new Difficulty('1', null, null, '').risk).toBe(DifficultyRisk.G);
        });

        it('keeps explicit risk when set and not milder than default', () => {
            const d = new Difficulty('1', null, null, 'PG');
            expect(d.risk).toBe(DifficultyRisk.PG);
        });

        it('upgrades risk to default when explicit risk is milder than default', () => {
            const d = new Difficulty('3', null, null, 'G');
            expect(d.risk).toBe(DifficultyRisk.PG13);
        });

        it('keeps explicit risk when no default (technical null)', () => {
            const d = new Difficulty(null, null, null, 'R');
            expect(d.risk).toBe(DifficultyRisk.R);
        });
    });
});
