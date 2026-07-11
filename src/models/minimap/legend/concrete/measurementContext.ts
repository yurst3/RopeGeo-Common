import { LengthMeasurement } from '../../../measurements/lengthMeasurement';
import { Measurement } from '../../../measurements/measurement';
import { TimeMeasurement } from '../../../measurements/timeMeasurement';

export class MeasurementContext {
    readonly label: string;
    readonly measurement: Measurement;
    readonly confidence: number;

    constructor(label: string, measurement: Measurement, confidence: number) {
        MeasurementContext.assertNonEmptyString(label, 'MeasurementContext.label');
        MeasurementContext.assertConfidence(confidence);
        this.label = label;
        this.measurement = measurement;
        this.confidence = confidence;
    }

    toPlain(): Record<string, unknown> {
        return {
            label: this.label,
            measurement: this.measurement.toJSON(),
            confidence: this.confidence,
        };
    }

    static fromResult(result: unknown): MeasurementContext {
        if (result == null || typeof result !== 'object' || Array.isArray(result)) {
            throw new Error('MeasurementContext result must be an object');
        }
        const r = result as Record<string, unknown>;
        const label = MeasurementContext.assertNonEmptyString(r.label, 'MeasurementContext.label');
        MeasurementContext.assertConfidence(r.confidence);
        const measurement = MeasurementContext.parseMeasurement(r.measurement);
        return new MeasurementContext(label, measurement, r.confidence as number);
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

    private static assertConfidence(value: unknown): void {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
            throw new Error(
                `MeasurementContext.confidence must be a number from 0 to 1, got: ${JSON.stringify(value)}`,
            );
        }
    }
}
