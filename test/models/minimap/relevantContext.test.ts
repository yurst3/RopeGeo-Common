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
                relevanceStrength: 'Definitely Relevant',
                relevantPhrase: 'R3',
            });
            expect(BetaSectionExcerpt.fromResult(excerpt.toPlain())).toEqual(excerpt);
        });

        it('allows title-only excerpts (no text/offsets)', () => {
            const excerpt = BetaSectionExcerpt.fromResult({
                relevanceStrength: 'Maybe Relevant',
                relevantPhrase: 'Descent',
            });
            expect(excerpt.text).toBeUndefined();
            expect(excerpt.start).toBeUndefined();
            expect(excerpt.end).toBeUndefined();
            expect(excerpt.relevantPhrase).toBe('Descent');
        });

        it('accepts all relevanceStrength enum values', () => {
            expect(
                BetaSectionExcerpt.fromResult({
                    relevanceStrength: 'Maybe Relevant',
                    relevantPhrase: 'x',
                }).relevanceStrength,
            ).toBe('Maybe Relevant');
            expect(
                BetaSectionExcerpt.fromResult({
                    relevanceStrength: 'Somewhat Relevant',
                    relevantPhrase: 'x',
                }).relevanceStrength,
            ).toBe('Somewhat Relevant');
            expect(
                BetaSectionExcerpt.fromResult({
                    relevanceStrength: 'Definitely Relevant',
                    relevantPhrase: 'x',
                }).relevanceStrength,
            ).toBe('Definitely Relevant');
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

        it('throws when relevanceStrength is missing or invalid', () => {
            expect(() =>
                BetaSectionExcerpt.fromResult({ relevantPhrase: 'x' }),
            ).toThrow(/BetaSectionExcerpt\.relevanceStrength/);
            expect(() =>
                BetaSectionExcerpt.fromResult({
                    relevanceStrength: 'Nope',
                    relevantPhrase: 'x',
                }),
            ).toThrow(/BetaSectionExcerpt\.relevanceStrength/);
        });

        it('allows relevantPhrase to be omitted', () => {
            const excerpt = BetaSectionExcerpt.fromResult({
                relevanceStrength: 'Maybe Relevant',
            });
            expect(excerpt.relevantPhrase).toBeUndefined();
            expect(excerpt.toPlain()).toEqual({
                relevanceStrength: 'Maybe Relevant',
            });
            expect(excerpt.toHtml()).toBe('');
        });

        it('throws when relevantPhrase is empty', () => {
            expect(() =>
                BetaSectionExcerpt.fromResult({
                    relevanceStrength: 'Maybe Relevant',
                    relevantPhrase: '  ',
                }),
            ).toThrow(/BetaSectionExcerpt\.relevantPhrase/);
        });

        it('throws when text is not a string', () => {
            expect(() =>
                BetaSectionExcerpt.fromResult({
                    text: 1,
                    relevanceStrength: 'Maybe Relevant',
                    relevantPhrase: 'x',
                }),
            ).toThrow('BetaSectionExcerpt.text must be a string');
        });

        it('throws when start or end are invalid', () => {
            expect(() =>
                BetaSectionExcerpt.fromResult({
                    start: -1,
                    relevanceStrength: 'Maybe Relevant',
                    relevantPhrase: 'x',
                }),
            ).toThrow('BetaSectionExcerpt.start must be a non-negative integer');
            expect(() =>
                BetaSectionExcerpt.fromResult({
                    start: 1.5,
                    relevanceStrength: 'Maybe Relevant',
                    relevantPhrase: 'x',
                }),
            ).toThrow('BetaSectionExcerpt.start must be a non-negative integer');
            expect(() =>
                BetaSectionExcerpt.fromResult({
                    end: '5',
                    relevanceStrength: 'Maybe Relevant',
                    relevantPhrase: 'x',
                }),
            ).toThrow('BetaSectionExcerpt.end must be a non-negative integer');
        });
    });
});

describe('ImageContext', () => {
    describe('fromResult', () => {
        it('round-trips via toPlain', () => {
            const image = ImageContext.fromResult({
                id: 'img-1',
                relevanceStrength: 'Somewhat Relevant',
                relevantPhrase: 'La Capella',
            });
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
            expect(() =>
                ImageContext.fromResult({
                    relevanceStrength: 'Maybe Relevant',
                    relevantPhrase: 'x',
                }),
            ).toThrow('ImageContext.id must be a non-empty string');
            expect(() =>
                ImageContext.fromResult({
                    id: '',
                    relevanceStrength: 'Maybe Relevant',
                    relevantPhrase: 'x',
                }),
            ).toThrow('ImageContext.id must be a non-empty string');
        });

        it('throws when relevanceStrength is invalid or relevantPhrase is empty', () => {
            expect(() =>
                ImageContext.fromResult({ id: 'img-1', relevantPhrase: 'x' }),
            ).toThrow(/ImageContext\.relevanceStrength/);
            expect(() =>
                ImageContext.fromResult({
                    id: 'img-1',
                    relevanceStrength: 'Definitely Relevant',
                    relevantPhrase: '  ',
                }),
            ).toThrow(/ImageContext\.relevantPhrase/);
        });

        it('allows relevantPhrase to be omitted', () => {
            const image = ImageContext.fromResult({
                id: 'img-1',
                relevanceStrength: 'Definitely Relevant',
            });
            expect(image.relevantPhrase).toBeUndefined();
            expect(image.toPlain()).toEqual({
                id: 'img-1',
                relevanceStrength: 'Definitely Relevant',
            });
        });
    });
});

