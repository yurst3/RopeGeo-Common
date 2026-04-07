import { describe, it, expect } from '@jest/globals';
import { BetaSectionImage } from '../../../src/models/betaSections/betaSectionImage';
import { DownloadBytes } from '../../../src/models/betaSections/downloadBytes';

function getValidBody(): Record<string, unknown> {
    return {
        order: 0,
        id: '550e8400-e29b-41d4-a716-446655440000',
        bannerUrl: 'https://example.com/banner.jpg',
        fullUrl: 'https://example.com/full.jpg',
        linkUrl: 'https://example.com/page',
        caption: 'A caption',
        latestRevisionDate: '2024-01-15T12:00:00Z',
        downloadBytes: { preview: 100, banner: 2000, full: 300000 },
    };
}

describe('BetaSectionImage', () => {
    describe('constructor', () => {
        it('sets all properties', () => {
            const db = new DownloadBytes(1, 2, 3);
            const img = new BetaSectionImage(
                1,
                'img-id-1',
                'https://example.com/banner.jpg',
                'https://example.com/full.jpg',
                'https://example.com/link',
                'Caption text',
                new Date('2024-01-15T12:00:00Z'),
                db,
            );
            expect(img.order).toBe(1);
            expect(img.id).toBe('img-id-1');
            expect(img.bannerUrl).toBe('https://example.com/banner.jpg');
            expect(img.fullUrl).toBe('https://example.com/full.jpg');
            expect(img.linkUrl).toBe('https://example.com/link');
            expect(img.caption).toBe('Caption text');
            expect(img.latestRevisionDate).toEqual(new Date('2024-01-15T12:00:00Z'));
            expect(img.downloadBytes).toBe(db);
        });

        it('normalizes latestRevisionDate to Date', () => {
            const d = new Date('2024-06-01T00:00:00Z');
            const img = new BetaSectionImage(
                0,
                'id',
                null,
                null,
                '',
                null,
                d,
                null,
            );
            expect(img.latestRevisionDate).toBeInstanceOf(Date);
            expect(img.latestRevisionDate.getTime()).toBe(d.getTime());
            expect(img.downloadBytes).toBeNull();
        });
    });

    describe('fromResult', () => {
        it('returns instance with validated and parsed fields', () => {
            const img = BetaSectionImage.fromResult(getValidBody());
            expect(img).toBeInstanceOf(BetaSectionImage);
            expect(img.order).toBe(0);
            expect(img.id).toBe('550e8400-e29b-41d4-a716-446655440000');
            expect(img.bannerUrl).toBe('https://example.com/banner.jpg');
            expect(img.fullUrl).toBe('https://example.com/full.jpg');
            expect(img.linkUrl).toBe('https://example.com/page');
            expect(img.caption).toBe('A caption');
            expect(img.latestRevisionDate).toEqual(new Date('2024-01-15T12:00:00Z'));
            expect(img.downloadBytes).toBeInstanceOf(DownloadBytes);
            expect(img.downloadBytes?.preview).toBe(100);
            expect(img.downloadBytes?.banner).toBe(2000);
            expect(img.downloadBytes?.full).toBe(300000);
        });

        it('accepts null values for bannerUrl, fullUrl, caption, and downloadBytes', () => {
            const img = BetaSectionImage.fromResult({
                ...getValidBody(),
                bannerUrl: null,
                fullUrl: null,
                caption: null,
                downloadBytes: null,
            });
            expect(img.bannerUrl).toBeNull();
            expect(img.fullUrl).toBeNull();
            expect(img.caption).toBeNull();
            expect(img.downloadBytes).toBeNull();
        });

        it('throws when result is null', () => {
            expect(() => BetaSectionImage.fromResult(null)).toThrow(
                'BetaSectionImage result must be an object',
            );
        });

        it('throws when result is not an object', () => {
            expect(() => BetaSectionImage.fromResult('string')).toThrow(
                'BetaSectionImage result must be an object',
            );
            expect(() => BetaSectionImage.fromResult(42)).toThrow(
                'BetaSectionImage result must be an object',
            );
        });

        it('throws when order is not a number', () => {
            expect(() =>
                BetaSectionImage.fromResult({ ...getValidBody(), order: '1' }),
            ).toThrow('BetaSectionImage.order must be a number');
            expect(() =>
                BetaSectionImage.fromResult({ ...getValidBody(), order: undefined }),
            ).toThrow('BetaSectionImage.order must be a number');
        });

        it('throws when id is missing or empty', () => {
            expect(() =>
                BetaSectionImage.fromResult({ ...getValidBody(), id: '' }),
            ).toThrow('BetaSectionImage.id must be a non-empty string');
            expect(() =>
                BetaSectionImage.fromResult({ ...getValidBody(), id: '   ' }),
            ).toThrow('BetaSectionImage.id must be a non-empty string');
            expect(() =>
                BetaSectionImage.fromResult({ ...getValidBody(), id: undefined }),
            ).toThrow('BetaSectionImage.id must be a non-empty string');
        });

        it('throws when bannerUrl is not a string or null', () => {
            expect(() =>
                BetaSectionImage.fromResult({ ...getValidBody(), bannerUrl: 123 }),
            ).toThrow('BetaSectionImage.bannerUrl must be a string or null');
        });

        it('throws when fullUrl is not a string or null', () => {
            expect(() =>
                BetaSectionImage.fromResult({ ...getValidBody(), fullUrl: [] }),
            ).toThrow('BetaSectionImage.fullUrl must be a string or null');
        });

        it('throws when linkUrl is not a string', () => {
            expect(() =>
                BetaSectionImage.fromResult({ ...getValidBody(), linkUrl: null }),
            ).toThrow('BetaSectionImage.linkUrl must be a string');
        });

        it('throws when caption is not a string or null', () => {
            expect(() =>
                BetaSectionImage.fromResult({ ...getValidBody(), caption: [] }),
            ).toThrow('BetaSectionImage.caption must be a string or null');
        });

        it('throws when latestRevisionDate is not valid ISO 8601', () => {
            expect(() =>
                BetaSectionImage.fromResult({
                    ...getValidBody(),
                    latestRevisionDate: 'not-a-date',
                }),
            ).toThrow(
                'BetaSectionImage.latestRevisionDate must be a valid ISO 8601 date string',
            );
            expect(() =>
                BetaSectionImage.fromResult({
                    ...getValidBody(),
                    latestRevisionDate: 123,
                }),
            ).toThrow(
                'BetaSectionImage.latestRevisionDate must be an ISO 8601 date string',
            );
        });

        it('throws when downloadBytes is invalid', () => {
            expect(() =>
                BetaSectionImage.fromResult({
                    ...getValidBody(),
                    downloadBytes: { preview: -1, banner: 0, full: 0 },
                }),
            ).toThrow('DownloadBytes.preview must be a finite non-negative number');
        });
    });
});
