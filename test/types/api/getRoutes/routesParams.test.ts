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
            expect(p.source).toBe(PageDataSource.Ropewiki);
            expect(p.region).toBe('region-uuid-123');
        });

        it('accepts both source and region absent (undefined)', () => {
            const p = new RoutesParams(undefined, undefined);
            expect(p.source).toBeUndefined();
            expect(p.region).toBeUndefined();
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

    describe('toQueryStringParams', () => {
        it('returns empty object when both are undefined', () => {
            const p = new RoutesParams(undefined, undefined);
            expect(p.toQueryStringParams()).toEqual({});
        });

        it('returns source and region when both set', () => {
            const p = new RoutesParams(
                PageDataSource.Ropewiki,
                'region-uuid',
            );
            expect(p.toQueryStringParams()).toEqual({
                source: 'ropewiki',
                region: 'region-uuid',
            });
        });
    });

    describe('fromQueryStringParams', () => {
        it('parses empty query as both absent', () => {
            const p = RoutesParams.fromQueryStringParams({});
            expect(p.source).toBeUndefined();
            expect(p.region).toBeUndefined();
        });

        it('parses source and region when both provided', () => {
            const p = RoutesParams.fromQueryStringParams({
                source: 'ropewiki',
                region: 'my-region-id',
            });
            expect(p.source).toBe(PageDataSource.Ropewiki);
            expect(p.region).toBe('my-region-id');
        });

        it('accepts Source and Region (capitalized) keys', () => {
            const p = RoutesParams.fromQueryStringParams({
                Source: 'ropewiki',
                Region: 'region-123',
            });
            expect(p.source).toBe(PageDataSource.Ropewiki);
            expect(p.region).toBe('region-123');
        });

        it('trims whitespace from source and region', () => {
            const p = RoutesParams.fromQueryStringParams({
                source: '  ropewiki  ',
                region: '  region-id  ',
            });
            expect(p.source).toBe(PageDataSource.Ropewiki);
            expect(p.region).toBe('region-id');
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
});
