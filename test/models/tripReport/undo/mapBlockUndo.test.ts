import { describe, it, expect } from '@jest/globals';
import {
    EnrichedGeoJsonMapFile,
    MapBlockUndoChange,
    MapFile,
    TripReportMapBlock,
    TripReportMarkerStyle,
} from '../../../../src/models';

/** Stand-in for the stack size Mobile will pass into {@link TripReportMapBlock.createEmpty}. */
const MAX_UNDO = 10;

describe('TripReportMapBlock undo', () => {
    it('pushes add/remove segment and undoes them', () => {
        const empty = TripReportMapBlock.createEmpty(MAX_UNDO);
        const withSegment = empty.withNewSegment('red');
        expect(withSegment.undoStack).toHaveLength(1);
        expect(withSegment.undoStack[0]!.type).toBe('addSegment');
        expect(withSegment.segments).toHaveLength(1);
        expect(withSegment.maxUndoStackSize).toBe(MAX_UNDO);

        const undoneAdd = withSegment.undoChange();
        expect(undoneAdd.segments).toHaveLength(0);
        expect(undoneAdd.undoStack).toHaveLength(0);
        // Counters only increase.
        expect(undoneAdd.nextSegmentNumber).toBe(2);

        const again = undoneAdd.withNewSegment().withNewSegment();
        const firstId = again.segments[0]!.id;
        const secondId = again.segments[1]!.id;
        expect(again.segments.map((s) => s.name)).toEqual(['Segment 2', 'Segment 3']);
        const removed = again.withSegmentRemoved(firstId);
        expect(removed.segments.map((s) => s.id)).toEqual([secondId]);
        expect(removed.undoStack[removed.undoStack.length - 1]!.type).toBe('removeSegment');

        const restored = removed.undoChange();
        expect(restored.segments.map((s) => s.id)).toEqual([firstId, secondId]);
        expect(restored.segments[0]!.name).toBe('Segment 2');
    });

    it('pushes add/remove marker and undoes them', () => {
        const block = TripReportMapBlock.createEmpty(MAX_UNDO).withNewMarker([-110, 38], 'blue');
        expect(block.undoStack[0]!.type).toBe('addMarker');
        const markerId = block.markers[0]!.id;

        const without = block.undoChange();
        expect(without.markers).toHaveLength(0);
        expect(without.nextMarkerNumber).toBe(2);

        const two = without.withNewMarker([0, 0]).withNewMarker([1, 1]);
        const removed = two.withMarkerRemoved(two.markers[0]!.id);
        const restored = removed.undoChange();
        expect(restored.markers.map((m) => m.position)).toEqual([
            [0, 0],
            [1, 1],
        ]);
        expect(restored.hasId(markerId)).toBe(false);
    });

    it('pushes marker and waypoint moves and undoes them', () => {
        const block = TripReportMapBlock.createEmpty(MAX_UNDO)
            .withNewSegment()
            .withWaypointAppendedToActive([-109, 38])
            .withWaypointAppendedToActive([-109.1, 38.1])
            .withNewMarker([-110, 38]);
        const segmentId = block.segments[0]!.id;
        const markerId = block.markers[0]!.id;

        const movedWaypoint = block.withSegmentWaypointMoved(segmentId, 1, [-109.2, 38.2]);
        expect(movedWaypoint.segments[0]!.waypoints[1]).toEqual([-109.2, 38.2]);
        expect(movedWaypoint.undoStack[movedWaypoint.undoStack.length - 1]!.type).toBe('moveWaypoint');
        const waypointRestored = movedWaypoint.undoChange();
        expect(waypointRestored.segments[0]!.waypoints[1]).toEqual([-109.1, 38.1]);

        const movedMarker = waypointRestored.withMarkerMoved(markerId, [-111, 39]);
        expect(movedMarker.markers[0]!.position).toEqual([-111, 39]);
        const markerRestored = movedMarker.undoChange();
        expect(markerRestored.markers[0]!.position).toEqual([-110, 38]);
    });

    it('does not push for property updates', () => {
        const block = TripReportMapBlock.createEmpty(MAX_UNDO)
            .withNewSegment()
            .withNewMarker([0, 0]);
        const afterGeometry = block.undoStack.length;
        const styled = block
            .withSegmentUpdated(block.segments[0]!.id, (s) => s.withName('Ridge').withColor('red'))
            .withMarkerUpdated(block.markers[0]!.id, (m) =>
                m.withName('Camp').withStyle(TripReportMarkerStyle.Camp),
            );
        expect(styled.undoStack).toHaveLength(afterGeometry);
        expect(styled.segments[0]!.name).toBe('Ridge');
        expect(styled.markers[0]!.name).toBe('Camp');
    });

    it('does not push when appending waypoints to an existing segment', () => {
        const withSegment = TripReportMapBlock.createEmpty(MAX_UNDO).withNewSegment();
        expect(withSegment.undoStack).toHaveLength(1);
        const appended = withSegment
            .withWaypointAppendedToActive([1, 2])
            .withWaypointAppendedToActive([3, 4]);
        expect(appended.undoStack).toHaveLength(1);
        expect(appended.segments[0]!.waypoints).toHaveLength(2);
    });

    it('pushes when appending the first waypoint creates a segment', () => {
        const block = TripReportMapBlock.createEmpty(MAX_UNDO).withWaypointAppendedToActive([1, 2]);
        expect(block.undoStack).toHaveLength(1);
        expect(block.undoStack[0]!.type).toBe('addSegment');
        const undone = block.undoChange();
        expect(undone.segments).toHaveLength(0);
    });

    it('caps the stack at maxUndoStackSize', () => {
        let block = TripReportMapBlock.createEmpty(MAX_UNDO);
        for (let i = 0; i < MAX_UNDO + 3; i += 1) {
            block = block.withNewMarker([i, i]);
        }
        expect(block.undoStack).toHaveLength(MAX_UNDO);
        expect(block.markers).toHaveLength(MAX_UNDO + 3);
        for (let i = 0; i < MAX_UNDO; i += 1) {
            block = block.undoChange();
        }
        expect(block.markers).toHaveLength(3);
        expect(block.undoStack).toHaveLength(0);
    });

    it('throws when undoing an empty stack', () => {
        expect(() => TripReportMapBlock.createEmpty(MAX_UNDO).undoChange()).toThrow(
            'TripReportMapBlock.undoChange: undo stack is empty',
        );
    });

    it('round-trips the undo stack and maxUndoStackSize through JSON', () => {
        const block = TripReportMapBlock.createEmpty(MAX_UNDO)
            .withNewSegment('green')
            .withWaypointAppendedToActive([1, 2])
            .withNewMarker([3, 4], 'red');
        const moved = block.withMarkerMoved(block.markers[0]!.id, [5, 6]);
        const json = moved.toJSON();
        expect(json.maxUndoStackSize).toBe(MAX_UNDO);
        expect(json.undoStack).toHaveLength(3);
        expect(json.undoStack!.map((e) => e.type)).toEqual(['addSegment', 'addMarker', 'moveMarker']);
        const restored = TripReportMapBlock.fromResult(JSON.parse(JSON.stringify(json)));
        expect(restored.toJSON()).toEqual(json);
        expect(restored.maxUndoStackSize).toBe(MAX_UNDO);
        expect(restored.markers[0]!.position).toEqual([5, 6]);
        const afterUndoMove = restored.undoChange();
        expect(afterUndoMove.markers[0]!.position).toEqual([3, 4]);
    });

    it('parses each concrete undo type via MapBlockUndoChange.fromResult', () => {
        const types = [
            { type: 'addSegment', segmentId: 's1' },
            {
                type: 'removeSegment',
                segment: { id: 's1', name: 'Segment 1', waypoints: [[1, 2]] as [number, number][] },
                index: 0,
            },
            { type: 'addMarker', markerId: 'm1' },
            {
                type: 'removeMarker',
                marker: { id: 'm1', name: 'Marker 1', position: [1, 2] as [number, number] },
                index: 0,
            },
            { type: 'moveMarker', markerId: 'm1', previousPosition: [1, 2] as [number, number] },
            {
                type: 'moveWaypoint',
                segmentId: 's1',
                waypointIndex: 0,
                previousPosition: [1, 2] as [number, number],
            },
            {
                type: 'importMapFile',
                segmentIds: ['s1'],
                markerIds: ['m1'],
                featureIds: ['f1'],
            },
        ];
        for (const entry of types) {
            const change = MapBlockUndoChange.fromResult(entry);
            expect(change.type).toBe(entry.type);
            expect(change.toJSON()).toMatchObject(entry);
        }
        expect(() => MapBlockUndoChange.fromResult({ type: 'nope' })).toThrow(
            'Unknown MapBlockUndoChange.type',
        );
    });

    describe('importMapFile undo', () => {
        const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
<Placemark>
  <name>Approach</name>
  <LineString><coordinates>-109.5,38.5 -109.4,38.6</coordinates></LineString>
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

        function importedFile(fileName = 'canyon.kml'): EnrichedGeoJsonMapFile {
            return MapFile.fromContent(fileName, kml).toGeoJson().enrich();
        }

        it('removes only features the import added', () => {
            const prior = TripReportMapBlock.createEmpty(MAX_UNDO).withNewMarker([-110, 38], 'red');
            const priorMarkerId = prior.markers[0]!.id;
            const imported = prior.withMapFileImported(importedFile());
            expect(imported.undoStack[imported.undoStack.length - 1]!.type).toBe('importMapFile');
            expect(imported.segments).toHaveLength(1);
            expect(imported.markers).toHaveLength(2);
            expect(imported.features).toHaveLength(1);

            const undone = imported.undoChange();
            expect(undone.segments).toHaveLength(0);
            expect(undone.markers.map((m) => m.id)).toEqual([priorMarkerId]);
            expect(undone.features).toHaveLength(0);
            expect(undone.legend).toEqual({});
            expect(undone.hasId(priorMarkerId)).toBe(true);
        });

        it('does not record colliding features that were skipped', () => {
            const once = TripReportMapBlock.createEmpty(MAX_UNDO).withMapFileImported(importedFile());
            const segmentIds = once.segments.map((s) => s.id);
            const markerIds = once.markers.map((m) => m.id);
            const featureIds = Object.keys(once.legend);
            expect(once.undoStack).toHaveLength(1);

            const twice = once.withMapFileImported(importedFile());
            expect(twice).toBe(once);
            expect(twice.undoStack).toHaveLength(1);

            const undone = twice.undoChange();
            expect(undone.segments).toHaveLength(0);
            expect(undone.markers).toHaveLength(0);
            expect(undone.features).toHaveLength(0);
            for (const id of [...segmentIds, ...markerIds, ...featureIds]) {
                expect(undone.hasId(id)).toBe(false);
            }
        });

        it('keeps a pre-existing recording segment when undoing an import', () => {
            const recording = TripReportMapBlock.createEmpty(MAX_UNDO).withWaypointAppendedToActive([
                -110, 38,
            ]);
            const activeId = recording.activeSegment!.id;
            const imported = recording.withMapFileImported(importedFile());
            expect(imported.activeSegment!.id).toBe(activeId);
            expect(imported.segments.length).toBeGreaterThan(1);

            const undone = imported.undoChange();
            expect(undone.segments.map((s) => s.id)).toEqual([activeId]);
            expect(undone.markers).toHaveLength(0);
            expect(undone.features).toHaveLength(0);
        });
    });
});
