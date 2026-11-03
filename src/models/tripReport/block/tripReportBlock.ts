import { TRIP_REPORT_BLOCK_TYPES, TripReportBlockType } from './tripReportBlockType';
import type { TripReportMapBlockJson } from './tripReportMapBlock';
import type { TripReportTextBlockJson } from './tripReportTextBlock';

/** Serialized form of any {@link TripReportBlock}. */
export type TripReportBlockJson = TripReportTextBlockJson | TripReportMapBlockJson;

const tripReportBlockParsers = new Map<TripReportBlockType, (result: unknown) => TripReportBlock>();

export function registerTripReportBlockParser(
    blockType: TripReportBlockType,
    parse: (result: unknown) => TripReportBlock,
): void {
    tripReportBlockParsers.set(blockType, parse);
}

/**
 * Base type for trip report content blocks (text, map; media will join). Use
 * {@link TripReportBlock.fromResult} to parse stored `blockType` payloads.
 */
export abstract class TripReportBlock {
    abstract readonly blockType: TripReportBlockType;
    readonly id: string;

    protected constructor(id: string) {
        TripReportBlock.assertNonEmptyString(id, 'TripReportBlock.id');
        this.id = id;
    }

    /** Serialized shape suitable for JSON persistence; read back with {@link fromResult}. */
    abstract toJSON(): TripReportBlockJson;

    /**
     * Validates `blockType` and delegates to the matching block parser.
     */
    static fromResult(result: unknown): TripReportBlock {
        if (result == null || typeof result !== 'object') {
            throw new Error('TripReportBlock result must be an object');
        }
        const r = result as Record<string, unknown>;
        const bt = r.blockType;
        if (typeof bt !== 'string' || !TRIP_REPORT_BLOCK_TYPES.has(bt)) {
            throw new Error(
                `TripReportBlock.blockType must be one of [${[...TRIP_REPORT_BLOCK_TYPES].join(', ')}], got: ${JSON.stringify(bt)}`,
            );
        }
        const parser = tripReportBlockParsers.get(bt as TripReportBlockType);
        if (parser === undefined) {
            throw new Error(`No TripReportBlock parser registered for blockType ${JSON.stringify(bt)}`);
        }
        return parser(result);
    }

    static assertNonEmptyString(value: unknown, context: string): string {
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`${context} must be a non-empty string`);
        }
        return value;
    }

    /** `value` when it's a string, `fallback` when it's missing; throws for any other type. */
    static parseOptionalString(value: unknown, context: string, fallback = ''): string {
        if (value === undefined || value === null) return fallback;
        if (typeof value !== 'string') {
            throw new Error(`${context} must be a string, got: ${typeof value}`);
        }
        return value;
    }

    /** Checks `result` is an object whose `blockType` is `expected`. */
    protected static assertBlockType(
        result: unknown,
        expected: TripReportBlockType,
        context: string,
    ): Record<string, unknown> {
        if (result == null || typeof result !== 'object' || Array.isArray(result)) {
            throw new Error(`${context} result must be an object`);
        }
        const r = result as Record<string, unknown>;
        if (r.blockType !== expected) {
            throw new Error(`${context}.blockType must be "${expected}", got: ${JSON.stringify(r.blockType)}`);
        }
        return r;
    }
}
