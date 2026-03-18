import { describe, it, expect } from '@jest/globals';
import { PageDataSource } from '../../../src/types/pageDataSource';
import { PageMiniMap } from '../../../src/types/minimap/pageMiniMap';
import { MiniMap } from '../../../src/types/minimap/miniMap';
import { MiniMapType } from '../../../src/types/minimap/miniMapType';
import { RegionMiniMap } from '../../../src/types/minimap/regionMiniMap';

describe('MiniMap', () => {
    describe('fromResult', () => {
        it('delegates to RegionMiniMap', () => {
            const m = MiniMap.fromResult({
                miniMapType: MiniMapType.GeoJson,
                routesParams: { source: 'ropewiki', region: 'r1' },
            });
            expect(m).toBeInstanceOf(RegionMiniMap);
            expect(m.miniMapType).toBe(MiniMapType.GeoJson);
        });

        it('delegates to PageMiniMap', () => {
            const m = MiniMap.fromResult({
                miniMapType: MiniMapType.TilesTemplate,
                layerId: '38f5c3fa-7248-41ed-815e-8b9e6aae5d61',
                tilesTemplate: 'https://x.com/t/{z}/{x}/{y}.pbf',
                bounds: { north: 40, south: 38, east: -108, west: -110 },
            });
            expect(m).toBeInstanceOf(PageMiniMap);
            expect(m.miniMapType).toBe(MiniMapType.TilesTemplate);
        });

        it('throws when result is not an object', () => {
            expect(() => MiniMap.fromResult(null)).toThrow('MiniMap result must be an object');
        });

        it('throws when miniMapType is invalid', () => {
            expect(() => MiniMap.fromResult({ miniMapType: 'other' })).toThrow(
                /MiniMap\.miniMapType must be one of/,
            );
        });
    });
});

describe('RegionMiniMap', () => {
    const validRoutes = { source: 'ropewiki', region: 'region-uuid' };

    it('fromResult parses valid payload', () => {
        const m = RegionMiniMap.fromResult({
            miniMapType: MiniMapType.GeoJson,
            routesParams: validRoutes,
        });
        expect(m.routesParams.region).toEqual({
            source: PageDataSource.Ropewiki,
            id: 'region-uuid',
        });
    });

    it('throws when miniMapType wrong', () => {
        expect(() =>
            RegionMiniMap.fromResult({
                miniMapType: MiniMapType.TilesTemplate,
                layerId: 'x',
                tilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                bounds: { north: 1, south: 0, east: 1, west: 0 },
            }),
        ).toThrow(/RegionMiniMap\.miniMapType must be/);
    });

    it('throws when routesParams missing', () => {
        expect(() =>
            RegionMiniMap.fromResult({ miniMapType: MiniMapType.GeoJson }),
        ).toThrow(/RegionMiniMap\.routesParams must be an object/);
    });

    it('throws when routesParams incomplete (requiredRegion path)', () => {
        expect(() =>
            RegionMiniMap.fromResult({
                miniMapType: MiniMapType.GeoJson,
                routesParams: { source: 'ropewiki' },
            }),
        ).toThrow();
    });
});

describe('PageMiniMap', () => {
    const validBounds = { north: 39.5, south: 38.1, east: -108.2, west: -110.0 };

    it('fromResult parses valid payload', () => {
        const m = PageMiniMap.fromResult({
            miniMapType: MiniMapType.TilesTemplate,
            layerId: '38f5c3fa-7248-41ed-815e-8b9e6aae5d61',
            tilesTemplate: 'https://api.example.com/tiles/u/{z}/{x}/{y}.pbf',
            bounds: validBounds,
        });
        expect(m.layerId).toBe('38f5c3fa-7248-41ed-815e-8b9e6aae5d61');
        expect(m.bounds.north).toBe(39.5);
    });

    it('throws when miniMapType wrong', () => {
        expect(() =>
            PageMiniMap.fromResult({
                miniMapType: MiniMapType.GeoJson,
                routesParams: { source: 'ropewiki', region: 'x' },
            }),
        ).toThrow(/PageMiniMap\.miniMapType must be/);
    });

    it('throws when layerId empty', () => {
        expect(() =>
            PageMiniMap.fromResult({
                miniMapType: MiniMapType.TilesTemplate,
                layerId: '',
                tilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
                bounds: validBounds,
            }),
        ).toThrow(/PageMiniMap\.layerId/);
    });

    it('throws when tilesTemplate missing placeholders', () => {
        expect(() =>
            PageMiniMap.fromResult({
                miniMapType: MiniMapType.TilesTemplate,
                layerId: 'id',
                tilesTemplate: 'https://x/',
                bounds: validBounds,
            }),
        ).toThrow(/PageMiniMap\.tilesTemplate must contain/);
    });
});
