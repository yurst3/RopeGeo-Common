import { BetaSectionExcerpt } from '../../../betaSections/betaSectionExcerpt';
import { ImageContext } from './imageContext';
import { MeasurementContext } from './measurementContext';

export class RelevantContext {
    readonly measurements: MeasurementContext[];
    readonly betaSectionExcerpts: Record<string, BetaSectionExcerpt[]>;
    /** Flat list of relevant images; owning section is resolved via `toImageLookup()`. */
    readonly images: ImageContext[];

    constructor(
        measurements: MeasurementContext[],
        betaSectionExcerpts: Record<string, BetaSectionExcerpt[]>,
        images: ImageContext[],
    ) {
        this.measurements = measurements;
        this.betaSectionExcerpts = betaSectionExcerpts;
        this.images = images;
    }

    toPlain(): Record<string, unknown> {
        const betaSectionExcerpts: Record<string, unknown> = {};
        for (const [key, excerpts] of Object.entries(this.betaSectionExcerpts)) {
            betaSectionExcerpts[key] = excerpts.map((excerpt) => excerpt.toPlain());
        }

        return {
            measurements: this.measurements.map((measurement) => measurement.toPlain()),
            betaSectionExcerpts,
            images: this.images.map((image) => image.toPlain()),
        };
    }

    static fromResult(result: unknown): RelevantContext {
        if (result == null || typeof result !== 'object' || Array.isArray(result)) {
            throw new Error('RelevantContext result must be an object');
        }
        const r = result as Record<string, unknown>;

        const measurements = RelevantContext.parseMeasurementsArray(r.measurements);
        const betaSectionExcerpts = RelevantContext.parseBetaSectionExcerptsRecord(
            r.betaSectionExcerpts,
        );
        const images = RelevantContext.parseImagesArray(r.images);

        return new RelevantContext(measurements, betaSectionExcerpts, images);
    }

    private static parseMeasurementsArray(value: unknown): MeasurementContext[] {
        if (value === undefined || value === null) {
            return [];
        }
        if (!Array.isArray(value)) {
            throw new Error(
                `RelevantContext.measurements must be an array, got: ${typeof value}`,
            );
        }
        return value.map((entry) => MeasurementContext.fromResult(entry));
    }

    private static parseBetaSectionExcerptsRecord(
        value: unknown,
    ): Record<string, BetaSectionExcerpt[]> {
        if (value === undefined || value === null) {
            return {};
        }
        if (typeof value !== 'object' || Array.isArray(value)) {
            throw new Error(
                `RelevantContext.betaSectionExcerpts must be an object, got: ${typeof value}`,
            );
        }
        const raw = value as Record<string, unknown>;
        const out: Record<string, BetaSectionExcerpt[]> = {};
        for (const [key, excerpts] of Object.entries(raw)) {
            if (!Array.isArray(excerpts)) {
                throw new Error(
                    `RelevantContext.betaSectionExcerpts["${key}"] must be an array, got: ${typeof excerpts}`,
                );
            }
            out[key] = excerpts.map((entry) => BetaSectionExcerpt.fromResult(entry));
        }
        return out;
    }

    private static parseImagesArray(value: unknown): ImageContext[] {
        if (value === undefined || value === null) {
            return [];
        }
        if (!Array.isArray(value)) {
            throw new Error(`RelevantContext.images must be an array, got: ${typeof value}`);
        }
        return value.map((entry) => ImageContext.fromResult(entry));
    }
}
