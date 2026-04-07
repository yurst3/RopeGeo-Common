import { describe, it, expect } from '@jest/globals';
import { RopewikiRegionView } from '../../../../src/models/api/endpoints/ropewikiRegionView';
import { BetaSection } from '../../../../src/models/betaSections/betaSection';
import { RegionMiniMap } from '../../../../src/models/minimap/regionMiniMap';
import type { MiniMap } from '../../../../src/models/minimap/miniMap';
import { MiniMapType } from '../../../../src/models/minimap/miniMapType';

const REGION_UUID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

const defaultRegionMiniMap = RegionMiniMap.fromResult({
    miniMapType: MiniMapType.GeoJson,
    routesParams: {
        region: { source: 'ropewiki', id: REGION_UUID },
    },
});

interface ConstructorArgs {
    name: string;
    latestRevisionDate: Date;
    url: string;
    updatedAt: Date;
    miniMap?: MiniMap | null;
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
    const miniMap: MiniMap | null = !('miniMap' in overrides)
        ? defaultRegionMiniMap
        : overrides.miniMap === undefined
          ? defaultRegionMiniMap
          : overrides.miniMap;
    const b: ConstructorArgs = {
        name: 'North America',
        latestRevisionDate: new Date('2024-01-15T12:00:00Z'),
        url: 'https://ropewiki.com/North_America',
        updatedAt: new Date('2024-01-10T08:00:00Z'),
        ...overrides,
        miniMap,
    };
    return [
        b.name,
        b.latestRevisionDate,
        b.url,
        b.updatedAt,
        miniMap,
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
            expect(view.miniMap).toBeInstanceOf(RegionMiniMap);
            expect((view.miniMap as RegionMiniMap).routesParams.region!.id).toBe(
                REGION_UUID,
            );
        });

        it('defaults regionCount, topLevelPageCount, pageCount, and totalPageCount to 0 when missing', () => {
            const view = new RopewikiRegionView(...baseArgs());
            expect(view.regionCount).toBe(0);
            expect(view.topLevelPageCount).toBe(0);
            expect(view.pageCount).toBe(0);
            expect(view.totalPageCount).toBe(0);
        });

        it('allows null miniMap in constructor', () => {
            const view = new RopewikiRegionView(...baseArgs({ miniMap: null }));
            expect(view.miniMap).toBeNull();
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

    describe('fromResult', () => {
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
                miniMap: {
                    miniMapType: MiniMapType.GeoJson,
                    routesParams: {
                        region: {
                            source: 'ropewiki',
                            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                        },
                    },
                },
            };
        }

        it('returns RopewikiRegionView instance for valid body', () => {
            const view = RopewikiRegionView.fromResult(getValidBody());
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
            expect((view.miniMap as RegionMiniMap).routesParams.region!.id).toBe(
                'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            );
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
                miniMap: {
                    miniMapType: MiniMapType.GeoJson,
                    routesParams: {
                        region: { source: 'ropewiki', id: REGION_UUID },
                    },
                },
            };
            const view = RopewikiRegionView.fromResult(minimal);
            expect(view.name).toBe('Root');
            expect(view.regions).toEqual([]);
            expect(view.overview).toBeNull();
            expect(view.bestMonths).toEqual([]);
            expect(view.isMajorRegion).toBe(false);
        });

        it('throws when body is null', () => {
            expect(() => RopewikiRegionView.fromResult(null)).toThrow(
                'RopewikiRegionView result must be an object',
            );
        });

        it('throws when body is not an object', () => {
            expect(() => RopewikiRegionView.fromResult('string')).toThrow(
                'RopewikiRegionView result must be an object',
            );
            expect(() => RopewikiRegionView.fromResult(42)).toThrow(
                'RopewikiRegionView result must be an object',
            );
        });

        it('throws when name is missing or not a string', () => {
            expect(() =>
                RopewikiRegionView.fromResult({ ...getValidBody(), name: 1 }),
            ).toThrow('RopewikiRegionView.name must be a string');
            expect(() =>
                RopewikiRegionView.fromResult({ ...getValidBody(), name: undefined }),
            ).toThrow('RopewikiRegionView.name must be a string');
        });

        it('throws when regions is not an array', () => {
            expect(() =>
                RopewikiRegionView.fromResult({ ...getValidBody(), regions: 'not-array' }),
            ).toThrow('RopewikiRegionView.regions must be an array');
        });

        it('throws when regions item has wrong shape', () => {
            expect(() =>
                RopewikiRegionView.fromResult({
                    ...getValidBody(),
                    regions: [{ id: 'x', name: 123 }],
                }),
            ).toThrow('RopewikiRegionView.regions[0].name must be a string');
            expect(() =>
                RopewikiRegionView.fromResult({
                    ...getValidBody(),
                    regions: [{ id: 1, name: 'World' }],
                }),
            ).toThrow('RopewikiRegionView.regions[0].id must be a string');
        });

        it('throws when count fields are not non-negative numbers', () => {
            expect(() =>
                RopewikiRegionView.fromResult({ ...getValidBody(), regionCount: -1 }),
            ).toThrow('RopewikiRegionView.regionCount must be a number >= 0');
            expect(() =>
                RopewikiRegionView.fromResult({ ...getValidBody(), pageCount: '10' }),
            ).toThrow('RopewikiRegionView.pageCount must be a number >= 0');
        });

        it('throws when overview is not BetaSection or null', () => {
            expect(() =>
                RopewikiRegionView.fromResult({ ...getValidBody(), overview: 1 }),
            ).toThrow('RopewikiRegionView.overview must be BetaSection or null');
        });

        it('throws when overview is an object but invalid BetaSection', () => {
            expect(() =>
                RopewikiRegionView.fromResult({
                    ...getValidBody(),
                    overview: { order: 1, title: 'Overview', text: 'Text', images: [] },
                    // missing latestRevisionDate
                }),
            ).toThrow('BetaSection.latestRevisionDate must be an ISO 8601 date string');
        });

        it('throws when bestMonths is not an array of strings', () => {
            expect(() =>
                RopewikiRegionView.fromResult({ ...getValidBody(), bestMonths: [1, 2] }),
            ).toThrow('RopewikiRegionView.bestMonths[0] must be a string');
        });

        it('throws when isMajorRegion is not a boolean', () => {
            expect(() =>
                RopewikiRegionView.fromResult({ ...getValidBody(), isMajorRegion: 'yes' }),
            ).toThrow('RopewikiRegionView.isMajorRegion must be a boolean');
        });

        it('throws when latestRevisionDate is not valid ISO 8601', () => {
            expect(() =>
                RopewikiRegionView.fromResult({
                    ...getValidBody(),
                    latestRevisionDate: 'not-a-date',
                }),
            ).toThrow('RopewikiRegionView.latestRevisionDate must be a valid ISO 8601 date string');
            expect(() =>
                RopewikiRegionView.fromResult({
                    ...getValidBody(),
                    latestRevisionDate: 123,
                }),
            ).toThrow('RopewikiRegionView.latestRevisionDate must be an ISO 8601 date string');
        });

        it('throws when externalLink is not a valid URL', () => {
            expect(() =>
                RopewikiRegionView.fromResult({
                    ...getValidBody(),
                    externalLink: 'not-a-url',
                }),
            ).toThrow('RopewikiRegionView.externalLink must be a valid URL');
            expect(() =>
                RopewikiRegionView.fromResult({
                    ...getValidBody(),
                    externalLink: 123,
                }),
            ).toThrow('RopewikiRegionView.externalLink must be a string (valid URL)');
        });

        it('throws when syncDate is not valid ISO 8601', () => {
            expect(() =>
                RopewikiRegionView.fromResult({
                    ...getValidBody(),
                    syncDate: 'not-a-date',
                }),
            ).toThrow('RopewikiRegionView.syncDate must be a valid ISO 8601 date string');
        });

        it('parses when miniMap is null or omitted', () => {
            expect(
                RopewikiRegionView.fromResult({ ...getValidBody(), miniMap: null }).miniMap,
            ).toBeNull();
            const { miniMap: _m, ...withoutMiniMap } = getValidBody();
            expect(RopewikiRegionView.fromResult(withoutMiniMap).miniMap).toBeNull();
        });

        it('throws when miniMap is not object or null', () => {
            expect(() =>
                RopewikiRegionView.fromResult({ ...getValidBody(), miniMap: 'bad' }),
            ).toThrow(/RopewikiRegionView\.miniMap must be a MiniMap object or null/);
            expect(() =>
                RopewikiRegionView.fromResult({
                    ...getValidBody(),
                    miniMap: { miniMapType: MiniMapType.TilesTemplate, layerId: 'x' },
                }),
            ).toThrow();
        });
    });
});
