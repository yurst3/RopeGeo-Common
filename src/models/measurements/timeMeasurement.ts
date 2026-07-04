import { FREEDOM_MEASUREMENT_SYSTEM, Measurement } from './measurement';
import { formatMeasurementValue } from './measurementValue';
import type { FreedomSystem } from './lengthMeasurement';

export type StandardSystem = {
    measurementSystem: 'Standard';
    name: 'minutes' | 'hours' | 'days';
};
export type TimeMeasurementUnit = StandardSystem | FreedomSystem;
export type TimeMeasurementSystem = 'Standard' | 'Freedom';

/** Convenience unit descriptors for the units RopeWiki stores times in. */
export const MINUTES: StandardSystem = { measurementSystem: 'Standard', name: 'minutes' };
export const HOURS: StandardSystem = { measurementSystem: 'Standard', name: 'hours' };
export const DAYS: StandardSystem = { measurementSystem: 'Standard', name: 'days' };

type StandardTimeName = 'minutes' | 'hours' | 'days';

/** Duration of one unit of each Standard name, expressed in seconds. */
const SECONDS_PER_UNIT: Record<StandardTimeName, number> = {
    minutes: 60,
    hours: 3600,
    days: 86400,
};

const STANDARD_NAMES: readonly StandardTimeName[] = ['minutes', 'hours', 'days'];

type FreedomTimeEntry = { minSeconds: number; maxSeconds: number };

function fixed(seconds: number): FreedomTimeEntry {
    return { minSeconds: seconds, maxSeconds: seconds };
}

/** Duration of each freedom unit in seconds. Ranges pick a random value within the interval. */
const FREEDOM_TIME_UNITS: Record<string, FreedomTimeEntry> = {
    'Star-Spangled Banners': fixed(79),
    'Saving Private Ryans': fixed(169 * 60),
    Jiffies: fixed(0.02),
    Moments: fixed(90),
    'Dog years': fixed(52 * 86400),
    Fortnights: fixed(14 * 86400),
    Scaramuccis: fixed(11 * 86400),
    'Basketball quarters': fixed(12 * 60),
    'Hockey periods': fixed(20 * 60),
    'Football quarters': fixed(15 * 60),
    Microcenturies: fixed(52 * 60 + 35.7),
    'DMV wait times': { minSeconds: 60 * 60, maxSeconds: 90 * 60 },
    'Green light honks': { minSeconds: 0.003, maxSeconds: 0.015 },
};

function randomInRange(min: number, max: number): number {
    if (min === max) return min;
    return min + Math.random() * (max - min);
}

function pickRandomKey(record: Record<string, unknown>): string {
    const keys = Object.keys(record);
    return keys[Math.floor(Math.random() * keys.length)]!;
}

/** A duration with an explicit unit, convertible between Standard and Freedom systems. */
export class TimeMeasurement extends Measurement {
    readonly measurementType = 'time' as const;
    declare readonly unit: TimeMeasurementUnit;

    constructor(value: number, unit: TimeMeasurementUnit) {
        super(value, unit);
    }

    toMeasurementSystem(system: TimeMeasurementSystem, unitName?: string): TimeMeasurement {
        const unit = this.unit;
        if (unit.measurementSystem === FREEDOM_MEASUREMENT_SYSTEM) {
            throw new Error(
                'Freedom units cannot be converted to any other system because they are the best units.',
            );
        }
        if (system === 'Freedom') {
            return this.toFreedom(unit, unitName);
        }
        const targetName = unitName != null ? assertStandardUnit(unitName) : unit.name;
        const seconds = this.value * SECONDS_PER_UNIT[unit.name];
        const value = seconds / SECONDS_PER_UNIT[targetName];
        return new TimeMeasurement(value, { measurementSystem: 'Standard', name: targetName });
    }

    protected abbreviate(): string {
        return abbreviateStandardUnit(this.unit.name as StandardTimeName);
    }

    /**
     * Renders the value in a human-friendly unit derived from the stored unit and magnitude
     * (e.g. 90 minutes → `1.5h`) without changing {@link unit}.
     */
    toString(showUnitName = true): string {
        if (this.unit.measurementSystem === FREEDOM_MEASUREMENT_SYSTEM) {
            return super.toString(showUnitName);
        }
        const { value, unit } = displayUnitAndValue(this.value, this.unit.name);
        const formatted = formatMeasurementValue(value);
        if (!showUnitName) {
            return formatted;
        }
        return `${formatted}${abbreviateStandardUnit(unit)}`;
    }

