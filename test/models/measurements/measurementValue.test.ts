import { describe, it, expect } from '@jest/globals';
import { formatMeasurementValue } from '../../../src/models/measurements/measurementValue';

describe('formatMeasurementValue', () => {
    it('renders exact zero as "0"', () => {
        expect(formatMeasurementValue(0)).toBe('0');
    });

    it('rounds values in [1, 9999] to the nearest 0.1 without scientific notation', () => {
        expect(formatMeasurementValue(200)).toBe('200');
        expect(formatMeasurementValue(5.14)).toBe('5.1');
        expect(formatMeasurementValue(5.16)).toBe('5.2');
        expect(formatMeasurementValue(9999)).toBe('9999');
    });

    it('rounds values in [0.001, 1) to the nearest 0.001 without scientific notation', () => {
        expect(formatMeasurementValue(0.0834)).toBe('0.083');
        expect(formatMeasurementValue(0.001)).toBe('0.001');
    });

    it('uses scientific notation (2 dp) for magnitudes > 9999', () => {
        expect(formatMeasurementValue(10000)).toBe('1.00e+4');
        expect(formatMeasurementValue(12345)).toBe('1.23e+4');
    });

    it('uses scientific notation (2 dp) for magnitudes < 0.001', () => {
        expect(formatMeasurementValue(0.0009)).toBe('9.00e-4');
    });

    it('preserves sign', () => {
        expect(formatMeasurementValue(-600)).toBe('-600');
        expect(formatMeasurementValue(-1800)).toBe('-1800');
        expect(formatMeasurementValue(-0.0009)).toBe('-9.00e-4');
    });

    it('throws on non-finite values', () => {
        expect(() => formatMeasurementValue(NaN)).toThrow(/finite number/);
        expect(() => formatMeasurementValue(Infinity)).toThrow(/finite number/);
    });
});
