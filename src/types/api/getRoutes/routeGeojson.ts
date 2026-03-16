import { Route, RouteGeoJsonFeature } from '../../routes/route';

/**
 * GeoJSON Feature Collection of routes.
 * Matches the GET /routes response shape.
 */
export class RoutesGeojson {
    type: 'FeatureCollection' = 'FeatureCollection';
    features: RouteGeoJsonFeature[];

    constructor(features: RouteGeoJsonFeature[]) {
        this.features = features;
    }

    static fromRoutes(routes: Route[]): RoutesGeojson {
        return new RoutesGeojson(routes.map((r) => r.toGeoJsonFeature()));
    }

    /**
     * Validates result has RoutesGeojson fields and returns a RoutesGeojson instance.
     */
    static fromResult(result: unknown): RoutesGeojson {
        if (result == null || typeof result !== 'object') {
            throw new Error('RoutesGeojson result must be an object');
        }
        const r = result as Record<string, unknown>;
        RoutesGeojson.assertLiteral(r, 'type', 'FeatureCollection');
        RoutesGeojson.assertFeaturesArray(r, 'features');
        (r as Record<string, unknown>).features = (
            r.features as unknown[]
        ).map((f) => RouteGeoJsonFeature.fromResult(f));
        Object.setPrototypeOf(r, RoutesGeojson.prototype);
        return r as unknown as RoutesGeojson;
    }

    private static assertLiteral(
        obj: Record<string, unknown>,
        key: string,
        expected: string,
    ): void {
        const v = obj[key];
        if (v !== expected) {
            throw new Error(
                `RoutesGeojson.${key} must be "${expected}", got: ${JSON.stringify(v)}`,
            );
        }
    }

    private static assertFeaturesArray(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (!Array.isArray(v)) {
            throw new Error(
                `RoutesGeojson.${key} must be an array, got: ${typeof v}`,
            );
        }
    }
}
