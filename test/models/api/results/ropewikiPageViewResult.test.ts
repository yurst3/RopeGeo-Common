import { describe, it, expect } from '@jest/globals';
import { RopewikiPageViewResult } from '../../../../src/models/api/results/ropewikiPageViewResult';
import { RopewikiPageView } from '../../../../src/models/api/endpoints/ropewikiPageView';
import { ResultType } from '../../../../src/models/api/results/result';
import { MiniMapType } from '../../../../src/models/minimap/abstract/miniMapType';
import { CenteredRegionMiniMap } from '../../../../src/models/minimap/abstract/centeredRegionMiniMap';
import { OnlinePageMiniMap } from '../../../../src/models/minimap/concrete/onlinePageMiniMap';
import { OnlineCenteredRegionMiniMap } from '../../../../src/models/minimap/concrete/onlineCenteredRegionMiniMap';
import '../../../../src/models/pageViews/registerPageViewParsers';
import '../../../../src/models/minimap/registerMiniMapParsers';
import '../../../../src/models/betaSections/registerBetaSectionParsers';

function validResult(): Record<string, unknown> {
    return {
        id: '550e8400-e29b-41d4-a716-446655440000',
        routeType: 'Canyon',
        pageViewType: 'ropewiki',
        fetchType: 'online',
        name: 'Test Page',
        aka: [],
        url: 'https://ropewiki.com/page',
        quality: 4,
        userVotes: 10,
        regions: [{ id: 'r1', name: 'Region' }],
        difficulty: { technical: null, water: null, time: null, additionalRisk: null },
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
        mapDataId: null,
        bannerImage: null,
        betaSections: [],
        miniMap: null,
        coordinates: null,
    };
}

function validTilesMiniMap() {
    return {
        miniMapType: MiniMapType.Page,
        fetchType: 'online',
        polyLineLayerId: 'PolyLines',
        pointLayerId: 'Points',
        onlineTilesTemplate:
            'https://api.webscraper.ropegeo.com/mapdata/tiles/38f5c3fa-7248-41ed-815e-8b9e6aae5d61/{z}/{x}/{y}.pbf',
        bounds: { north: 39.5, south: 38.1, east: -108.2, west: -110.0 },
        title: 'Route One',
    };
}

const MAP_REGION_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const CENTERED_ROUTE_ID = '38f5c3fa-7248-41ed-815e-8b9e6aae5d61';

function validCenteredMiniMap() {
    return {
        miniMapType: MiniMapType.CenteredRegion,
        fetchType: 'online',
        title: 'Route One',
        centeredRouteId: CENTERED_ROUTE_ID,
        routesParams: {
            region: { source: 'ropewiki', id: MAP_REGION_ID },
        },
    };
}

