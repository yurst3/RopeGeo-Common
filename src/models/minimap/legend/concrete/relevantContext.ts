import { BetaSectionExcerpt } from '../../../betaSections/betaSectionExcerpt';
import { ImageContext } from './imageContext';
import { MeasurementContext } from './measurementContext';

export class RelevantContext {
    readonly measurements: MeasurementContext[];
    readonly betaSectionExcerpts: Record<string, BetaSectionExcerpt[]>;
    readonly images: Record<string, ImageContext[]>;

    constructor(
        measurements: MeasurementContext[],
        betaSectionExcerpts: Record<string, BetaSectionExcerpt[]>,
        images: Record<string, ImageContext[]>,
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

        const images: Record<string, unknown> = {};
        for (const [key, imageContexts] of Object.entries(this.images)) {
            images[key] = imageContexts.map((image) => image.toPlain());
        }

        return {
            measurements: this.measurements.map((measurement) => measurement.toPlain()),
            betaSectionExcerpts,
            images,
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
        const images = RelevantContext.parseImagesRecord(r.images);

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

    private static parseImagesRecord(value: unknown): Record<string, ImageContext[]> {
        if (value === undefined || value === null) {
            return {};
        }
        if (typeof value !== 'object' || Array.isArray(value)) {
            throw new Error(`RelevantContext.images must be an object, got: ${typeof value}`);
        }
        const raw = value as Record<string, unknown>;
        const out: Record<string, ImageContext[]> = {};
        for (const [key, imageContexts] of Object.entries(raw)) {
            if (!Array.isArray(imageContexts)) {
                throw new Error(
                    `RelevantContext.images["${key}"] must be an array, got: ${typeof imageContexts}`,
                );
            }
            out[key] = imageContexts.map((entry) => ImageContext.fromResult(entry));
        }
        return out;
    }
}
