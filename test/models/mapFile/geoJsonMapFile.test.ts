import { describe, it, expect } from '@jest/globals';
import { GeoJsonMapFile, MapFileParseError } from '../../../src/models';

const point = { type: 'Point', coordinates: [1, 2] };
const feature = { type: 'Feature', properties: { name: 'A' }, geometry: point };

describe('GeoJsonMapFile', () => {
    it('normalizes FeatureCollections, Features, and bare Geometries', () => {
        expect(GeoJsonMapFile.parse('a.geojson', JSON.stringify(point)).geoJson.features).toEqual([
            { type: 'Feature', properties: {}, geometry: point },
        ]);
        expect(GeoJsonMapFile.parse('a.geojson', JSON.stringify(feature)).geoJson.features).toEqual([feature]);
        const collection = { type: 'FeatureCollection', features: [feature, { type: 'Nope' }] };
        expect(GeoJsonMapFile.parse('a.geojson', JSON.stringify(collection)).geoJson.features).toEqual([feature]);
    });

    it('rejects invalid GeoJSON', () => {
        expect(() => GeoJsonMapFile.parse('a.geojson', '{')).toThrow(MapFileParseError);
        expect(() => GeoJsonMapFile.parse('a.geojson', '{"type":"Topology"}')).toThrow(MapFileParseError);
    });

    it('returns itself from toGeoJson and computes bounds', () => {
        const file = GeoJsonMapFile.parse('a.geojson', JSON.stringify(feature));
        expect(file.toGeoJson()).toBe(file);
        expect(file.bounds).toMatchObject({ north: 2, south: 2, east: 1, west: 1 });
    });
});
