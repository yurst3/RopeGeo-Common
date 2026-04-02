import { RouteType } from './routeType';
import { RouteGeoJsonFeature } from './routeGeoJsonFeature';

export { RouteType } from './routeType';
export { RouteGeoJsonFeature } from './routeGeoJsonFeature';

export class Route {
    id: string;
    name: string;
    type: RouteType;
    coordinates: unknown;

    constructor(id: string, name: string, type: RouteType, coordinates: unknown) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.coordinates = coordinates;
    }

    /**
     * Returns this route as a GeoJSON Feature with a Point geometry.
     * Coordinates are [longitude, latitude] per RFC 7946.
     */
    toGeoJsonFeature(): RouteGeoJsonFeature {
        const coords = this.coordinates as { lat: number; lon: number } | null | undefined;
        const lon = coords?.lon ?? 0;
        const lat = coords?.lat ?? 0;
        return new RouteGeoJsonFeature([lon, lat], this.id, this.name, this.type);
    }
}
