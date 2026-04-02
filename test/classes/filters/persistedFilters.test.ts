import { describe, it, expect } from '@jest/globals';
import {
    AcaDifficultyFilterOptions,
    AcaDifficultyParams,
    AcaRiskRating,
    AcaTechnicalRating,
    AcaTimeRating,
    AcaWaterRating,
    DifficultyFilterOptions,
    PageDataSource,
    RiskMinMax,
    RouteFilter,
    RouteType,
    SavedFilters,
    SavedPagesFilter,
    SearchFilter,
    TechnicalMinMax,
    TimeMinMax,
    WaterMinMax,
} from '../../../src/classes';

const rid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function sampleAcaFilterOptions(): AcaDifficultyFilterOptions {
    return new AcaDifficultyFilterOptions(
        new TechnicalMinMax(AcaTechnicalRating.One, AcaTechnicalRating.Two),
        new WaterMinMax(AcaWaterRating.A, AcaWaterRating.C),
        new TimeMinMax(AcaTimeRating.I, AcaTimeRating.II),
        new RiskMinMax(AcaRiskRating.G, AcaRiskRating.PG),
    );
}

describe('MinMax constructors', () => {
    it('throws when technical min > max', () => {
        expect(
            () =>
                new TechnicalMinMax(
                    AcaTechnicalRating.Three,
                    AcaTechnicalRating.One,
                ),
        ).toThrow(/must not be greater than max/);
    });

    it('throws when water min > max', () => {
        expect(
            () =>
                new WaterMinMax(AcaWaterRating.C, AcaWaterRating.A),
        ).toThrow(/must not be greater than max/);
    });

    it('throws when time min > max', () => {
        expect(
            () =>
                new TimeMinMax(AcaTimeRating.VI, AcaTimeRating.I),
        ).toThrow(/must not be greater than max/);
    });

    it('throws when risk min > max', () => {
        expect(
            () => new RiskMinMax(AcaRiskRating.R, AcaRiskRating.G),
        ).toThrow(/must not be greater than max/);
    });
});

describe('AcaDifficultyFilterOptions', () => {
    it('toDifficultyParams expands inclusive ranges', () => {
        const f = new AcaDifficultyFilterOptions(
            new TechnicalMinMax(AcaTechnicalRating.One, AcaTechnicalRating.Two),
            new WaterMinMax(AcaWaterRating.C, AcaWaterRating.C),
            new TimeMinMax(AcaTimeRating.I, AcaTimeRating.I),
            new RiskMinMax(AcaRiskRating.G, AcaRiskRating.G),
        );
        const p = f.toDifficultyParams();
        expect(p.technical).toEqual([
            AcaTechnicalRating.One,
            AcaTechnicalRating.Two,
        ]);
        expect(p.water).toEqual([AcaWaterRating.C]);
        expect(p.time).toEqual([AcaTimeRating.I]);
        expect(p.risk).toEqual([AcaRiskRating.G]);
    });

    it('toJSON and DifficultyFilterOptions.fromResult round-trip', () => {
        const orig = sampleAcaFilterOptions();
        const again = DifficultyFilterOptions.fromResult(
            orig.toJSON(),
        ) as AcaDifficultyFilterOptions;
        expect(again.toJSON()).toEqual(orig.toJSON());
    });

    it('fromResult allows omitted difficultyType (defaults to ACA)', () => {
        const j = {
            technical: { min: '1', max: '1' },
            water: { min: 'A', max: 'A' },
            time: { min: 'I', max: 'I' },
            risk: { min: 'G', max: 'G' },
        };
        const f = AcaDifficultyFilterOptions.fromResult(j);
        expect(f.difficultyType).toBe('ACA');
        expect(f.technical.min).toBe(AcaTechnicalRating.One);
    });

    it('fromResult rejects wrong difficultyType', () => {
        expect(() =>
            AcaDifficultyFilterOptions.fromResult({
                difficultyType: 'SPORT',
                technical: { min: '1', max: '1' },
                water: { min: 'A', max: 'A' },
                time: { min: 'I', max: 'I' },
                risk: { min: 'G', max: 'G' },
            }),
        ).toThrow(/must be ACA/);
    });
});

