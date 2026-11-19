import type { Feature, GeoJsonProperties, Point } from 'geojson';
import { EnrichedGeoJsonMapFile } from '../../mapFile/enrichedGeoJsonMapFile';
import { LEGEND_ID_PROPERTY, ROPEGEO_PROPERTY, STYLE_PROPERTY } from '../../mapFile/util/properties';
import { LegendItem } from '../../minimap/legend/abstract/legendItem';
import {
    TripReportLineSegment,
    type TripReportLineColor,
    type TripReportLineSegmentJson,
    type TripReportWaypoint,
} from '../tripReportLineSegment';
import {
    TripReportMarker,
    type TripReportMarkerJson,
    type TripReportMarkerStyle,
} from '../tripReportMarker';
import { AddMarkerUndoChange } from '../undo/addMarkerUndoChange';
import { AddSegmentUndoChange } from '../undo/addSegmentUndoChange';
import { AddWaypointUndoChange } from '../undo/addWaypointUndoChange';
import { ImportMapFileUndoChange } from '../undo/importMapFileUndoChange';
import { MapBlockUndoChange, type MapBlockUndoChangeJson } from '../undo/mapBlockUndoChange';
import { MoveMarkerUndoChange } from '../undo/moveMarkerUndoChange';
import { MoveWaypointUndoChange } from '../undo/moveWaypointUndoChange';
import { RemoveMarkerUndoChange } from '../undo/removeMarkerUndoChange';
import { RemoveSegmentUndoChange } from '../undo/removeSegmentUndoChange';
import { RemoveWaypointUndoChange } from '../undo/removeWaypointUndoChange';
import { SplitSegmentUndoChange } from '../undo/splitSegmentUndoChange';
import { createBlockId } from './createBlockId';
import { registerTripReportBlockParser, TripReportBlock } from './tripReportBlock';
import { TripReportBlockType } from './tripReportBlockType';

export type TripReportMapBlockJson = {
    blockType: TripReportBlockType.Map;
    id: string;
    segments: TripReportLineSegmentJson[];
    nextSegmentNumber?: number;
    markers?: TripReportMarkerJson[];
    nextMarkerNumber?: number;
    nextPolygonNumber?: number;
    /** Imported polygon features, each tagged with its legend id. */
    features?: Feature[];
    /** Plain legend items (`LegendItem.toPlain()`) for {@link features}, keyed by legend id. */
    legend?: Record<string, Record<string, unknown>>;
    /** Differential undo stack for geometric edits; oldest first. */
    undoStack?: MapBlockUndoChangeJson[];
    /**
     * Max undo entries retained. Owned by the app (e.g. Mobile); persisted so loaded blocks keep
     * the cap they were created with.
     */
    maxUndoStackSize?: number;
};

export type ImportMapFileOptions = {
    /**
     * Color for imported lines and points without a RopeGeo color or a recognizable color
     * property.
     */
    newSegmentColor?: TripReportLineColor;
};

type MapBlockFields = {
    segments: TripReportLineSegment[];
    nextSegmentNumber: number;
    features: Feature[];
    legend: Record<string, LegendItem>;
    markers: TripReportMarker[];
    nextMarkerNumber: number;
    nextPolygonNumber: number;
    undoStack: readonly MapBlockUndoChange[];
    maxUndoStackSize: number;
};

const SEGMENT_NAME_PATTERN = /^Segment (\d+)$/;
const MARKER_NAME_PATTERN = /^Marker (\d+)$/;
const POLYGON_NAME_PATTERN = /^Polygon (\d+)$/;

