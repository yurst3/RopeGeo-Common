import { LegendFeatureType } from '../abstract/legendFeatureType';
import { LegendItem, registerLegendItemParser } from '../abstract/legendItem';

export class PointLegendItem extends LegendItem {
    readonly featureType = LegendFeatureType.Point;
    coordinates: { lat: number; lon: number };
    icon?: string;

    constructor(
        id: string,
        name: string,
        coordinates: { lat: number; lon: number },
        icon?: string,
    ) {
        super(id, name);
        this.coordinates = coordinates;
        this.icon = icon;
    }

    toPlain(): Record<string, unknown> {
        const base: Record<string, unknown> = {
            featureType: this.featureType,
            id: this.id,
            name: this.name,
            coordinates: { lat: this.coordinates.lat, lon: this.coordinates.lon },
        };
        if (this.icon !== undefined) {
            base.icon = this.icon;
        }
        return base;
    }

    static fromResult(result: unknown): PointLegendItem {
        if (result == null || typeof result !== 'object') {
            throw new Error('PointLegendItem result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.featureType !== LegendFeatureType.Point) {
            throw new Error(
                `PointLegendItem.featureType must be "${LegendFeatureType.Point}", got: ${JSON.stringify(r.featureType)}`,
            );
        }
        const id = LegendItem.assertNonEmptyString(r.id, 'PointLegendItem.id');
        const name = LegendItem.assertNonEmptyString(r.name, 'PointLegendItem.name');
        const coords = r.coordinates;
        if (coords == null || typeof coords !== 'object' || Array.isArray(coords)) {
            throw new Error('PointLegendItem.coordinates must be an object');
        }
        const c = coords as Record<string, unknown>;
        PointLegendItem.assertNumber(c.lat, 'PointLegendItem.coordinates.lat');
        PointLegendItem.assertNumber(c.lon, 'PointLegendItem.coordinates.lon');
        let icon: string | undefined;
        if (r.icon !== undefined) {
            if (typeof r.icon !== 'string') {
                throw new Error(`PointLegendItem.icon must be a string, got: ${typeof r.icon}`);
            }
            icon = r.icon;
        }
        return new PointLegendItem(id, name, { lat: c.lat as number, lon: c.lon as number }, icon);
    }

    private static assertNumber(value: unknown, context: string): void {
        if (typeof value !== 'number' || Number.isNaN(value)) {
            throw new Error(`${context} must be a number, got: ${typeof value}`);
        }
    }
}

registerLegendItemParser(LegendFeatureType.Point, (res) => PointLegendItem.fromResult(res));
