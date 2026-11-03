import { parseHexColor } from '../mapFile/util/export/color';
import type { TripReportLineColor, TripReportLineThickness } from './tripReportLineSegment';

/** `#rrggbb` for each line segment color; the same in every app theme. */
export const LINE_SEGMENT_COLOR_HEX: Record<TripReportLineColor, string> = {
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
