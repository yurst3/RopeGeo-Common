/** GeoJSON Feature with id, name, and type in properties and a Point geometry. */
export interface RouteGeoJsonFeature {
    type: 'Feature';
    geometry: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    properties: {
        id: string;
        name: string;
        type: RouteType;
    };
}

export enum RouteType {
    Cave = 'Cave',
    Canyon = 'Canyon',
    POI = 'POI',
    Unknown = 'Unknown',
}

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
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [lon, lat],
            },
            properties: {
                id: this.id,
                name: this.name,
                type: this.type,
            },
        };
    }
}