function stringProperty(props: GeoJsonProperties, key: string): string | null {
    const value = props?.[key];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function explicitNameOf(feature: Feature): string | null {
    return stringProperty(feature.properties, STYLE_PROPERTY.name) ?? stringProperty(feature.properties, 'title');
}

function legendIdOf(feature: Feature): string | null {
    return stringProperty(feature.properties, LEGEND_ID_PROPERTY);
}

/** `item` under a different id (legend items are immutable, so it's rebuilt from its plain form). */
function withLegendItemId(item: LegendItem, id: string): LegendItem {
    return item.id === id ? item : LegendItem.fromResult({ ...item.toPlain(), id });
}

/** One past the highest "<Prefix> N" name, or past the count when that's higher. */
function nextNumberAfter(names: string[], pattern: RegExp): number {
    const highestNamed = names.reduce((highest, name) => {
        const match = pattern.exec(name);
        return match != null ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    return Math.max(highestNamed, names.length) + 1;
}

/**
 * A map section of a trip report. Its editable line segments and markers are drawn on the map,
 * and recording always appends to the last (active) segment. Imported lines become segments,
 * imported points become markers, and imported polygons are kept as features with legend items.
 *
 * Everything on the block has a unique id: segment, marker, and imported feature ids never
 * repeat, which is how re-importing the same map file is deduplicated.
 *
 * Geometric edits ({@link withNewSegment}, remove/move helpers) push differential undo entries
 * capped by {@link maxUndoStackSize}; property updates and recording appends do not.
 * {@link undoChange} pops and applies the latest.
 */
export class TripReportMapBlock extends TripReportBlock {
    readonly blockType = TripReportBlockType.Map;
    /**
     * Max undo entries retained. Set by the app at creation (e.g. Mobile's stack-size constant);
     * geometric {@link withNewSegment | with*} methods use this when pushing.
     */
    readonly maxUndoStackSize: number;
    readonly segments: TripReportLineSegment[];
    /** Number used for the next "Segment N" name. Only ever increases, so names stay unique. */
    readonly nextSegmentNumber: number;
    /** Imported polygon features, each with a `legendId` property keyed into {@link legend}. */
    readonly features: Feature[];
    /** Legend items for {@link features}, keyed by legend id. */
    readonly legend: Record<string, LegendItem>;
    readonly markers: TripReportMarker[];
    /** Number used for the next "Marker N" name. Only ever increases, so names stay unique. */
    readonly nextMarkerNumber: number;
    /** Number used for the next "Polygon N" name. Only ever increases, so names stay unique. */
    readonly nextPolygonNumber: number;
    /** Differential undo stack for geometric edits; oldest first. */
    readonly undoStack: readonly MapBlockUndoChange[];

    constructor(
        id: string,
        maxUndoStackSize: number,
        segments: TripReportLineSegment[] = [],
        nextSegmentNumber = 1,
        features: Feature[] = [],
        legend: Record<string, LegendItem> = {},
        markers: TripReportMarker[] = [],
        nextMarkerNumber = 1,
        nextPolygonNumber = 1,
        undoStack: readonly MapBlockUndoChange[] = [],
    ) {
        super(id);
        this.maxUndoStackSize = TripReportMapBlock.assertPositiveInteger(
            maxUndoStackSize,
            'TripReportMapBlock.maxUndoStackSize',
        );
        this.segments = segments;
        this.nextSegmentNumber = nextSegmentNumber;
        this.features = features;
        this.legend = legend;
        this.markers = markers;
        this.nextMarkerNumber = nextMarkerNumber;
        this.nextPolygonNumber = nextPolygonNumber;
        this.undoStack = undoStack;
    }

    static createEmpty(maxUndoStackSize: number): TripReportMapBlock {
        return new TripReportMapBlock(createBlockId(TripReportBlockType.Map), maxUndoStackSize);
    }

    private copy(changes: Partial<MapBlockFields>): TripReportMapBlock {
        return new TripReportMapBlock(
            this.id,
            changes.maxUndoStackSize ?? this.maxUndoStackSize,
            changes.segments ?? this.segments,
            changes.nextSegmentNumber ?? this.nextSegmentNumber,
            changes.features ?? this.features,
            changes.legend ?? this.legend,
            changes.markers ?? this.markers,
            changes.nextMarkerNumber ?? this.nextMarkerNumber,
            changes.nextPolygonNumber ?? this.nextPolygonNumber,
            changes.undoStack ?? this.undoStack,
        );
    }

    private withUndoPushed(change: MapBlockUndoChange): TripReportMapBlock {
        const next = [...this.undoStack, change];
        const undoStack =
            next.length > this.maxUndoStackSize
                ? next.slice(next.length - this.maxUndoStackSize)
                : next;
        return this.copy({ undoStack });
    }

    get activeSegment(): TripReportLineSegment | null {
        return this.segments.length > 0 ? this.segments[this.segments.length - 1] : null;
    }

    /** Whether a segment, marker, or imported feature already uses `id`. */
    hasId(id: string): boolean {
        return (
            id in this.legend ||
            this.segments.some((segment) => segment.id === id) ||
            this.markers.some((marker) => marker.id === id)
        );
    }

    /**
     * Replaces segments without pushing undo. Used by {@link MapBlockUndoChange.apply}.
     */
    withSegments(segments: readonly TripReportLineSegment[]): TripReportMapBlock {
        return this.copy({ segments: [...segments] });
    }

    /**
     * Replaces markers without pushing undo. Used by {@link MapBlockUndoChange.apply}.
     */
    withMarkers(markers: readonly TripReportMarker[]): TripReportMapBlock {
        return this.copy({ markers: [...markers] });
    }

    withNewSegment(color?: TripReportLineColor): TripReportMapBlock {
        const segment = TripReportLineSegment.createEmpty(`Segment ${this.nextSegmentNumber}`, color);
        return this.copy({
            segments: [...this.segments, segment],
            nextSegmentNumber: this.nextSegmentNumber + 1,
        }).withUndoPushed(new AddSegmentUndoChange(segment.id));
    }

    /**
     * Appends to the last segment, creating one first (with `newSegmentColor`) if the block has
     * none. Creating that first segment pushes undo; appending a waypoint does not.
     */
    withWaypointAppendedToActive(
        point: TripReportWaypoint,
        newSegmentColor?: TripReportLineColor,
    ): TripReportMapBlock {
        const block = this.segments.length > 0 ? this : this.withNewSegment(newSegmentColor);
        const active = block.segments[block.segments.length - 1]!;
        return block.withSegmentUpdated(active.id, (segment) => segment.withWaypointAppended(point));
    }

    withSegmentUpdated(
        segmentId: string,
        update: (segment: TripReportLineSegment) => TripReportLineSegment,
    ): TripReportMapBlock {
        return this.copy({
            segments: this.segments.map((segment) => (segment.id === segmentId ? update(segment) : segment)),
        });
    }

    withSegmentRemoved(segmentId: string): TripReportMapBlock {
        const index = this.segments.findIndex((segment) => segment.id === segmentId);
        if (index < 0) return this;
        const segment = this.segments[index]!;
        return this.copy({
            segments: this.segments.filter((entry) => entry.id !== segmentId),
        }).withUndoPushed(new RemoveSegmentUndoChange(segment.toJSON(), index));
    }

    /**
     * Moves a waypoint and pushes undo with its previous position. No-op when the segment or
     * index is missing.
     */
    withSegmentWaypointMoved(
        segmentId: string,
        waypointIndex: number,
        position: TripReportWaypoint,
    ): TripReportMapBlock {
        const segment = this.segments.find((entry) => entry.id === segmentId);
        const previous = segment?.waypoints[waypointIndex];
        if (segment == null || previous == null) return this;
        return this.copy({
            segments: this.segments.map((entry) =>
                entry.id === segmentId ? entry.withWaypointMoved(waypointIndex, position) : entry,
            ),
        }).withUndoPushed(new MoveWaypointUndoChange(segmentId, waypointIndex, previous));
    }

    /**
     * Inserts a waypoint at `index` (append when `index === length`) and pushes undo. No-op when
     * the segment is missing or `index` is outside `[0, length]`.
     */
    withSegmentWaypointInserted(
        segmentId: string,
        index: number,
        position: TripReportWaypoint,
    ): TripReportMapBlock {
        const segment = this.segments.find((entry) => entry.id === segmentId);
        if (segment == null || index < 0 || index > segment.waypoints.length) return this;
        return this.copy({
            segments: this.segments.map((entry) =>
                entry.id === segmentId ? entry.withWaypointInserted(index, position) : entry,
            ),
        }).withUndoPushed(new AddWaypointUndoChange(segmentId, index));
    }

    /**
     * Removes a waypoint and pushes undo with its prior position. No-op when the segment or index
     * is missing.
     */
    withSegmentWaypointRemoved(segmentId: string, waypointIndex: number): TripReportMapBlock {
        const segment = this.segments.find((entry) => entry.id === segmentId);
        const waypoint = segment?.waypoints[waypointIndex];
        if (segment == null || waypoint == null) return this;
        return this.copy({
            segments: this.segments.map((entry) =>
                entry.id === segmentId ? entry.withWaypointRemoved(waypointIndex) : entry,
            ),
        }).withUndoPushed(new RemoveWaypointUndoChange(segmentId, waypointIndex, waypoint));
    }

    /**
     * Splits a segment at `waypointIndex`: the original keeps waypoints before the index; a new
     * segment (inserted immediately after) owns the selected waypoint and everything after it.
     * Throws when `waypointIndex === 0` (would leave the original empty). No-op when the segment
     * is missing or `waypointIndex >= length`.
     */
    withSegmentSplitAt(segmentId: string, waypointIndex: number): TripReportMapBlock {
        const segmentIndex = this.segments.findIndex((entry) => entry.id === segmentId);
        if (segmentIndex < 0) return this;
        const segment = this.segments[segmentIndex]!;
        if (waypointIndex >= segment.waypoints.length) return this;
        if (waypointIndex === 0) {
            throw new Error(
                'TripReportMapBlock.withSegmentSplitAt: cannot split at the first waypoint',
            );
        }
        if (waypointIndex < 0) return this;

        const head = segment.withWaypoints(segment.waypoints.slice(0, waypointIndex));
        const tail = segment.createSibling(
            `Segment ${this.nextSegmentNumber}`,
            segment.waypoints.slice(waypointIndex),
        );
        const segments = [
            ...this.segments.slice(0, segmentIndex),
            head,
            tail,
            ...this.segments.slice(segmentIndex + 1),
        ];
        return this.copy({
            segments,
            nextSegmentNumber: this.nextSegmentNumber + 1,
        }).withUndoPushed(new SplitSegmentUndoChange(segmentId, tail.id, waypointIndex));
    }

    /** Adds a "Marker N" at `position`. */
    withNewMarker(
        position: TripReportWaypoint,
        color?: TripReportLineColor,
        style?: TripReportMarkerStyle,
    ): TripReportMapBlock {
        const marker = TripReportMarker.create(`Marker ${this.nextMarkerNumber}`, position, color, style);
        return this.copy({
            markers: [...this.markers, marker],
            nextMarkerNumber: this.nextMarkerNumber + 1,
        }).withUndoPushed(new AddMarkerUndoChange(marker.id));
    }

    withMarkerUpdated(
        markerId: string,
        update: (marker: TripReportMarker) => TripReportMarker,
    ): TripReportMapBlock {
        return this.copy({
            markers: this.markers.map((marker) => (marker.id === markerId ? update(marker) : marker)),
        });
    }

    withMarkerRemoved(markerId: string): TripReportMapBlock {
        const index = this.markers.findIndex((marker) => marker.id === markerId);
        if (index < 0) return this;
        const marker = this.markers[index]!;
        return this.copy({
            markers: this.markers.filter((entry) => entry.id !== markerId),
        }).withUndoPushed(new RemoveMarkerUndoChange(marker.toJSON(), index));
    }

    /**
     * Moves a marker and pushes undo with its previous position. No-op when the marker is missing.
     */
    withMarkerMoved(markerId: string, position: TripReportWaypoint): TripReportMapBlock {
        const marker = this.markers.find((entry) => entry.id === markerId);
        if (marker == null) return this;
        return this.copy({
            markers: this.markers.map((entry) =>
                entry.id === markerId ? entry.withPosition(position) : entry,
            ),
        }).withUndoPushed(new MoveMarkerUndoChange(markerId, marker.position));
    }

    /** Removes an imported polygon and its legend item. */
    withFeatureRemoved(legendId: string): TripReportMapBlock {
        const legend = { ...this.legend };
        delete legend[legendId];
        return this.copy({
            features: this.features.filter((feature) => legendIdOf(feature) !== legendId),
            legend,
        });
    }

    /**
     * Pops the latest undo entry and applies it. Throws when the stack is empty.
     */
    undoChange(): TripReportMapBlock {
        if (this.undoStack.length === 0) {
            throw new Error('TripReportMapBlock.undoChange: undo stack is empty');
        }
        const change = this.undoStack[this.undoStack.length - 1]!;
        const without = this.copy({ undoStack: this.undoStack.slice(0, -1) });
        return change.apply(without);
    }

    /**
     * Merges an enriched map file into this block, skipping anything it already has:
     * - Each feature's id is its `ropegeo:id` when present (so RopeGeo's own exports keep their
     *   ids), otherwise its legend id. Features whose id is already on the block, or repeated
     *   within the file, are skipped.
     * - Lines become segments named after the line (or "Segment N" when unnamed), inserted before
     *   the active segment so a recording in progress keeps its segment.
     * - Points become markers named after the point (or "Marker N" when unnamed).
     * - Polygons are kept as features with their legend items.
     * - Features without a legend id (no geometry or unsupported geometry) are dropped.
     */
    withMapFileImported(
        file: EnrichedGeoJsonMapFile,
        { newSegmentColor }: ImportMapFileOptions = {},
    ): TripReportMapBlock {
        const usedIds = new Set<string>([
            ...this.segments.map((segment) => segment.id),
            ...this.markers.map((marker) => marker.id),
            ...Object.keys(this.legend),
        ]);
        const importedSegments: TripReportLineSegment[] = [];
        const addedSegmentIds: string[] = [];
        const addedMarkerIds: string[] = [];
        const addedFeatureIds: string[] = [];
        const markers = [...this.markers];
        const features = [...this.features];
        const legend = { ...this.legend };
        let nextSegmentNumber = this.nextSegmentNumber;
        let nextMarkerNumber = this.nextMarkerNumber;

        for (const feature of file.geoJson.features) {
            const legendId = legendIdOf(feature);
            const legendItem = legendId != null ? file.legend[legendId] : undefined;
            if (legendId == null || legendItem == null || feature.geometry == null) continue;
            const id = stringProperty(feature.properties, ROPEGEO_PROPERTY.id) ?? legendId;
            // Already on the block (or earlier in this file): skip — and do not record for undo.
            if (usedIds.has(id)) continue;
            usedIds.add(id);

            if (feature.geometry.type === 'LineString') {
                importedSegments.push(
                    TripReportLineSegment.fromMapFileLine(feature.geometry, feature.properties, {
                        id,
                        name: explicitNameOf(feature) ?? `Segment ${nextSegmentNumber++}`,
                        defaultColor: newSegmentColor,
                    }),
                );
                addedSegmentIds.push(id);
            } else if (feature.geometry.type === 'Point') {
                markers.push(
                    TripReportMarker.fromMapFilePoint(feature.geometry, feature.properties, {
                        id,
                        name: explicitNameOf(feature) ?? `Marker ${nextMarkerNumber++}`,
                        defaultColor: newSegmentColor,
                    }),
                );
                addedMarkerIds.push(id);
            } else {
                features.push({
                    type: 'Feature',
                    properties: { ...(feature.properties ?? {}), [LEGEND_ID_PROPERTY]: id },
                    geometry: feature.geometry,
                });
                legend[id] = withLegendItemId(legendItem, id);
                addedFeatureIds.push(id);
            }
        }

        if (
            addedSegmentIds.length === 0 &&
            addedMarkerIds.length === 0 &&
            addedFeatureIds.length === 0
        ) {
            return this;
        }

        const active = this.activeSegment;
        const segments =
            active == null
                ? importedSegments
                : [...this.segments.slice(0, -1), ...importedSegments, active];
        return this.copy({
            segments,
            nextSegmentNumber,
            markers,
            nextMarkerNumber,
            features,
            legend,
        }).withUndoPushed(
            new ImportMapFileUndoChange(addedSegmentIds, addedMarkerIds, addedFeatureIds),
        );
    }

    /**
     * Everything on this block (segments, markers, then imported features) as one enriched map
     * file, ready for {@link exportMapFile}. Every feature carries `ropegeo:id`, so importing the
     * export back into this block adds nothing. Segments without waypoints are left out.
     */
    toEnrichedGeoJsonMapFile(fileName: string): EnrichedGeoJsonMapFile {
        const segmentFeatures = this.segments
            .map((segment) => segment.toMapFileFeature())
            .filter((feature): feature is Feature => feature != null);
        const markerFeatures = this.markers.map((marker) => marker.toMapFileFeature());
        const importedFeatures = this.features.map((feature): Feature => {
            const props = { ...(feature.properties ?? {}) };
            const id = props[LEGEND_ID_PROPERTY];
            delete props[LEGEND_ID_PROPERTY];
            return { ...feature, properties: { ...props, [ROPEGEO_PROPERTY.id]: id } };
        });
        return new EnrichedGeoJsonMapFile(fileName, {
            type: 'FeatureCollection',
            features: [...segmentFeatures, ...markerFeatures, ...importedFeatures],
        });
    }

    toJSON(): TripReportMapBlockJson {
        const json: TripReportMapBlockJson = {
            blockType: this.blockType,
            id: this.id,
            segments: this.segments.map((segment) => segment.toJSON()),
            nextSegmentNumber: this.nextSegmentNumber,
            nextMarkerNumber: this.nextMarkerNumber,
            nextPolygonNumber: this.nextPolygonNumber,
            maxUndoStackSize: this.maxUndoStackSize,
        };
        if (this.markers.length > 0) json.markers = this.markers.map((marker) => marker.toJSON());
        if (this.features.length > 0) {
            json.features = this.features;
            json.legend = Object.fromEntries(
                Object.entries(this.legend).map(([id, item]) => [id, item.toPlain()]),
            );
        }
        if (this.undoStack.length > 0) {
            json.undoStack = this.undoStack.map((change) => change.toJSON());
        }
        return json;
    }

    /**
     * Validates a stored map block. Without a saved counter, names continue after the highest
     * "Segment N" / "Marker N" / "Polygon N" name (or the count). Imported features whose legend item is missing
     * or no longer parses are dropped. Points imported before markers existed (stored as features)
     * become markers.
     */
    static fromResult(result: unknown): TripReportMapBlock {
        const r = TripReportBlock.assertBlockType(result, TripReportBlockType.Map, 'TripReportMapBlock');
        const id = TripReportBlock.assertNonEmptyString(r.id, 'TripReportMapBlock.id');
        const segments = TripReportMapBlock.parseOptionalArray(r.segments, 'TripReportMapBlock.segments').map(
            (segment) => TripReportLineSegment.fromJSON(segment as TripReportLineSegmentJson),
        );
        const nextSegmentNumber =
            r.nextSegmentNumber === undefined
                ? nextNumberAfter(
                      segments.map((segment) => segment.name),
                      SEGMENT_NAME_PATTERN,
                  )
                : TripReportMapBlock.assertPositiveInteger(r.nextSegmentNumber, 'TripReportMapBlock.nextSegmentNumber');
        const markers = TripReportMapBlock.parseOptionalArray(r.markers, 'TripReportMapBlock.markers').map(
            (marker) => TripReportMarker.fromJSON(marker as TripReportMarkerJson),
        );

        const legend: Record<string, LegendItem> = {};
        for (const [legendId, plain] of Object.entries(
            TripReportMapBlock.parseOptionalRecord(r.legend, 'TripReportMapBlock.legend'),
        )) {
            try {
                legend[legendId] = LegendItem.fromResult(plain);
            } catch {
                // Skip legend items that no longer parse; their features are dropped below.
            }
        }
        const features: Feature[] = [];
        for (const feature of TripReportMapBlock.parseOptionalArray(
            r.features,
            'TripReportMapBlock.features',
        ) as Feature[]) {
            const legendId = feature != null && typeof feature === 'object' ? legendIdOf(feature) : null;
            if (legendId == null || !(legendId in legend)) continue;
            if (feature.geometry?.type === 'Point') {
                markers.push(
                    TripReportMarker.fromMapFilePoint(feature.geometry as Point, feature.properties, {
                        id: legendId,
                        name: legend[legendId]!.name,
                    }),
                );
                delete legend[legendId];
                continue;
            }
            features.push(feature);
        }

        const nextMarkerNumber =
            r.nextMarkerNumber === undefined
                ? nextNumberAfter(
                      markers.map((marker) => marker.name),
                      MARKER_NAME_PATTERN,
                  )
                : TripReportMapBlock.assertPositiveInteger(r.nextMarkerNumber, 'TripReportMapBlock.nextMarkerNumber');
        const nextPolygonNumber =
            r.nextPolygonNumber === undefined
                ? nextNumberAfter(
                      features.map((feature) => legend[legendIdOf(feature)!]!.name),
                      POLYGON_NAME_PATTERN,
                  )
                : TripReportMapBlock.assertPositiveInteger(r.nextPolygonNumber, 'TripReportMapBlock.nextPolygonNumber');
        const undoStack = TripReportMapBlock.parseOptionalArray(
            r.undoStack,
            'TripReportMapBlock.undoStack',
        ).map((entry) => MapBlockUndoChange.fromResult(entry));
        // Legacy saves omit the cap; treat as uncapped until the app recreates the block.
        const maxUndoStackSize =
            r.maxUndoStackSize === undefined
                ? Number.MAX_SAFE_INTEGER
                : TripReportMapBlock.assertPositiveInteger(
                      r.maxUndoStackSize,
                      'TripReportMapBlock.maxUndoStackSize',
                  );
        return new TripReportMapBlock(
            id,
            maxUndoStackSize,
            segments,
            nextSegmentNumber,
            features,
            legend,
            markers,
            nextMarkerNumber,
            nextPolygonNumber,
            undoStack,
        );
    }

    private static parseOptionalArray(value: unknown, context: string): unknown[] {
        if (value === undefined || value === null) return [];
        if (!Array.isArray(value)) {
            throw new Error(`${context} must be an array, got: ${typeof value}`);
        }
        return value;
    }

    private static parseOptionalRecord(value: unknown, context: string): Record<string, unknown> {
        if (value === undefined || value === null) return {};
        if (typeof value !== 'object' || Array.isArray(value)) {
            throw new Error(`${context} must be an object, got: ${Array.isArray(value) ? 'array' : typeof value}`);
        }
        return value as Record<string, unknown>;
    }

    private static assertPositiveInteger(value: unknown, context: string): number {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
            throw new Error(`${context} must be a positive integer, got: ${JSON.stringify(value)}`);
        }
        return value;
    }
}

registerTripReportBlockParser(TripReportBlockType.Map, (res) => TripReportMapBlock.fromResult(res));