    private toFreedom(unit: StandardSystem, unitName?: string): TimeMeasurement {
        const seconds = this.value * SECONDS_PER_UNIT[unit.name];
        const name = unitName ?? pickRandomKey(FREEDOM_TIME_UNITS);
        const entry = FREEDOM_TIME_UNITS[name];
        if (entry == null) {
            throw new Error(`TimeMeasurement: "${name}" is not a known Freedom unit`);
        }
        const unitSeconds = randomInRange(entry.minSeconds, entry.maxSeconds);
        return new TimeMeasurement(seconds / unitSeconds, {
            measurementSystem: 'Freedom',
            name,
        });
    }

    static fromResult(json: unknown): TimeMeasurement {
        if (json == null || typeof json !== 'object') {
            throw new Error('TimeMeasurement result must be an object');
        }
        const r = json as Record<string, unknown>;
        if (r.measurementType !== 'time') {
            throw new Error(
                `TimeMeasurement.measurementType must be "time", got: ${JSON.stringify(r.measurementType)}`,
            );
        }
        if (typeof r.value !== 'number' || !Number.isFinite(r.value)) {
            throw new Error(
                `TimeMeasurement.value must be a finite number, got: ${JSON.stringify(r.value)}`,
            );
        }
        return new TimeMeasurement(r.value, parseTimeUnit(r.unit));
    }

    static coerce(
        value: unknown,
        defaultUnit: TimeMeasurementUnit,
    ): TimeMeasurement | null {
        if (value == null) {
            return null;
        }
        if (value instanceof TimeMeasurement) {
            return value;
        }
        if (typeof value === 'number') {
            if (!Number.isFinite(value)) {
                throw new Error(
                    `TimeMeasurement.coerce: numeric value must be finite, got: ${value}`,
                );
            }
            return new TimeMeasurement(value, defaultUnit);
        }
        return TimeMeasurement.fromResult(value);
    }
}

function abbreviateStandardUnit(name: StandardTimeName): string {
    switch (name) {
        case 'minutes':
            return 'min';
        case 'hours':
            return 'h';
        case 'days':
            return 'd';
    }
}

/** Picks a display unit and scaled value for {@link TimeMeasurement.toString}. */
function displayUnitAndValue(
    value: number,
    baseUnit: StandardTimeName,
): { value: number; unit: StandardTimeName } {
    switch (baseUnit) {
        case 'minutes':
            if (value >= 60 * 24) {
                return { value: value / (60 * 24), unit: 'days' };
            }
            if (value >= 60) {
                return { value: value / 60, unit: 'hours' };
            }
            return { value, unit: 'minutes' };
        case 'hours':
            if (value >= 24) {
                return { value: value / 24, unit: 'days' };
            }
            if (value < 1) {
                return { value: value * 60, unit: 'minutes' };
            }
            return { value, unit: 'hours' };
        case 'days':
            if (value < 1 / 24) {
                return { value: value * 24 * 60, unit: 'minutes' };
            }
            if (value < 1) {
                return { value: value * 24, unit: 'hours' };
            }
            return { value, unit: 'days' };
    }
}

function assertStandardUnit(name: string): StandardTimeName {
    if (!(STANDARD_NAMES as readonly string[]).includes(name)) {
        throw new Error(
            `TimeMeasurement: "${name}" is not a valid Standard unit (expected one of [${STANDARD_NAMES.join(', ')}])`,
        );
    }
    return name as StandardTimeName;
}

function parseTimeUnit(u: unknown): TimeMeasurementUnit {
    if (u == null || typeof u !== 'object') {
        throw new Error('TimeMeasurement.unit must be an object');
    }
    const o = u as Record<string, unknown>;
    const { measurementSystem, name } = o;
    if (typeof name !== 'string') {
        throw new Error('TimeMeasurement.unit.name must be a string');
    }
    if (measurementSystem === 'Standard') {
        return { measurementSystem: 'Standard', name: assertStandardUnit(name) };
    }
    if (measurementSystem === 'Freedom') {
        return { measurementSystem: 'Freedom', name };
    }
    throw new Error(
        `TimeMeasurement.unit.measurementSystem must be Standard or Freedom, got: ${JSON.stringify(measurementSystem)}`,
    );
}
