import { describe, it, expect } from '@jest/globals';
import { strToU8 } from 'fflate';
import { GeoJsonMapFile, KMLMapFile, MapFileParseError } from '../../../src/models';
import { GPX, KML } from './fixtures';

describe('KMLMapFile', () => {
    it('converts placemarks with styles and ExtendedData', () => {
        const geoJsonFile = new KMLMapFile('route.kml', KML).toGeoJson();
        expect(geoJsonFile).toBeInstanceOf(GeoJsonMapFile);
        expect(geoJsonFile.fileName).toBe('route.geojson');
        const [line, point] = geoJsonFile.geoJson.features;
        expect(line!.geometry?.type).toBe('LineString');
        expect(line!.properties).toMatchObject({ name: 'Approach', stroke: '#ff0000', 'ropegeo:style': 'dashed' });
        expect(line!.properties!['stroke-width']).toBe(3);
        expect(point!.geometry).toEqual({ type: 'Point', coordinates: [-109.45, 38.55] });
    });

    it('reads bytes as UTF-8', () => {
        expect(new KMLMapFile('route.kml', strToU8(KML)).toGeoJson().geoJson.features).toHaveLength(2);
    });

    it('returns an empty collection for a file with no features', () => {
        const empty = '<kml xmlns="http://www.opengis.net/kml/2.2"><Document/></kml>';
        expect(new KMLMapFile('empty.kml', empty).toGeoJson().geoJson.features).toEqual([]);
    });

    it('rejects malformed or mismatched XML', () => {
        expect(() => new KMLMapFile('a.kml', 'not xml').toGeoJson()).toThrow(MapFileParseError);
        expect(() => new KMLMapFile('a.kml', GPX).toGeoJson()).toThrow(MapFileParseError);
    });
});
