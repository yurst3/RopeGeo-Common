import { FREEDOM_MEASUREMENT_SYSTEM, Measurement } from './measurement';

export type ImperialSystem = { measurementSystem: 'Imperial'; name: 'feet' | 'miles' };
export type MetricSystem = { measurementSystem: 'Metric'; name: 'meters' | 'kilometers' };
export type FreedomSystem = { measurementSystem: 'Freedom'; name: string };
export type LengthMeasurementUnit = ImperialSystem | MetricSystem | FreedomSystem;
export type LengthMeasurementSystem = 'Imperial' | 'Metric' | 'Freedom';

/** Convenience unit descriptors for the units RopeWiki stores lengths/elevations in. */
export const MILES: ImperialSystem = { measurementSystem: 'Imperial', name: 'miles' };
export const FEET: ImperialSystem = { measurementSystem: 'Imperial', name: 'feet' };

type StandardLengthName = 'feet' | 'miles' | 'meters' | 'kilometers';

const FEET_PER_METER = 3.280839895013123;

/** Length of one unit of each Imperial/Metric name, expressed in meters. */
const METERS_PER_UNIT: Record<StandardLengthName, number> = {
    feet: 0.3048,
    miles: 1609.344,
    meters: 1,
    kilometers: 1000,
};

const IMPERIAL_NAMES: readonly StandardLengthName[] = ['feet', 'miles'];
const METRIC_NAMES: readonly StandardLengthName[] = ['meters', 'kilometers'];

/** Imperial <-> Metric tier mapping used when no explicit unit name is requested. */
const TIER_MAP: Record<StandardLengthName, StandardLengthName> = {
    feet: 'meters',
    miles: 'kilometers',
    meters: 'feet',
    kilometers: 'miles',
};

type FreedomLengthEntry = { minFeet: number; maxFeet: number };

const FEET_PER_INCH = 1 / 12;

function feetFromInches(inches: number): number {
    return inches * FEET_PER_INCH;
}

function feetFromMeters(meters: number): number {
    return meters * FEET_PER_METER;
}

function feetFromMiles(miles: number): number {
    return miles * METERS_PER_UNIT.miles * FEET_PER_METER;
}

/** Length of each freedom unit in feet. Ranges pick a random value within `[minFeet, maxFeet]`. */
const FREEDOM_LENGTH_UNITS: Record<string, FreedomLengthEntry> = {
    "McDonald's Big Macs": { minFeet: feetFromInches(2.75), maxFeet: feetFromInches(3.5) },
    'Football Fields': fixed(300),
    'Walmart Supercenters': { minFeet: 400, maxFeet: 500 },
    'Olympic Swimming Pools': fixed(feetFromMeters(50)),
    'M1A1 Abrams Main Battle Tanks': fixed(32.04),
    'Mount Rushmores': fixed(5725),
    'White Houses': fixed(168),
    'AR-15 Carbines': { minFeet: feetFromInches(32.5), maxFeet: feetFromInches(36) },
    'Rhode Islands': fixed(feetFromMiles(48)),
    'Statues of Liberty': fixed(305 + feetFromInches(1)),
    Horses: fixed(8),
    'City Blocks': { minFeet: feetFromMeters(100), maxFeet: feetFromMeters(200) },
    'Nautical Mile': fixed(feetFromMiles(1.151)),
    Leagues: fixed(feetFromMiles(3)),
    Cubits: fixed(feetFromInches(17.5)),
    Fathoms: fixed(6),
    Poppyseeds: fixed(feetFromInches(0.083)),
    Furlongs: fixed(660),
    Paces: fixed(feetFromInches(30)),
};

function fixed(feet: number): FreedomLengthEntry {
    return { minFeet: feet, maxFeet: feet };
}

function randomInRange(min: number, max: number): number {
    if (min === max) return min;
    return min + Math.random() * (max - min);
}

function pickRandomKey(record: Record<string, unknown>): string {
    const keys = Object.keys(record);
    return keys[Math.floor(Math.random() * keys.length)]!;
}

/** A length with an explicit unit, convertible between Imperial, Metric, and Freedom systems. */
export class LengthMeasurement extends Measurement {
    readonly measurementType = 'length' as const;
    declare readonly unit: LengthMeasurementUnit;

    constructor(value: number, unit: LengthMeasurementUnit) {
        super(value, unit);
    }

