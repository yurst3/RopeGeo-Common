import type { Measurement } from './measurements/measurement';

/**
 * Page-stat keys used by relevant-context measurements.
 * Values match the AI model / Zod enum and page-view lookup keys exactly.
 */
export const MEASUREMENT_KEYS = [
    'approachLength',
    'descentLength',
    'exitLength',
    'approachElevGain',
    'descentElevGain',
    'exitElevGain',
    'minApproachTime',
    'maxApproachTime',
    'minDescentTime',
    'maxDescentTime',
    'minExitTime',
    'maxExitTime',
    'shuttleTime',
] as const;

export type MeasurementKey = (typeof MEASUREMENT_KEYS)[number];

/** Key → page measurement for resolving {@link MeasurementContext} without a stored value. */
export type MeasurementsLookup = Partial<Record<MeasurementKey, Measurement>>;

export function isMeasurementKey(value: unknown): value is MeasurementKey {
    return (
        typeof value === 'string' &&
        (MEASUREMENT_KEYS as readonly string[]).includes(value)
    );
}

export function assertMeasurementKey(value: unknown, context: string): MeasurementKey {
    if (!isMeasurementKey(value)) {
        throw new Error(
            `${context} must be one of ${MEASUREMENT_KEYS.map((s) => JSON.stringify(s)).join(', ')}, got: ${JSON.stringify(value)}`,
        );
    }
    return value;
}
