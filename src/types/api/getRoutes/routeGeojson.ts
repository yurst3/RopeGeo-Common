import { Route, type RouteGeoJsonFeature } from '../../route';

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
}
