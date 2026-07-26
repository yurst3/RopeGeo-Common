import { describe, it, expect } from '@jest/globals';
import { BetaSection } from '../../../src/models/betaSections/betaSection';
import { BetaSectionExcerpt } from '../../../src/models/betaSections/betaSectionExcerpt';
import { BetaSectionImage } from '../../../src/models/betaSections/betaSectionImage';
import { DownloadBytes } from '../../../src/models/betaSections/downloadBytes';
import { OnlineBetaSection } from '../../../src/models/betaSections/onlineBetaSection';
import { OnlineBetaSectionImage } from '../../../src/models/betaSections/onlineBetaSectionImage';
import { OfflineBetaSection } from '../../../src/models/betaSections/offlineBetaSection';
import '../../../src/models/betaSections/registerBetaSectionParsers';

function validImageBody(): Record<string, unknown> {
    return {
        fetchType: 'online',
        order: 0,
        id: '550e8400-e29b-41d4-a716-446655440001',
        previewUrl: 'https://example.com/preview.jpg',
        bannerUrl: 'https://example.com/banner.jpg',
        fullUrl: 'https://example.com/full.jpg',
        linkUrl: 'https://example.com/page',
        caption: 'Caption',
        latestRevisionDate: '2024-01-15T12:00:00Z',
        downloadBytes: { preview: 10, banner: 100, full: 1000 },
    };
}

