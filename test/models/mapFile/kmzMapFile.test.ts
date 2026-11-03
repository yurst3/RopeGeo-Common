import { describe, it, expect } from '@jest/globals';
import { strToU8 } from 'fflate';
import { KMLMapFile, KMZMapFile, MapFileParseError } from '../../../src/models';
import { KML, kmzBytes } from './fixtures';

describe('KMZMapFile', () => {
    it('reads doc.kml, or else the first .kml entry', () => {
        const withDoc = new KMZMapFile(
            'map.kmz',
            kmzBytes({ 'doc.kml': strToU8(KML), 'files/icon.png': new Uint8Array([1, 2]) }),
        );
        expect(withDoc.toKml()).toBeInstanceOf(KMLMapFile);
        expect(withDoc.toKml().fileName).toBe('map.kml');
        expect(withDoc.toGeoJson().geoJson.features).toHaveLength(2);
        const otherName = new KMZMapFile('map.kmz', kmzBytes({ 'route.kml': strToU8(KML) }));
        expect(otherName.toGeoJson().geoJson.features).toHaveLength(2);
    });

    it('rejects archives without KML, invalid zips, and text content', () => {
        const noKml = new KMZMapFile('a.kmz', kmzBytes({ 'readme.txt': strToU8('hi') }));
        expect(() => noKml.toGeoJson()).toThrow(MapFileParseError);
        expect(() => new KMZMapFile('a.kmz', strToU8('not a zip')).toGeoJson()).toThrow(MapFileParseError);
        expect(() => new KMZMapFile('a.kmz', KML)).toThrow(MapFileParseError);
    });
});
