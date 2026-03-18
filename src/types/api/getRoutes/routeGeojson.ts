import { Bounds } from '../../minimap/bounds';
import { Route, RouteGeoJsonFeature } from '../../routes/route';

/**
 * GeoJSON Feature Collection of routes.
 * Matches the GET /routes response shape.
 */
export class RoutesGeojson {
    type: 'FeatureCollection' = 'FeatureCollection';
    features: RouteGeoJsonFeature[];
    /** Bounding box of the route geometry when provided; otherwise null. */
    bounds: Bounds | null;

    constructor(features: RouteGeoJsonFeature[], bounds: Bounds | null = null) {
        this.features = features;
        this.bounds = bounds;
    }

    /**
     * @param withBounds - When true and `routes` is non-empty, computes a {@link Bounds} from each route’s
     *   `{ lat, lon }` coordinates (same as {@link Route.toGeoJsonFeature}). Empty `routes` always yields
     *   `bounds: null`.
     */
    static fromRoutes(routes: Route[], withBounds = false): RoutesGeojson {
        const features = routes.map((r) => r.toGeoJsonFeature());
        let bounds: Bounds | null = null;
        if (routes.length > 0 && withBounds) {
            bounds = RoutesGeojson.computeBoundsFromRoutes(routes);
        }
        return new RoutesGeojson(features, bounds);
    }

    private static computeBoundsFromRoutes(routes: Route[]): Bounds {
        const firstCoords = routes[0].coordinates as
            | { lat?: number; lon?: number }
            | null
            | undefined;
        const lon0 = firstCoords?.lon ?? 0;
        const lat0 = firstCoords?.lat ?? 0;
        const b = new Bounds(lat0, lat0, lon0, lon0);
        for (let i = 1; i < routes.length; i++) {
            const c = routes[i].coordinates as
                | { lat?: number; lon?: number }
                | null
                | undefined;
            b.update(c?.lon ?? 0, c?.lat ?? 0);
        }
        return b;
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
        RoutesGeojson.assertNullableBounds(r, 'bounds');
        (r as Record<string, unknown>).features = (
            r.features as unknown[]
        ).map((f) => RouteGeoJsonFeature.fromResult(f));
        if (r.bounds == null || r.bounds === undefined) {
            (r as Record<string, unknown>).bounds = null;
        } else {
            (r as Record<string, unknown>).bounds = Bounds.fromResult(r.bounds);
        }
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

    private static assertNullableBounds(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (v === null || v === undefined) return;
        if (typeof v !== 'object') {
            throw new Error(
                `RoutesGeojson.${key} must be Bounds or null, got: ${typeof v}`,
            );
        }
    }
}
