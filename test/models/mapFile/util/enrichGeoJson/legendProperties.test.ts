import { describe, it, expect } from '@jest/globals';
import {
    borderColorFromProps,
    featureLabel,
    fillColorFromProps,
    LEGEND_ID_PROPERTY,
    markerIconFromProps,
    readStringProp,
    strokeColorFromProps,
    strokeWidthFromProps,
    withLegendId,
} from '../../../../../src/models';

describe('readStringProp', () => {
    it('returns the first non-blank string, trimmed', () => {
        expect(readStringProp({ a: '  ', b: 3, c: ' value ' }, ['a', 'b', 'c'])).toBe('value');
        expect(readStringProp({ a: '' }, ['a'])).toBeUndefined();
        expect(readStringProp(null, ['a'])).toBeUndefined();
    });
});

describe('featureLabel', () => {
    it('prefers name, then title, then description', () => {
        expect(featureLabel({ name: 'N', title: 'T' }, 'Fallback')).toBe('N');
        expect(featureLabel({ Title: 'T', description: 'D' }, 'Fallback')).toBe('T');
        expect(featureLabel({ description: 'D' }, 'Fallback')).toBe('D');
        expect(featureLabel({}, 'Fallback')).toBe('Fallback');
    });
});

describe('style readers', () => {
    it('read simplestyle and common alternate keys', () => {
        expect(strokeColorFromProps({ lineColor: '#123456' })).toBe('#123456');
        expect(strokeWidthFromProps({ weight: '3' })).toBe('3');
        expect(borderColorFromProps({ 'border-color': '#000000' })).toBe('#000000');
        expect(fillColorFromProps({ fillColor: '#ffffff' })).toBe('#ffffff');
        expect(markerIconFromProps({ 'marker-symbol': 'campsite' })).toBe('campsite');
    });
});

describe('withLegendId', () => {
    it('copies properties and sets the legend id', () => {
        const props = { name: 'A' };
        const result = withLegendId(props, 'id-1');
        expect(result).toEqual({ name: 'A', [LEGEND_ID_PROPERTY]: 'id-1' });
        expect(props).toEqual({ name: 'A' });
        expect(withLegendId(null, 'id-2')).toEqual({ [LEGEND_ID_PROPERTY]: 'id-2' });
    });
});
