import { describe, it, expect, afterEach, jest } from '@jest/globals';
import { MinMax } from '../../../src/models/measurements/minMax';
import { HOURS, MINUTES, TimeMeasurement } from '../../../src/models/measurements/timeMeasurement';

describe('MinMax', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('toString', () => {
        it('shows the unit only on max for measurement ranges', () => {
            const range = new MinMax(
                new TimeMeasurement(3, HOURS),
                new TimeMeasurement(6, HOURS),
            );
            expect(range.toString()).toBe('3-6h');
        });

        it('renders plain (non-measurement) ranges without a unit', () => {
            expect(new MinMax(1, 2).toString()).toBe('1-2');
        });
    });

    describe('toMeasurementSystem', () => {
        it('forces min and max onto the same Freedom unit', () => {
            const randomValues = [0.05, 0, 0.05, 0];
            let i = 0;
            jest.spyOn(Math, 'random').mockImplementation(() => randomValues[i++ % randomValues.length]!);

            const range = new MinMax(
                new TimeMeasurement(60, MINUTES),
                new TimeMeasurement(120, MINUTES),
            );
            const converted = range.toMeasurementSystem('Freedom');
            expect(converted.min.unit.measurementSystem).toBe('Freedom');
            expect(converted.max.unit.measurementSystem).toBe('Freedom');
            expect(converted.min.unit.name).toBe(converted.max.unit.name);
        });

        it('propagates an explicit unitName to both endpoints', () => {
            const range = new MinMax(
                new TimeMeasurement(30, MINUTES),
                new TimeMeasurement(60, MINUTES),
            );
            const converted = range.toMeasurementSystem('Standard', 'hours');
            expect(converted.min.unit.name).toBe('hours');
            expect(converted.max.unit.name).toBe('hours');
            expect(converted.min.value).toBeCloseTo(0.5, 6);
            expect(converted.max.value).toBeCloseTo(1, 6);
        });
    });

    describe('map / fromResult / toJSON', () => {
        it('maps both endpoints', () => {
            const doubled = new MinMax(1, 2).map((n) => n * 2);
            expect(doubled.min).toBe(2);
            expect(doubled.max).toBe(4);
        });

        it('round-trips measurement ranges through toJSON and fromResult', () => {
            const range = new MinMax(
                new TimeMeasurement(3, HOURS),
                new TimeMeasurement(6, HOURS),
            );
            const wire = JSON.parse(JSON.stringify(range));
            const parsed = MinMax.fromResult(wire, (v) => TimeMeasurement.fromResult(v));
            expect(parsed.min).toBeInstanceOf(TimeMeasurement);
            expect(parsed.toString()).toBe('3-6h');
        });

        it('throws when min or max are missing', () => {
            expect(() => MinMax.fromResult({ min: 1 }, (v) => v)).toThrow(/must include both min and max/);
        });
    });
});
