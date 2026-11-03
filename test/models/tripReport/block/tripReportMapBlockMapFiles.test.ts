import { describe, it, expect } from '@jest/globals';
import type { FeatureCollection } from 'geojson';
import {
    EnrichedGeoJsonMapFile,
    exportMapFile,
    LEGEND_ID_PROPERTY,
    MapFile,
    type MapFileExportFormat,
} from '../../../../src/models';
import { PointLegendItem, TripReportMapBlock } from '../../../../src/models';

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
    it('turns lines into segments and keeps points and polygons as features', () => {
        const block = TripReportMapBlock.createEmpty().withMapFileImported(enrichedKml());

        expect(block.segments.map((s) => s.name)).toEqual(['Approach', 'Segment 1']);
        const [approach, unnamed] = block.segments;
        expect(approach).toMatchObject({ color: 'red', style: 'dashed', thickness: 'thick' });
        expect(approach!.waypoints).toEqual([
            [-109.5, 38.5],
            [-109.4, 38.6],
        ]);
        expect(unnamed).toMatchObject({ color: 'black', style: 'solid', thickness: 'medium' });
        expect(block.nextSegmentNumber).toBe(2);

        expect(block.features.map((f) => f.geometry?.type)).toEqual(['Point', 'Polygon']);
        const ids = block.features.map((f) => f.properties![LEGEND_ID_PROPERTY] as string);
        expect(Object.keys(block.legend).sort()).toEqual([...ids].sort());
        const rappel = block.legend[ids[0]!] as PointLegendItem;
        expect(rappel).toBeInstanceOf(PointLegendItem);
        expect(rappel.name).toBe('Rappel 1');
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
        expect(twice.features).toEqual(edited.features);
        expect(twice.legend).toEqual(edited.legend);
        expect(twice.nextSegmentNumber).toBe(edited.nextSegmentNumber);
    });

    it('treats a differently named copy as new features', () => {
        const block = TripReportMapBlock.createEmpty()
            .withMapFileImported(enrichedKml('canyon.kml'))
            .withMapFileImported(enrichedKml('canyon (1).kml'));
        expect(block.segments).toHaveLength(4);
        expect(block.features).toHaveLength(4);
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
        expect(block.segments.map((s) => s.color)).toEqual(['red', 'white']);
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
        expect(removed.features).toHaveLength(1);
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
            expect(same.features).toEqual(block.features);
            expect(same.legend).toEqual(block.legend);
        },
    );

    it.each<MapFileExportFormat>(['kml', 'geojson'])(
        'a %s export imported into a new block reproduces the block',
        (format) => {
            const copy = TripReportMapBlock.createEmpty().withMapFileImported(exportAndReimport(format));
            expect(segmentSummary(copy)).toEqual(segmentSummary(block));
            expect(copy.features.map((f) => f.geometry)).toEqual(block.features.map((f) => f.geometry));
            expect(Object.keys(copy.legend).sort()).toEqual(Object.keys(block.legend).sort());
        },
    );

    it('a GPX export imported into a new block turns polygons into segments (GPX has no polygons)', () => {
        const copy = TripReportMapBlock.createEmpty().withMapFileImported(exportAndReimport('gpx'));
        const poolId = Object.entries(block.legend).find(([, item]) => item.name === 'Pool')![0];
        expect(segmentSummary(copy).slice(0, block.segments.length)).toEqual(segmentSummary(block));
        expect(copy.segments.at(-1)).toMatchObject({ id: poolId, name: 'Pool' });
        expect(copy.features.map((f) => f.geometry?.type)).toEqual(['Point']);
    });
});

describe('TripReportMapBlock JSON with imported features', () => {
    it('round-trips features and legend items', () => {
        const block = TripReportMapBlock.createEmpty().withMapFileImported(enrichedKml());
        const restored = TripReportMapBlock.fromResult(JSON.parse(JSON.stringify(block.toJSON())));
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
        expect(restored.features).toHaveLength(1);
        expect(restored.hasId(firstId)).toBe(false);
    });
});
