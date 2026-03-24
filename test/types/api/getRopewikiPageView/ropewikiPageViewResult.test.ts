import { describe, it, expect } from '@jest/globals';
import { RopewikiPageViewResult } from '../../../../src/types/api/getRopewikiPageView/ropewikiPageViewResult';
import { RopewikiPageView } from '../../../../src/types/api/getRopewikiPageView/ropewikiPageView';
import { ResultType } from '../../../../src/types/results/result';
import { MiniMapType } from '../../../../src/types/minimap/miniMapType';
import type { PageMiniMap } from '../../../../src/types/minimap/pageMiniMap';

function validResult(): Record<string, unknown> {
    return {
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
}

function validTilesMiniMap() {
    return {
        miniMapType: MiniMapType.TilesTemplate,
        layerId: '38f5c3fa-7248-41ed-815e-8b9e6aae5d61',
        tilesTemplate:
            'https://api.webscraper.ropegeo.com/mapdata/tiles/38f5c3fa-7248-41ed-815e-8b9e6aae5d61/{z}/{x}/{y}.pbf',
        bounds: { north: 39.5, south: 38.1, east: -108.2, west: -110.0 },
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
        });

        it('parses miniMap when null', () => {
            const result = validResult();
            const parsed = RopewikiPageViewResult.fromResult(result);
            expect(parsed.result.miniMap).toBeNull();
        });

        it('parses valid PageMiniMap', () => {
            const result = { ...validResult(), miniMap: validTilesMiniMap() };
            const parsed = RopewikiPageViewResult.fromResult(result);
            expect(parsed.result.miniMap).not.toBeNull();
            const mm = parsed.result.miniMap as PageMiniMap;
            expect(mm.layerId).toBe('38f5c3fa-7248-41ed-815e-8b9e6aae5d61');
            expect(mm.tilesTemplate).toContain('{z}');
            expect(mm.bounds.north).toBe(39.5);
        });

        it('throws when miniMap is not object or null', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({ ...validResult(), miniMap: 'invalid' }),
            ).toThrow(/RopewikiPageView\.miniMap must be a PageMiniMap object or null/);
        });

        it('throws when miniMap is region shape (wrong type for page)', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({
                    ...validResult(),
                    miniMap: {
                        miniMapType: MiniMapType.GeoJson,
                        routesParams: {
                            region: { source: 'ropewiki', id: 'x' },
                        },
                    },
                }),
            ).toThrow(/PageMiniMap\.miniMapType must be/);
        });

        it('throws when tilesTemplate string is missing {z}, {x}, or {y}', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({
                    ...validResult(),
                    miniMap: {
                        miniMapType: MiniMapType.TilesTemplate,
                        layerId: 'id',
                        tilesTemplate: 'https://example.com/tiles/{z}/{x}.pbf',
                        bounds: { north: 39, south: 38, east: -108, west: -110 },
                    },
                }),
            ).toThrow(/PageMiniMap\.tilesTemplate must contain/);
        });

        it('throws when bounds object is invalid inside miniMap', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({
                    ...validResult(),
                    miniMap: {
                        miniMapType: MiniMapType.TilesTemplate,
                        layerId: 'id',
                        tilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                        bounds: { north: 39, south: 38, east: -108 },
                    },
                }),
            ).toThrow(/Bounds\.west must be a number/);
        });
    });
});
