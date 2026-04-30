import { Bounds } from '../../bounds';
import { LegendFeatureType } from '../abstract/legendFeatureType';
import { LegendItem, registerLegendItemParser } from '../abstract/legendItem';

export class PolygonLegendItem extends LegendItem {
    readonly featureType = LegendFeatureType.Polygon;
    bounds: Bounds;
    borderColor?: string;
    fillColor?: string;

    constructor(
        id: string,
        name: string,
        bounds: Bounds,
        borderColor?: string,
        fillColor?: string,
    ) {
        super(id, name);
        this.bounds = bounds;
        this.borderColor = borderColor;
        this.fillColor = fillColor;
    }

    toPlain(): Record<string, unknown> {
        const base: Record<string, unknown> = {
            featureType: this.featureType,
            id: this.id,
            name: this.name,
            bounds: {
                north: this.bounds.north,
                south: this.bounds.south,
                east: this.bounds.east,
                west: this.bounds.west,
            },
        };
        if (this.borderColor !== undefined) {
            base.borderColor = this.borderColor;
        }
        if (this.fillColor !== undefined) {
            base.fillColor = this.fillColor;
        }
        return base;
    }

    static fromResult(result: unknown): PolygonLegendItem {
        if (result == null || typeof result !== 'object') {
            throw new Error('PolygonLegendItem result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.featureType !== LegendFeatureType.Polygon) {
            throw new Error(
                `PolygonLegendItem.featureType must be "${LegendFeatureType.Polygon}", got: ${JSON.stringify(r.featureType)}`,
            );
        }
        const id = LegendItem.assertNonEmptyString(r.id, 'PolygonLegendItem.id');
        const name = LegendItem.assertNonEmptyString(r.name, 'PolygonLegendItem.name');
        const bounds = Bounds.fromResult(r.bounds);
        let borderColor: string | undefined;
        if (r.borderColor !== undefined) {
            if (typeof r.borderColor !== 'string') {
                throw new Error(`PolygonLegendItem.borderColor must be a string, got: ${typeof r.borderColor}`);
            }
            borderColor = r.borderColor;
        }
        let fillColor: string | undefined;
        if (r.fillColor !== undefined) {
            if (typeof r.fillColor !== 'string') {
                throw new Error(`PolygonLegendItem.fillColor must be a string, got: ${typeof r.fillColor}`);
            }
            fillColor = r.fillColor;
        }
        return new PolygonLegendItem(id, name, bounds, borderColor, fillColor);
    }
}

registerLegendItemParser(LegendFeatureType.Polygon, (res) => PolygonLegendItem.fromResult(res));
