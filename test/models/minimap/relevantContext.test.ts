import { FEET, LengthMeasurement } from '../../../src/models/measurements/lengthMeasurement';
import { MINUTES, TimeMeasurement } from '../../../src/models/measurements/timeMeasurement';
import { BetaSectionExcerpt } from '../../../src/models/betaSections/betaSectionExcerpt';
import { ImageContext } from '../../../src/models/minimap/legend/concrete/imageContext';
import { MeasurementContext } from '../../../src/models/minimap/legend/concrete/measurementContext';
import { RelevantContext } from '../../../src/models/minimap/legend/concrete/relevantContext';

const validLengthMeasurement = {
    measurementType: 'length',
    value: 490,
    unit: { measurementSystem: 'Imperial', name: 'feet' },
};

const validTimeMeasurement = {
    measurementType: 'time',
    value: 20,
    unit: { measurementSystem: 'Standard', name: 'minutes' },
};

describe('BetaSectionExcerpt', () => {
    describe('fromResult', () => {
        it('round-trips via toPlain', () => {
            const excerpt = BetaSectionExcerpt.fromResult({
                text: 'R3 anchor',
                start: 10,
                end: 19,
                confidence: 0.95,
            });
            expect(BetaSectionExcerpt.fromResult(excerpt.toPlain())).toEqual(excerpt);
        });

        it('allows confidence-only excerpts', () => {
            const excerpt = BetaSectionExcerpt.fromResult({ confidence: 0.5 });
            expect(excerpt.text).toBeUndefined();
            expect(excerpt.start).toBeUndefined();
            expect(excerpt.end).toBeUndefined();
        });

        it('accepts boundary confidence values 0 and 1', () => {
            expect(BetaSectionExcerpt.fromResult({ confidence: 0 }).confidence).toBe(0);
            expect(BetaSectionExcerpt.fromResult({ confidence: 1 }).confidence).toBe(1);
        });

        it('throws when result is not an object', () => {
            expect(() => BetaSectionExcerpt.fromResult(null)).toThrow(
                'BetaSectionExcerpt result must be an object',
            );
            expect(() => BetaSectionExcerpt.fromResult('x')).toThrow(
                'BetaSectionExcerpt result must be an object',
            );
            expect(() => BetaSectionExcerpt.fromResult([])).toThrow(
                'BetaSectionExcerpt result must be an object',
            );
        });

        it('throws when confidence is missing or invalid', () => {
            expect(() => BetaSectionExcerpt.fromResult({})).toThrow(
                /BetaSectionExcerpt\.confidence must be a number from 0 to 1/,
            );
            expect(() => BetaSectionExcerpt.fromResult({ confidence: -0.1 })).toThrow(
                /BetaSectionExcerpt\.confidence/,
            );
            expect(() => BetaSectionExcerpt.fromResult({ confidence: 1.1 })).toThrow(
                /BetaSectionExcerpt\.confidence/,
            );
            expect(() => BetaSectionExcerpt.fromResult({ confidence: Number.NaN })).toThrow(
                /BetaSectionExcerpt\.confidence/,
            );
            expect(() => BetaSectionExcerpt.fromResult({ confidence: '0.5' })).toThrow(
                /BetaSectionExcerpt\.confidence/,
            );
        });

        it('throws when text is not a string', () => {
            expect(() =>
                BetaSectionExcerpt.fromResult({ text: 1, confidence: 0.5 }),
            ).toThrow('BetaSectionExcerpt.text must be a string');
        });

        it('throws when start or end are invalid', () => {
            expect(() =>
                BetaSectionExcerpt.fromResult({ start: -1, confidence: 0.5 }),
            ).toThrow('BetaSectionExcerpt.start must be a non-negative integer');
            expect(() =>
                BetaSectionExcerpt.fromResult({ start: 1.5, confidence: 0.5 }),
            ).toThrow('BetaSectionExcerpt.start must be a non-negative integer');
            expect(() =>
                BetaSectionExcerpt.fromResult({ end: '5', confidence: 0.5 }),
            ).toThrow('BetaSectionExcerpt.end must be a non-negative integer');
        });
    });
});

