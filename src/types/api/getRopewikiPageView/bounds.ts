/**
 * Geographic bounding box (west, south, east, north) for map tile content.
 */
export class Bounds {
    north: number;
    south: number;
    east: number;
    west: number;

    constructor(north: number, south: number, east: number, west: number) {
        this.north = north;
        this.south = south;
        this.east = east;
        this.west = west;
    }

    /**
     * Expands this bounds to include the given coordinate (lon, lat).
     * If lat is greater than north, north is updated; if lat is less than south, south is updated;
     * if lon is greater than east, east is updated; if lon is less than west, west is updated.
     */
    update(lon: number, lat: number): void {
        if (lat > this.north) this.north = lat;
        if (lat < this.south) this.south = lat;
        if (lon > this.east) this.east = lon;
        if (lon < this.west) this.west = lon;
    }

    /**
     * Validates result has Bounds fields (north, south, east, west as numbers) and returns a Bounds instance.
     */
    static fromResult(result: unknown): Bounds {
        if (result == null || typeof result !== 'object') {
            throw new Error('Bounds result must be an object');
        }
        const r = result as Record<string, unknown>;
        Bounds.assertNumber(r, 'north');
        Bounds.assertNumber(r, 'south');
        Bounds.assertNumber(r, 'east');
        Bounds.assertNumber(r, 'west');
        return new Bounds(
            r.north as number,
            r.south as number,
            r.east as number,
            r.west as number,
        );
    }

    private static assertNumber(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'number' || Number.isNaN(v)) {
            throw new Error(
                `Bounds.${key} must be a number, got: ${typeof v}`,
            );
        }
    }
}
