import { describe, it, expect } from '@jest/globals';
import { Result, ResultType } from '../../../src/classes/results/result';
import { RopewikiPageViewResult } from '../../../src/classes/api/getRopewikiPageView/ropewikiPageViewResult';
import { RopewikiRegionViewResult } from '../../../src/classes/api/getRopewikiRegionView/ropewikiRegionViewResult';
import { RoutesGeojsonResult } from '../../../src/classes/api/getRoutes/routesGeojsonResult';
import { RoutePreviewResult } from '../../../src/classes/api/getRoutePreview/routePreviewResult';
import { RopewikiPageLinkPreviewResult } from '../../../src/classes/api/getRopewikiPageLinkPreview/ropewikiPageLinkPreviewResult';
import { LinkPreview } from '../../../src/classes/linkPreview/linkPreview';
import { RopewikiPageView } from '../../../src/classes/api/getRopewikiPageView/ropewikiPageView';
import { RopewikiRegionView } from '../../../src/classes/api/getRopewikiRegionView/ropewikiRegionView';
import { RoutesGeojson } from '../../../src/classes/api/getRoutes/routeGeojson';
import { PagePreview } from '../../../src/classes/previews/pagePreview';
import { RouteType } from '../../../src/classes/routes/route';
import { MiniMapType } from '../../../src/classes/minimap/miniMapType';

const validRopewikiPageViewResult = {
    name: 'Test Page',
    aka: [],
    url: 'https://ropewiki.com/page',
    quality: 4,
    userVotes: 10,
    regions: [{ id: 'r1', name: 'Region' }],
    difficulty: { technical: null, water: null, time: null, risk: null },
    permit: null,
    rappelCount: null,
    jumps: null,
    vehicle: null,
    rappelLongest: null,
    shuttleTime: null,
    overallLength: null,
    descentLength: null,
    exitLength: null,
    approachLength: null,
    overallTime: null,
    approachTime: null,
    descentTime: null,
    exitTime: null,
    approachElevGain: null,
    descentElevGain: null,
    exitElevGain: null,
    months: [],
    latestRevisionDate: '2024-01-01T00:00:00.000Z',
    bannerImage: null,
    betaSections: [],
    miniMap: null,
};

const validRopewikiRegionViewResult = {
    name: 'Root',
    regions: [],
    regionCount: 0,
    topLevelPageCount: 0,
    pageCount: 0,
    totalPageCount: 0,
    overview: null,
    bestMonths: [] as string[],
    isMajorRegion: false,
    latestRevisionDate: '2024-01-01T00:00:00.000Z',
    syncDate: '2024-01-01T00:00:00.000Z',
    externalLink: 'https://example.com/region',
    miniMap: {
        miniMapType: MiniMapType.GeoJson,
        routesParams: {
            region: { source: 'ropewiki', id: 'c3d4e5f6-a7b8-9012-cdef-123456789012' },
        },
    },
};

const validRoutesGeojsonResult = {
    type: 'FeatureCollection' as const,
    features: [
        {
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [-111.5, 40.1] as [number, number] },
            properties: { id: 'id-1', name: 'Route One', type: RouteType.Canyon },
        },
    ],
};

const validLinkPreviewResult = {
    title: 'T',
    description: 'D',
    image: null as null,
    siteName: 'RopeGeo',
    type: 'website',
};

const validPagePreviewItem = {
    previewType: 'page' as const,
    id: 'p1',
    title: 'Page 1',
    source: 'ropewiki' as const,
    regions: [] as string[],
    aka: [] as string[],
    difficulty: {},
    mapData: null as string | null,
    externalLink: null as string | null,
    imageUrl: null as string | null,
    rating: null as number | null,
    ratingCount: null as number | null,
    permit: null as string | null,
};

