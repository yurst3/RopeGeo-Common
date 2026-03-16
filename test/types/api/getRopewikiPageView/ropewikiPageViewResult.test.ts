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
    });
});
