import type { Feature, FeatureCollection, GeoJsonProperties, LineString, Point } from 'geojson';
import { LengthMeasurement, METERS } from '../measurements/lengthMeasurement';
import { ROPEGEO_PROPERTY, STYLE_PROPERTY } from '../mapFile/util/properties';
import { Bounds } from '../minimap/bounds';
import {
    importedTripReportColors,
    LINE_SEGMENT_WIDTH_PX,
    nearestLineThickness,
    parseTripReportColor,
    toTripReportHexColor,
    tripReportColorHex,
    type TripReportColor,
    type TripReportHexColor,
} from './lineSegmentAppearance';

/** A recorded or hand-placed point on a line segment: [longitude, latitude]. */
export type TripReportWaypoint = readonly [lng: number, lat: number];

export const TRIP_REPORT_LINE_COLORS = [
    'black',
    'white',
    'red',
    'orange',
    'yellow',
    'green',
    'cyan',
    'blue',
    'violet',
    'pink',
] as const;
export type TripReportLineColor = (typeof TRIP_REPORT_LINE_COLORS)[number];
export const DEFAULT_TRIP_REPORT_LINE_COLOR: TripReportLineColor = 'black';

export const TRIP_REPORT_LINE_STYLES = ['solid', 'dashed', 'dotted'] as const;
export type TripReportLineStyle = (typeof TRIP_REPORT_LINE_STYLES)[number];
export const DEFAULT_TRIP_REPORT_LINE_STYLE: TripReportLineStyle = 'solid';

export const TRIP_REPORT_LINE_THICKNESSES = ['thin', 'medium', 'thick'] as const;
export type TripReportLineThickness = (typeof TRIP_REPORT_LINE_THICKNESSES)[number];
export const DEFAULT_TRIP_REPORT_LINE_THICKNESS: TripReportLineThickness = 'medium';

/** Whether direction arrows are drawn along the line. */
export const DEFAULT_TRIP_REPORT_LINE_SHOW_DIRECTION = true;

/** Stored precision: 6 decimals is about 0.1 m. */
const COORDINATE_DECIMALS = 6;

function roundCoordinate(value: number): number {
    const factor = 10 ** COORDINATE_DECIMALS;
    return Math.round(value * factor) / factor;
}

/** Rounds to the stored precision. */
export function roundWaypoint([lng, lat]: TripReportWaypoint): TripReportWaypoint {
    return [roundCoordinate(lng), roundCoordinate(lat)];
}

/** Meters per degree of latitude (WGS84 approximation). */
const METERS_PER_DEG_LAT = 111_320;
/** Mean Earth radius used for haversine path length. */
const EARTH_RADIUS_M = 6_371_000;

/**
 * Point `meters` from `from` toward `toward`, rounded to stored precision. Null when the two
 * points coincide (no direction).
 */
export function waypointOffsetToward(
    from: TripReportWaypoint,
    toward: TripReportWaypoint,
    meters: number,
): TripReportWaypoint | null {
    const [fromLng, fromLat] = from;
    const dLng = toward[0] - fromLng;
    const dLat = toward[1] - fromLat;
    const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos((fromLat * Math.PI) / 180);
    const distanceM = Math.hypot(dLng * metersPerDegLng, dLat * METERS_PER_DEG_LAT);
    if (!(distanceM > 0)) return null;
    const scale = meters / distanceM;
    return roundWaypoint([fromLng + dLng * scale, fromLat + dLat * scale]);
}

