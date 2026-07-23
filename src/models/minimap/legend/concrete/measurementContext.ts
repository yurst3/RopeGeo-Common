import { LengthMeasurement } from '../../../measurements/lengthMeasurement';
import { Measurement } from '../../../measurements/measurement';
import { TimeMeasurement } from '../../../measurements/timeMeasurement';
import {
    assertRelevanceStrength,
    type RelevanceStrength,
} from '../../../relevanceStrength';

export class MeasurementContext {
    readonly label: string;
    readonly measurement: Measurement;
    readonly relevanceStrength: RelevanceStrength;

    constructor(label: string, measurement: Measurement, relevanceStrength: RelevanceStrength) {
        MeasurementContext.assertNonEmptyString(label, 'MeasurementContext.label');
        assertRelevanceStrength(relevanceStrength, 'MeasurementContext.relevanceStrength');
        this.label = label;
        this.measurement = measurement;
        this.relevanceStrength = relevanceStrength;
    }

    toPlain(): Record<string, unknown> {
        return {
            label: this.label,
            measurement: this.measurement.toJSON(),
            relevanceStrength: this.relevanceStrength,
        };
    }

    static fromResult(result: unknown): MeasurementContext {
        if (result == null || typeof result !== 'object' || Array.isArray(result)) {
            throw new Error('MeasurementContext result must be an object');
        }
        const r = result as Record<string, unknown>;
        const label = MeasurementContext.assertNonEmptyString(r.label, 'MeasurementContext.label');
        const relevanceStrength = assertRelevanceStrength(
            r.relevanceStrength,
            'MeasurementContext.relevanceStrength',
        );
        const measurement = MeasurementContext.parseMeasurement(r.measurement);
        return new MeasurementContext(label, measurement, relevanceStrength);
    }

    private static parseMeasurement(value: unknown): Measurement {
        if (value == null || typeof value !== 'object') {
            throw new Error('MeasurementContext.measurement must be an object');
        }
        const r = value as Record<string, unknown>;
        if (r.measurementType === 'length') {
            return LengthMeasurement.fromResult(value);
        }
        if (r.measurementType === 'time') {
            return TimeMeasurement.fromResult(value);
        }
        throw new Error(
            `MeasurementContext.measurement.measurementType must be "length" or "time", got: ${JSON.stringify(r.measurementType)}`,
        );
    }

    private static assertNonEmptyString(value: unknown, context: string): string {
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`${context} must be a non-empty string`);
        }
        return value;
    }
}
