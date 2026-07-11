import { Bounds } from '../../bounds';
import { LegendFeatureType } from '../abstract/legendFeatureType';
import { LegendItem, registerLegendItemParser } from '../abstract/legendItem';
import type { RelevantContext } from './relevantContext';

export class LineLegendItem extends LegendItem {
    readonly featureType = LegendFeatureType.Line;
    bounds: Bounds;
    strokeColor?: string;
    strokeWidth?: string;

    constructor(
        id: string,
        name: string,
        bounds: Bounds,
        strokeColor?: string,
        strokeWidth?: string,
        relevantContext: RelevantContext | null = null,
    ) {
        super(id, name, relevantContext);
        this.bounds = bounds;
        this.strokeColor = strokeColor;
        this.strokeWidth = strokeWidth;
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
        if (this.strokeColor !== undefined) {
            base.strokeColor = this.strokeColor;
        }
        if (this.strokeWidth !== undefined) {
            base.strokeWidth = this.strokeWidth;
        }
        LegendItem.appendRelevantContextToPlain(base, this.relevantContext);
        return base;
    }

    static fromResult(result: unknown): LineLegendItem {
        if (result == null || typeof result !== 'object') {
            throw new Error('LineLegendItem result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.featureType !== LegendFeatureType.Line) {
            throw new Error(
                `LineLegendItem.featureType must be "${LegendFeatureType.Line}", got: ${JSON.stringify(r.featureType)}`,
            );
        }
        const id = LegendItem.assertNonEmptyString(r.id, 'LineLegendItem.id');
        const name = LegendItem.assertNonEmptyString(r.name, 'LineLegendItem.name');
        const bounds = Bounds.fromResult(r.bounds);
        let strokeColor: string | undefined;
        if (r.strokeColor !== undefined) {
            if (typeof r.strokeColor !== 'string') {
                throw new Error(`LineLegendItem.strokeColor must be a string, got: ${typeof r.strokeColor}`);
            }
            strokeColor = r.strokeColor;
        }
        let strokeWidth: string | undefined;
        if (r.strokeWidth !== undefined) {
            if (typeof r.strokeWidth !== 'string') {
                throw new Error(`LineLegendItem.strokeWidth must be a string, got: ${typeof r.strokeWidth}`);
            }
            strokeWidth = r.strokeWidth;
        }
        const relevantContext = LegendItem.parseOptionalRelevantContext(r.relevantContext);
        return new LineLegendItem(id, name, bounds, strokeColor, strokeWidth, relevantContext);
    }
}

registerLegendItemParser(LegendFeatureType.Line, (res) => LineLegendItem.fromResult(res));
