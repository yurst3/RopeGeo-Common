import { Measurement } from './measurement';

/**
 * A min/max pair, generic over the endpoint type. Used for range-valued fields such as
 * `rappelCount` (`MinMax<number>`) and time estimates (`MinMax<TimeMeasurement>`).
 */
export class MinMax<T> {
    readonly min: T;
    readonly max: T;

    constructor(min: T, max: T) {
        this.min = min;
        this.max = max;
    }

    /** Applies `fn` to both endpoints, returning a new pair. */
    map<U>(fn: (value: T) => U): MinMax<U> {
        return new MinMax<U>(fn(this.min), fn(this.max));
    }

    /**
     * Renders the range as `min-max`. When the endpoints are {@link Measurement}s, the unit is
     * shown only on `max`, so a range reads e.g. `3-6h` or `400-500 Walmart Supercenters`.
     * Non-measurement endpoints (e.g. numbers) render plainly (`1-2`).
     */
    toString(showUnitName = true): string {
        const minStr =
            this.min instanceof Measurement ? this.min.toString(false) : String(this.min);
        const maxStr =
            this.max instanceof Measurement
                ? this.max.toString(showUnitName)
                : String(this.max);
        return `${minStr}-${maxStr}`;
    }

    /**
     * Converts a measurement range to the given system. `min` is converted first (choosing a
     * random Freedom unit when applicable), then `max` is forced onto the same unit by reusing
     * `min`'s resulting unit name, guaranteeing both endpoints share a unit.
     */
    toMeasurementSystem<M extends Measurement>(
        this: MinMax<M>,
        system: string,
        unitName?: string,
    ): MinMax<M> {
        const convertedMin = this.min.toMeasurementSystem(system, unitName) as M;
        const convertedMax = this.max.toMeasurementSystem(
            system,
            convertedMin.unit.name,
        ) as M;
        return new MinMax<M>(convertedMin, convertedMax);
    }

    toJSON(): { min: T; max: T } {
        return { min: this.min, max: this.max };
    }

    static fromResult<T>(json: unknown, parseItem: (value: unknown) => T): MinMax<T> {
        if (json == null || typeof json !== 'object') {
            throw new Error('MinMax result must be an object with min and max');
        }
        const o = json as Record<string, unknown>;
        if (!('min' in o) || !('max' in o)) {
            throw new Error('MinMax result must include both min and max');
        }
        return new MinMax<T>(parseItem(o.min), parseItem(o.max));
    }
}