function getValidBody(): Record<string, unknown> {
    return {
        fetchType: 'online',
        id: 'section-id',
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
            const img = new OnlineBetaSectionImage(
                0,
                'img-local-id',
                'https://a.com/banner.jpg',
                'https://a.com/full.jpg',
                'https://a.com',
                'Cap',
                new Date('2024-01-01Z'),
                new DownloadBytes(0, 1, 2),
            );
            const section = new OnlineBetaSection(
                1,
                'Descent',
                'Descent beta.',
                new Date('2024-01-15T12:00:00Z'),
                [img],
            );
            expect(section.order).toBe(1);
            expect(section.id).toBeNull();
            expect(section.title).toBe('Descent');
            expect(section.text).toBe('Descent beta.');
            expect(section.images).toHaveLength(1);
            expect(section.images[0]).toBe(img);
            expect(section.latestRevisionDate).toEqual(new Date('2024-01-15T12:00:00Z'));
        });

        it('defaults images to empty array when omitted', () => {
            const section = new OnlineBetaSection(
                0,
                'Title',
                'Text',
                new Date('2024-01-01Z'),
            );
            expect(section.images).toEqual([]);
        });

        it('normalizes latestRevisionDate to Date', () => {
            const d = new Date('2024-06-01T00:00:00Z');
            const section = new OnlineBetaSection(0, '', '', d);
            expect(section.latestRevisionDate).toBeInstanceOf(Date);
            expect(section.latestRevisionDate.getTime()).toBe(d.getTime());
        });
    });

    describe('toExcerpt', () => {
        it('computes start and end when excerpt text is found in the middle', () => {
            const section = new OnlineBetaSection(
                1,
                'Descent',
                'Before <b>R1</b>: 25 feet - After',
                new Date('2025-01-01T00:00:00Z'),
            );
            const excerptText = '<b>R1</b>: 25 feet -';
            const excerpt = section.toExcerpt(excerptText, 'Definitely Relevant', 'R1');
            expect(excerpt).toBeInstanceOf(BetaSectionExcerpt);
            expect(excerpt.text).toBe(excerptText);
            expect(excerpt.start).toBe(7);
            expect(excerpt.end).toBe(7 + excerptText.length);
            expect(excerpt.relevanceStrength).toBe('Definitely Relevant');
        });

        it('computes start 0 when excerpt is at the beginning of section text', () => {
            const section = new OnlineBetaSection(
                1,
                'Exit',
                'Exit hike details',
                new Date('2025-01-01T00:00:00Z'),
            );
            const excerpt = section.toExcerpt('Exit hike', 'Somewhat Relevant', 'R1');
            expect(excerpt.start).toBe(0);
            expect(excerpt.end).toBe(9);
        });

        it('leaves start and end undefined when excerpt text is not found', () => {
            const section = new OnlineBetaSection(
                1,
                'Descent',
                'Some beta text',
                new Date('2025-01-01T00:00:00Z'),
            );
            const excerpt = section.toExcerpt('missing excerpt', 'Somewhat Relevant', 'R1');
            expect(excerpt.text).toBe('missing excerpt');
            expect(excerpt.start).toBeUndefined();
            expect(excerpt.end).toBeUndefined();
        });

        it('returns title-style excerpt for empty excerpt text', () => {
            const section = new OnlineBetaSection(
                1,
                'Descent',
                'Some beta text',
                new Date('2025-01-01T00:00:00Z'),
            );
            const excerpt = section.toExcerpt('', 'Maybe Relevant', 'R1');
            expect(excerpt.text).toBeUndefined();
            expect(excerpt.start).toBeUndefined();
            expect(excerpt.end).toBeUndefined();
            expect(excerpt.relevanceStrength).toBe('Maybe Relevant');
            expect(excerpt.relevantPhrase).toBe('R1');
        });

        it('works on OfflineBetaSection', () => {
            const section = new OfflineBetaSection(
                1,
                'Descent',
                'Offline <b>R1</b> text',
                new Date('2025-01-01T00:00:00Z'),
            );
            const excerptText = '<b>R1</b>';
            const excerpt = section.toExcerpt(excerptText, 'Somewhat Relevant', 'R1');
            expect(excerpt.start).toBe(8);
            expect(excerpt.end).toBe(8 + excerptText.length);
        });

        it('throws when relevanceStrength is invalid', () => {
            const section = new OnlineBetaSection(
                1,
                'Descent',
                'Some beta text',
                new Date('2025-01-01T00:00:00Z'),
            );
            expect(() => section.toExcerpt('Some beta', 'Nope' as any, 'R1')).toThrow(
                /BetaSectionExcerpt\.relevanceStrength/,
            );
        });
    });

    describe('excerpt HTML', () => {
        it('normalizes excerpt-only list fragments', () => {
            expect(
                new BetaSectionExcerpt('<li>One</li>', undefined, undefined, 'Definitely Relevant', 'R1').toHtml(),
            ).toBe('<ul><li>One</li></ul>');
            expect(
                new BetaSectionExcerpt('<ol><li>One</li>', undefined, undefined, 'Definitely Relevant', 'R1').toHtml(),
            ).toBe('<ol><li>One</li></ol>');
            expect(
                new BetaSectionExcerpt('<li>One</li></ol>', undefined, undefined, 'Definitely Relevant', 'R1').toHtml(),
            ).toBe('<ul><li>One</li></ul>');
            expect(
                new BetaSectionExcerpt('<ul><li>One</li>', undefined, undefined, 'Definitely Relevant', 'R1').toHtml(),
            ).toBe('<ul><li>One</li></ul>');
            expect(
                new BetaSectionExcerpt('<li>One</li></ul>', undefined, undefined, 'Definitely Relevant', 'R1').toHtml(),
            ).toBe('<ul><li>One</li></ul>');
            expect(
                new BetaSectionExcerpt(
                    '<ol><li>One</li></ol>',
                    undefined,
                    undefined,
                    'Definitely Relevant',
                    'R1',
                ).toHtml(),
            ).toBe('<ol><li>One</li></ol>');
        });

        it('bolds relevantPhrase in excerpt HTML when present and skips when omitted', () => {
            expect(
                new BetaSectionExcerpt(
                    'Find the first rappel here.',
                    undefined,
                    undefined,
                    'Definitely Relevant',
                    'first rappel',
                ).toHtml(),
            ).toBe('Find the <b>first rappel</b> here.');
            expect(
                new BetaSectionExcerpt(
                    'Find the first rappel here.',
                    undefined,
                    undefined,
                    'Definitely Relevant',
                ).toHtml(),
            ).toBe('Find the first rappel here.');

            const section = new OnlineBetaSection(
                0,
                'Beta',
                'Find the first rappel here.',
                new Date('2025-01-01Z'),
            );
            const withPhrase = section.toExcerpt(
                'Find the first rappel here.',
                'Definitely Relevant',
                'first rappel',
            );
            expect(section.toExcerptHtml(withPhrase)).toEqual({
                body: 'Find the <b>first rappel</b> here.',
            });
            const withoutPhrase = section.toExcerpt(
                'Find the first rappel here.',
                'Definitely Relevant',
            );
            expect(withoutPhrase.relevantPhrase).toBeUndefined();
            expect(section.toExcerptHtml(withoutPhrase)).toEqual({
                body: 'Find the first rappel here.',
            });
        });

        it('returns normalized excerpt-only HTML for missing or stale offsets', () => {
            const section = new OnlineBetaSection(
                0,
                'Beta',
                'Different text.',
                new Date('2025-01-01Z'),
            );
            expect(
                section.toExcerptHtml(
                    new BetaSectionExcerpt('<li>Missing</li>', 0, 5, 'Definitely Relevant', 'R1'),
                ),
            ).toEqual({ body: '<ul><li>Missing</li></ul>' });
            expect(
                section.toExcerptHtml(
                    new BetaSectionExcerpt('<li>Missing</li>', undefined, undefined, 'Definitely Relevant', 'R1'),
                ),
            ).toEqual({ body: '<ul><li>Missing</li></ul>' });
        });

        it('falls back when offsets cut through tags or entities', () => {
            const text = 'Before <b>R1</b> and &amp; after.';
            const section = new OnlineBetaSection(
                0,
                'Beta',
                text,
                new Date('2025-01-01Z'),
            );
            expect(
                section.toExcerptHtml(
                    new BetaSectionExcerpt('b>R1</b', text.indexOf('b>R1</b'), text.indexOf('b>R1</b') + 7, 'Definitely Relevant', 'R1'),
                ),
            ).toEqual({ body: 'b><b>R1</b></b' });
            const entityStart = text.indexOf('&amp;') + 1;
            const entityExcerpt = 'amp; after.';
            expect(
                section.toExcerptHtml(
                    new BetaSectionExcerpt(
                        entityExcerpt,
                        entityStart,
                        entityStart + entityExcerpt.length,
                        'Definitely Relevant',
                        'R1',
                    ),
                ),
            ).toEqual({ body: entityExcerpt });
        });

        it('omits before/after when there is no surrounding context', () => {
            const section = new OnlineBetaSection(
                0,
                'Beta',
                'Target phrase continues here.',
                new Date('2025-01-01Z'),
            );
            const excerpt = section.toExcerpt('Target phrase', 'Definitely Relevant', 'R1');
            expect(section.toExcerptHtml(excerpt)).toEqual({
                body: 'Target phrase',
                after: 'continues here.',
            });
        });

        it('expands prose to sentence boundaries without cutting words', () => {
            const text =
                'First sentence. Target phrase continues here. Third sentence.';
            const section = new OnlineBetaSection(
                0,
                'Beta',
                text,
                new Date('2025-01-01Z'),
            );
            const excerpt = section.toExcerpt('Target phrase', 'Definitely Relevant', 'R1');
            expect(section.toExcerptHtml(excerpt)).toEqual({
                before: 'First sentence.',
                body: 'Target phrase',
                after: 'continues here.',
            });
        });

        it('does not treat common abbreviations or decimals as sentence boundaries', () => {
            const text =
                'Intro sentence. Use care, e.g. around 2.5 feet of loose rock. Target detail.';
            const section = new OnlineBetaSection(
                0,
                'Beta',
                text,
                new Date('2025-01-01Z'),
            );
            const excerpt = section.toExcerpt('around 2.5 feet', 'Definitely Relevant', 'R1');
            expect(section.toExcerptHtml(excerpt)).toEqual({
                before: 'Use care, e.g.',
                body: 'around 2.5 feet',
                after: 'of loose rock.',
            });
        });

        it('treats subheaders as transparent when finding list context', () => {
            const text =
                'This is an example sentence.\n<h3>List of cool things</h3>\n<ul><li>some list item</li><li>another list item</li><li>a third item</li></ul>';
            const section = new OnlineBetaSection(
                0,
                'Beta',
                text,
                new Date('2025-01-01Z'),
            );
            const excerpt = section.toExcerpt('<li>some list item</li>', 'Definitely Relevant', 'R1');
            expect(section.toExcerptHtml(excerpt)).toEqual({
                before: 'This is an example sentence.\n<h3>List of cool things</h3>',
                body: '<ul><li>some list item</li></ul>',
                after: '<ul><li>another list item</li></ul>',
            });
        });

        it('includes one adjacent list item on each side', () => {
            const text =
                '<ol><li>one</li><li>two</li><li>three</li><li>four</li></ol>';
            const section = new OnlineBetaSection(
                0,
                'Beta',
                text,
                new Date('2025-01-01Z'),
            );
            const excerpt = section.toExcerpt('<li>two</li><li>three</li>', 'Definitely Relevant', 'R1');
            expect(section.toExcerptHtml(excerpt)).toEqual({
                before: '<ol><li>one</li></ol>',
                body: '<ol start="2"><li>two</li><li>three</li></ol>',
                after: '<ol start="4"><li>four</li></ol>',
            });
        });

        it('aligns ordered-list excerpt numbering with a non-default source start', () => {
            const text =
                '<ol start="5"><li>five</li><li>six</li><li>seven</li></ol>';
            const section = new OnlineBetaSection(
                0,
                'Beta',
                text,
                new Date('2025-01-01Z'),
            );
            const excerpt = section.toExcerpt('<li>six</li>', 'Definitely Relevant', 'R1');
            expect(section.toExcerptHtml(excerpt)).toEqual({
                before: '<ol start="5"><li>five</li></ol>',
                body: '<ol start="6"><li>six</li></ol>',
                after: '<ol start="7"><li>seven</li></ol>',
            });
        });

        it('keeps ol→ul conversion for excerpt-only text without offsets', () => {
            const section = new OnlineBetaSection(
                0,
                'Beta',
                'Unrelated text.',
                new Date('2025-01-01Z'),
            );
            expect(
                section.toExcerptHtml(
                    new BetaSectionExcerpt(
                        '<li>orphan</li></ol>',
                        undefined,
                        undefined,
                        'Definitely Relevant',
                        'R1',
                    ),
                ),
            ).toEqual({ body: '<ul><li>orphan</li></ul>' });
        });

        it('uses a following prose sentence at the end of a list', () => {
            const text =
                '<ul><li>one</li><li>two</li></ul> Following sentence. Later sentence.';
            const section = new OnlineBetaSection(
                0,
                'Beta',
                text,
                new Date('2025-01-01Z'),
            );
            const excerpt = section.toExcerpt('<li>two</li>', 'Definitely Relevant', 'R1');
            expect(section.toExcerptHtml(excerpt)).toEqual({
                before: '<ul><li>one</li></ul>',
                body: '<ul><li>two</li></ul>',
                after: 'Following sentence.',
            });
        });
    });

    describe('fromResponseBody', () => {
        it('returns instance with validated and parsed fields', () => {
            const section = OnlineBetaSection.fromResponseBody(getValidBody());
            expect(section).toBeInstanceOf(BetaSection);
            expect(section.id).toBe('section-id');
            expect(section.order).toBe(0);
            expect(section.title).toBe('Approach');
            expect(section.text).toBe('Beta text here.');
            expect(section.images).toHaveLength(1);
            expect(section.images[0]).toBeInstanceOf(BetaSectionImage);
            expect(section.images[0].previewUrl).toBe('https://example.com/preview.jpg');
            expect(section.images[0].bannerUrl).toBe('https://example.com/banner.jpg');
            expect(section.images[0].fullUrl).toBe('https://example.com/full.jpg');
            expect(section.latestRevisionDate).toEqual(new Date('2024-01-15T12:00:00Z'));
        });

        it('accepts empty images array', () => {
            const body = { ...getValidBody(), images: [] };
            const section = OnlineBetaSection.fromResponseBody(body);
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

        it('accepts missing legacy ids as null and rejects invalid ids', () => {
            const legacy = OnlineBetaSection.fromResponseBody({
                ...getValidBody(),
                id: undefined,
            });
            expect(legacy.id).toBeNull();
            expect(() =>
                OnlineBetaSection.fromResponseBody({
                    ...getValidBody(),
                    id: '   ',
                }),
            ).toThrow('BetaSection.id must be a non-empty string or null');
        });

        it('throws when images contain duplicate ids', () => {
            const image = validImageBody();
            expect(() =>
                OnlineBetaSection.fromResponseBody({
                    ...getValidBody(),
                    images: [image, { ...image, order: 1 }],
                }),
            ).toThrow(
                'Duplicate image id 550e8400-e29b-41d4-a716-446655440001 in beta section section-id',
            );
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

        it('parses offline section shape', () => {
            const section = OfflineBetaSection.fromResponseBody({
                fetchType: 'offline',
                order: 1,
                title: 'Offline',
                text: 'Saved section',
                latestRevisionDate: '2024-01-15T12:00:00Z',
                images: [
                    {
                        fetchType: 'offline',
                        order: 0,
                        id: '550e8400-e29b-41d4-a716-446655440001',
                        downloadedPreviewPath: '/tmp/preview.avif',
                        downloadedBannerPath: '/tmp/banner.avif',
                        downloadedFullPath: '/tmp/full.avif',
                        linkUrl: 'https://example.com/page',
                        caption: null,
                        latestRevisionDate: '2024-01-15T12:00:00Z',
                    },
                ],
            });
            expect(section).toBeInstanceOf(OfflineBetaSection);
            expect(section.images).toHaveLength(1);
        });

        it('throws when fetchType mismatches parser', () => {
            expect(() =>
                OfflineBetaSection.fromResponseBody({
                    ...getValidBody(),
                    fetchType: 'online',
                }),
            ).toThrow(/fetchType must be "offline"/);
        });
    });
});
