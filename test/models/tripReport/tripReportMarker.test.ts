import { describe, it, expect } from '@jest/globals';
import type { Point } from 'geojson';
import {
    DEFAULT_TRIP_REPORT_MARKER_STYLE,
    TRIP_REPORT_MARKER_STYLES,
    TripReportMarker,
    TripReportMarkerStyle,
    type TripReportMarkerJson,
} from '../../../src/models';

const POINT: Point = { type: 'Point', coordinates: [-109.45, 38.55, 1500] };

describe('TripReportMarkerStyle', () => {
    it('has one style per marker icon, with the plain marker as the default', () => {
        expect(TRIP_REPORT_MARKER_STYLES).toEqual([
            'marker',
            'alert',
            'blocked',
            'camera',
            'camp',
            'down',
            'parking',
            'pool',
            'question',
            'star',
            'swim',
            'up',
            'waterfall',
        ]);
        expect(DEFAULT_TRIP_REPORT_MARKER_STYLE).toBe(TripReportMarkerStyle.Marker);
    });
});

describe('TripReportMarker.create', () => {
    it('defaults to black with the plain marker style and rounds the position', () => {
        const marker = TripReportMarker.create('Marker 1', [-109.123456789, 38.987654321]);
        expect(marker).toMatchObject({ name: 'Marker 1', color: 'black', style: TripReportMarkerStyle.Marker });
        expect(marker.position).toEqual([-109.123457, 38.987654]);
    });

    it('gives every marker a unique id', () => {
        const ids = new Set(Array.from({ length: 5 }, () => TripReportMarker.create('M', [0, 0]).id));
        expect(ids.size).toBe(5);
    });

    it('accepts a color and style', () => {
        const marker = TripReportMarker.create('Camp', [0, 0], 'green', TripReportMarkerStyle.Camp);
        expect(marker).toMatchObject({ color: 'green', style: TripReportMarkerStyle.Camp });
    });
});

describe('TripReportMarker edits', () => {
    const marker = TripReportMarker.create('Marker 1', [-110, 38]);

    it('returns updated copies that keep the id', () => {
        const edited = marker
            .withName('  Rappel  ')
            .withPosition([-110.0000004, 38.1])
            .withColor('red')
            .withStyle(TripReportMarkerStyle.Down);
        expect(edited).toMatchObject({
            id: marker.id,
            name: 'Rappel',
            position: [-110, 38.1],
            color: 'red',
            style: TripReportMarkerStyle.Down,
        });
        const imported = new TripReportMarker('m1', 'M', [0, 0], '#ff8800', TripReportMarkerStyle.Marker, '#ff8800');
        expect(imported.withColor('blue').withName('Camp').originalColor).toBe('#ff8800');
        expect(marker).toMatchObject({ name: 'Marker 1', color: 'black', style: TripReportMarkerStyle.Marker });
    });

    it('ignores blank names', () => {
        expect(marker.withName('   ')).toBe(marker);
    });
});

describe('TripReportMarker features', () => {
    const marker = new TripReportMarker('m1', 'Pool', [-110, 38], 'blue', TripReportMarkerStyle.Pool);

    it('draws as a point carrying its id', () => {
        expect(marker.toFeature()).toEqual({
            type: 'Feature',
            properties: { markerId: 'm1' },
            geometry: { type: 'Point', coordinates: [-110, 38] },
        });
    });

    it('exports with a simplestyle marker color and RopeGeo values', () => {
        expect(marker.toMapFileFeature()).toEqual({
            type: 'Feature',
            properties: {
                name: 'Pool',
                'marker-color': '#3b82f6',
                'ropegeo:id': 'm1',
                'ropegeo:color': 'blue',
                'ropegeo:style': 'pool',
            },
            geometry: { type: 'Point', coordinates: [-110, 38] },
        });
    });

    it('exports an exact color as the marker color and keeps the original color', () => {
        const imported = new TripReportMarker('m1', 'Pool', [-110, 38], 'red', TripReportMarkerStyle.Pool, '#ff8800');
        expect(imported.toMapFileFeature().properties).toMatchObject({
            'marker-color': '#ef4444',
            'ropegeo:color': 'red',
            'ropegeo:original-color': '#ff8800',
        });
        const exact = imported.withColor(imported.originalColor!);
        expect(exact.toMapFileFeature().properties).toMatchObject({
            'marker-color': '#ff8800',
            'ropegeo:color': '#ff8800',
        });
        const feature = exact.toMapFileFeature();
        expect(TripReportMarker.fromMapFilePoint(feature.geometry, feature.properties, { id: 'm1', name: 'Pool' }))
            .toEqual(exact);
    });

    it('is restored exactly from its own map file feature', () => {
        const feature = marker.toMapFileFeature();
        const restored = TripReportMarker.fromMapFilePoint(feature.geometry, feature.properties, {
            id: 'm1',
            name: 'Pool',
        });
        expect(restored).toEqual(marker);
    });
});