describe('DifficultyFilterOptions.fromResult', () => {
    it('throws when result is not an object', () => {
        expect(() => DifficultyFilterOptions.fromResult(null)).toThrow(
            /must be an object/,
        );
    });

    it('throws on unknown difficultyType string', () => {
        expect(() =>
            DifficultyFilterOptions.fromResult({
                difficultyType: 'UNKNOWN',
                technical: { min: '1', max: '1' },
                water: { min: 'A', max: 'A' },
                time: { min: 'I', max: 'I' },
                risk: { min: 'G', max: 'G' },
            }),
        ).toThrow(/Unknown difficultyType/);
    });

    it('throws when difficultyType is not string or null', () => {
        expect(() =>
            DifficultyFilterOptions.fromResult({
                difficultyType: 1,
                technical: { min: '1', max: '1' },
                water: { min: 'A', max: 'A' },
                time: { min: 'I', max: 'I' },
                risk: { min: 'G', max: 'G' },
            }),
        ).toThrow(/must be a string or null/);
    });
});

describe('RouteFilter', () => {
    it('toRoutesParams maps region and difficulty params', () => {
        const rf = new RouteFilter(
            [PageDataSource.Ropewiki],
            rid,
            RouteType.Canyon,
            sampleAcaFilterOptions(),
        );
        const rp = rf.toRoutesParams();
        expect(rp.region).toEqual({
            id: rid,
            source: [PageDataSource.Ropewiki],
        });
        expect(rp.routeType).toBe(RouteType.Canyon);
        expect(rp.difficulty).toBeInstanceOf(AcaDifficultyParams);
        expect(rp.difficulty!.isActive()).toBe(true);
    });

    it('throws when source set without regionId', () => {
        const rf = new RouteFilter([PageDataSource.Ropewiki], null, null, null);
        expect(() => rf.toRoutesParams()).toThrow(/regionId/);
    });

    it('fromJSON and toJSON round-trip', () => {
        const orig = new RouteFilter(
            null,
            rid,
            RouteType.Canyon,
            sampleAcaFilterOptions(),
        );
        const again = RouteFilter.fromJSON(orig.toJSON());
        expect(again.toJSON()).toEqual(orig.toJSON());
    });

    it('fromJsonString parses valid JSON', () => {
        const j = JSON.stringify({
            source: null,
            regionId: rid,
            routeType: 'Canyon',
            difficultyOptions: null,
        });
        const rf = RouteFilter.fromJsonString(j);
        expect(rf.regionId).toBe(rid);
        expect(rf.routeType).toBe(RouteType.Canyon);
    });

    it('fromJsonString throws on invalid JSON', () => {
        expect(() => RouteFilter.fromJsonString('not json')).toThrow(
            /invalid JSON/,
        );
    });

    it('fromJSON throws on non-object', () => {
        expect(() => RouteFilter.fromJSON(null)).toThrow(/JSON object/);
    });

    it('fromJSON throws on invalid source entry', () => {
        expect(() =>
            RouteFilter.fromJSON({ source: ['nope'], regionId: null }),
        ).toThrow(/Invalid PageDataSource/);
    });
});

