import {
    assertRelevanceStrength,
    type RelevanceStrength,
} from '../../../relevanceStrength';
import {
    assertMeasurementKey,
    type MeasurementKey,
} from '../../../measurementKey';

/**
 * Relevant page-stat reference for a map feature.
 * The numeric value is resolved on the client via {@link MeasurementsLookup}
 * keyed by {@link key}.
 */
export class MeasurementContext {
    readonly key: MeasurementKey;
    readonly relevanceStrength: RelevanceStrength;

    constructor(key: MeasurementKey, relevanceStrength: RelevanceStrength) {
        assertMeasurementKey(key, 'MeasurementContext.key');
        assertRelevanceStrength(relevanceStrength, 'MeasurementContext.relevanceStrength');
        this.key = key;
        this.relevanceStrength = relevanceStrength;
    }

    toPlain(): Record<string, unknown> {
        return {
            key: this.key,
            relevanceStrength: this.relevanceStrength,
        };
    }

    static fromResult(result: unknown): MeasurementContext {
        if (result == null || typeof result !== 'object' || Array.isArray(result)) {
            throw new Error('MeasurementContext result must be an object');
        }
        const r = result as Record<string, unknown>;
        const key = assertMeasurementKey(r.key, 'MeasurementContext.key');
        const relevanceStrength = assertRelevanceStrength(
            r.relevanceStrength,
            'MeasurementContext.relevanceStrength',
        );
        return new MeasurementContext(key, relevanceStrength);
    }
}
