import { formatMeasurementValue } from './measurementValue';

/** Marker for the "best" measurement system; freedom units render/behave specially. */
export const FREEDOM_MEASUREMENT_SYSTEM = 'Freedom';

/** Base shape shared by every unit descriptor. */
export interface MeasurementUnit {
    measurementSystem: string;
    name: string;
}

/**
 * Abstract base for {@link LengthMeasurement} and {@link TimeMeasurement}. Holds a numeric
 * `value` and a `unit` descriptor, and centralizes value formatting + freedom spacing so a
 * range wrapper ({@link MinMax}) can treat both subclasses uniformly via `instanceof Measurement`.
 */
export abstract class Measurement {
    abstract readonly measurementType: string;
    readonly value: number;
    readonly unit: MeasurementUnit;

    protected constructor(value: number, unit: MeasurementUnit) {
        this.value = value;
        this.unit = unit;
    }

    /** Non-freedom unit abbreviation (e.g. `ft`, `km`, `min`), appended without a space. */
    protected abstract abbreviate(): string;

    /** Returns a new measurement converted to the given system (optionally forcing a unit). */
    abstract toMeasurementSystem(system: string, unitName?: string): Measurement;

    /**
     * Renders the value and (by default) its unit. Imperial/Metric/Standard units are
     * abbreviated with no space; Freedom units use their full name with a leading space.
     * Pass `showUnitName = false` to render the value only (used by {@link MinMax}).
     */
    toString(showUnitName = true): string {
        const formatted = formatMeasurementValue(this.value);
        if (!showUnitName) {
            return formatted;
        }
        if (this.unit.measurementSystem === FREEDOM_MEASUREMENT_SYSTEM) {
            return `${formatted} ${this.unit.name}`;
        }
        return `${formatted}${this.abbreviate()}`;
    }

    toJSON(): { value: number; measurementType: string; unit: MeasurementUnit } {
        return {
            value: this.value,
            measurementType: this.measurementType,
            unit: {
                measurementSystem: this.unit.measurementSystem,
                name: this.unit.name,
            },
        };
    }
}
