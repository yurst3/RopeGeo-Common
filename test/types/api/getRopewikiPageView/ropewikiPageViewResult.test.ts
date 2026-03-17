import { describe, it, expect } from '@jest/globals';
import { RopewikiPageViewResult } from '../../../../src/types/api/getRopewikiPageView/ropewikiPageViewResult';
import { RopewikiPageView } from '../../../../src/types/api/getRopewikiPageView/ropewikiPageView';
import { ResultType } from '../../../../src/types/results/result';

function validResult(): Record<string, unknown> {
    return {
        pageId: 'page-1',
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
        tilesTemplate: null,
        bounds: null,
    };
}

describe('RopewikiPageViewResult', () => {
    describe('constructor', () => {
        it('sets result and resultType', () => {
            const view = { pageId: 'p1', name: 'P', url: '', quality: 0, userVotes: 0 } as unknown as RopewikiPageView;
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
            expect(parsed.result.pageId).toBe('page-1');
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
                RopewikiPageViewResult.fromResult({ ...validResult(), pageId: 1 }),
            ).toThrow(/RopewikiPageView\.pageId must be a string/);
            expect(() =>
                RopewikiPageViewResult.fromResult({ ...validResult(), name: undefined }),
            ).toThrow(/RopewikiPageView\.name must be a string/);
        });

        it('parses tilesTemplate when null', () => {
            const result = validResult();
            const parsed = RopewikiPageViewResult.fromResult(result);
            expect(parsed.result.tilesTemplate).toBeNull();
        });

        it('parses valid tilesTemplate with {z}/{x}/{y} placeholders', () => {
            const template =
                'https://api.webscraper.ropegeo.com/mapdata/tiles/38f5c3fa-7248-41ed-815e-8b9e6aae5d61/{z}/{x}/{y}.pbf';
            const result = { ...validResult(), tilesTemplate: template };
            const parsed = RopewikiPageViewResult.fromResult(result);
            expect(parsed.result.tilesTemplate).toBe(template);
        });

        it('throws when tilesTemplate is not string or null', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({ ...validResult(), tilesTemplate: 42 }),
            ).toThrow(/RopewikiPageView\.tilesTemplate must be string or null/);
        });

        it('throws when tilesTemplate string is missing {z}, {x}, or {y} placeholders', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({
                    ...validResult(),
                    tilesTemplate: 'https://example.com/tiles/{z}/{x}.pbf',
                }),
            ).toThrow(/tilesTemplate must contain \{z\}, \{x\}, and \{y\} placeholders/);
            expect(() =>
                RopewikiPageViewResult.fromResult({
                    ...validResult(),
                    tilesTemplate: 'https://example.com/tiles/',
                }),
            ).toThrow(/tilesTemplate must contain \{z\}, \{x\}, and \{y\} placeholders/);
        });

        it('parses bounds when null', () => {
            const result = validResult();
            const parsed = RopewikiPageViewResult.fromResult(result);
            expect(parsed.result.bounds).toBeNull();
        });

        it('parses valid bounds with north, south, east, west', () => {
            const bounds = { north: 39.5, south: 38.1, east: -108.2, west: -110.0 };
            const result = { ...validResult(), bounds };
            const parsed = RopewikiPageViewResult.fromResult(result);
            expect(parsed.result.bounds).not.toBeNull();
            expect(parsed.result.bounds!.north).toBe(39.5);
            expect(parsed.result.bounds!.south).toBe(38.1);
            expect(parsed.result.bounds!.east).toBe(-108.2);
            expect(parsed.result.bounds!.west).toBe(-110.0);
        });

        it('throws when bounds is not object or null', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({ ...validResult(), bounds: 'invalid' }),
            ).toThrow(/RopewikiPageView\.bounds must be Bounds or null/);
        });

        it('throws when bounds object is missing required number property', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({
                    ...validResult(),
                    bounds: { north: 39, south: 38, east: -108 },
                }),
            ).toThrow(/Bounds\.west must be a number/);
        });

        it('throws when bounds property is not a number', () => {
            expect(() =>
                RopewikiPageViewResult.fromResult({
                    ...validResult(),
                    bounds: { north: '39', south: 38, east: -108, west: -110 },
                }),
            ).toThrow(/Bounds\.north must be a number/);
        });
    });
});