describe('RopewikiPageViewResult', () => {
    describe('constructor', () => {
        it('sets result and resultType', () => {
            const view = { name: 'P', url: '', quality: 0, userVotes: 0 } as unknown as RopewikiPageView;
            const r = new RopewikiPageViewResult(view);
            expect(r.result).toBe(view);
            expect(r.resultType).toBe(ResultType.RopewikiPageView);
        });
    });

    describe('fromResult', () => {
        it('parses valid result and returns RopewikiPageViewResult with RopewikiPageView', () => {
            const result = validResult();
            const parsed = RopewikiPageViewResult.fromResult(result);
            expect(parsed).toBeInstanceOf(RopewikiPageViewResult);
            expect(parsed.resultType).toBe(ResultType.RopewikiPageView);
            expect(parsed.result).toBeInstanceOf(RopewikiPageView);
            expect(parsed.result.name).toBe('Test Page');
            expect(parsed.result.url).toBe('https://ropewiki.com/page');
            expect(parsed.result.quality).toBe(4);
            expect(parsed.result.userVotes).toBe(10);
        });

        it('throws when result is null', () => {
            expect(() => RopewikiPageViewResult.fromResult(null)).toThrow(
                'RopewikiPageView result must be an object',
            );
        });

        it('throws when result is not an object', () => {
            expect(() => RopewikiPageViewResult.fromResult('string')).toThrow(
                'RopewikiPageView result must be an object',
            );
            expect(() => RopewikiPageViewResult.fromResult(42)).toThrow(
                'RopewikiPageView result must be an object',
            );
        });

        it('throws when required field is invalid', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({ ...validResult(), name: 1 }),
            ).toThrow(/RopewikiPageView\.name must be a string/);
            expect(() =>
                RopewikiPageViewResult.fromResult({ ...validResult(), url: undefined }),
            ).toThrow(/RopewikiPageView\.url must be a string/);
            expect(() =>
                RopewikiPageViewResult.fromResult({ ...validResult(), mapDataId: '' }),
            ).toThrow(/RopewikiPageView\.mapDataId/);
        });

        it('parses miniMap when null', () => {
            const result = validResult();
            const parsed = RopewikiPageViewResult.fromResult(result);
            expect(parsed.result.miniMap).toBeNull();
        });

        it('parses coordinates when null', () => {
            const result = validResult();
            const parsed = RopewikiPageViewResult.fromResult(result);
            expect(parsed.result.coordinates).toBeNull();
        });

        it('parses coordinates when omitted (normalized to null)', () => {
            const result = validResult();
            delete (result as Record<string, unknown>).coordinates;
            const parsed = RopewikiPageViewResult.fromResult(result);
            expect(parsed.result.coordinates).toBeNull();
        });

        it('parses valid numeric coordinates', () => {
            const result = {
                ...validResult(),
                coordinates: { lat: 37.7749, lon: -122.4194 },
            };
            const parsed = RopewikiPageViewResult.fromResult(result);
            expect(parsed.result.coordinates).toEqual({ lat: 37.7749, lon: -122.4194 });
        });

        it('parses coordinates from numeric strings', () => {
            const result = {
                ...validResult(),
                coordinates: { lat: '37.7749', lon: '-122.4194' },
            };
            const parsed = RopewikiPageViewResult.fromResult(result);
            expect(parsed.result.coordinates).toEqual({ lat: 37.7749, lon: -122.4194 });
        });

        it('throws when coordinates is not object or null', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({ ...validResult(), coordinates: 'nope' }),
            ).toThrow(/RopewikiPageView\.coordinates must be \{ lat, lon \} or null/);
        });

        it('throws when coordinates lat/lon are not usable', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({
                    ...validResult(),
                    coordinates: { lat: NaN, lon: 0 },
                }),
            ).toThrow(/RopewikiPageView\.coordinates\.lat and \.lon must be finite/);
        });

        it('parses valid PageMiniMap', () => {
            const result = {
                ...validResult(),
                mapDataId: '38f5c3fa-7248-41ed-815e-8b9e6aae5d61',
                miniMap: validTilesMiniMap(),
            };
            const parsed = RopewikiPageViewResult.fromResult(result);
            expect(parsed.result.miniMap).not.toBeNull();
            expect(parsed.result.mapDataId).toBe('38f5c3fa-7248-41ed-815e-8b9e6aae5d61');
            const mm = parsed.result.miniMap as OnlinePageMiniMap;
            expect(mm.polyLineLayerId).toBe('PolyLines');
            expect(mm.pointLayerId).toBe('Points');
            expect(mm.onlineTilesTemplate).toContain('{z}');
            expect(mm.bounds.north).toBe(39.5);
            expect(mm.title).toBe('Route One');
        });

        it('parses valid CenteredRegionMiniMap', () => {
            const result = { ...validResult(), miniMap: validCenteredMiniMap() };
            const parsed = RopewikiPageViewResult.fromResult(result);
            expect(parsed.result.miniMap).toBeInstanceOf(CenteredRegionMiniMap);
            const cm = parsed.result.miniMap as OnlineCenteredRegionMiniMap;
            expect(cm.centeredRouteId).toBe(CENTERED_ROUTE_ID);
            expect(cm.title).toBe('Route One');
            expect(cm.routesParams.region!.id).toBe(MAP_REGION_ID);
        });

        it('throws when miniMap is not object or null', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({ ...validResult(), miniMap: 'invalid' }),
            ).toThrow(
                /OnlineRopewikiPageView\.miniMap must be object or null/,
            );
        });

        it('throws when miniMap is region geojson shape (wrong type for page)', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({
                    ...validResult(),
                    miniMap: {
                        miniMapType: MiniMapType.Region,
                        fetchType: 'online',
                        title: 'R',
                        bounds: null,
                        routesParams: {
                            region: { source: 'ropewiki', id: MAP_REGION_ID },
                        },
                    },
                }),
            ).toThrow(/OnlineRopewikiPageView\.miniMap must be online page\/centered minimap/);
        });

        it('throws when tilesTemplate string is missing {z}, {x}, or {y}', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({
                    ...validResult(),
                    miniMap: {
                        miniMapType: MiniMapType.Page,
                        fetchType: 'online',
                        polyLineLayerId: 'PolyLines',
                        pointLayerId: 'Points',
                        title: 'T',
                        onlineTilesTemplate: 'https://example.com/tiles/{z}/{x}.pbf',
                        bounds: { north: 39, south: 38, east: -108, west: -110 },
                    },
                }),
            ).toThrow(/OnlinePageMiniMap\.onlineTilesTemplate must contain/);
        });

        it('throws when bounds object is invalid inside miniMap', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({
                    ...validResult(),
                    miniMap: {
                        miniMapType: MiniMapType.Page,
                        fetchType: 'online',
                        polyLineLayerId: 'PolyLines',
                        pointLayerId: 'Points',
                        title: 'T',
                        onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                        bounds: { north: 39, south: 38, east: -108 },
                    },
                }),
            ).toThrow(/Bounds\.west must be a number/);
        });
    });
});
