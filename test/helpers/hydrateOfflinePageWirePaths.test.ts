import { describe, it, expect } from '@jest/globals';
import { hydrateOfflinePageWirePaths } from '../../src/helpers/hydrateOfflinePageWirePaths';

describe('hydrateOfflinePageWirePaths', () => {
    it('rewrites relative paths', () => {
        const node: Record<string, unknown> = {
            fetchType: 'offline',
            bannerImage: {
                downloadedPreviewPath: 'images/a-preview.avif',
                downloadedBannerPath: 'images/a-banner.avif',
                downloadedFullPath: 'images/a-full.avif',
            },
            miniMap: {
                offlineTilesTemplate: 'mapdata/tiles/map-1/{z}/{x}/{y}.pbf',
                downloadedGeojson: 'regions/r1/routes.geojson',
            },
        };
        hydrateOfflinePageWirePaths('file:///root/', node);
        const banner = node.bannerImage as Record<string, string>;
        expect(banner.downloadedPreviewPath).toBe(
            'file:///root/images/a-preview.avif',
        );
        expect(banner.downloadedBannerPath).toBe('file:///root/images/a-banner.avif');
        const miniMap = node.miniMap as Record<string, string>;
        expect(miniMap.offlineTilesTemplate).toBe(
            'file:///root/mapdata/tiles/map-1/{z}/{x}/{y}.pbf',
        );
        expect(miniMap.downloadedGeojson).toBe('file:///root/regions/r1/routes.geojson');
    });

    it('leaves file:// and http paths unchanged', () => {
        const node: Record<string, unknown> = {
            bannerImage: {
                downloadedBannerPath: 'file:///existing/banner.avif',
            },
        };
        hydrateOfflinePageWirePaths('file:///root/', node);
        const banner = node.bannerImage as Record<string, string>;
        expect(banner.downloadedBannerPath).toBe('file:///existing/banner.avif');
    });
});
