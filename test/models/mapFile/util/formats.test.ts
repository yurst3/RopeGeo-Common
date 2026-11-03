import { describe, it, expect } from '@jest/globals';
import { mapFileFormatFromFileName } from '../../../../src/models';

describe('mapFileFormatFromFileName', () => {
    it('detects formats by extension', () => {
        expect(mapFileFormatFromFileName('Trip.GPX')).toBe('gpx');
        expect(mapFileFormatFromFileName('a/b/route.kml')).toBe('kml');
        expect(mapFileFormatFromFileName('map.kmz')).toBe('kmz');
        expect(mapFileFormatFromFileName('lines.geojson')).toBe('geojson');
        expect(mapFileFormatFromFileName('lines.json')).toBe('geojson');
        expect(mapFileFormatFromFileName('https://x.com/file.kml?download=1')).toBe('kml');
        expect(mapFileFormatFromFileName('notes.txt')).toBeNull();
        expect(mapFileFormatFromFileName('README')).toBeNull();
    });
});
