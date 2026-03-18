import { describe, it, expect } from '@jest/globals';
import { PageDataSource } from '../../../../src/types/pageDataSource';
import { RoutesParams } from '../../../../src/types/api/getRoutes/routesParams';

describe('RoutesParams', () => {
    describe('constructor', () => {
        it('accepts both source and region present', () => {
            const p = new RoutesParams(
                PageDataSource.Ropewiki,
                'region-uuid-123',
            );
            expect(p.region).toEqual({
                source: PageDataSource.Ropewiki,
                id: 'region-uuid-123',
            });
        });

        it('accepts both source and region absent (undefined)', () => {
            const p = new RoutesParams(undefined, undefined);
            expect(p.region).toBeNull();
        });

        it('throws when source is present but region is absent', () => {
            expect(
                () => new RoutesParams(PageDataSource.Ropewiki, undefined),
            ).toThrow(
                'Query parameters "source" and "region" must both be present or both be absent',
            );
        });

        it('throws when region is present but source is absent', () => {
            expect(
                () => new RoutesParams(undefined, 'region-id'),
            ).toThrow(
                'Query parameters "source" and "region" must both be present or both be absent',
            );
        });

        it('throws when source is present but region is empty string', () => {
            expect(
                () => new RoutesParams(PageDataSource.Ropewiki, ''),
            ).toThrow(
                'Query parameters "source" and "region" must both be present or both be absent',
            );
        });
    });

    describe('toQueryString', () => {
        it('returns empty string when region is null', () => {
            const p = new RoutesParams(undefined, undefined);
            expect(p.toQueryString()).toBe('');
        });

        it('returns URL-encoded string with source and region when set', () => {
            const p = new RoutesParams(
                PageDataSource.Ropewiki,
                'region-uuid',
            );
            const q = p.toQueryString();
            const params = new URLSearchParams(q);
            expect(params.get('source')).toBe('ropewiki');
            expect(params.get('region')).toBe('region-uuid');
        });
    });

    describe('fromQueryStringParams', () => {
        it('parses empty query as region null', () => {
            const p = RoutesParams.fromQueryStringParams({});
            expect(p.region).toBeNull();
        });

        it('parses source and region when both provided', () => {
            const p = RoutesParams.fromQueryStringParams({
                source: 'ropewiki',
                region: 'my-region-id',
            });
            expect(p.region).toEqual({
                source: PageDataSource.Ropewiki,
                id: 'my-region-id',
            });
        });

        it('accepts Source and Region (capitalized) keys', () => {
            const p = RoutesParams.fromQueryStringParams({
                Source: 'ropewiki',
                Region: 'region-123',
            });
            expect(p.region).toEqual({
                source: PageDataSource.Ropewiki,
                id: 'region-123',
            });
        });

        it('trims whitespace from source and region', () => {
            const p = RoutesParams.fromQueryStringParams({
                source: '  ropewiki  ',
                region: '  region-id  ',
            });
            expect(p.region).toEqual({
                source: PageDataSource.Ropewiki,
                id: 'region-id',
            });
        });

        it('throws when only source is in query', () => {
            expect(() =>
                RoutesParams.fromQueryStringParams({ source: 'ropewiki' }),
            ).toThrow(
                'Query parameters "source" and "region" must both be present or both be absent',
            );
        });

        it('throws when only region is in query', () => {
            expect(() =>
                RoutesParams.fromQueryStringParams({ region: 'region-id' }),
            ).toThrow(
                'Query parameters "source" and "region" must both be present or both be absent',
            );
        });

        it('throws when source is invalid', () => {
            expect(() =>
                RoutesParams.fromQueryStringParams({
                    source: 'invalid',
                    region: 'region-id',
                }),
            ).toThrow(
                'Query parameter "source" must be one of: ropewiki',
            );
        });
    });

    describe('fromResult', () => {
        it('parses empty object as region null when requiredRegion is false', () => {
            const p = RoutesParams.fromResult({});
            expect(p.region).toBeNull();
        });

        it('parses source and region when requiredRegion is false', () => {
            const p = RoutesParams.fromResult({
                source: 'ropewiki',
                region: 'rid-1',
            });
            expect(p.region).toEqual({
                source: PageDataSource.Ropewiki,
                id: 'rid-1',
            });
        });

        it('accepts Source and Region keys', () => {
            const p = RoutesParams.fromResult({
                Source: 'ropewiki',
                Region: 'rid-2',
            });
            expect(p.region!.id).toBe('rid-2');
        });

        it('throws when requiredRegion is true and object is empty', () => {
            expect(() => RoutesParams.fromResult({}, true)).toThrow(
                /source and region must both be non-empty strings when requiredRegion is true/,
            );
        });

        it('throws when requiredRegion is true and region missing', () => {
            expect(() =>
                RoutesParams.fromResult({ source: 'ropewiki' }, true),
            ).toThrow(/source and region must both be non-empty/);
        });

        it('throws when result is not an object', () => {
            expect(() => RoutesParams.fromResult(null)).toThrow(
                'RoutesParams result must be an object',
            );
        });

        it('throws when source is not a string', () => {
            expect(() =>
                RoutesParams.fromResult({ source: 1, region: 'x' }),
            ).toThrow(/RoutesParams\.source must be a string/);
        });

        it('throws when only source set and requiredRegion false', () => {
            expect(() => RoutesParams.fromResult({ source: 'ropewiki' })).toThrow(
                /Query parameters "source" and "region" must both be present/,
            );
        });
    });
});
