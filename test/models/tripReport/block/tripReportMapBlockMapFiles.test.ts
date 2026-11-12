import { describe, it, expect } from '@jest/globals';
import type { FeatureCollection } from 'geojson';
import {
    EnrichedGeoJsonMapFile,
    exportMapFile,
    LEGEND_ID_PROPERTY,
    MapFile,
    type MapFileExportFormat,
} from '../../../../src/models';
import {
    PointLegendItem,
    TripReportMapBlock,
    TripReportMarker,
    TripReportMarkerStyle,
} from '../../../../src/models';

const KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
<Placemark>
  <name>Approach</name>
  <Style><LineStyle><color>ff0000ff</color><width>6</width></LineStyle></Style>
  <ExtendedData><Data name="ropegeo:style"><value>dashed</value></Data></ExtendedData>
  <LineString><coordinates>-109.5,38.5 -109.4,38.6,1500</coordinates></LineString>
</Placemark>
<Placemark>
  <LineString><coordinates>-109.3,38.5 -109.2,38.6</coordinates></LineString>
</Placemark>
<Placemark>
  <name>Rappel 1</name>
  <Point><coordinates>-109.45,38.55</coordinates></Point>
</Placemark>
<Placemark>
  <name>Pool</name>
  <Polygon><outerBoundaryIs><LinearRing><coordinates>0,0 1,0 1,1 0,0</coordinates></LinearRing></outerBoundaryIs></Polygon>