describe('ImageContext', () => {
    describe('fromResult', () => {
        it('round-trips via toPlain', () => {
            const image = ImageContext.fromResult({ id: 'img-1', confidence: 0.85 });
            expect(ImageContext.fromResult(image.toPlain())).toEqual(image);
        });

        it('throws when result is not an object', () => {
            expect(() => ImageContext.fromResult(undefined)).toThrow(
                'ImageContext result must be an object',
            );
            expect(() => ImageContext.fromResult([])).toThrow(
                'ImageContext result must be an object',
            );
        });

        it('throws when id is missing, empty, or whitespace', () => {
            expect(() => ImageContext.fromResult({ confidence: 0.5 })).toThrow(
                'ImageContext.id must be a non-empty string',
            );
            expect(() => ImageContext.fromResult({ id: '', confidence: 0.5 })).toThrow(
                'ImageContext.id must be a non-empty string',
            );
            expect(() => ImageContext.fromResult({ id: '   ', confidence: 0.5 })).toThrow(
                'ImageContext.id must be a non-empty string',
            );
        });

        it('throws when confidence is invalid', () => {
            expect(() => ImageContext.fromResult({ id: 'img-1' })).toThrow(
                /ImageContext\.confidence must be a number from 0 to 1/,
            );
            expect(() => ImageContext.fromResult({ id: 'img-1', confidence: 2 })).toThrow(
                /ImageContext\.confidence/,
            );
        });
    });
});

describe('MeasurementContext', () => {
    describe('fromResult', () => {
        it('parses length measurements', () => {
            const ctx = MeasurementContext.fromResult({
                label: 'exitElevGain',
                measurement: validLengthMeasurement,
                confidence: 0.95,
            });
            expect(ctx.label).toBe('exitElevGain');
            expect(ctx.measurement).toBeInstanceOf(LengthMeasurement);
            expect((ctx.measurement as LengthMeasurement).value).toBe(490);
            expect(ctx.measurement.unit).toEqual(FEET);
        });

        it('parses time measurements', () => {
            const ctx = MeasurementContext.fromResult({
                label: 'shuttleTime',
                measurement: validTimeMeasurement,
                confidence: 0.7,
            });
            expect(ctx.measurement).toBeInstanceOf(TimeMeasurement);
            expect(ctx.measurement.unit).toEqual(MINUTES);
        });

        it('round-trips via toPlain', () => {
            const ctx = MeasurementContext.fromResult({
                label: 'exitElevGain',
                measurement: validLengthMeasurement,
                confidence: 0.95,
            });
            const roundTripped = MeasurementContext.fromResult(ctx.toPlain());
            expect(roundTripped.label).toBe(ctx.label);
            expect(roundTripped.confidence).toBe(ctx.confidence);
            expect(roundTripped.measurement.value).toBe(ctx.measurement.value);
        });

        it('throws when result is not an object', () => {
            expect(() => MeasurementContext.fromResult(null)).toThrow(
                'MeasurementContext result must be an object',
            );
            expect(() => MeasurementContext.fromResult([])).toThrow(
                'MeasurementContext result must be an object',
            );
        });

        it('throws when label is missing or empty', () => {
            expect(() =>
                MeasurementContext.fromResult({
                    measurement: validLengthMeasurement,
                    confidence: 0.5,
                }),
            ).toThrow('MeasurementContext.label must be a non-empty string');
            expect(() =>
                MeasurementContext.fromResult({
                    label: '  ',
                    measurement: validLengthMeasurement,
                    confidence: 0.5,
                }),
            ).toThrow('MeasurementContext.label must be a non-empty string');
        });

        it('throws when confidence is invalid', () => {
            expect(() =>
                MeasurementContext.fromResult({
                    label: 'exitElevGain',
                    measurement: validLengthMeasurement,
                }),
            ).toThrow(/MeasurementContext\.confidence must be a number from 0 to 1/);
        });

        it('throws when measurement is missing or not an object', () => {
            expect(() =>
                MeasurementContext.fromResult({
                    label: 'exitElevGain',
                    confidence: 0.5,
                }),
            ).toThrow('MeasurementContext.measurement must be an object');
            expect(() =>
                MeasurementContext.fromResult({
                    label: 'exitElevGain',
                    measurement: 'bad',
                    confidence: 0.5,
                }),
            ).toThrow('MeasurementContext.measurement must be an object');
        });

        it('throws when measurementType is unknown', () => {
            expect(() =>
                MeasurementContext.fromResult({
                    label: 'exitElevGain',
                    measurement: { measurementType: 'mass', value: 1, unit: {} },
                    confidence: 0.5,
                }),
            ).toThrow(
                'MeasurementContext.measurement.measurementType must be "length" or "time"',
            );
        });

        it('delegates length measurement validation to LengthMeasurement', () => {
            expect(() =>
                MeasurementContext.fromResult({
                    label: 'exitElevGain',
                    measurement: {
                        measurementType: 'length',
                        value: 'bad',
                        unit: { measurementSystem: 'Imperial', name: 'feet' },
                    },
                    confidence: 0.5,
                }),
            ).toThrow(/LengthMeasurement\.value/);
        });

        it('delegates time measurement validation to TimeMeasurement', () => {
            expect(() =>
                MeasurementContext.fromResult({
                    label: 'shuttleTime',
                    measurement: {
                        measurementType: 'time',
                        value: 20,
                        unit: { measurementSystem: 'Standard', name: 'fortnights' },
                    },
                    confidence: 0.5,
                }),
            ).toThrow(/TimeMeasurement/);
        });
    });
});