describe('Result', () => {
    describe('fromResponseBody', () => {
        describe('invalid body shape', () => {
            it('throws if body is null or undefined', () => {
                expect(() => Result.fromResponseBody(null)).toThrow(
                    'Response body must be an object',
                );
                expect(() => Result.fromResponseBody(undefined)).toThrow(
                    'Response body must be an object',
                );
            });

            it('throws if body is a primitive (string, number, boolean)', () => {
                expect(() => Result.fromResponseBody('')).toThrow(
                    'Response body must be an object',
                );
                expect(() => Result.fromResponseBody(0)).toThrow(
                    'Response body must be an object',
                );
                expect(() => Result.fromResponseBody(true)).toThrow(
                    'Response body must be an object',
                );
            });

            it('throws if body is an array', () => {
                expect(() => Result.fromResponseBody([])).toThrow(
                    'Response body must have resultType',
                );
            });

            it('throws if resultType is missing', () => {
                expect(() =>
                    Result.fromResponseBody({
                        result: validRoutesGeojsonResult,
                    }),
                ).toThrow('Response body must have resultType');
            });

            it('throws if resultType is not a string', () => {
                expect(() =>
                    Result.fromResponseBody({
                        resultType: 123,
                        result: validRoutesGeojsonResult,
                    }),
                ).toThrow(/resultType must be one of/);
                expect(() =>
                    Result.fromResponseBody({
                        resultType: true,
                        result: validRoutesGeojsonResult,
                    }),
                ).toThrow(/resultType must be one of/);
                expect(() =>
                    Result.fromResponseBody({
                        resultType: {},
                        result: validRoutesGeojsonResult,
                    }),
                ).toThrow(/resultType must be one of/);
            });

            it('throws if resultType is not a valid enum value', () => {
                expect(() =>
                    Result.fromResponseBody({
                        resultType: 'other',
                        result: validRoutesGeojsonResult,
                    }),
                ).toThrow(/resultType must be one of/);
                expect(() =>
                    Result.fromResponseBody({
                        resultType: '',
                        result: validRoutesGeojsonResult,
                    }),
                ).toThrow(/resultType must be one of/);
            });

            it('throws if result is missing', () => {
                expect(() =>
                    Result.fromResponseBody({
                        resultType: ResultType.RoutesGeojson,
                    }),
                ).toThrow('Response body must have result');
            });
        });

        describe('valid body shape – delegates by resultType', () => {
            it('delegates to RopewikiPageViewResult when resultType is ropewikiPageView', () => {
                const body = {
                    resultType: ResultType.RopewikiPageView,
                    result: validRopewikiPageViewResult,
                };
                const parsed = Result.fromResponseBody(body);
                expect(parsed).toBeInstanceOf(RopewikiPageViewResult);
                expect(parsed.resultType).toBe(ResultType.RopewikiPageView);
                expect(parsed.result).toBeInstanceOf(RopewikiPageView);
                expect((parsed.result as RopewikiPageView).url).toBe('https://ropewiki.com/page');
                expect((parsed.result as RopewikiPageView).name).toBe('Test Page');
            });

            it('delegates to RopewikiRegionViewResult when resultType is ropewikiRegionView', () => {
                const body = {
                    resultType: ResultType.RopewikiRegionView,
                    result: validRopewikiRegionViewResult,
                };
                const parsed = Result.fromResponseBody(body);
                expect(parsed).toBeInstanceOf(RopewikiRegionViewResult);
                expect(parsed.resultType).toBe(ResultType.RopewikiRegionView);
                expect(parsed.result).toBeInstanceOf(RopewikiRegionView);
                expect((parsed.result as RopewikiRegionView).name).toBe('Root');
                expect((parsed.result as RopewikiRegionView).externalLink).toBe(
                    'https://example.com/region',
                );
            });

            it('delegates to RoutesGeojsonResult when resultType is routesGeojson', () => {
                const body = {
                    resultType: ResultType.RoutesGeojson,
                    result: validRoutesGeojsonResult,
                };
                const parsed = Result.fromResponseBody(body);
                expect(parsed).toBeInstanceOf(RoutesGeojsonResult);
                expect(parsed.resultType).toBe(ResultType.RoutesGeojson);
                expect(parsed.result).toBeInstanceOf(RoutesGeojson);
                expect((parsed.result as RoutesGeojson).type).toBe('FeatureCollection');
                expect((parsed.result as RoutesGeojson).features).toHaveLength(1);
                expect((parsed.result as RoutesGeojson).features[0].properties.id).toBe('id-1');
            });

            it('delegates to RoutePreviewResult when resultType is routePreview', () => {
                const body = {
                    resultType: ResultType.RoutePreview,
                    result: [validPagePreviewItem],
                };
                const parsed = Result.fromResponseBody(body);
                expect(parsed).toBeInstanceOf(RoutePreviewResult);
                expect(parsed.resultType).toBe(ResultType.RoutePreview);
                expect(Array.isArray(parsed.result)).toBe(true);
                expect((parsed.result as PagePreview[]).length).toBe(1);
                expect((parsed.result as PagePreview[])[0]).toBeInstanceOf(PagePreview);
                expect((parsed.result as PagePreview[])[0].id).toBe('p1');
                expect((parsed.result as PagePreview[])[0].title).toBe('Page 1');
            });

            it('delegates to RopewikiPageLinkPreviewResult when resultType is ropewikiPageLinkPreview', () => {
                const body = {
                    resultType: ResultType.RopewikiPageLinkPreview,
                    result: validLinkPreviewResult,
                };
                const parsed = Result.fromResponseBody(body);
                expect(parsed).toBeInstanceOf(RopewikiPageLinkPreviewResult);
                expect(parsed.resultType).toBe(ResultType.RopewikiPageLinkPreview);
                expect(parsed.result).toBeInstanceOf(LinkPreview);
                expect((parsed.result as LinkPreview).title).toBe('T');
                expect((parsed.result as LinkPreview).siteName).toBe('RopeGeo');
                expect((parsed.result as LinkPreview).image).toBeNull();
            });
        });
    });
});
