import { describe, it, expect, afterAll } from '@jest/globals';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { strToU8 } from 'fflate';
import {
    GeoJsonMapFile,
    GPXMapFile,
    KMLMapFile,
    KMZMapFile,
    MapFile,
} from '../../../src/models';
import { GPX, KML, kmzBytes } from './fixtures';

const tempDir = mkdtempSync(join(tmpdir(), 'map-file-test-'));
afterAll(() => rmSync(tempDir, { recursive: true, force: true }));

describe('MapFile.fromContent', () => {
    it('returns the concrete class for each format', () => {
        expect(MapFile.fromContent('a.gpx', GPX)).toBeInstanceOf(GPXMapFile);
        expect(MapFile.fromContent('a.kml', KML)).toBeInstanceOf(KMLMapFile);
        expect(MapFile.fromContent('a.kmz', kmzBytes())).toBeInstanceOf(KMZMapFile);
        expect(MapFile.fromContent('a.json', '{"type":"Point","coordinates":[1,2]}')).toBeInstanceOf(GeoJsonMapFile);
    });

    it('keeps only the file name and honors an explicit format', () => {
        const file = MapFile.fromContent('/tmp/maps/route.txt', KML, 'kml');
        expect(file).toBeInstanceOf(KMLMapFile);
        expect(file.fileName).toBe('route.txt');
    });

    it('rejects unknown extensions', () => {
        expect(() => MapFile.fromContent('notes.txt', 'hi')).toThrow('Unsupported map file type');
    });
});

describe('MapFile.readFile', () => {
    it('reads from the file system by default', async () => {
        const path = join(tempDir, 'route.kml');
        writeFileSync(path, KML);
        const file = await MapFile.readFile(path);
        expect(file).toBeInstanceOf(KMLMapFile);
        expect(file.fileName).toBe('route.kml');
        expect(file.toGeoJson().geoJson.features).toHaveLength(2);
    });

    it('reads KMZ bytes from the file system', async () => {
        const path = join(tempDir, 'route.kmz');
        writeFileSync(path, kmzBytes());
        const file = await MapFile.readFile(path);
        expect(file).toBeInstanceOf(KMZMapFile);
        expect(file.toGeoJson().geoJson.features).toHaveLength(2);
    });

    it('uses a provided reader', async () => {
        const requested: string[] = [];
        const file = await MapFile.readFile('content://picked/trip.gpx', async (path) => {
            requested.push(path);
            return strToU8(GPX);
        });
        expect(requested).toEqual(['content://picked/trip.gpx']);
        expect(file).toBeInstanceOf(GPXMapFile);
        expect(file.fileName).toBe('trip.gpx');
    });

    it('rejects unknown extensions before reading', async () => {
        await expect(MapFile.readFile('notes.txt', async () => new Uint8Array())).rejects.toThrow(
            'Unsupported map file type',
        );
    });
});