describe('RelevantContext', () => {
    describe('fromResult', () => {
        it('round-trips via toPlain', () => {
            const context = RelevantContext.fromResult({
                measurements: [
                    {
                        label: 'exitElevGain',
                        measurement: validLengthMeasurement,
                        confidence: 0.95,
                    },
                ],
                betaSectionExcerpts: {
                    'beta-exit': [{ text: 'Exit hike', confidence: 0.9 }],
                },
                images: {
                    '': [{ id: 'img-1', confidence: 0.85 }],
                    'beta-descent': [{ id: 'img-2', confidence: 0.99 }],
                },
            });
            const roundTripped = RelevantContext.fromResult(context.toPlain());
            expect(roundTripped.measurements).toHaveLength(1);
            expect(roundTripped.measurements[0]!.label).toBe('exitElevGain');
            expect(roundTripped.betaSectionExcerpts['beta-exit']).toHaveLength(1);
            expect(roundTripped.images['']).toHaveLength(1);
            expect(roundTripped.images['beta-descent']![0]).toBeInstanceOf(ImageContext);
        });

        it('defaults missing collections to empty', () => {
            const context = RelevantContext.fromResult({});
            expect(context.measurements).toEqual([]);
            expect(context.betaSectionExcerpts).toEqual({});
            expect(context.images).toEqual({});
        });

        it('throws when result is not an object', () => {
            expect(() => RelevantContext.fromResult(null)).toThrow(
                'RelevantContext result must be an object',
            );
            expect(() => RelevantContext.fromResult(1)).toThrow(
                'RelevantContext result must be an object',
            );
            expect(() => RelevantContext.fromResult([])).toThrow(
                'RelevantContext result must be an object',
            );
        });

        it('throws when measurements is not an array', () => {
            expect(() =>
                RelevantContext.fromResult({ measurements: {} }),
            ).toThrow('RelevantContext.measurements must be an array');
        });

        it('throws when betaSectionExcerpts is not an object', () => {
            expect(() =>
                RelevantContext.fromResult({ betaSectionExcerpts: [] }),
            ).toThrow('RelevantContext.betaSectionExcerpts must be an object');
            expect(() =>
                RelevantContext.fromResult({ betaSectionExcerpts: 'bad' }),
            ).toThrow('RelevantContext.betaSectionExcerpts must be an object');
        });

        it('throws when a betaSectionExcerpts entry is not an array', () => {
            expect(() =>
                RelevantContext.fromResult({
                    betaSectionExcerpts: { 'beta-exit': 'bad' },
                }),
            ).toThrow('RelevantContext.betaSectionExcerpts["beta-exit"] must be an array');
        });

        it('throws when images is not an object', () => {
            expect(() => RelevantContext.fromResult({ images: [] })).toThrow(
                'RelevantContext.images must be an object',
            );
        });

        it('throws when an images entry is not an array', () => {
            expect(() =>
                RelevantContext.fromResult({
                    images: { '': { id: 'img-1', confidence: 0.5 } },
                }),
            ).toThrow('RelevantContext.images[""] must be an array');
        });

        it('propagates nested measurement validation errors', () => {
            expect(() =>
                RelevantContext.fromResult({
                    measurements: [{ label: '', measurement: validLengthMeasurement, confidence: 0.5 }],
                }),
            ).toThrow('MeasurementContext.label must be a non-empty string');
        });

        it('propagates nested excerpt validation errors', () => {
            expect(() =>
                RelevantContext.fromResult({
                    betaSectionExcerpts: {
                        'beta-exit': [{ confidence: 2 }],
                    },
                }),
            ).toThrow(/BetaSectionExcerpt\.confidence/);
        });

        it('propagates nested image validation errors', () => {
            expect(() =>
                RelevantContext.fromResult({
                    images: {
                        '': [{ id: '', confidence: 0.5 }],
                    },
                }),
            ).toThrow('ImageContext.id must be a non-empty string');
        });
    });
});
