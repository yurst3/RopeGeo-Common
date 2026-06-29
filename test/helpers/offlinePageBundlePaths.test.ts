import { describe, it, expect } from '@jest/globals';
import {
    imageFileRelativePath,
    joinPageRootUri,
    offlineTilesTemplateRelative,
    regionRoutesGeojsonRelativePath,
    tileFileRelativePath,
} from '../../src/helpers/offlinePageBundlePaths';

describe('offlinePageBundlePaths', () => {
    it('builds canonical relative paths', () => {
        expect(imageFileRelativePath('img-1', 'banner', '.avif')).toBe(
            'images/img-1-banner.avif',
        );
        expect(tileFileRelativePath('map-1', 12, 801, 1571)).toBe(
            'mapdata/tiles/map-1/12/801/1571.pbf',
        );
        expect(offlineTilesTemplateRelative('map-1')).toBe(
            'mapdata/tiles/map-1/{z}/{x}/{y}.pbf',
        );
        expect(regionRoutesGeojsonRelativePath('region-1')).toBe(
            'regions/region-1/routes.geojson',
        );
    });

    it('joinPageRootUri composes absolute paths', () => {
        expect(joinPageRootUri('file:///docs/page/', 'images/a-banner.avif')).toBe(
            'file:///docs/page/images/a-banner.avif',
        );
    });
});
