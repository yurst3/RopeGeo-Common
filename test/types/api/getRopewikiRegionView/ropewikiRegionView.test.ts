import { describe, it, expect } from '@jest/globals';
import { RopewikiRegionView } from '../../../../src/types/api/getRopewikiRegionView/ropewikiRegionView';
import { BetaSection } from '../../../../src/types/betaSections/betaSection';

interface ConstructorArgs {
    name: string;
    latestRevisionDate: Date;
    url: string;
    updatedAt: Date;
    regions?: { name: string; id: string }[];
    rawPageCount?: number | null;
    truePageCount?: number | null;
    trueRegionCount?: number | null;
    truePageCountWithDescendents?: number | null;
    overview?: string | null;
    bestMonths?: string[] | null;
    isMajorRegion?: boolean | null;
}

function baseArgs(
    overrides: Partial<ConstructorArgs> = {},
): ConstructorParameters<typeof RopewikiRegionView> {
    const b: ConstructorArgs = {
        name: 'North America',
        latestRevisionDate: new Date('2024-01-15T12:00:00Z'),
        url: 'https://ropewiki.com/North_America',
        updatedAt: new Date('2024-01-10T08:00:00Z'),
        ...overrides,
    };
    return [
        b.name,
        b.latestRevisionDate,
        b.url,
        b.updatedAt,
        b.regions,
        b.rawPageCount,
        b.truePageCount,
        b.trueRegionCount,
        b.truePageCountWithDescendents,
        b.overview,
        b.bestMonths,
        b.isMajorRegion,
    ];
}