describe('MeasurementContext', () => {
    describe('fromResult', () => {
        it('parses length measurements', () => {
            const ctx = MeasurementContext.fromResult({
                label: 'exitElevGain',
                measurement: validLengthMeasurement,
                relevanceStrength: 'Definitely Relevant',
            });
            expect(ctx.label).toBe('exitElevGain');
            expect(ctx.measurement).toBeInstanceOf(LengthMeasurement);
            expect((ctx.measurement as LengthMeasurement).value).toBe(490);
            expect(ctx.measurement.unit).toEqual(FEET);
            expect(ctx.relevanceStrength).toBe('Definitely Relevant');
        });

        it('parses time measurements', () => {
            const ctx = MeasurementContext.fromResult({
                label: 'shuttleTime',
                measurement: validTimeMeasurement,
                relevanceStrength: 'Somewhat Relevant',
            });
            expect(ctx.measurement).toBeInstanceOf(TimeMeasurement);
            expect(ctx.measurement.unit).toEqual(MINUTES);
        });

        it('round-trips via toPlain', () => {
            const ctx = MeasurementContext.fromResult({
                label: 'exitElevGain',
                measurement: validLengthMeasurement,
                relevanceStrength: 'Definitely Relevant',
            });
            const roundTripped = MeasurementContext.fromResult(ctx.toPlain());
            expect(roundTripped.label).toBe(ctx.label);
            expect(roundTripped.relevanceStrength).toBe(ctx.relevanceStrength);
            expect(roundTripped.measurement.value).toBe(ctx.measurement.value);
        });

        it('throws when result is not an object', () => {
            expect(() => MeasurementContext.fromResult(null)).toThrow(
                'MeasurementContext result must be an object',
            );
        });

        it('throws when label is missing or empty', () => {
            expect(() =>
                MeasurementContext.fromResult({
                    measurement: validLengthMeasurement,
                    relevanceStrength: 'Maybe Relevant',
                }),
            ).toThrow('MeasurementContext.label must be a non-empty string');
        });

        it('throws when relevanceStrength is invalid', () => {
            expect(() =>
                MeasurementContext.fromResult({
                    label: 'exitElevGain',
                    measurement: validLengthMeasurement,
                }),
            ).toThrow(/MeasurementContext\.relevanceStrength/);
        });

        it('throws when measurement is missing or not an object', () => {
            expect(() =>
                MeasurementContext.fromResult({
                    label: 'exitElevGain',
                    relevanceStrength: 'Maybe Relevant',
                }),
            ).toThrow('MeasurementContext.measurement must be an object');
        });

        it('throws when measurementType is unknown', () => {
            expect(() =>
                MeasurementContext.fromResult({
                    label: 'exitElevGain',
                    measurement: { measurementType: 'mass', value: 1, unit: {} },
                    relevanceStrength: 'Maybe Relevant',
                }),
            ).toThrow(
                'MeasurementContext.measurement.measurementType must be "length" or "time"',
            );
        });
    });
});

describe('RelevantContext', () => {
    describe('fromResult', () => {
        it('round-trips via toPlain with flat images', () => {
            const context = RelevantContext.fromResult({
                measurements: [
                    {
                        label: 'exitElevGain',
                        measurement: validLengthMeasurement,
                        relevanceStrength: 'Definitely Relevant',
                    },
                ],
                betaSectionExcerpts: {
                    'beta-exit': [
                        {
                            text: 'Exit hike',
                            relevanceStrength: 'Somewhat Relevant',
                            relevantPhrase: 'Exit',
                        },
                    ],
                },
                images: [
                    {
                        id: 'img-1',
                        relevanceStrength: 'Somewhat Relevant',
                        relevantPhrase: 'banner',
                    },
                    {
                        id: 'img-2',
                        relevanceStrength: 'Definitely Relevant',
                        relevantPhrase: 'rappel',
                    },
                ],
            });
            const roundTripped = RelevantContext.fromResult(context.toPlain());
            expect(roundTripped.measurements).toHaveLength(1);
            expect(roundTripped.measurements[0]!.label).toBe('exitElevGain');
            expect(roundTripped.betaSectionExcerpts['beta-exit']).toHaveLength(1);
            expect(roundTripped.images).toHaveLength(2);
            expect(roundTripped.images[1]).toBeInstanceOf(ImageContext);
        });

        it('defaults missing collections to empty', () => {
            const context = RelevantContext.fromResult({});
            expect(context.measurements).toEqual([]);
            expect(context.betaSectionExcerpts).toEqual({});
            expect(context.images).toEqual([]);
        });

        it('throws when images is not an array', () => {
            expect(() =>
                RelevantContext.fromResult({
                    images: { '': [{ id: 'img-1' }] },
                }),
            ).toThrow('RelevantContext.images must be an array');
        });

        it('propagates nested excerpt validation errors', () => {
            expect(() =>
                RelevantContext.fromResult({
                    betaSectionExcerpts: {
                        'beta-exit': [{ relevanceStrength: 'Nope', relevantPhrase: 'x' }],
                    },
                }),
            ).toThrow(/BetaSectionExcerpt\.relevanceStrength/);
        });

        it('propagates nested image validation errors', () => {
            expect(() =>
                RelevantContext.fromResult({
                    images: [
                        {
                            id: '',
                            relevanceStrength: 'Maybe Relevant',
                            relevantPhrase: 'x',
                        },
                    ],
                }),
            ).toThrow('ImageContext.id must be a non-empty string');
        });
    });
});
