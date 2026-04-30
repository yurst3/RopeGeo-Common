import { LEGEND_FEATURE_TYPES, LegendFeatureType } from './legendFeatureType';

const legendItemParsers = new Map<LegendFeatureType, (result: unknown) => LegendItem>();

export function registerLegendItemParser(
    featureType: LegendFeatureType,
    parse: (result: unknown) => LegendItem,
): void {
    legendItemParsers.set(featureType, parse);
}

/**
 * Base type for page minimap legend entries. Use {@link LegendItem.fromResult} to parse API wire shapes.
 */
export abstract class LegendItem {
    abstract readonly featureType: LegendFeatureType;
    readonly id: string;
    readonly name: string;

    protected constructor(id: string, name: string) {
        LegendItem.assertNonEmptyString(id, 'LegendItem.id');
        LegendItem.assertNonEmptyString(name, 'LegendItem.name');
        this.id = id;
        this.name = name;
    }

    /** Serialized shape suitable for JSON / offline persistence. */
    abstract toPlain(): Record<string, unknown>;

    /**
     * Validates `featureType` and delegates to the matching legend item parser.
     */
    static fromResult(result: unknown): LegendItem {
        if (result == null || typeof result !== 'object') {
            throw new Error('LegendItem result must be an object');
        }
        const r = result as Record<string, unknown>;
        const ft = r.featureType;
        if (typeof ft !== 'string' || !LEGEND_FEATURE_TYPES.has(ft)) {
            throw new Error(
                `LegendItem.featureType must be one of [${[...LEGEND_FEATURE_TYPES].join(', ')}], got: ${JSON.stringify(ft)}`,
            );
        }
        const parser = legendItemParsers.get(ft as LegendFeatureType);
        if (parser === undefined) {
            throw new Error(`No LegendItem parser registered for featureType ${JSON.stringify(ft)}`);
        }
        return parser(result);
    }

    static assertNonEmptyString(value: unknown, context: string): string {
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`${context} must be a non-empty string`);
        }
        return value;
    }

    /**
     * Parses an optional `legend` object keyed by arbitrary ids to {@link LegendItem} instances.
     */
    static legendRecordFromResult(value: unknown, context: string): Record<string, LegendItem> {
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error(`${context} must be a non-array object`);
        }
        const raw = value as Record<string, unknown>;
        const out: Record<string, LegendItem> = {};
        for (const [key, entry] of Object.entries(raw)) {
            out[key] = LegendItem.fromResult(entry);
        }
        return out;
    }
}
