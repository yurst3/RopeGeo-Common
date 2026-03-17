import { describe, it, expect } from '@jest/globals';
import { Bounds } from '../../../../src/types/api/getRopewikiPageView/bounds';

describe('Bounds', () => {
    describe('fromResult', () => {
        it('parses valid result and returns Bounds instance', () => {
            const result = { north: 40.5, south: 38.0, east: -109.0, west: -111.5 };
            const parsed = Bounds.fromResult(result);
            expect(parsed).toBeInstanceOf(Bounds);
            expect(parsed.north).toBe(40.5);
            expect(parsed.south).toBe(38.0);
            expect(parsed.east).toBe(-109.0);
            expect(parsed.west).toBe(-111.5);
        });

        it('throws when result is null', () => {
            expect(() => Bounds.fromResult(null)).toThrow('Bounds result must be an object');
        });

        it('throws when result is not an object', () => {
            expect(() => Bounds.fromResult(42)).toThrow('Bounds result must be an object');
            expect(() => Bounds.fromResult('string')).toThrow('Bounds result must be an object');
        });

        it('throws when north is missing or not a number', () => {
            expect(() =>
                Bounds.fromResult({ south: 38, east: -109, west: -111 }),
            ).toThrow(/Bounds\.north must be a number/);
            expect(() =>
                Bounds.fromResult({ north: '40', south: 38, east: -109, west: -111 }),
            ).toThrow(/Bounds\.north must be a number/);
        });

        it('throws when south is missing or not a number', () => {
            expect(() =>
                Bounds.fromResult({ north: 40, east: -109, west: -111 }),
            ).toThrow(/Bounds\.south must be a number/);
        });

        it('throws when east is missing or not a number', () => {
            expect(() =>
                Bounds.fromResult({ north: 40, south: 38, west: -111 }),
            ).toThrow(/Bounds\.east must be a number/);
        });

        it('throws when west is missing or not a number', () => {
            expect(() =>
                Bounds.fromResult({ north: 40, south: 38, east: -109 }),
            ).toThrow(/Bounds\.west must be a number/);
        });

        it('throws when a property is NaN', () => {
            expect(() =>
                Bounds.fromResult({ north: Number.NaN, south: 38, east: -109, west: -111 }),
            ).toThrow(/Bounds\.north must be a number/);
        });
    });
});