    toMeasurementSystem(
        system: LengthMeasurementSystem,
        unitName?: string,
    ): LengthMeasurement {
        const unit = this.unit;
        if (unit.measurementSystem === FREEDOM_MEASUREMENT_SYSTEM) {
            throw new Error(
                'Freedom units cannot be converted to any other system because they are the best units.',
            );
        }
        if (system === 'Freedom') {
            return this.toFreedom(unit, unitName);
        }
        const targetName =
            unitName != null
                ? assertStandardUnit(system, unitName)
                : LengthMeasurement.defaultTargetName(unit, system);
        const meters = this.value * METERS_PER_UNIT[unit.name];
        const value = meters / METERS_PER_UNIT[targetName];
        const targetUnit: LengthMeasurementUnit =
            system === 'Imperial'
                ? { measurementSystem: 'Imperial', name: targetName as 'feet' | 'miles' }
                : { measurementSystem: 'Metric', name: targetName as 'meters' | 'kilometers' };
        return new LengthMeasurement(value, targetUnit);
    }

    protected abbreviate(): string {
        switch (this.unit.name) {
            case 'feet':
                return 'ft';
            case 'miles':
                return 'mi';
            case 'meters':
                return 'm';
            case 'kilometers':
                return 'km';
            default:
                return this.unit.name;
        }
    }

    private toFreedom(
        unit: ImperialSystem | MetricSystem,
        unitName?: string,
    ): LengthMeasurement {
        const feet = this.value * METERS_PER_UNIT[unit.name] * FEET_PER_METER;
        const name = unitName ?? pickRandomKey(FREEDOM_LENGTH_UNITS);
        const entry = FREEDOM_LENGTH_UNITS[name];
        if (entry == null) {
            throw new Error(`LengthMeasurement: "${name}" is not a known Freedom unit`);
        }
        const unitFeet = randomInRange(entry.minFeet, entry.maxFeet);
        return new LengthMeasurement(feet / unitFeet, {
            measurementSystem: 'Freedom',
            name,
        });
    }

    private static defaultTargetName(
        unit: ImperialSystem | MetricSystem,
        targetSystem: 'Imperial' | 'Metric',
    ): StandardLengthName {
        if (unit.measurementSystem === targetSystem) {
            return unit.name;
        }
        return TIER_MAP[unit.name];
    }

    static fromResult(json: unknown): LengthMeasurement {
        if (json == null || typeof json !== 'object') {
            throw new Error('LengthMeasurement result must be an object');
        }
        const r = json as Record<string, unknown>;
        if (r.measurementType !== 'length') {
            throw new Error(
                `LengthMeasurement.measurementType must be "length", got: ${JSON.stringify(r.measurementType)}`,
            );
        }
        if (typeof r.value !== 'number' || !Number.isFinite(r.value)) {
            throw new Error(
                `LengthMeasurement.value must be a finite number, got: ${JSON.stringify(r.value)}`,
            );
        }
        return new LengthMeasurement(r.value, parseLengthUnit(r.unit));
    }

    static coerce(
        value: unknown,
        defaultUnit: LengthMeasurementUnit,
    ): LengthMeasurement | null {
        if (value == null) {
            return null;
        }
        if (value instanceof LengthMeasurement) {
            return value;
        }
        if (typeof value === 'number') {
            if (!Number.isFinite(value)) {
                throw new Error(
                    `LengthMeasurement.coerce: numeric value must be finite, got: ${value}`,
                );
            }
            return new LengthMeasurement(value, defaultUnit);
        }
        return LengthMeasurement.fromResult(value);
    }
}

function assertStandardUnit(
    system: 'Imperial' | 'Metric',
    name: string,
): StandardLengthName {
    const allowed = system === 'Imperial' ? IMPERIAL_NAMES : METRIC_NAMES;
    if (!(allowed as readonly string[]).includes(name)) {
        throw new Error(
            `LengthMeasurement: "${name}" is not a valid ${system} unit (expected one of [${allowed.join(', ')}])`,
        );
    }
    return name as StandardLengthName;
}

function parseLengthUnit(u: unknown): LengthMeasurementUnit {
    if (u == null || typeof u !== 'object') {
        throw new Error('LengthMeasurement.unit must be an object');
    }
    const o = u as Record<string, unknown>;
    const { measurementSystem, name } = o;
    if (typeof name !== 'string') {
        throw new Error('LengthMeasurement.unit.name must be a string');
    }
    if (measurementSystem === 'Imperial') {
        return { measurementSystem: 'Imperial', name: assertStandardUnit('Imperial', name) as 'feet' | 'miles' };
    }
    if (measurementSystem === 'Metric') {
        return {
            measurementSystem: 'Metric',
            name: assertStandardUnit('Metric', name) as 'meters' | 'kilometers',
        };
    }
    if (measurementSystem === 'Freedom') {
        return { measurementSystem: 'Freedom', name };
    }
    throw new Error(
        `LengthMeasurement.unit.measurementSystem must be Imperial, Metric, or Freedom, got: ${JSON.stringify(measurementSystem)}`,
    );
}