describe('RopewikiRegionView', () => {
    describe('constructor', () => {
        it('maps row fields to view properties', () => {
            const view = new RopewikiRegionView(
                ...baseArgs({
                    overview: 'Overview text',
                    bestMonths: ['May', 'June'],
                    isMajorRegion: true,
                }),
            );
            expect(view.name).toBe('North America');
            expect(view.overview).not.toBeNull();
            expect(view.overview!.title).toBe('Overview');
            expect(view.overview!.text).toBe('Overview text');
            expect(view.overview!.order).toBe(1);
            expect(view.overview!.images).toEqual([]);
            expect(view.overview!.latestRevisionDate).toEqual(new Date('2024-01-15T12:00:00Z'));
            expect(view.bestMonths).toEqual(['May', 'June']);
            expect(view.isMajorRegion).toBe(true);
            expect(view.latestRevisionDate).toEqual(new Date('2024-01-15T12:00:00Z'));
            expect(view.externalLink).toBe('https://ropewiki.com/North_America');
        });

        it('defaults regionCount, topLevelPageCount, pageCount, and totalPageCount to 0 when missing', () => {
            const view = new RopewikiRegionView(...baseArgs());
            expect(view.regionCount).toBe(0);
            expect(view.topLevelPageCount).toBe(0);
            expect(view.pageCount).toBe(0);
            expect(view.totalPageCount).toBe(0);
        });

        it('defaults regionCount, topLevelPageCount, pageCount, and totalPageCount to 0 when null', () => {
            const view = new RopewikiRegionView(
                ...baseArgs({
                    rawPageCount: null,
                    truePageCount: null,
                    trueRegionCount: null,
                    truePageCountWithDescendents: null,
                }),
            );
            expect(view.regionCount).toBe(0);
            expect(view.topLevelPageCount).toBe(0);
            expect(view.pageCount).toBe(0);
            expect(view.totalPageCount).toBe(0);
        });

        it('maps rawPageCount to pageCount', () => {
            const view = new RopewikiRegionView(...baseArgs({ rawPageCount: 42 }));
            expect(view.pageCount).toBe(42);
        });

        it('maps trueRegionCount to regionCount', () => {
            const view = new RopewikiRegionView(...baseArgs({ trueRegionCount: 5 }));
            expect(view.regionCount).toBe(5);
        });

        it('maps truePageCount to topLevelPageCount', () => {
            const view = new RopewikiRegionView(...baseArgs({ truePageCount: 10 }));
            expect(view.topLevelPageCount).toBe(10);
        });

        it('maps truePageCountWithDescendents to totalPageCount', () => {
            const view = new RopewikiRegionView(
                ...baseArgs({ truePageCountWithDescendents: 200 }),
            );
            expect(view.totalPageCount).toBe(200);
        });

        it('defaults regions to empty array when omitted', () => {
            expect(new RopewikiRegionView(...baseArgs()).regions).toEqual([]);
        });

        it('sets regions when provided', () => {
            const regions = [{ name: 'World', id: 'parent-uuid' }];
            const view = new RopewikiRegionView(...baseArgs({ regions }));
            expect(view.regions).toEqual(regions);
        });

        it('copies regions array so mutating caller array does not affect view', () => {
            const regions = [{ name: 'World', id: 'parent-uuid' }];
            const view = new RopewikiRegionView(...baseArgs({ regions }));
            regions.push({ name: 'Other', id: 'other-uuid' });
            expect(view.regions).toHaveLength(1);
            expect(view.regions[0].name).toBe('World');
        });

        it('defaults overview to null when missing', () => {
            const view = new RopewikiRegionView(...baseArgs());
            expect(view.overview).toBeNull();
        });

        it('defaults bestMonths to empty array when missing or not an array', () => {
            expect(new RopewikiRegionView(...baseArgs()).bestMonths).toEqual([]);
            expect(new RopewikiRegionView(...baseArgs({ bestMonths: null })).bestMonths).toEqual([]);
        });

        it('defaults isMajorRegion to false when missing or null', () => {
            expect(new RopewikiRegionView(...baseArgs()).isMajorRegion).toBe(false);
            expect(new RopewikiRegionView(...baseArgs({ isMajorRegion: null })).isMajorRegion).toBe(
                false,
            );
        });

        it('normalizes latestRevisionDate to a Date instance', () => {
            const date = new Date('2023-06-01T00:00:00Z');
            const view = new RopewikiRegionView(...baseArgs({ latestRevisionDate: date }));
            expect(view.latestRevisionDate).toBeInstanceOf(Date);
            expect(view.latestRevisionDate.getTime()).toBe(date.getTime());
        });

        it('sets syncDate from updatedAt', () => {
            const updatedAt = new Date('2024-06-15T12:30:00Z');
            const view = new RopewikiRegionView(...baseArgs({ updatedAt }));
            expect(view.syncDate).toBeInstanceOf(Date);
            expect(view.syncDate.getTime()).toBe(updatedAt.getTime());
        });
    });

    describe('fromResponseBody', () => {
        function getValidBody() {
            return {
                name: 'North America',
                regions: [{ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'World' }],
                regionCount: 12,
                topLevelPageCount: 45,
                pageCount: 120,
                totalPageCount: 380,
                overview: {
                    order: 1,
                    title: 'Overview',
                    text: 'Canyoneering regions.',
                    images: [],
                    latestRevisionDate: '2025-01-15T00:00:00.000Z',
                },
                bestMonths: ['April', 'May'],
                isMajorRegion: true,
                latestRevisionDate: '2025-01-15T00:00:00.000Z',
                syncDate: '2025-01-10T08:00:00.000Z',
                externalLink: 'https://ropewiki.com/North_America',
            };
        }

        it('returns RopewikiRegionView instance for valid body', () => {
            const view = RopewikiRegionView.fromResponseBody(getValidBody());
            expect(view).toBeInstanceOf(RopewikiRegionView);
            expect(view.name).toBe('North America');
            expect(view.regions).toEqual([
                { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'World' },
            ]);
            expect(view.regionCount).toBe(12);
            expect(view.topLevelPageCount).toBe(45);
            expect(view.pageCount).toBe(120);
            expect(view.totalPageCount).toBe(380);
            expect(view.overview).not.toBeNull();
            expect(view.overview).toBeInstanceOf(BetaSection);
            expect(view.overview!.title).toBe('Overview');
            expect(view.overview!.text).toBe('Canyoneering regions.');
            expect(view.overview!.order).toBe(1);
            expect(view.overview!.images).toEqual([]);
            expect(view.bestMonths).toEqual(['April', 'May']);
            expect(view.isMajorRegion).toBe(true);
            expect(view.latestRevisionDate).toBeInstanceOf(Date);
            expect(view.latestRevisionDate.toISOString()).toBe('2025-01-15T00:00:00.000Z');
            expect(view.syncDate).toBeInstanceOf(Date);
            expect(view.syncDate.toISOString()).toBe('2025-01-10T08:00:00.000Z');
            expect(view.externalLink).toBe('https://ropewiki.com/North_America');
        });

        it('accepts minimal valid body (empty regions, null overview, zero counts)', () => {
            const minimal = {
                name: 'Root',
                regions: [],
                regionCount: 0,
                topLevelPageCount: 0,
                pageCount: 0,
                totalPageCount: 0,
                overview: null,
                bestMonths: [],
                isMajorRegion: false,
                latestRevisionDate: '2024-01-01T00:00:00.000Z',
                syncDate: '2024-01-01T00:00:00.000Z',
                externalLink: 'https://example.com/region',
            };
            const view = RopewikiRegionView.fromResponseBody(minimal);
            expect(view.name).toBe('Root');
            expect(view.regions).toEqual([]);
            expect(view.overview).toBeNull();
            expect(view.bestMonths).toEqual([]);
            expect(view.isMajorRegion).toBe(false);
        });

        it('throws when body is null', () => {
            expect(() => RopewikiRegionView.fromResponseBody(null)).toThrow(
                'RopewikiRegionView body must be an object',
            );
        });

        it('throws when body is not an object', () => {
            expect(() => RopewikiRegionView.fromResponseBody('string')).toThrow(
                'RopewikiRegionView body must be an object',
            );
            expect(() => RopewikiRegionView.fromResponseBody(42)).toThrow(
                'RopewikiRegionView body must be an object',
            );
        });

        it('throws when name is missing or not a string', () => {
            expect(() =>
                RopewikiRegionView.fromResponseBody({ ...getValidBody(), name: 1 }),
            ).toThrow('RopewikiRegionView.name must be a string');
            expect(() =>
                RopewikiRegionView.fromResponseBody({ ...getValidBody(), name: undefined }),
            ).toThrow('RopewikiRegionView.name must be a string');
        });

        it('throws when regions is not an array', () => {
            expect(() =>
                RopewikiRegionView.fromResponseBody({ ...getValidBody(), regions: 'not-array' }),
            ).toThrow('RopewikiRegionView.regions must be an array');
        });

        it('throws when regions item has wrong shape', () => {
            expect(() =>
                RopewikiRegionView.fromResponseBody({
                    ...getValidBody(),
                    regions: [{ id: 'x', name: 123 }],
                }),
            ).toThrow('RopewikiRegionView.regions[0].name must be a string');
            expect(() =>
                RopewikiRegionView.fromResponseBody({
                    ...getValidBody(),
                    regions: [{ id: 1, name: 'World' }],
                }),
            ).toThrow('RopewikiRegionView.regions[0].id must be a string');
        });

        it('throws when count fields are not non-negative numbers', () => {
            expect(() =>
                RopewikiRegionView.fromResponseBody({ ...getValidBody(), regionCount: -1 }),
            ).toThrow('RopewikiRegionView.regionCount must be a number >= 0');
            expect(() =>
                RopewikiRegionView.fromResponseBody({ ...getValidBody(), pageCount: '10' }),
            ).toThrow('RopewikiRegionView.pageCount must be a number >= 0');
        });

        it('throws when overview is not BetaSection or null', () => {
            expect(() =>
                RopewikiRegionView.fromResponseBody({ ...getValidBody(), overview: 1 }),
            ).toThrow('RopewikiRegionView.overview must be BetaSection or null');
        });

        it('throws when overview is an object but invalid BetaSection', () => {
            expect(() =>
                RopewikiRegionView.fromResponseBody({
                    ...getValidBody(),
                    overview: { order: 1, title: 'Overview', text: 'Text', images: [] },
                    // missing latestRevisionDate
                }),
            ).toThrow('BetaSection.latestRevisionDate must be an ISO 8601 date string');
        });

        it('throws when bestMonths is not an array of strings', () => {
            expect(() =>
                RopewikiRegionView.fromResponseBody({ ...getValidBody(), bestMonths: [1, 2] }),
            ).toThrow('RopewikiRegionView.bestMonths[0] must be a string');
        });

        it('throws when isMajorRegion is not a boolean', () => {
            expect(() =>
                RopewikiRegionView.fromResponseBody({ ...getValidBody(), isMajorRegion: 'yes' }),
            ).toThrow('RopewikiRegionView.isMajorRegion must be a boolean');
        });

        it('throws when latestRevisionDate is not valid ISO 8601', () => {
            expect(() =>
                RopewikiRegionView.fromResponseBody({
                    ...getValidBody(),
                    latestRevisionDate: 'not-a-date',
                }),
            ).toThrow('RopewikiRegionView.latestRevisionDate must be a valid ISO 8601 date string');
            expect(() =>
                RopewikiRegionView.fromResponseBody({
                    ...getValidBody(),
                    latestRevisionDate: 123,
                }),
            ).toThrow('RopewikiRegionView.latestRevisionDate must be an ISO 8601 date string');
        });

        it('throws when externalLink is not a valid URL', () => {
            expect(() =>
                RopewikiRegionView.fromResponseBody({
                    ...getValidBody(),
                    externalLink: 'not-a-url',
                }),
            ).toThrow('RopewikiRegionView.externalLink must be a valid URL');
            expect(() =>
                RopewikiRegionView.fromResponseBody({
                    ...getValidBody(),
                    externalLink: 123,
                }),
            ).toThrow('RopewikiRegionView.externalLink must be a string (valid URL)');
        });

        it('throws when syncDate is not valid ISO 8601', () => {
            expect(() =>
                RopewikiRegionView.fromResponseBody({
                    ...getValidBody(),
                    syncDate: 'not-a-date',
                }),
            ).toThrow('RopewikiRegionView.syncDate must be a valid ISO 8601 date string');
        });
    });
});
