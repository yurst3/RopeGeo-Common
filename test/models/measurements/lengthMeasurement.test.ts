import { describe, it, expect, afterEach, jest } from '@jest/globals';
import {
    FEET,
    LengthMeasurement,
    MILES,
} from '../../../src/models/measurements/lengthMeasurement';

const METERS = { measurementSystem: 'Metric', name: 'meters' } as const;
const KILOMETERS = { measurementSystem: 'Metric', name: 'kilometers' } as const;

describe('LengthMeasurement', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('toString', () => {
        it('abbreviates Imperial/Metric units with no space', () => {
            expect(new LengthMeasurement(200, FEET).toString()).toBe('200ft');
            expect(new LengthMeasurement(5.1, MILES).toString()).toBe('5.1mi');
            expect(new LengthMeasurement(60.96, METERS).toString()).toBe('61m');
            expect(new LengthMeasurement(8.21, KILOMETERS).toString()).toBe('8.2km');
        });

        it('renders Freedom units with a leading space and full name', () => {
            const macs = new LengthMeasurement(3.5, {
                measurementSystem: 'Freedom',
                name: "McDonald's Big Macs",
            });
            expect(macs.toString()).toBe("3.5 McDonald's Big Macs");
        });

        it('omits the unit when showUnitName is false', () => {
            expect(new LengthMeasurement(200, FEET).toString(false)).toBe('200');
        });
    });

    describe('toMeasurementSystem', () => {
        it('converts Imperial to Metric using the tier mapping', () => {
            const meters = new LengthMeasurement(100, FEET).toMeasurementSystem('Metric');
            expect(meters.unit).toEqual({ measurementSystem: 'Metric', name: 'meters' });
            expect(meters.value).toBeCloseTo(30.48, 5);

            const km = new LengthMeasurement(1, MILES).toMeasurementSystem('Metric');
            expect(km.unit).toEqual({ measurementSystem: 'Metric', name: 'kilometers' });
            expect(km.value).toBeCloseTo(1.609344, 5);
        });

        it('converts Metric to Imperial using the tier mapping', () => {
            const feet = new LengthMeasurement(1000, METERS).toMeasurementSystem('Imperial');
            expect(feet.unit).toEqual({ measurementSystem: 'Imperial', name: 'feet' });
            expect(feet.value).toBeCloseTo(3280.8399, 3);
        });

        it('honors a unitName override', () => {
            const meters = new LengthMeasurement(1, MILES).toMeasurementSystem('Metric', 'meters');
            expect(meters.unit).toEqual({ measurementSystem: 'Metric', name: 'meters' });
            expect(meters.value).toBeCloseTo(1609.344, 3);
        });

        it('throws on a unitName that does not belong to the target system', () => {
            expect(() =>
                new LengthMeasurement(1, MILES).toMeasurementSystem('Metric', 'feet'),
            ).toThrow(/not a valid Metric unit/);
        });

        it('converts to a specific Freedom unit deterministically via unitName', () => {
            const fields = new LengthMeasurement(300, FEET).toMeasurementSystem(
                'Freedom',
                'Football Fields',
            );
            expect(fields.unit).toEqual({
                measurementSystem: 'Freedom',
                name: 'Football Fields',
            });
            expect(fields.value).toBeCloseTo(1, 6);
        });

        it('picks a random known Freedom unit when none is specified', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0);
            const converted = new LengthMeasurement(300, FEET).toMeasurementSystem('Freedom');
            expect(converted.unit.measurementSystem).toBe('Freedom');
            expect(converted.unit.name).toBe("McDonald's Big Macs");
            expect(Number.isFinite(converted.value)).toBe(true);
            expect(converted.value).toBeGreaterThan(0);
        });

        it('throws when converting from a Freedom unit', () => {
            const horses = new LengthMeasurement(2, {
                measurementSystem: 'Freedom',
                name: 'Horses',
            });
            expect(() => horses.toMeasurementSystem('Imperial')).toThrow(
                /Freedom units cannot be converted/,
            );
        });
    });

    describe('fromResult / coerce / toJSON', () => {
        it('round-trips through toJSON and fromResult', () => {
            const original = new LengthMeasurement(5.1, MILES);
            const parsed = LengthMeasurement.fromResult(JSON.parse(JSON.stringify(original)));
            expect(parsed).toBeInstanceOf(LengthMeasurement);
            expect(parsed.value).toBe(5.1);
            expect(parsed.unit).toEqual({ measurementSystem: 'Imperial', name: 'miles' });
        });

        it('coerces numbers with the provided default unit', () => {
            const coerced = LengthMeasurement.coerce(200, FEET);
            expect(coerced).toBeInstanceOf(LengthMeasurement);
            expect(coerced?.toString()).toBe('200ft');
            expect(LengthMeasurement.coerce(null, FEET)).toBeNull();
        });

        it('passes through existing instances unchanged', () => {
            const inst = new LengthMeasurement(1, MILES);
            expect(LengthMeasurement.coerce(inst, FEET)).toBe(inst);
        });

        it('rejects invalid wire shapes', () => {
            expect(() => LengthMeasurement.fromResult({ measurementType: 'time', value: 1, unit: FEET })).toThrow(
                /measurementType must be "length"/,
            );
            expect(() =>
                LengthMeasurement.fromResult({ measurementType: 'length', value: 'x', unit: FEET }),
            ).toThrow(/value must be a finite number/);
            expect(() =>
                LengthMeasurement.fromResult({
                    measurementType: 'length',
                    value: 1,
                    unit: { measurementSystem: 'Nope', name: 'feet' },
                }),
            ).toThrow(/measurementSystem must be Imperial, Metric, or Freedom/);
        });
    });
});
