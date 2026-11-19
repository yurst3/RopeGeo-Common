import type { TripReportMapBlock } from '../block/tripReportMapBlock';
import type { MapBlockUndoChangeJson } from './mapBlockUndoChangeJson';

export type { MapBlockUndoChangeJson };

/**
 * One reversible geometric edit on a {@link TripReportMapBlock}. Concrete subclasses store only
 * the differential needed to restore the prior state; {@link apply} must not push a new undo
 * entry (use silent segment/marker replacement on the block).
 */
export abstract class MapBlockUndoChange {
    abstract readonly type: MapBlockUndoChangeJson['type'];

    /** Restores the prior geometry on `block` without pushing onto the undo stack. */
    abstract apply(block: TripReportMapBlock): TripReportMapBlock;

    abstract toJSON(): MapBlockUndoChangeJson;

    /**
     * Parses a stored undo entry. Uses a deferred require so concrete subclasses can extend this
     * class without a circular import.
     */
    static fromResult(result: unknown): MapBlockUndoChange {
        const { parseMapBlockUndoChange } = require('./parseMapBlockUndoChange') as {
            parseMapBlockUndoChange: (value: unknown) => MapBlockUndoChange;
        };
        return parseMapBlockUndoChange(result);
    }

    protected static assertNonEmptyString(value: unknown, context: string): string {
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`${context} must be a non-empty string`);
        }
        return value;
    }

    protected static assertNonNegativeInteger(value: unknown, context: string): number {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
            throw new Error(`${context} must be a non-negative integer, got: ${JSON.stringify(value)}`);
        }
        return value;
    }
}
