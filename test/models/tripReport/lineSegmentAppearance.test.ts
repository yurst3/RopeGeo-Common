import { describe, it, expect } from '@jest/globals';
import {
    LINE_SEGMENT_COLOR_HEX,
    nearestLineColor,
    nearestLineThickness,
    TRIP_REPORT_LINE_COLORS,
} from '../../../src/models';

describe('nearestLineColor', () => {
    it('maps each palette color to itself', () => {
        for (const color of TRIP_REPORT_LINE_COLORS) {
            expect(nearestLineColor(LINE_SEGMENT_COLOR_HEX[color])).toBe(color);
        }
    });

    it('picks the closest palette color', () => {
        expect(nearestLineColor('#ff0000')).toBe('red');
        expect(nearestLineColor('#00f')).toBe('blue');
        expect(nearestLineColor('#111111')).toBe('black');
    });

    it('returns null for non-hex values', () => {
        expect(nearestLineColor('red')).toBeNull();
        expect(nearestLineColor(undefined)).toBeNull();
    });
});

describe('nearestLineThickness', () => {
    it('picks the closest width', () => {
        expect(nearestLineThickness(1)).toBe('thin');
        expect(nearestLineThickness('4')).toBe('medium');
        expect(nearestLineThickness(9)).toBe('thick');
    });

    it('returns null for missing or non-positive widths', () => {
        expect(nearestLineThickness(undefined)).toBeNull();
        expect(nearestLineThickness(0)).toBeNull();
        expect(nearestLineThickness('wide')).toBeNull();
    });
});
