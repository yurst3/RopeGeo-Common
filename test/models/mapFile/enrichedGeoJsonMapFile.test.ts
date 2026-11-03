import { describe, it, expect } from '@jest/globals';
import type { FeatureCollection } from 'geojson';
import {
    EnrichedGeoJsonMapFile,
    GeoJsonMapFile,
    KMLMapFile,
    LEGEND_ID_PROPERTY,
} from '../../../src/models';
import { KML } from './fixtures';

describe('EnrichedGeoJsonMapFile', () => {
    it('is produced by enrich() with deterministic legend ids', () => {
        const first = new KMLMapFile('route.kml', KML).toGeoJson().enrich();
        const second = new KMLMapFile('route.kml', KML).toGeoJson().enrich();
        expect(first).toBeInstanceOf(EnrichedGeoJsonMapFile);
        expect(first.fileName).toBe('route.geojson');
        expect(Object.keys(first.legend)).toHaveLength(2);
        const ids = first.geoJson.features.map((f) => f.properties![LEGEND_ID_PROPERTY]);
        expect(Object.keys(first.legend).sort()).toEqual([...ids].sort());
        expect(second.geoJson.features.map((f) => f.properties![LEGEND_ID_PROPERTY])).toEqual(ids);
        expect(first.bounds).toMatchObject({ north: 38.6, south: 38.5, east: -109.4, west: -109.5 });
    });

    it('has an empty legend when there are no features', () => {
        const enriched = new GeoJsonMapFile('empty.geojson', { type: 'FeatureCollection', features: [] }).enrich();
        expect(enriched.legend).toEqual({});
        expect(enriched.bounds).toBeNull();
    });

    describe('legend ids across the whole file', () => {
        const trail: FeatureCollection = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: { name: 'North fork', stroke: '#ff0000' },
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [-110.0, 38.2],
                            [-109.5, 38.4],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: { name: 'Start' },
                    geometry: { type: 'Point', coordinates: [-109.0, 38.5] },
                },
            ],
        };

        function legendIds(fc: FeatureCollection, fileName = 'trail.geojson'): string[] {
            return new EnrichedGeoJsonMapFile(fileName, fc).geoJson.features.map(
                (f) => (f.properties as Record<string, string>)[LEGEND_ID_PROPERTY]!,
            );
        }

        it('are the same when the same file is enriched twice', () => {
            expect(legendIds(trail)).toEqual(legendIds(structuredClone(trail)));
        });

        it('ignore property key order and tiny float differences', () => {
            const reordered = structuredClone(trail);
            reordered.features[0]!.properties = { stroke: '#ff0000', name: 'North fork' };
            (reordered.features[0]!.geometry as { coordinates: number[][] }).coordinates[0] = [-110.00000000001, 38.2];
            expect(legendIds(reordered)).toEqual(legendIds(trail));
        });

        it('depend only on the file name and contents', () => {
            expect(legendIds(trail, 'copy.geojson')).toEqual(legendIds(structuredClone(trail), 'copy.geojson'));
            expect(legendIds(trail, 'a.geojson')[0]).not.toBe(legendIds(trail, 'b.geojson')[0]);
        });

        it('keep repeated identical features distinct and reproducible', () => {
            const repeated: FeatureCollection = {
                type: 'FeatureCollection',
                features: [trail.features[1]!, trail.features[1]!, trail.features[1]!],
            };
            const ids = legendIds(repeated);
            expect(new Set(ids).size).toBe(3);
            expect(legendIds(repeated)).toEqual(ids);
            expect(ids[0]).toBe(legendIds(trail)[1]);
        });

        it('stay the same when an enriched file is enriched again', () => {
            const enriched = new EnrichedGeoJsonMapFile('trail.geojson', trail);
            expect(enriched.enrich().legend).toEqual(enriched.legend);
            expect(legendIds(enriched.geoJson)).toEqual(legendIds(trail));
        });

        it('key the legend by the ids on the features', () => {
            const enriched = new EnrichedGeoJsonMapFile('trail.geojson', trail);
            expect(Object.keys(enriched.legend).sort()).toEqual([...legendIds(trail)].sort());
        });
    });
});