describe('TripReportMarker.fromMapFilePoint', () => {
    const options = { id: 'p1', name: 'Point' };

    it('drops the elevation and uses the plain marker and black by default', () => {
        const marker = TripReportMarker.fromMapFilePoint(POINT, {}, options);
        expect(marker).toMatchObject({
            id: 'p1',
            name: 'Point',
            position: [-109.45, 38.55],
            color: 'black',
            originalColor: null,
            style: TripReportMarkerStyle.Marker,
        });
    });

    it('falls back to the given default color', () => {
        const marker = TripReportMarker.fromMapFilePoint(POINT, null, { ...options, defaultColor: 'white' });
        expect(marker.color).toBe('white');
    });

    it('prefers ropegeo:color, then marker-color, then icon-color, then stroke', () => {
        const colorsOf = (props: Record<string, unknown>) => {
            const marker = TripReportMarker.fromMapFilePoint(POINT, props, { ...options, defaultColor: 'white' });
            return [marker.color, marker.originalColor];
        };
        const all = {
            'ropegeo:color': 'violet',
            'marker-color': '#ff0000',
            'icon-color': '#00ff00',
            stroke: '#0000ff',
        };
        expect(colorsOf(all)).toEqual(['violet', null]);
        expect(colorsOf({ ...all, 'ropegeo:color': undefined })).toEqual(['#ff0000', '#ff0000']);
        expect(colorsOf({ ...all, 'ropegeo:color': undefined, 'marker-color': undefined })).toEqual([
            '#00ff00',
            '#00ff00',
        ]);
        expect(colorsOf({ stroke: '#0000FF' })).toEqual(['#0000ff', '#0000ff']);
    });

    it('keeps an imported color exactly, even one in the palette', () => {
        const marker = TripReportMarker.fromMapFilePoint(POINT, { 'marker-color': '#ef4444' }, options);
        expect(marker).toMatchObject({ color: '#ef4444', originalColor: '#ef4444' });
    });

    it("restores RopeGeo's own original color", () => {
        const marker = TripReportMarker.fromMapFilePoint(
            POINT,
            { 'ropegeo:color': 'red', 'ropegeo:original-color': '#123456', 'marker-color': '#ef4444' },
            options,
        );
        expect(marker).toMatchObject({ color: 'red', originalColor: '#123456' });
    });

    it('ignores unknown RopeGeo values', () => {
        const marker = TripReportMarker.fromMapFilePoint(
            POINT,
            { 'ropegeo:color': 'mauve', 'ropegeo:style': 'volcano', 'marker-color': '#22c55e' },
            options,
        );
        expect(marker).toMatchObject({
            color: '#22c55e',
            originalColor: '#22c55e',
            style: TripReportMarkerStyle.Marker,
        });
    });

    it('uses ropegeo:style when it names a style', () => {
        const marker = TripReportMarker.fromMapFilePoint(POINT, { 'ropegeo:style': 'waterfall' }, options);
        expect(marker.style).toBe(TripReportMarkerStyle.Waterfall);
    });
});

describe('TripReportMarker JSON', () => {
    it('writes appearance only when it differs from the defaults', () => {
        expect(new TripReportMarker('m1', 'Marker 1', [-110, 38]).toJSON()).toEqual({
            id: 'm1',
            name: 'Marker 1',
            position: [-110, 38],
        });
        expect(new TripReportMarker('m1', 'Camp', [-110, 38], 'orange', TripReportMarkerStyle.Camp).toJSON()).toEqual({
            id: 'm1',
            name: 'Camp',
            position: [-110, 38],
            color: 'orange',
            style: 'camp',
        });
    });

    it('round-trips', () => {
        const marker = new TripReportMarker('m1', 'Camp', [-110.5, 38.25], 'orange', TripReportMarkerStyle.Camp);
        expect(TripReportMarker.fromJSON(JSON.parse(JSON.stringify(marker.toJSON())))).toEqual(marker);
    });

    it('round-trips an exact color and the original color', () => {
        const marker = new TripReportMarker('m1', 'Camp', [0, 0], '#ff8800', TripReportMarkerStyle.Camp, '#ff8800');
        const json = marker.toJSON();
        expect(json).toMatchObject({ color: '#ff8800', originalColor: '#ff8800' });
        expect(TripReportMarker.fromJSON(JSON.parse(JSON.stringify(json)))).toEqual(marker);
        expect(new TripReportMarker('m1', 'M', [0, 0]).toJSON()).not.toHaveProperty('originalColor');
    });

    it('falls back to the defaults for unknown appearance values', () => {
        const json = { id: 'm1', name: 'M', position: [0, 0], color: 'mauve', originalColor: 'teal', style: 'volcano' };
        const marker = TripReportMarker.fromJSON(json as unknown as TripReportMarkerJson);
        expect(marker).toMatchObject({ color: 'black', originalColor: null, style: TripReportMarkerStyle.Marker });
    });
});
