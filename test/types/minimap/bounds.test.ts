import { describe, it, expect } from '@jest/globals';
import { Bounds } from '../../../src/types/minimap/bounds';

describe('Bounds', () => {
    describe('fromResult', () => {
        it('parses valid result and returns Bounds instance', () => {
            const result = { north: 40, south: 38, east: -108, west: -111 };
            const parsed = Bounds.fromResult(result);
            expect(parsed).toBeInstanceOf(Bounds);
            expect(parsed.north).toBe(40);
            expect(parsed.south).toBe(38);
            expect(parsed.east).toBe(-108);
            expect(parsed.west).toBe(-111);
        });

        it('throws when result is null or not an object', () => {
            expect(() => Bounds.fromResult(null)).toThrow('Bounds result must be an object');
            expect(() => Bounds.fromResult(undefined)).toThrow('Bounds result must be an object');
            expect(() => Bounds.fromResult(42)).toThrow('Bounds result must be an object');
            expect(() => Bounds.fromResult('string')).toThrow('Bounds result must be an object');
        });

        it('throws when a coordinate is missing or wrong type', () => {
            expect(() =>
                Bounds.fromResult({ south: 38, east: -109, west: -111 }),
            ).toThrow(/Bounds\.north must be a number/);
            expect(() =>
                Bounds.fromResult({ north: '40', south: 38, east: -109, west: -111 }),
            ).toThrow(/Bounds\.north must be a number/);
            expect(() =>
                Bounds.fromResult({ north: 40, east: -109, west: -111 }),
            ).toThrow(/Bounds\.south must be a number/);
            expect(() =>
                Bounds.fromResult({ north: 40, south: 38, west: -111 }),
            ).toThrow(/Bounds\.east must be a number/);
            expect(() =>
                Bounds.fromResult({ north: 40, south: 38, east: -109 }),
            ).toThrow(/Bounds\.west must be a number/);
            expect(() =>
                Bounds.fromResult({ north: Number.NaN, south: 38, east: -109, west: -111 }),
            ).toThrow(/Bounds\.north must be a number/);
        });
    });

    describe('update', () => {
        it('expands bounds when point is outside to the north', () => {
            const b = new Bounds(40, 38, -108, -111);
            b.update(-109, 41);
            expect(b.north).toBe(41);
            expect(b.south).toBe(38);
            expect(b.east).toBe(-108);
            expect(b.west).toBe(-111);
        });

        it('expands bounds when point is outside to the south', () => {
            const b = new Bounds(40, 38, -108, -111);
            b.update(-109, 37);
            expect(b.north).toBe(40);
            expect(b.south).toBe(37);
            expect(b.east).toBe(-108);
            expect(b.west).toBe(-111);
        });

        it('expands bounds when point is outside to the east', () => {
            const b = new Bounds(40, 38, -108, -111);
            b.update(-107, 39);
            expect(b.north).toBe(40);
            expect(b.south).toBe(38);
            expect(b.east).toBe(-107);
            expect(b.west).toBe(-111);
        });

        it('expands bounds when point is outside to the west', () => {
            const b = new Bounds(40, 38, -108, -111);
            b.update(-112, 39);
            expect(b.north).toBe(40);
            expect(b.south).toBe(38);
            expect(b.east).toBe(-108);
            expect(b.west).toBe(-112);
        });

        it('does not change bounds when point is inside', () => {
            const b = new Bounds(40, 38, -108, -111);
            b.update(-109, 39);
            expect(b.north).toBe(40);
            expect(b.south).toBe(38);
            expect(b.east).toBe(-108);
            expect(b.west).toBe(-111);
        });

        it('expands multiple edges when point is outside on diagonal', () => {
            const b = new Bounds(40, 38, -108, -111);
            b.update(-107, 41);
            expect(b.north).toBe(41);
            expect(b.south).toBe(38);
            expect(b.east).toBe(-107);
            expect(b.west).toBe(-111);
        });
    });
});
