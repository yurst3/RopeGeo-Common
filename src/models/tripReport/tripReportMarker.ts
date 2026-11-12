import type { Feature, GeoJsonProperties, Point } from 'geojson';
import { ROPEGEO_PROPERTY, STYLE_PROPERTY } from '../mapFile/util/properties';
import {
    importedTripReportColors,
    parseTripReportColor,
    toTripReportHexColor,
    tripReportColorHex,
    type TripReportColor,
    type TripReportHexColor,
} from './lineSegmentAppearance';
import {
    DEFAULT_TRIP_REPORT_LINE_COLOR,
    roundWaypoint,
    type TripReportLineColor,
    type TripReportWaypoint,
} from './tripReportLineSegment';

/** Marker icon: one per marker image (`marker.png`, `markerCamera.png`, ...). */
export enum TripReportMarkerStyle {
    Marker = 'marker',
    Alert = 'alert',
    Blocked = 'blocked',
    Camera = 'camera',
    Camp = 'camp',
    Down = 'down',
    Parking = 'parking',
    Pool = 'pool',
    Question = 'question',
    Star = 'star',
    Swim = 'swim',
    Up = 'up',
    Waterfall = 'waterfall',
}

export const TRIP_REPORT_MARKER_STYLES: readonly TripReportMarkerStyle[] = Object.values(TripReportMarkerStyle);
export const DEFAULT_TRIP_REPORT_MARKER_STYLE = TripReportMarkerStyle.Marker;

/**
 * Color properties an imported point may carry, most specific first: simplestyle `marker-color`,
 * togeojson's `icon-color` (from a KML IconStyle), then a plain `stroke`.
 */
const POINT_COLOR_PROPERTIES = [STYLE_PROPERTY.markerColor, 'icon-color', STYLE_PROPERTY.stroke] as const;

function parseOption<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
    return options.includes(value as T) ? (value as T) : fallback;
}

let nextMarkerId = 0;

function createMarkerId(): string {
    nextMarkerId += 1;
    return `marker-${Date.now()}-${nextMarkerId}`;
}

export type FromMapFilePointOptions = {
    id: string;
    name: string;
    /** Color when the point has no RopeGeo color and no hex color property. */
    defaultColor?: TripReportLineColor;
};

export type TripReportMarkerJson = {
    id: string;
    name: string;
    position: [number, number];
    color?: TripReportColor;
    originalColor?: TripReportHexColor;
    style?: TripReportMarkerStyle;
};

/**
 * A single named point on a trip report map, drawn as a marker icon. Colors are the line segment
 * palette or an imported file's exact color; the style picks the icon.
 */
export class TripReportMarker {
    readonly id: string;
    readonly name: string;
    readonly position: TripReportWaypoint;
    /** The color drawn on the map. */
    readonly color: TripReportColor;
    /** The color the point had in the map file it was imported from, or null if it had none. */
    readonly originalColor: TripReportHexColor | null;
    readonly style: TripReportMarkerStyle;

    constructor(
        id: string,
        name: string,
        position: TripReportWaypoint,
        color: TripReportColor = DEFAULT_TRIP_REPORT_LINE_COLOR,
        style: TripReportMarkerStyle = DEFAULT_TRIP_REPORT_MARKER_STYLE,
        originalColor: TripReportHexColor | null = null,
    ) {
        this.id = id;
        this.name = name;
        this.position = position;
        this.color = color;
        this.originalColor = originalColor;
        this.style = style;
    }

    static create(
        name: string,
        position: TripReportWaypoint,
        color: TripReportLineColor = DEFAULT_TRIP_REPORT_LINE_COLOR,
        style: TripReportMarkerStyle = DEFAULT_TRIP_REPORT_MARKER_STYLE,
    ): TripReportMarker {
        return new TripReportMarker(createMarkerId(), name, roundWaypoint(position), color, style);
    }

    private copy(
        changes: Partial<Pick<TripReportMarker, 'name' | 'position' | 'color' | 'style'>>,
    ): TripReportMarker {
        return new TripReportMarker(
            this.id,
            changes.name ?? this.name,
            changes.position ?? this.position,
            changes.color ?? this.color,
            changes.style ?? this.style,
            this.originalColor,
        );
    }

