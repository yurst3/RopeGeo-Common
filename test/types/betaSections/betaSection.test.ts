import { describe, it, expect } from '@jest/globals';
import { BetaSection } from '../../../src/types/betaSections/betaSection';
import { BetaSectionImage } from '../../../src/types/betaSections/betaSectionImage';

function validImageBody(): Record<string, unknown> {
    return {
        order: 0,
        url: 'https://example.com/img.jpg',
        linkUrl: 'https://example.com/page',
        caption: 'Caption',
        latestRevisionDate: '2024-01-15T12:00:00Z',
    };
}

function getValidBody(): Record<string, unknown> {
    return {
        order: 0,
        title: 'Approach',
        text: 'Beta text here.',
        images: [validImageBody()],
        latestRevisionDate: '2024-01-15T12:00:00Z',
    };
}

describe('BetaSection', () => {
    describe('constructor', () => {
        it('sets all properties', () => {
            const img = new BetaSectionImage(
                0,
                'https://a.com/i.jpg',
                'https://a.com',
                'Cap',
                new Date('2024-01-01Z'),
            );
            const section = new BetaSection(
                1,
                'Descent',
                'Descent beta.',
                new Date('2024-01-15T12:00:00Z'),
                [img],
            );
            expect(section.order).toBe(1);
            expect(section.title).toBe('Descent');
            expect(section.text).toBe('Descent beta.');
            expect(section.images).toHaveLength(1);
            expect(section.images[0]).toBe(img);
            expect(section.latestRevisionDate).toEqual(new Date('2024-01-15T12:00:00Z'));
        });

        it('defaults images to empty array when omitted', () => {
            const section = new BetaSection(
                0,
                'Title',
                'Text',
                new Date('2024-01-01Z'),
            );
            expect(section.images).toEqual([]);
        });

        it('normalizes latestRevisionDate to Date', () => {
            const d = new Date('2024-06-01T00:00:00Z');
            const section = new BetaSection(0, '', '', d);
            expect(section.latestRevisionDate).toBeInstanceOf(Date);
            expect(section.latestRevisionDate.getTime()).toBe(d.getTime());
        });
    });

    describe('fromResponseBody', () => {
        it('returns instance with validated and parsed fields', () => {
            const section = BetaSection.fromResponseBody(getValidBody());
            expect(section).toBeInstanceOf(BetaSection);
            expect(section.order).toBe(0);
            expect(section.title).toBe('Approach');
            expect(section.text).toBe('Beta text here.');
            expect(section.images).toHaveLength(1);
            expect(section.images[0]).toBeInstanceOf(BetaSectionImage);
            expect(section.images[0].url).toBe('https://example.com/img.jpg');
            expect(section.latestRevisionDate).toEqual(new Date('2024-01-15T12:00:00Z'));
        });

        it('accepts empty images array', () => {
            const body = { ...getValidBody(), images: [] };
            const section = BetaSection.fromResponseBody(body);
            expect(section.images).toEqual([]);
        });

        it('throws when body is null', () => {
            expect(() => BetaSection.fromResponseBody(null)).toThrow(
                'BetaSection body must be an object',
            );
        });

        it('throws when body is not an object', () => {
            expect(() => BetaSection.fromResponseBody('string')).toThrow(
                'BetaSection body must be an object',
            );
            expect(() => BetaSection.fromResponseBody(42)).toThrow(
                'BetaSection body must be an object',
            );
        });

        it('throws when order is not a number', () => {
            expect(() =>
                BetaSection.fromResponseBody({ ...getValidBody(), order: '0' }),
            ).toThrow('BetaSection.order must be a number');
        });

        it('throws when title is not a string', () => {
            expect(() =>
                BetaSection.fromResponseBody({ ...getValidBody(), title: 1 }),
            ).toThrow('BetaSection.title must be a string');
        });

        it('throws when text is not a string', () => {
            expect(() =>
                BetaSection.fromResponseBody({ ...getValidBody(), text: null }),
            ).toThrow('BetaSection.text must be a string');
        });

        it('throws when images is not an array', () => {
            expect(() =>
                BetaSection.fromResponseBody({ ...getValidBody(), images: 'not-array' }),
            ).toThrow('BetaSection.images must be an array');
        });

        it('throws when images item is invalid', () => {
            expect(() =>
                BetaSection.fromResponseBody({
                    ...getValidBody(),
                    images: [{ ...validImageBody(), order: 'not-a-number' }],
                }),
            ).toThrow('BetaSectionImage.order must be a number');
        });

        it('throws when latestRevisionDate is not valid ISO 8601', () => {
            expect(() =>
                BetaSection.fromResponseBody({
                    ...getValidBody(),
                    latestRevisionDate: 'not-a-date',
                }),
            ).toThrow(
                'BetaSection.latestRevisionDate must be a valid ISO 8601 date string',
            );
            expect(() =>
                BetaSection.fromResponseBody({
                    ...getValidBody(),
                    latestRevisionDate: 123,
                }),
            ).toThrow(
                'BetaSection.latestRevisionDate must be an ISO 8601 date string',
            );
        });
    });
});