/** Great-circle distance in meters between two waypoints. */
function distanceMetersBetween(a: TripReportWaypoint, b: TripReportWaypoint): number {
    const toRad = Math.PI / 180;
    const lat1 = a[1] * toRad;
    const lat2 = b[1] * toRad;
    const dLat = (b[1] - a[1]) * toRad;
    const dLng = (b[0] - a[0]) * toRad;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h =
        sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Sum of great-circle lengths along consecutive waypoints. */
function pathDistanceMeters(waypoints: readonly TripReportWaypoint[]): number {
    let total = 0;
    for (let i = 1; i < waypoints.length; i += 1) {
        total += distanceMetersBetween(waypoints[i - 1]!, waypoints[i]!);
    }
    return total;
}

/** Smallest box containing every waypoint, or null when there are none. */
function boundsOfWaypoints(waypoints: readonly TripReportWaypoint[]): Bounds | null {
    if (waypoints.length === 0) return null;
    const [firstLng, firstLat] = waypoints[0]!;
    const bounds = new Bounds(firstLat, firstLat, firstLng, firstLng);
    for (const [lng, lat] of waypoints) bounds.update(lng, lat);
    return bounds;
}

function parseOption<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
    return options.includes(value as T) ? (value as T) : fallback;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

let nextSegmentId = 0;

function createSegmentId(): string {
    nextSegmentId += 1;
    return `segment-${Date.now()}-${nextSegmentId}`;
}

export type FromMapFileLineOptions = {
    id: string;
    name: string;
    /** Color when the line has no RopeGeo color and no hex `stroke`. */
    defaultColor?: TripReportLineColor;
};

export type TripReportLineSegmentJson = {
    id: string;
    name: string;
    waypoints: [number, number][];
    color?: TripReportColor;
    originalColor?: TripReportHexColor;
    style?: TripReportLineStyle;
    thickness?: TripReportLineThickness;
    showDirection?: boolean;
};

/**
 * An ordered list of waypoints drawn as one line. A waypoint's number is its position plus one,
 * so waypoints are addressed by index.
 */
export class TripReportLineSegment {
    readonly id: string;
    readonly name: string;
    readonly waypoints: TripReportWaypoint[];
    /** The color drawn on the map. */
    readonly color: TripReportColor;
    /** The color the line had in the map file it was imported from, or null if it had none. */
    readonly originalColor: TripReportHexColor | null;
    readonly style: TripReportLineStyle;
    readonly thickness: TripReportLineThickness;
    /** When true, direction arrows are drawn along the line. */
    readonly showDirection: boolean;
    /**
     * Smallest box containing every waypoint, or null with no waypoints. Computed from
     * {@link waypoints} when the segment is created; every waypoint change creates a new segment,
     * so it always matches. Not part of the JSON.
     */
    readonly bounds: Bounds | null;
    /**
     * Great-circle length of the polyline in meters. Recomputed from {@link waypoints} whenever
     * the segment is created (including add/remove/move/split). Not part of the JSON.
     */
    readonly distance: LengthMeasurement;

    constructor(
        id: string,
        name: string,
        waypoints: TripReportWaypoint[],
        color: TripReportColor = DEFAULT_TRIP_REPORT_LINE_COLOR,
        style: TripReportLineStyle = DEFAULT_TRIP_REPORT_LINE_STYLE,
        thickness: TripReportLineThickness = DEFAULT_TRIP_REPORT_LINE_THICKNESS,
        originalColor: TripReportHexColor | null = null,
        showDirection: boolean = DEFAULT_TRIP_REPORT_LINE_SHOW_DIRECTION,
    ) {
        this.id = id;
        this.name = name;
        this.waypoints = waypoints;
        this.color = color;
        this.originalColor = originalColor;
        this.style = style;
        this.thickness = thickness;
        this.showDirection = showDirection;
        this.bounds = boundsOfWaypoints(waypoints);
        this.distance = new LengthMeasurement(pathDistanceMeters(waypoints), METERS);
    }

    static createEmpty(
        name: string,
        color: TripReportLineColor = DEFAULT_TRIP_REPORT_LINE_COLOR,
    ): TripReportLineSegment {
        return new TripReportLineSegment(createSegmentId(), name, [], color);
    }

    private copy(
        changes: Partial<
            Pick<
                TripReportLineSegment,
                'name' | 'waypoints' | 'color' | 'style' | 'thickness' | 'showDirection'
            >
        >,
    ): TripReportLineSegment {
        return new TripReportLineSegment(
            this.id,
            changes.name ?? this.name,
            changes.waypoints ?? this.waypoints,
            changes.color ?? this.color,
            changes.style ?? this.style,
            changes.thickness ?? this.thickness,
            this.originalColor,
            changes.showDirection ?? this.showDirection,
        );
    }

    withWaypointAppended(point: TripReportWaypoint): TripReportLineSegment {
        return this.copy({ waypoints: [...this.waypoints, roundWaypoint(point)] });
    }

    /** Inserts so the new point gets number `index + 1`; out-of-range indexes are clamped. */
    withWaypointInserted(index: number, point: TripReportWaypoint): TripReportLineSegment {
        const at = Math.max(0, Math.min(index, this.waypoints.length));
        const waypoints = [...this.waypoints];
        waypoints.splice(at, 0, roundWaypoint(point));
        return this.copy({ waypoints });
    }

    withWaypointMoved(index: number, point: TripReportWaypoint): TripReportLineSegment {
        if (index < 0 || index >= this.waypoints.length) return this;
        const waypoints = [...this.waypoints];
        waypoints[index] = roundWaypoint(point);
        return this.copy({ waypoints });
    }

    withWaypointRemoved(index: number): TripReportLineSegment {
        if (index < 0 || index >= this.waypoints.length) return this;
        return this.copy({ waypoints: this.waypoints.filter((_, i) => i !== index) });
    }

    /** Replaces the waypoint list (each rounded); keeps id, name, and appearance. */
    withWaypoints(waypoints: readonly TripReportWaypoint[]): TripReportLineSegment {
        return this.copy({ waypoints: waypoints.map(roundWaypoint) });
    }

    /**
     * A new segment id with the same color, style, thickness, showDirection, and originalColor as
     * this one. Used when splitting a segment so the tail inherits appearance.
     */
    createSibling(name: string, waypoints: readonly TripReportWaypoint[]): TripReportLineSegment {
        return new TripReportLineSegment(
            createSegmentId(),
            name,
            waypoints.map(roundWaypoint),
            this.color,
            this.style,
            this.thickness,
            this.originalColor,
            this.showDirection,
        );
    }

    /** Blank or whitespace-only names are ignored. */
    withName(name: string): TripReportLineSegment {
        const trimmed = name.trim();
        return trimmed.length === 0 ? this : this.copy({ name: trimmed });
    }

    /** A palette color, or an exact color such as {@link originalColor}. */
    withColor(color: TripReportColor): TripReportLineSegment {
        return this.copy({ color });
    }

    withStyle(style: TripReportLineStyle): TripReportLineSegment {
        return this.copy({ style });
    }

    withThickness(thickness: TripReportLineThickness): TripReportLineSegment {
        return this.copy({ thickness });
    }

    withShowDirection(showDirection: boolean): TripReportLineSegment {
        return this.copy({ showDirection });
    }

    get lastWaypoint(): TripReportWaypoint | null {
        return this.waypoints.length > 0 ? this.waypoints[this.waypoints.length - 1] : null;
    }

    toLineFeature(): Feature<LineString> {
        return {
            type: 'Feature',
            properties: { segmentId: this.id },
            geometry: {
                type: 'LineString',
                coordinates: this.waypoints.map(([lng, lat]) => [lng, lat]),
            },
        };
    }

    toWaypointFeatures(): FeatureCollection<Point, { number: number }> {
        return {
            type: 'FeatureCollection',
            features: this.waypoints.map(([lng, lat], index) => ({
                type: 'Feature',
                properties: { number: index + 1 },
                geometry: { type: 'Point', coordinates: [lng, lat] },
            })),
        };
    }

    /**
     * This segment as a map file feature: a LineString (a Point when it has one waypoint, null when
     * it has none) styled with simplestyle `stroke` / `stroke-width`, plus `ropegeo:*` values so
     * RopeGeo restores the exact segment on import.
     */
    toMapFileFeature(): Feature | null {
        if (this.waypoints.length === 0) return null;
        const coordinates = this.waypoints.map(([lng, lat]) => [lng, lat]);
        return {
            type: 'Feature',
            properties: {
                [STYLE_PROPERTY.name]: this.name,
                [STYLE_PROPERTY.stroke]: tripReportColorHex(this.color),
                [STYLE_PROPERTY.strokeWidth]: LINE_SEGMENT_WIDTH_PX[this.thickness],
                [ROPEGEO_PROPERTY.id]: this.id,
                [ROPEGEO_PROPERTY.color]: this.color,
                ...(this.originalColor != null && { [ROPEGEO_PROPERTY.originalColor]: this.originalColor }),
                [ROPEGEO_PROPERTY.style]: this.style,
                [ROPEGEO_PROPERTY.thickness]: this.thickness,
                [ROPEGEO_PROPERTY.showDirection]: this.showDirection,
            },
            geometry:
                coordinates.length === 1
                    ? { type: 'Point', coordinates: coordinates[0]! }
                    : { type: 'LineString', coordinates },
        };
    }

    /**
     * A segment from an imported line. RopeGeo's own `ropegeo:*` values win. Otherwise a hex
     * `stroke` is kept exactly as both the color and the original color (with no `stroke`, the color
     * is `defaultColor` and there is no original color), and the thickness is the one nearest the
     * line's `stroke-width`. The style is solid unless `ropegeo:style` says otherwise (other apps
     * can't express dashed or dotted lines).
     */
    static fromMapFileLine(
        line: LineString,
        properties: GeoJsonProperties,
        { id, name, defaultColor = DEFAULT_TRIP_REPORT_LINE_COLOR }: FromMapFileLineOptions,
    ): TripReportLineSegment {
        const props = properties ?? {};
        const { color, originalColor } = importedTripReportColors(props, [STYLE_PROPERTY.stroke], defaultColor);
        return new TripReportLineSegment(
            id,
            name,
            line.coordinates
                .filter((position) => Number.isFinite(position[0]) && Number.isFinite(position[1]))
                .map((position) => roundWaypoint([position[0]!, position[1]!])),
            color,
            parseOption(TRIP_REPORT_LINE_STYLES, props[ROPEGEO_PROPERTY.style], DEFAULT_TRIP_REPORT_LINE_STYLE),
            parseOption(
                TRIP_REPORT_LINE_THICKNESSES,
                props[ROPEGEO_PROPERTY.thickness],
                nearestLineThickness(props[STYLE_PROPERTY.strokeWidth]) ?? DEFAULT_TRIP_REPORT_LINE_THICKNESS,
            ),
            originalColor,
            parseBoolean(props[ROPEGEO_PROPERTY.showDirection], DEFAULT_TRIP_REPORT_LINE_SHOW_DIRECTION),
        );
    }

    /** Appearance values are written only when they differ from the defaults. */
    toJSON(): TripReportLineSegmentJson {
        const json: TripReportLineSegmentJson = {
            id: this.id,
            name: this.name,
            waypoints: this.waypoints.map(([lng, lat]) => [lng, lat]),
        };
        if (this.color !== DEFAULT_TRIP_REPORT_LINE_COLOR) json.color = this.color;
        if (this.originalColor != null) json.originalColor = this.originalColor;
        if (this.style !== DEFAULT_TRIP_REPORT_LINE_STYLE) json.style = this.style;
        if (this.thickness !== DEFAULT_TRIP_REPORT_LINE_THICKNESS) json.thickness = this.thickness;
        if (this.showDirection !== DEFAULT_TRIP_REPORT_LINE_SHOW_DIRECTION) {
            json.showDirection = this.showDirection;
        }
        return json;
    }

    /** Missing or unknown appearance values fall back to the defaults (no original color). */
    static fromJSON(json: TripReportLineSegmentJson): TripReportLineSegment {
        return new TripReportLineSegment(
            json.id,
            json.name,
            (json.waypoints ?? []).map(([lng, lat]) => roundWaypoint([lng, lat])),
            parseTripReportColor(json.color) ?? DEFAULT_TRIP_REPORT_LINE_COLOR,
            parseOption(TRIP_REPORT_LINE_STYLES, json.style, DEFAULT_TRIP_REPORT_LINE_STYLE),
            parseOption(
                TRIP_REPORT_LINE_THICKNESSES,
                json.thickness,
                DEFAULT_TRIP_REPORT_LINE_THICKNESS,
            ),
            toTripReportHexColor(json.originalColor),
            parseBoolean(json.showDirection, DEFAULT_TRIP_REPORT_LINE_SHOW_DIRECTION),
        );
    }
}
