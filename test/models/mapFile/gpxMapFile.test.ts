import { describe, it, expect } from '@jest/globals';
import { GPXMapFile, MapFileParseError } from '../../../src/models';
import { GPX, KML } from './fixtures';

describe('GPXMapFile', () => {
    it('converts tracks and waypoints, restoring ropegeo values', () => {
        const geoJsonFile = new GPXMapFile('trip.gpx', GPX).toGeoJson();
        expect(geoJsonFile.fileName).toBe('trip.geojson');
        const { geoJson } = geoJsonFile;
        const track = geoJson.features.find((f) => f.geometry?.type === 'LineString')!;
        expect(track.properties).toMatchObject({ name: 'Exit', stroke: '#00ff00', 'ropegeo:color': 'green' });
        expect(track.properties!['ropegeo_color']).toBeUndefined();
        expect((track.geometry as { coordinates: number[][] }).coordinates[0]).toEqual([-109.5, 38.5, 1500]);
        const waypoint = geoJson.features.find((f) => f.geometry?.type === 'Point')!;
        expect(waypoint.properties!.name).toBe('Parking');
    });

    it('rejects malformed or mismatched XML', () => {
        expect(() => new GPXMapFile('a.gpx', 'not xml').toGeoJson()).toThrow(MapFileParseError);
        expect(() => new GPXMapFile('a.gpx', KML).toGeoJson()).toThrow(MapFileParseError);
    });
});