</Placemark>
</Document>
</kml>`;

function enrichedKml(fileName = 'canyon.kml'): EnrichedGeoJsonMapFile {
    return MapFile.fromContent(fileName, KML).toGeoJson().enrich();
}

describe('TripReportMapBlock.withMapFileImported', () => {
    it('turns lines into segments, points into markers, and keeps polygons as features', () => {
        const block = TripReportMapBlock.createEmpty().withMapFileImported(enrichedKml());

        expect(block.segments.map((s) => s.name)).toEqual(['Approach', 'Segment 1']);
        const [approach, unnamed] = block.segments;
        expect(approach).toMatchObject({
            color: '#ff0000',
            originalColor: '#ff0000',
            style: 'dashed',
            thickness: 'thick',
        });
        expect(approach!.waypoints).toEqual([
            [-109.5, 38.5],
            [-109.4, 38.6],
        ]);
        expect(unnamed).toMatchObject({ color: 'black', originalColor: null, style: 'solid', thickness: 'medium' });
        expect(block.nextSegmentNumber).toBe(2);

        expect(block.markers).toHaveLength(1);
        expect(block.markers[0]).toBeInstanceOf(TripReportMarker);
        expect(block.markers[0]).toMatchObject({
            name: 'Rappel 1',
            position: [-109.45, 38.55],
            color: 'black',
            originalColor: null,
            style: TripReportMarkerStyle.Marker,
        });
        expect(block.nextMarkerNumber).toBe(1);

        expect(block.features.map((f) => f.geometry?.type)).toEqual(['Polygon']);
        const ids = block.features.map((f) => f.properties![LEGEND_ID_PROPERTY] as string);
        expect(Object.keys(block.legend)).toEqual(ids);
        expect(block.legend[ids[0]!]!.name).toBe('Pool');
    });

    it('uses the legend id as the marker id and names unnamed points "Marker N"', () => {
        const collection: FeatureCollection = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [-110, 38] } },
                {
                    type: 'Feature',
                    properties: { 'marker-color': '#2563eb' },
                    geometry: { type: 'Point', coordinates: [-110.1, 38.1] },
                },
            ],
        };
        const file = new EnrichedGeoJsonMapFile('points.geojson', collection);
        const block = TripReportMapBlock.createEmpty().withMapFileImported(file, { newSegmentColor: 'white' });
        expect(block.markers.map((m) => [m.name, m.color, m.originalColor])).toEqual([
            ['Marker 1', 'white', null],
            ['Marker 2', '#2563eb', '#2563eb'],
        ]);
        expect(block.markers.map((m) => m.id)).toEqual(
            file.geoJson.features.map((f) => f.properties![LEGEND_ID_PROPERTY]),
        );
        expect(block.nextMarkerNumber).toBe(3);
        expect(block.markers.every((m) => block.hasId(m.id))).toBe(true);
    });

    it('uses the legend id as the segment id so the file maps back to the block', () => {
        const file = enrichedKml();
        const block = TripReportMapBlock.createEmpty().withMapFileImported(file);
        const lineIds = file.geoJson.features
            .filter((f) => f.geometry?.type === 'LineString')
            .map((f) => f.properties![LEGEND_ID_PROPERTY]);
        expect(block.segments.map((s) => s.id)).toEqual(lineIds);
        expect(block.segments.every((s) => block.hasId(s.id))).toBe(true);
    });

    it('adds nothing when the same file is imported again, even after edits', () => {
        const once = TripReportMapBlock.createEmpty().withMapFileImported(enrichedKml());
        const edited = once.withSegmentUpdated(once.segments[0]!.id, (s) => s.withName('Renamed').withColor('blue'));
        const twice = edited.withMapFileImported(enrichedKml());
        expect(twice.segments).toEqual(edited.segments);
        expect(twice.markers).toEqual(edited.markers);
        expect(twice.features).toEqual(edited.features);
        expect(twice.legend).toEqual(edited.legend);
        expect(twice.nextSegmentNumber).toBe(edited.nextSegmentNumber);
    });

    it('treats a differently named copy as new features', () => {
        const block = TripReportMapBlock.createEmpty()
            .withMapFileImported(enrichedKml('canyon.kml'))
            .withMapFileImported(enrichedKml('canyon (1).kml'));
        expect(block.segments).toHaveLength(4);
        expect(block.markers).toHaveLength(2);
        expect(block.features).toHaveLength(2);
    });

    it('inserts imported segments before the active segment', () => {
        const recording = TripReportMapBlock.createEmpty().withWaypointAppendedToActive([-110, 38]);
        const active = recording.activeSegment!;
        const block = recording.withMapFileImported(enrichedKml());
        expect(block.activeSegment).toBe(active);
        expect(block.segments.map((s) => s.name)).toEqual(['Approach', 'Segment 2', 'Segment 1']);
    });

    it('uses newSegmentColor for lines without a color', () => {
        const block = TripReportMapBlock.createEmpty().withMapFileImported(enrichedKml(), {
            newSegmentColor: 'white',
        });
        expect(block.segments.map((s) => s.color)).toEqual(['#ff0000', 'white']);
    });

    it('drops features without a legend id', () => {
        const collection: FeatureCollection = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', properties: {}, geometry: { type: 'GeometryCollection', geometries: [] } },
            ],
        };
        const block = TripReportMapBlock.createEmpty().withMapFileImported(
            new EnrichedGeoJsonMapFile('empty.geojson', collection),
        );
        expect(block.segments).toEqual([]);
        expect(block.features).toEqual([]);
    });

    it('removes an imported feature with its legend item', () => {
        const block = TripReportMapBlock.createEmpty().withMapFileImported(enrichedKml());
        const id = block.features[0]!.properties![LEGEND_ID_PROPERTY] as string;
        const removed = block.withFeatureRemoved(id);
        expect(removed.features).toHaveLength(0);
        expect(removed.legend[id]).toBeUndefined();
        expect(removed.hasId(id)).toBe(false);
    });
});

describe('TripReportMapBlock.toEnrichedGeoJsonMapFile', () => {
    const block = TripReportMapBlock.createEmpty()
        .withWaypointAppendedToActive([-110, 38])
        .withWaypointAppendedToActive([-110.1, 38.1])
        .withMapFileImported(enrichedKml());

    function exportAndReimport(format: MapFileExportFormat): EnrichedGeoJsonMapFile {
        const content = exportMapFile(block.toEnrichedGeoJsonMapFile(`trip.${format}`).geoJson, format);
        return MapFile.fromContent(`trip.${format}`, content).toGeoJson().enrich();
    }

    function segmentSummary(target: TripReportMapBlock) {
        return target.segments.map((s) => [s.id, s.name, s.color, s.style, s.thickness, s.waypoints]);
    }

    function markerSummary(target: TripReportMapBlock) {
        return target.markers.map((m) => [m.id, m.name, m.position, m.color, m.style]);
    }

    it('combines segments and imported features into one enriched file', () => {
        const file = block.toEnrichedGeoJsonMapFile('My Trip.geojson');
        expect(file).toBeInstanceOf(EnrichedGeoJsonMapFile);
        expect(file.fileName).toBe('My Trip.geojson');
        expect(file.geoJson.features.map((f) => f.geometry?.type)).toEqual([
            'LineString',
            'LineString',
            'LineString',
            'Point',
            'Polygon',
        ]);
        expect(Object.keys(file.legend)).toHaveLength(5);
        const recorded = file.geoJson.features[2]!.properties!;
        expect(recorded).toMatchObject({
            name: 'Segment 1',
            stroke: '#000000',
            'stroke-width': 4,
            'ropegeo:id': block.activeSegment!.id,
            'ropegeo:style': 'solid',
        });
    });

    it('leaves out segments without waypoints', () => {
        const empty = TripReportMapBlock.createEmpty().withNewSegment();
        expect(empty.toEnrichedGeoJsonMapFile('a.geojson').geoJson.features).toEqual([]);
    });

    it.each<MapFileExportFormat>(['gpx', 'kml', 'geojson'])(
        're-importing a %s export into the same block adds nothing',
        (format) => {
            const same = block.withMapFileImported(exportAndReimport(format));
            expect(same.segments).toEqual(block.segments);
            expect(same.markers).toEqual(block.markers);
            expect(same.features).toEqual(block.features);
            expect(same.legend).toEqual(block.legend);
        },
    );

    it.each<MapFileExportFormat>(['kml', 'geojson'])(
        'a %s export imported into a new block reproduces the block',
        (format) => {
            const copy = TripReportMapBlock.createEmpty().withMapFileImported(exportAndReimport(format));
            expect(segmentSummary(copy)).toEqual(segmentSummary(block));
            expect(markerSummary(copy)).toEqual(markerSummary(block));
            expect(copy.features.map((f) => f.geometry)).toEqual(block.features.map((f) => f.geometry));
            expect(Object.keys(copy.legend).sort()).toEqual(Object.keys(block.legend).sort());
        },
    );

    it('a GPX export imported into a new block turns polygons into segments (GPX has no polygons)', () => {
        const copy = TripReportMapBlock.createEmpty().withMapFileImported(exportAndReimport('gpx'));
        const poolId = Object.entries(block.legend).find(([, item]) => item.name === 'Pool')![0];
        expect(segmentSummary(copy).slice(0, block.segments.length)).toEqual(segmentSummary(block));
        expect(copy.segments.at(-1)).toMatchObject({ id: poolId, name: 'Pool' });
        expect(markerSummary(copy)).toEqual(markerSummary(block));
        expect(copy.features).toEqual([]);
    });

    it('writes markers with their color and RopeGeo values, and KML keeps the color for other apps', () => {
        const styled = block.withMarkerUpdated(block.markers[0]!.id, (m) =>
            m.withColor('blue').withStyle(TripReportMarkerStyle.Camera),
        );
        const markerFeature = styled
            .toEnrichedGeoJsonMapFile('trip.geojson')
            .geoJson.features.find((f) => f.geometry?.type === 'Point')!;
        expect(markerFeature.properties).toMatchObject({
            name: 'Rappel 1',
            'marker-color': '#3b82f6',
            'ropegeo:color': 'blue',
            'ropegeo:style': 'camera',
        });

        const kml = exportMapFile(styled.toEnrichedGeoJsonMapFile('trip.kml').geoJson, 'kml');
        expect(kml).toContain('<IconStyle><color>fff6823b</color></IconStyle>');
        // Without RopeGeo's own color, the KML icon color comes back as the exact color.
        const plainKml = kml.replace(/<Data name="ropegeo:color">.*?<\/Data>/g, '');
        const reimported = TripReportMapBlock.createEmpty().withMapFileImported(
            MapFile.fromContent('trip.kml', plainKml).toGeoJson().enrich(),
        );
        expect(reimported.markers[0]).toMatchObject({
            color: '#3b82f6',
            originalColor: '#3b82f6',
            style: TripReportMarkerStyle.Camera,
        });
    });

    it.each<MapFileExportFormat>(['kml', 'gpx', 'geojson'])(
        'a %s export keeps exact and original colors',
        (format) => {
            const recolored = block
                .withSegmentUpdated(block.segments[0]!.id, (s) => s.withColor('green'))
                .withMarkerUpdated(block.markers[0]!.id, (m) => m.withColor('#123456'));
            const fileName = `trip.${format}`;
            const content = exportMapFile(recolored.toEnrichedGeoJsonMapFile(fileName).geoJson, format);
            const copy = TripReportMapBlock.createEmpty().withMapFileImported(
                MapFile.fromContent(fileName, content).toGeoJson().enrich(),
            );
            expect(copy.segments[0]).toMatchObject({ color: 'green', originalColor: '#ff0000' });
            expect(copy.segments[1]).toMatchObject({ color: 'black', originalColor: null });
            expect(copy.markers[0]).toMatchObject({ color: '#123456', originalColor: null });
        },
    );

    it('keeps original colors through JSON', () => {
        const restored = TripReportMapBlock.fromResult(JSON.parse(JSON.stringify(block.toJSON())));
        expect(restored.segments.map((s) => s.originalColor)).toEqual(block.segments.map((s) => s.originalColor));
        expect(restored.segments[0]!.originalColor).toBe('#ff0000');
    });
});

describe('TripReportMapBlock JSON with imported features', () => {
    it('round-trips markers, features, and legend items', () => {
        const block = TripReportMapBlock.createEmpty().withMapFileImported(enrichedKml());
        const restored = TripReportMapBlock.fromResult(JSON.parse(JSON.stringify(block.toJSON())));
        expect(restored.markers).toEqual(block.markers);
        expect(restored.nextMarkerNumber).toBe(block.nextMarkerNumber);
        expect(restored.features).toEqual(block.features);
        expect(Object.keys(restored.legend)).toEqual(Object.keys(block.legend));
        for (const [id, item] of Object.entries(block.legend)) {
            expect(restored.legend[id]!.toPlain()).toEqual(item.toPlain());
        }
        expect(restored.toJSON()).toEqual(block.toJSON());
    });

    it('omits features and legend when there are none', () => {
        const json = TripReportMapBlock.createEmpty().toJSON();
        expect(json.features).toBeUndefined();
        expect(json.legend).toBeUndefined();
    });

    it('drops features whose legend item is missing', () => {
        const block = TripReportMapBlock.createEmpty().withMapFileImported(enrichedKml());
        const json = block.toJSON();
        const firstId = Object.keys(json.legend!)[0]!;
        delete json.legend![firstId];
        const restored = TripReportMapBlock.fromResult(json);
        expect(restored.features).toHaveLength(0);
        expect(restored.hasId(firstId)).toBe(false);
    });

    it('turns points saved as features (before markers existed) into markers', () => {
        const block = TripReportMapBlock.createEmpty().withMapFileImported(enrichedKml());
        const pointId = 'legacy-point';
        const legacy = {
            ...block.toJSON(),
            markers: undefined,
            nextMarkerNumber: undefined,
            features: [
                ...block.features,
                {
                    type: 'Feature',
                    properties: { name: 'Rappel 1', 'marker-color': '#ef4444', [LEGEND_ID_PROPERTY]: pointId },
                    geometry: { type: 'Point', coordinates: [-109.45, 38.55] },
                },
            ],
            legend: {
                ...block.toJSON().legend,
                [pointId]: new PointLegendItem(pointId, 'Rappel 1', { lat: 38.55, lon: -109.45 }).toPlain(),
            },
        };
        const restored = TripReportMapBlock.fromResult(JSON.parse(JSON.stringify(legacy)));
        expect(restored.markers.map((m) => [m.id, m.name, m.position, m.color, m.originalColor])).toEqual([
            [pointId, 'Rappel 1', [-109.45, 38.55], '#ef4444', '#ef4444'],
        ]);
        expect(restored.features.map((f) => f.geometry?.type)).toEqual(['Polygon']);
        expect(restored.legend[pointId]).toBeUndefined();
        expect(restored.nextMarkerNumber).toBe(2);
    });
});
