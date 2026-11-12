import type { GeoJsonProperties } from 'geojson';
import { parseHexColor, rgbToHex } from '../mapFile/util/export/color';
import { ROPEGEO_PROPERTY } from '../mapFile/util/properties';
import type { TripReportLineColor, TripReportLineThickness } from './tripReportLineSegment';

/** An exact color outside the palette as lowercase `#rrggbb`, such as an imported file's own color. */
export type TripReportHexColor = `#${string}`;

/** The color a line segment or marker is drawn with: a palette color or an exact color. */
export type TripReportColor = TripReportLineColor | TripReportHexColor;

/** `#rrggbb` for each line segment color; the same in every app theme. */
export const LINE_SEGMENT_COLOR_HEX: Record<TripReportLineColor, TripReportHexColor> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ef4444',
    orange: '#f97316',
    yellow: '#facc15',
    green: '#22c55e',
    cyan: '#06b6d4',
    blue: '#3b82f6',
    violet: '#8b5cf6',
    pink: '#ec4899',
};

/** Line width in pixels (simplestyle `stroke-width`) for each thickness. */
export const LINE_SEGMENT_WIDTH_PX: Record<TripReportLineThickness, number> = {
    thin: 2,
    medium: 4,
    thick: 6,
};

function isLineColor(value: unknown): value is TripReportLineColor {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LINE_SEGMENT_COLOR_HEX, value);
}

/** A `#rgb`/`#rrggbb` color as lowercase `#rrggbb`, or null if it isn't one. */
export function toTripReportHexColor(value: unknown): TripReportHexColor | null {
    const rgb = parseHexColor(value);
    return rgb == null ? null : `#${rgbToHex(rgb)}`;
}

/** A palette color name, or a hex color as lowercase `#rrggbb`; null for anything else. */
export function parseTripReportColor(value: unknown): TripReportColor | null {
    return isLineColor(value) ? value : toTripReportHexColor(value);
}

/** `#rrggbb` to draw or export a color with. */
export function tripReportColorHex(color: TripReportColor): TripReportHexColor {
    return isLineColor(color) ? LINE_SEGMENT_COLOR_HEX[color] : color;
}

/**
 * The drawn color and original color of an imported feature. RopeGeo's own `ropegeo:color` and
 * `ropegeo:original-color` win, so its exports restore exactly. Otherwise the first of
 * `colorProperties` holding a hex color becomes both the drawn color and the original color, and a
 * feature without one gets `defaultColor` and no original color.
 */
export function importedTripReportColors(
    properties: GeoJsonProperties,
    colorProperties: readonly string[],
    defaultColor: TripReportLineColor,
): { color: TripReportColor; originalColor: TripReportHexColor | null } {
    const props = properties ?? {};
    const savedColor = parseTripReportColor(props[ROPEGEO_PROPERTY.color]);
    if (savedColor != null) {
        return { color: savedColor, originalColor: toTripReportHexColor(props[ROPEGEO_PROPERTY.originalColor]) };
    }
    const fileColor = colorProperties.reduce<TripReportHexColor | null>(
        (found, key) => found ?? toTripReportHexColor(props[key]),
        null,
    );
    return { color: fileColor ?? defaultColor, originalColor: fileColor };
}

/** Palette color closest to a `#rgb`/`#rrggbb` color by RGB distance, or null if it isn't one. */
export function nearestLineColor(color: unknown): TripReportLineColor | null {
    const rgb = parseHexColor(color);
    if (rgb == null) return null;
    let best: TripReportLineColor | null = null;
    let bestDistance = Infinity;
    for (const [name, hex] of Object.entries(LINE_SEGMENT_COLOR_HEX) as [TripReportLineColor, string][]) {
        const candidate = parseHexColor(hex)!;
        const distance = (candidate.r - rgb.r) ** 2 + (candidate.g - rgb.g) ** 2 + (candidate.b - rgb.b) ** 2;
        if (distance < bestDistance) {
            best = name;
            bestDistance = distance;
        }
    }
    return best;
}

/** Thickness whose pixel width is closest to `width`, or null if it isn't a positive number. */
export function nearestLineThickness(width: unknown): TripReportLineThickness | null {
    const value = typeof width === 'number' ? width : typeof width === 'string' ? Number(width) : NaN;
    if (!Number.isFinite(value) || value <= 0) return null;
    let best: TripReportLineThickness | null = null;
    let bestDistance = Infinity;
    for (const [name, px] of Object.entries(LINE_SEGMENT_WIDTH_PX) as [TripReportLineThickness, number][]) {
        const distance = Math.abs(px - value);
        if (distance < bestDistance) {
            best = name;
            bestDistance = distance;
        }
    }
    return best;
}