    /** Blank or whitespace-only names are ignored. */
    withName(name: string): TripReportMarker {
        const trimmed = name.trim();
        return trimmed.length === 0 ? this : this.copy({ name: trimmed });
    }

    withPosition(position: TripReportWaypoint): TripReportMarker {
        return this.copy({ position: roundWaypoint(position) });
    }

    /** A palette color, or an exact color such as {@link originalColor}. */
    withColor(color: TripReportColor): TripReportMarker {
        return this.copy({ color });
    }

    withStyle(style: TripReportMarkerStyle): TripReportMarker {
        return this.copy({ style });
    }

    /** This marker as a Point feature for drawing on a map. */
    toFeature(): Feature<Point, { markerId: string }> {
        return {
            type: 'Feature',
            properties: { markerId: this.id },
            geometry: { type: 'Point', coordinates: [this.position[0], this.position[1]] },
        };
    }

    /**
     * This marker as a map file feature: a Point with its name and simplestyle `marker-color`,
     * plus `ropegeo:*` values so RopeGeo restores the exact marker on import.
     */
    toMapFileFeature(): Feature<Point> {
        return {
            type: 'Feature',
            properties: {
                [STYLE_PROPERTY.name]: this.name,
                [STYLE_PROPERTY.markerColor]: tripReportColorHex(this.color),
                [ROPEGEO_PROPERTY.id]: this.id,
                [ROPEGEO_PROPERTY.color]: this.color,
                ...(this.originalColor != null && { [ROPEGEO_PROPERTY.originalColor]: this.originalColor }),
                [ROPEGEO_PROPERTY.style]: this.style,
            },
            geometry: { type: 'Point', coordinates: [this.position[0], this.position[1]] },
        };
    }

    /**
     * A marker from an imported point. Like {@link TripReportLineSegment.fromMapFileLine}, RopeGeo's
     * own `ropegeo:*` values win; otherwise the point's first hex color property is kept exactly as
     * both the color and the original color, and a point without one gets `defaultColor` and no
     * original color. The style is the plain marker unless `ropegeo:style` names another one.
     */
    static fromMapFilePoint(
        point: Point,
        properties: GeoJsonProperties,
        { id, name, defaultColor = DEFAULT_TRIP_REPORT_LINE_COLOR }: FromMapFilePointOptions,
    ): TripReportMarker {
        const props = properties ?? {};
        const { color, originalColor } = importedTripReportColors(props, POINT_COLOR_PROPERTIES, defaultColor);
        return new TripReportMarker(
            id,
            name,
            roundWaypoint([point.coordinates[0]!, point.coordinates[1]!]),
            color,
            parseOption(TRIP_REPORT_MARKER_STYLES, props[ROPEGEO_PROPERTY.style], DEFAULT_TRIP_REPORT_MARKER_STYLE),
            originalColor,
        );
    }

    /** Appearance values are written only when they differ from the defaults. */
    toJSON(): TripReportMarkerJson {
        const json: TripReportMarkerJson = {
            id: this.id,
            name: this.name,
            position: [this.position[0], this.position[1]],
        };
        if (this.color !== DEFAULT_TRIP_REPORT_LINE_COLOR) json.color = this.color;
        if (this.originalColor != null) json.originalColor = this.originalColor;
        if (this.style !== DEFAULT_TRIP_REPORT_MARKER_STYLE) json.style = this.style;
        return json;
    }

    /** Missing or unknown appearance values fall back to the defaults (no original color). */
    static fromJSON(json: TripReportMarkerJson): TripReportMarker {
        const [lng, lat] = json.position;
        return new TripReportMarker(
            json.id,
            json.name,
            roundWaypoint([lng, lat]),
            parseTripReportColor(json.color) ?? DEFAULT_TRIP_REPORT_LINE_COLOR,
            parseOption(TRIP_REPORT_MARKER_STYLES, json.style, DEFAULT_TRIP_REPORT_MARKER_STYLE),
            toTripReportHexColor(json.originalColor),
        );
    }
}
