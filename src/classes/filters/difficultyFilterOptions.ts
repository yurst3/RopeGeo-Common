import { DifficultyType } from '../difficulty/difficulty';
import type { DifficultyParams } from '../requestParams/difficultyParams';

const difficultyFilterOptionsParsers = new Map<
    DifficultyType,
    (result: unknown) => DifficultyFilterOptions
>();

/**
 * Registers the parser for {@link DifficultyFilterOptions.fromResult} for a given
 * {@link DifficultyType}. Call once per scale from the corresponding module at load time
 * (see `registerDifficultyFilterOptionsParsers.ts`).
 */
export function registerDifficultyFilterOptionsParser(
    type: DifficultyType,
    parse: (result: unknown) => DifficultyFilterOptions,
): void {
    difficultyFilterOptionsParsers.set(type, parse);
}

/**
 * Persisted / modal difficulty filter shape (discriminated by {@link difficultyType}).
 * Concrete types extend this (e.g. {@link AcaDifficultyFilterOptions}).
 */
export abstract class DifficultyFilterOptions {
    abstract readonly difficultyType: DifficultyType;

    abstract toDifficultyParams(): DifficultyParams;

    abstract toJSON(): Record<string, unknown>;

    /**
     * Parses filter options from JSON/storage. Dispatches on `difficultyType` (case-insensitive);
     * a missing `difficultyType` is treated as {@link DifficultyType.ACA} (same default as
     * {@link Difficulty.fromResult}).
     */
    static fromResult(result: unknown): DifficultyFilterOptions {
        if (result == null || typeof result !== 'object') {
            throw new Error('DifficultyFilterOptions result must be an object');
        }
        const r = result as Record<string, unknown>;
        const dtypeRaw = r.difficultyType ?? r.DifficultyType;

        let typeEnum: DifficultyType;
        if (dtypeRaw === undefined || dtypeRaw === null) {
            typeEnum = DifficultyType.ACA;
        } else if (typeof dtypeRaw !== 'string') {
            throw new Error(
                `DifficultyFilterOptions.difficultyType must be a string or null, got: ${typeof dtypeRaw}`,
            );
        } else {
            const normalized = dtypeRaw.toUpperCase();
            const valid = Object.values(DifficultyType) as string[];
            if (!valid.includes(normalized)) {
                throw new Error(
                    `Unknown difficultyType on filter options: ${JSON.stringify(dtypeRaw)}`,
                );
            }
            typeEnum = normalized as DifficultyType;
        }

        const parser = difficultyFilterOptionsParsers.get(typeEnum);
        if (parser === undefined) {
            throw new Error(
                `No difficulty filter options parser registered for difficultyType ${JSON.stringify(typeEnum)}`,
            );
        }
        return parser(result);
    }
}
