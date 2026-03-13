import { describe, it, expect } from '@jest/globals';
import { BetaSectionImage } from '../../../src/types/betaSections/betaSectionImage';

function getValidBody(): Record<string, unknown> {
    return {
        order: 0,
        url: 'https://example.com/img.jpg',
        linkUrl: 'https://example.com/page',
        caption: 'A caption',
        latestRevisionDate: '2024-01-15T12:00:00Z',
    };
}

describe('BetaSectionImage', () => {
    describe('constructor', () => {
        it('sets all properties', () => {
            const img = new BetaSectionImage(
                1,
                'https://example.com/a.jpg',
                'https://example.com/link',
                'Caption text',
                new Date('2024-01-15T12:00:00Z'),
            );
            expect(img.order).toBe(1);
            expect(img.url).toBe('https://example.com/a.jpg');
            expect(img.linkUrl).toBe('https://example.com/link');
            expect(img.caption).toBe('Caption text');
            expect(img.latestRevisionDate).toEqual(new Date('2024-01-15T12:00:00Z'));
        });

        it('normalizes latestRevisionDate to Date', () => {
            const d = new Date('2024-06-01T00:00:00Z');
            const img = new BetaSectionImage(0, '', '', '', d);
            expect(img.latestRevisionDate).toBeInstanceOf(Date);
            expect(img.latestRevisionDate.getTime()).toBe(d.getTime());
        });
    });

    describe('fromResponseBody', () => {
        it('returns instance with validated and parsed fields', () => {
            const img = BetaSectionImage.fromResponseBody(getValidBody());
            expect(img).toBeInstanceOf(BetaSectionImage);
            expect(img.order).toBe(0);
            expect(img.url).toBe('https://example.com/img.jpg');
            expect(img.linkUrl).toBe('https://example.com/page');
            expect(img.caption).toBe('A caption');
            expect(img.latestRevisionDate).toEqual(new Date('2024-01-15T12:00:00Z'));
        });

        it('throws when body is null', () => {
            expect(() => BetaSectionImage.fromResponseBody(null)).toThrow(
                'BetaSectionImage body must be an object',
            );
        });

        it('throws when body is not an object', () => {
            expect(() => BetaSectionImage.fromResponseBody('string')).toThrow(
                'BetaSectionImage body must be an object',
            );
            expect(() => BetaSectionImage.fromResponseBody(42)).toThrow(
                'BetaSectionImage body must be an object',
            );
        });

        it('throws when order is not a number', () => {
            expect(() =>
                BetaSectionImage.fromResponseBody({ ...getValidBody(), order: '1' }),
            ).toThrow('BetaSectionImage.order must be a number');
            expect(() =>
                BetaSectionImage.fromResponseBody({ ...getValidBody(), order: undefined }),
            ).toThrow('BetaSectionImage.order must be a number');
        });

        it('throws when url is not a string', () => {
            expect(() =>
                BetaSectionImage.fromResponseBody({ ...getValidBody(), url: 123 }),
            ).toThrow('BetaSectionImage.url must be a string');
        });

        it('throws when linkUrl is not a string', () => {
            expect(() =>
                BetaSectionImage.fromResponseBody({ ...getValidBody(), linkUrl: null }),
            ).toThrow('BetaSectionImage.linkUrl must be a string');
        });

        it('throws when caption is not a string', () => {
            expect(() =>
                BetaSectionImage.fromResponseBody({ ...getValidBody(), caption: [] }),
            ).toThrow('BetaSectionImage.caption must be a string');
        });

        it('throws when latestRevisionDate is not valid ISO 8601', () => {
            expect(() =>
                BetaSectionImage.fromResponseBody({
                    ...getValidBody(),
                    latestRevisionDate: 'not-a-date',
                }),
            ).toThrow(
                'BetaSectionImage.latestRevisionDate must be a valid ISO 8601 date string',
            );
            expect(() =>
                BetaSectionImage.fromResponseBody({
                    ...getValidBody(),
                    latestRevisionDate: 123,
                }),
            ).toThrow(
                'BetaSectionImage.latestRevisionDate must be an ISO 8601 date string',
            );
        });
    });
});
