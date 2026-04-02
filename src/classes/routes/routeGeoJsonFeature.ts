import { RouteType } from './routeType';

/**
 * GeoJSON Feature with id, name, and type in properties and a Point geometry.
 */
export class RouteGeoJsonFeature {
    type: 'Feature' = 'Feature';
    geometry: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    properties: {
        id: string;
        name: string;
        type: RouteType;
    };

    constructor(
        coordinates: [number, number],
        id: string,
        name: string,
        type: RouteType,
    ) {
        this.geometry = { type: 'Point', coordinates };
        this.properties = { id, name, type };
    }

    /**
     * Validates result has RouteGeoJsonFeature fields and returns a RouteGeoJsonFeature instance.
     */
    static fromResult(result: unknown): RouteGeoJsonFeature {
        if (result == null || typeof result !== 'object') {
            throw new Error('RouteGeoJsonFeature result must be an object');
        }
        const f = result as Record<string, unknown>;
        RouteGeoJsonFeature.assertLiteral(f, 'type', 'Feature');
        RouteGeoJsonFeature.assertPointGeometry(f, 'geometry');
        RouteGeoJsonFeature.assertFeatureProperties(f, 'properties');
        Object.setPrototypeOf(result, RouteGeoJsonFeature.prototype);
        return result as unknown as RouteGeoJsonFeature;
    }

    private static assertLiteral(
        obj: Record<string, unknown>,
        key: string,
        expected: string,
    ): void {
        const v = obj[key];
        if (v !== expected) {
            throw new Error(
                `RouteGeoJsonFeature.${key} must be "${expected}", got: ${JSON.stringify(v)}`,
            );
        }
    }

    private static assertPointGeometry(
        feature: Record<string, unknown>,
        key: string,
    ): void {
        const g = feature[key];
        if (g == null || typeof g !== 'object') {
            throw new Error(
                `RouteGeoJsonFeature.${key} must be an object, got: ${typeof g}`,
            );
        }
        const geom = g as Record<string, unknown>;
        RouteGeoJsonFeature.assertLiteral(geom, 'type', 'Point');
        const coords = geom.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2) {
            throw new Error(
                `RouteGeoJsonFeature.${key}.coordinates must be [number, number], got: ${JSON.stringify(coords)}`,
            );
        }
        if (typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
            throw new Error(
                `RouteGeoJsonFeature.${key}.coordinates must be [number, number]`,
            );
        }
        if (Number.isNaN(coords[0]) || Number.isNaN(coords[1])) {
            throw new Error(
                `RouteGeoJsonFeature.${key}.coordinates must be finite numbers`,
            );
        }
    }

    private static assertFeatureProperties(
        feature: Record<string, unknown>,
        key: string,
    ): void {
        const p = feature[key];
        if (p == null || typeof p !== 'object') {
            throw new Error(
                `RouteGeoJsonFeature.${key} must be an object, got: ${typeof p}`,
            );
        }
        const props = p as Record<string, unknown>;
        if (typeof props.id !== 'string') {
            throw new Error(
                `RouteGeoJsonFeature.${key}.id must be a string, got: ${typeof props.id}`,
            );
        }
        if (typeof props.name !== 'string') {
            throw new Error(
                `RouteGeoJsonFeature.${key}.name must be a string, got: ${typeof props.name}`,
            );
        }
        const routeType = props.type;
        const validTypes: string[] = Object.values(RouteType);
        if (typeof routeType !== 'string' || !validTypes.includes(routeType)) {
            throw new Error(
                `RouteGeoJsonFeature.${key}.type must be one of ${validTypes.join(', ')}, got: ${JSON.stringify(routeType)}`,
            );
        }
    }
}
