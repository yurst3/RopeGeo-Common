import type { Feature, FeatureCollection, GeoJsonProperties, LineString, Point } from 'geojson';
import { ROPEGEO_PROPERTY, STYLE_PROPERTY } from '../mapFile/util/properties';
import {
    LINE_SEGMENT_COLOR_HEX,
    LINE_SEGMENT_WIDTH_PX,
    nearestLineColor,
    nearestLineThickness,
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

/** Stored precision: 6 decimals is about 0.1 m. */
const COORDINATE_DECIMALS = 6;

function roundCoordinate(value: number): number {
    const factor = 10 ** COORDINATE_DECIMALS;
    return Math.round(value * factor) / factor;
}

function roundWaypoint([lng, lat]: TripReportWaypoint): TripReportWaypoint {
    return [roundCoordinate(lng), roundCoordinate(lat)];
}

function parseOption<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
    return options.includes(value as T) ? (value as T) : fallback;
}

let nextSegmentId = 0;

function createSegmentId(): string {
    nextSegmentId += 1;
    return `segment-${Date.now()}-${nextSegmentId}`;
}

export type FromMapFileLineOptions = {
    id: string;
    name: string;
    /** Color when the line has no RopeGeo color and no recognizable `stroke`. */
    defaultColor?: TripReportLineColor;
};

export type TripReportLineSegmentJson = {
    id: string;
    name: string;
    waypoints: [number, number][];
    color?: TripReportLineColor;
    style?: TripReportLineStyle;
    thickness?: TripReportLineThickness;
};

/**
 * An ordered list of waypoints drawn as one line. A waypoint's number is its position plus one,
 * so waypoints are addressed by index.
 */
export class TripReportLineSegment {
    readonly id: string;
    readonly name: string;
    readonly waypoints: TripReportWaypoint[];
    readonly color: TripReportLineColor;
    readonly style: TripReportLineStyle;
    readonly thickness: TripReportLineThickness;

    constructor(
        id: string,
        name: string,
        waypoints: TripReportWaypoint[],
        color: TripReportLineColor = DEFAULT_TRIP_REPORT_LINE_COLOR,
        style: TripReportLineStyle = DEFAULT_TRIP_REPORT_LINE_STYLE,
        thickness: TripReportLineThickness = DEFAULT_TRIP_REPORT_LINE_THICKNESS,
    ) {
        this.id = id;
        this.name = name;
        this.waypoints = waypoints;
        this.color = color;
        this.style = style;
        this.thickness = thickness;
    }

    static createEmpty(
        name: string,
        color: TripReportLineColor = DEFAULT_TRIP_REPORT_LINE_COLOR,
    ): TripReportLineSegment {
        return new TripReportLineSegment(createSegmentId(), name, [], color);
    }

    private copy(
        changes: Partial<
            Pick<TripReportLineSegment, 'name' | 'waypoints' | 'color' | 'style' | 'thickness'>
        >,
    ): TripReportLineSegment {
        return new TripReportLineSegment(
            this.id,
            changes.name ?? this.name,
            changes.waypoints ?? this.waypoints,
            changes.color ?? this.color,
            changes.style ?? this.style,
            changes.thickness ?? this.thickness,
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

    /** Blank or whitespace-only names are ignored. */
    withName(name: string): TripReportLineSegment {
        const trimmed = name.trim();
        return trimmed.length === 0 ? this : this.copy({ name: trimmed });
    }

    withColor(color: TripReportLineColor): TripReportLineSegment {
        return this.copy({ color });
    }

    withStyle(style: TripReportLineStyle): TripReportLineSegment {
        return this.copy({ style });
    }

    withThickness(thickness: TripReportLineThickness): TripReportLineSegment {
        return this.copy({ thickness });
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
                [STYLE_PROPERTY.stroke]: LINE_SEGMENT_COLOR_HEX[this.color],
                [STYLE_PROPERTY.strokeWidth]: LINE_SEGMENT_WIDTH_PX[this.thickness],
                [ROPEGEO_PROPERTY.id]: this.id,
                [ROPEGEO_PROPERTY.color]: this.color,
                [ROPEGEO_PROPERTY.style]: this.style,
                [ROPEGEO_PROPERTY.thickness]: this.thickness,
            },
            geometry:
                coordinates.length === 1
                    ? { type: 'Point', coordinates: coordinates[0]! }
                    : { type: 'LineString', coordinates },
        };
    }

    /**
     * A segment from an imported line. RopeGeo's own `ropegeo:*` values win; otherwise the color
     * and thickness are the palette entries nearest the line's `stroke` / `stroke-width`, falling
     * back to `defaultColor` and the default thickness. The style is solid unless `ropegeo:style`
     * says otherwise (other apps can't express dashed or dotted lines).
     */
    static fromMapFileLine(
        line: LineString,
        properties: GeoJsonProperties,
        { id, name, defaultColor = DEFAULT_TRIP_REPORT_LINE_COLOR }: FromMapFileLineOptions,
    ): TripReportLineSegment {
        const props = properties ?? {};
        return new TripReportLineSegment(
            id,
            name,
            line.coordinates
                .filter((position) => Number.isFinite(position[0]) && Number.isFinite(position[1]))
                .map((position) => roundWaypoint([position[0]!, position[1]!])),
            parseOption(
                TRIP_REPORT_LINE_COLORS,
                props[ROPEGEO_PROPERTY.color],
                nearestLineColor(props[STYLE_PROPERTY.stroke]) ?? defaultColor,
            ),
            parseOption(TRIP_REPORT_LINE_STYLES, props[ROPEGEO_PROPERTY.style], DEFAULT_TRIP_REPORT_LINE_STYLE),
            parseOption(
                TRIP_REPORT_LINE_THICKNESSES,
                props[ROPEGEO_PROPERTY.thickness],
                nearestLineThickness(props[STYLE_PROPERTY.strokeWidth]) ?? DEFAULT_TRIP_REPORT_LINE_THICKNESS,
            ),
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
        if (this.style !== DEFAULT_TRIP_REPORT_LINE_STYLE) json.style = this.style;
        if (this.thickness !== DEFAULT_TRIP_REPORT_LINE_THICKNESS) json.thickness = this.thickness;
        return json;
    }

    /** Missing or unknown appearance values fall back to the defaults. */
    static fromJSON(json: TripReportLineSegmentJson): TripReportLineSegment {
        return new TripReportLineSegment(
            json.id,
            json.name,
            (json.waypoints ?? []).map(([lng, lat]) => roundWaypoint([lng, lat])),
            parseOption(TRIP_REPORT_LINE_COLORS, json.color, DEFAULT_TRIP_REPORT_LINE_COLOR),
            parseOption(TRIP_REPORT_LINE_STYLES, json.style, DEFAULT_TRIP_REPORT_LINE_STYLE),
            parseOption(
                TRIP_REPORT_LINE_THICKNESSES,
                json.thickness,
                DEFAULT_TRIP_REPORT_LINE_THICKNESS,
            ),
        );
    }
}
