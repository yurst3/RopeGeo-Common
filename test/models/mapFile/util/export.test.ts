import { describe, it, expect } from '@jest/globals';
import type { FeatureCollection } from 'geojson';
import { exportMapFile, MapFile, type MapFileExportFormat } from '../../../../src/models';

function readBack(fileName: string, content: string): FeatureCollection {
    return MapFile.fromContent(fileName, content).toGeoJson().geoJson;
}
import { nearestGarminDisplayColor, parseHexColor, rgbToKmlColor } from '../../../../src/models/mapFile/util/export/color';

const segments: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: {
                name: 'Segment 1 & <friends>',
                stroke: '#ef4444',
                'stroke-width': 4,
                'ropegeo:id': 'segment-1',
                'ropegeo:color': 'red',
                'ropegeo:style': 'dashed',
                'ropegeo:thickness': 'medium',
            },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-109.5508, 38.5733],
                    [-109.5501, 38.574, 1250.5],
                    [-109.549, 38.5752],
                ],
            },
        },
        {
            type: 'Feature',
            properties: { name: 'Anchor', 'ropegeo:id': 'segment-2' },
            geometry: { type: 'Point', coordinates: [-109.5, 38.5] },
        },
    ],
};

function lineFeature(fc: FeatureCollection) {
    return fc.features.find((f) => f.geometry?.type === 'LineString')!;
}

describe('exportMapFile', () => {
    it.each<MapFileExportFormat>(['gpx', 'kml', 'geojson'])('round-trips %s', (format) => {
        const content = exportMapFile(segments, format, { documentName: 'My Trip' });
        const parsed = readBack(`trip.${format}`, content);
        expect(parsed.features).toHaveLength(2);

        const line = lineFeature(parsed);
        expect(line.properties).toMatchObject({
            name: 'Segment 1 & <friends>',
            stroke: '#ef4444',
            'ropegeo:id': 'segment-1',
            'ropegeo:color': 'red',
            'ropegeo:style': 'dashed',
            'ropegeo:thickness': 'medium',
        });
        expect(Number(line.properties!['stroke-width'])).toBeCloseTo(4, 2);
        expect((line.geometry as { coordinates: number[][] }).coordinates).toEqual([
            [-109.5508, 38.5733],
            [-109.5501, 38.574, 1250.5],
            [-109.549, 38.5752],
        ]);

        const point = parsed.features.find((f) => f.geometry?.type === 'Point')!;
        expect(point.properties).toMatchObject({ name: 'Anchor', 'ropegeo:id': 'segment-2' });
        expect(point.geometry).toEqual({ type: 'Point', coordinates: [-109.5, 38.5] });
    });

    it('writes GPX style and Garmin color extensions', () => {
        const gpx = exportMapFile(segments, 'gpx');
        expect(gpx).toContain(
            '<line xmlns="http://www.topografix.com/GPX/gpx_style/0/2"><color>ef4444</color><width>1.058</width></line>',
        );
        expect(gpx).toContain('<gpxx:DisplayColor>Red</gpxx:DisplayColor>');
        expect(gpx).toContain('<ropegeo:style>dashed</ropegeo:style>');
    });

    it('writes polygons as closed GPX tracks and KML polygons', () => {
        const ring = [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
        ];
        const area: FeatureCollection = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: { name: 'Area', fill: '#00ff00' },
                    geometry: { type: 'Polygon', coordinates: [ring] },
                },
            ],
        };
        const fromGpx = readBack('area.gpx', exportMapFile(area, 'gpx'));
        expect(fromGpx.features[0]!.geometry).toEqual({ type: 'LineString', coordinates: ring });
        const fromKml = readBack('area.kml', exportMapFile(area, 'kml'));
        expect(fromKml.features[0]!.geometry).toEqual({ type: 'Polygon', coordinates: [ring] });
        expect(fromKml.features[0]!.properties!.fill).toBe('#00ff00');
    });
});

describe('colors', () => {
    it('converts to KML aabbggrr', () => {
        expect(rgbToKmlColor(parseHexColor('#ef4444')!)).toBe('ff4444ef');
        expect(rgbToKmlColor(parseHexColor('#f00')!, 0.5)).toBe('800000ff');
    });

    it('picks the nearest Garmin display color', () => {
        expect(nearestGarminDisplayColor(parseHexColor('#000000')!)).toBe('Black');
        expect(nearestGarminDisplayColor(parseHexColor('#1010f0')!)).toBe('Blue');
        expect(nearestGarminDisplayColor(parseHexColor('#ef4444')!)).toBe('Red');
        expect(nearestGarminDisplayColor(parseHexColor('#ffffff')!)).toBe('White');
    });

    it('rejects non-hex colors', () => {
        expect(parseHexColor('red')).toBeNull();
        expect(parseHexColor(undefined)).toBeNull();
    });
});