describe('SearchFilter', () => {
    it('defaults to similarity when name is non-empty', () => {
        const f = new SearchFilter(null, 'query');
        expect(f.order).toBe('similarity');
        expect(f.includeRegions).toBe(true);
    });

    it('defaults to distance when name empty and position set', () => {
        const f = new SearchFilter({ lat: 1, lon: 2 }, '');
        expect(f.order).toBe('distance');
        expect(f.includeRegions).toBe(false);
    });

    it('defaults to quality when no name and no position', () => {
        const f = new SearchFilter(null, null);
        expect(f.order).toBe('quality');
    });

    it('setIncludePages false with difficulty throws', () => {
        const f = new SearchFilter(null, 'x');
        f.setDifficultyOptions(sampleAcaFilterOptions());
        expect(() => f.setIncludePages(false)).toThrow(/clear difficulty/);
    });

    it('setSimilarityThreshold rejects out of range', () => {
        const f = new SearchFilter(null, 'x');
        expect(() => f.setSimilarityThreshold(1.5)).toThrow(/0 and 1/);
    });

    it('setDifficultyOptions forces includePages true', () => {
        const f = new SearchFilter(null, null);
        f.setIncludePages(false);
        f.setIncludeRegions(true);
        f.setIncludeAka(false);
        f.setDifficultyOptions(sampleAcaFilterOptions());
        expect(f.includePages).toBe(true);
    });

    it('toSearchParams passes active difficulty', () => {
        const f = new SearchFilter(null, 'test');
        f.setDifficultyOptions(sampleAcaFilterOptions());
        const sp = f.toSearchParams({ name: '  trimmed  ', limit: 10 });
        expect(sp.name).toBe('trimmed');
        expect(sp.difficulty).not.toBeNull();
        expect(sp.difficulty!.isActive()).toBe(true);
    });

    it('fromJSON restores fields', () => {
        const f = new SearchFilter({ lat: 10, lon: -20 }, null);
        f.setOrder('quality');
        f.setSimilarityThreshold(0.25);
        f.setSource([PageDataSource.Ropewiki]);
        const again = SearchFilter.fromJSON(f.toJSON());
        expect(again.order).toBe('quality');
        expect(again.similarityThreshold).toBe(0.25);
        expect(again.source).toEqual([PageDataSource.Ropewiki]);
        expect(again.currentPosition).toEqual({ lat: 10, lon: -20 });
    });

    it('fromJsonString throws on bad JSON', () => {
        expect(() => SearchFilter.fromJsonString('{')).toThrow(/invalid JSON/);
    });

    it('fromJSON throws on invalid order', () => {
        expect(() => SearchFilter.fromJSON({ order: 'bogus' })).toThrow(
            /Invalid SearchFilter.order/,
        );
    });
});

describe('SavedFilters', () => {
    it('fromJSON hydrates explore and search', () => {
        const explore = new RouteFilter(null, rid, RouteType.Canyon, null);
        const search = new SearchFilter(null, 'q');
        const raw = {
            explore: explore.toJSON(),
            search: search.toJSON(),
            savedPages: null,
        };
        const sf = SavedFilters.fromJSON(raw);
        expect(sf.explore!.regionId).toBe(rid);
        expect(sf.search!.order).toBe('similarity');
    });

    it('ignores legacy saved key without assigning search', () => {
        const sf = SavedFilters.fromJSON({
            saved: { order: 'quality' },
            search: null,
        });
        expect(sf.search).toBeNull();
    });

    it('toJSON round-trip', () => {
        const orig = new SavedFilters(
            new RouteFilter(null, rid, null, null),
            new SearchFilter(null, 'x'),
            null,
        );
        const again = SavedFilters.fromJSON(orig.toJSON());
        expect(again.toJSON()).toEqual(orig.toJSON());
    });

    it('fromJsonString throws on invalid JSON', () => {
        expect(() => SavedFilters.fromJsonString('')).toThrow(/invalid JSON/);
    });
});

describe('SavedPagesFilter', () => {
    it('defaultFilter matches documented defaults', () => {
        const d = SavedPagesFilter.defaultFilter();
        expect(d.name).toBeNull();
        expect(d.includeAka).toBe(true);
        expect(d.order).toBe('newest');
        expect(d.difficultyOptions).toBeNull();
    });

    it('fromJSON and toJSON round-trip', () => {
        const f = new SavedPagesFilter('hello', false, 'oldest', null);
        const again = SavedPagesFilter.fromJSON(f.toJSON());
        expect(again.toJSON()).toEqual(f.toJSON());
    });

    it('fromJSON throws on invalid order', () => {
        expect(() =>
            SavedPagesFilter.fromJSON({ order: 'soonest' }),
        ).toThrow(/Invalid SavedPagesFilter.order/);
    });

    it('setName trims and clears empty', () => {
        const f = new SavedPagesFilter();
        f.setName('  x  ');
        expect(f.name).toBe('x');
        f.setName('   ');
        expect(f.name).toBeNull();
    });
});
