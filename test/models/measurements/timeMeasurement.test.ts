import { describe, it, expect, afterEach, jest } from '@jest/globals';
import {
    DAYS,
    HOURS,
    MINUTES,
    TimeMeasurement,
} from '../../../src/models/measurements/timeMeasurement';

describe('TimeMeasurement', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('toString', () => {
        it('abbreviates Standard units with no space', () => {
            expect(new TimeMeasurement(45, MINUTES).toString()).toBe('45min');
            expect(new TimeMeasurement(3, HOURS).toString()).toBe('3h');
            expect(new TimeMeasurement(2, DAYS).toString()).toBe('2d');
        });

        it('displays minutes as hours when value is at least 60', () => {
            expect(new TimeMeasurement(90, MINUTES).toString()).toBe('1.5h');
            expect(new TimeMeasurement(60, MINUTES).toString()).toBe('1h');
        });

        it('displays minutes as days when value is at least 60 * 24', () => {
            expect(new TimeMeasurement(60 * 24 * 2, MINUTES).toString()).toBe('2d');
        });

        it('displays hours as minutes when value is less than 1', () => {
            expect(new TimeMeasurement(0.033, HOURS).toString()).toBe('2min');
            expect(new TimeMeasurement(0.5, HOURS).toString()).toBe('30min');
        });

        it('displays hours as days when value is at least 24', () => {
            expect(new TimeMeasurement(48, HOURS).toString()).toBe('2d');
        });

        it('displays days as hours when value is less than 1', () => {
            expect(new TimeMeasurement(0.5, DAYS).toString()).toBe('12h');
        });

        it('displays days as minutes when value is less than 1/24', () => {
            expect(new TimeMeasurement(0.01, DAYS).toString()).toBe('14.4min');
        });

        it('renders Freedom units with a leading space and full name', () => {
            const banners = new TimeMeasurement(2, {
                measurementSystem: 'Freedom',
                name: 'Star-Spangled Banners',
            });
            expect(banners.toString()).toBe('2 Star-Spangled Banners');
        });

        it('omits the unit when showUnitName is false', () => {
            expect(new TimeMeasurement(3, HOURS).toString(false)).toBe('3');
        });
    });

    describe('toMeasurementSystem', () => {
        it('converts between Standard units via unitName', () => {
            const minutes = new TimeMeasurement(1, HOURS).toMeasurementSystem('Standard', 'minutes');
            expect(minutes.unit).toEqual({ measurementSystem: 'Standard', name: 'minutes' });
            expect(minutes.value).toBeCloseTo(60, 6);

            const hours = new TimeMeasurement(120, MINUTES).toMeasurementSystem('Standard', 'hours');
            expect(hours.value).toBeCloseTo(2, 6);
        });

        it('converts to a specific Freedom unit deterministically via unitName', () => {
            const ryans = new TimeMeasurement(169, MINUTES).toMeasurementSystem(
                'Freedom',
                'Saving Private Ryans',
            );
            expect(ryans.unit).toEqual({
                measurementSystem: 'Freedom',
                name: 'Saving Private Ryans',
            });
            expect(ryans.value).toBeCloseTo(1, 6);
        });

        it('picks a random known Freedom unit when none is specified', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0);
            const converted = new TimeMeasurement(60, MINUTES).toMeasurementSystem('Freedom');
            expect(converted.unit.measurementSystem).toBe('Freedom');
            expect(converted.unit.name).toBe('Star-Spangled Banners');
            expect(converted.value).toBeGreaterThan(0);
        });

        it('throws when converting from a Freedom unit', () => {
            const jiffies = new TimeMeasurement(5, {
                measurementSystem: 'Freedom',
                name: 'Jiffies',
            });
            expect(() => jiffies.toMeasurementSystem('Standard')).toThrow(
                /Freedom units cannot be converted/,
            );
        });
    });

    describe('fromResult / coerce', () => {
        it('round-trips through toJSON and fromResult', () => {
            const original = new TimeMeasurement(3, HOURS);
            const parsed = TimeMeasurement.fromResult(JSON.parse(JSON.stringify(original)));
            expect(parsed).toBeInstanceOf(TimeMeasurement);
            expect(parsed.value).toBe(3);
            expect(parsed.unit).toEqual({ measurementSystem: 'Standard', name: 'hours' });
        });

        it('coerces numbers with the provided default unit', () => {
            const coerced = TimeMeasurement.coerce(45, MINUTES);
            expect(coerced?.toString()).toBe('45min');
            expect(TimeMeasurement.coerce(null, MINUTES)).toBeNull();
        });

        it('rejects invalid wire shapes', () => {
            expect(() =>
                TimeMeasurement.fromResult({ measurementType: 'length', value: 1, unit: MINUTES }),
            ).toThrow(/measurementType must be "time"/);
            expect(() =>
                TimeMeasurement.fromResult({
                    measurementType: 'time',
                    value: 1,
                    unit: { measurementSystem: 'Metric', name: 'minutes' },
                }),
            ).toThrow(/measurementSystem must be Standard or Freedom/);
        });
    });
});
