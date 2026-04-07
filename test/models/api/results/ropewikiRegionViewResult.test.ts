import { describe, it, expect } from '@jest/globals';
import { RopewikiRegionViewResult } from '../../../../src/models/api/results/ropewikiRegionViewResult';
import { RopewikiRegionView } from '../../../../src/models/api/endpoints/ropewikiRegionView';
import { ResultType } from '../../../../src/models/api/results/result';
import { MiniMapType } from '../../../../src/models/minimap/miniMapType';
import { RegionMiniMap } from '../../../../src/models/minimap/regionMiniMap';

const RID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

function validResult(): Record<string, unknown> {
    return {
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
                region: { source: 'ropewiki', id: RID },
            },
        },
    };
}

describe('RopewikiRegionViewResult', () => {
    describe('constructor', () => {
        it('sets result and resultType', () => {
            const view = {
                name: 'R',
                regions: [],
                regionCount: 0,
                topLevelPageCount: 0,
                pageCount: 0,
                totalPageCount: 0,
                overview: null,
                bestMonths: [],
                isMajorRegion: false,
                latestRevisionDate: new Date(),
                syncDate: new Date(),
                externalLink: 'https://example.com',
                miniMap: RegionMiniMap.fromResult({
                    miniMapType: MiniMapType.GeoJson,
                    routesParams: {
                        region: { source: 'ropewiki', id: RID },
                    },
                }),
            } as unknown as RopewikiRegionView;
            const r = new RopewikiRegionViewResult(view);
            expect(r.result).toBe(view);
            expect(r.resultType).toBe(ResultType.RopewikiRegionView);
        });
    });

    describe('fromResult', () => {
        it('parses valid result and returns RopewikiRegionViewResult with RopewikiRegionView', () => {
            const result = validResult();
            const parsed = RopewikiRegionViewResult.fromResult(result);
            expect(parsed).toBeInstanceOf(RopewikiRegionViewResult);
            expect(parsed.resultType).toBe(ResultType.RopewikiRegionView);
            expect(parsed.result).toBeInstanceOf(RopewikiRegionView);
            expect(parsed.result.name).toBe('Root');
            expect(parsed.result.externalLink).toBe('https://example.com/region');
            expect(parsed.result.regionCount).toBe(0);
            expect(parsed.result.overview).toBeNull();
            expect(parsed.result.bestMonths).toEqual([]);
            expect(parsed.result.isMajorRegion).toBe(false);
        });

        it('parses when miniMap is null', () => {
            const parsed = RopewikiRegionViewResult.fromResult({
                ...validResult(),
                miniMap: null,
            });
            expect(parsed.result.miniMap).toBeNull();
        });

        it('parses result with regions and overview', () => {
            const result = {
                ...validResult(),
                regions: [{ id: 'r1', name: 'World' }],
                overview: {
                    order: 1,
                    title: 'Overview',
                    text: 'Overview text.',
                    images: [],
                    latestRevisionDate: '2025-01-15T00:00:00.000Z',
                },
            };
            const parsed = RopewikiRegionViewResult.fromResult(result);
            expect(parsed.result.regions).toEqual([{ id: 'r1', name: 'World' }]);
            expect(parsed.result.overview).not.toBeNull();
            expect(parsed.result.overview!.title).toBe('Overview');
            expect(parsed.result.overview!.text).toBe('Overview text.');
        });

        it('throws when result is null', () => {
            expect(() => RopewikiRegionViewResult.fromResult(null)).toThrow(
                'RopewikiRegionView result must be an object',
            );
        });

        it('throws when result is not an object', () => {
            expect(() => RopewikiRegionViewResult.fromResult('string')).toThrow(
                'RopewikiRegionView result must be an object',
            );
        });

        it('throws when required field is invalid', () => {
            expect(() =>
                RopewikiRegionViewResult.fromResult({ ...validResult(), name: 1 }),
            ).toThrow(/RopewikiRegionView\.name must be a string/);
            expect(() =>
                RopewikiRegionViewResult.fromResult({ ...validResult(), externalLink: null }),
            ).toThrow(/RopewikiRegionView\.externalLink must be/);
        });
    });
});
