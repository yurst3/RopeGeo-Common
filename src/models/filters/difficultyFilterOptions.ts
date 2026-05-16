import { DifficultyRatingSystem } from '../difficulty/difficultyRating';
import type { DifficultyParams } from '../api/params/difficultyParams';

const difficultyFilterOptionsParsers = new Map<
    DifficultyRatingSystem,
    (result: unknown) => DifficultyFilterOptions
>();

/**
 * Registers the parser for {@link DifficultyFilterOptions.fromResult} for a given
 * {@link DifficultyRatingSystem}. Call once per scale from the corresponding module at load time
 * (see `registerDifficultyFilterOptionsParsers.ts`).
 */
export function registerDifficultyFilterOptionsParser(
    type: DifficultyRatingSystem,
    parse: (result: unknown) => DifficultyFilterOptions,
): void {
    difficultyFilterOptionsParsers.set(type, parse);
}

/**
 * Persisted / modal difficulty filter shape (discriminated by {@link difficultyType}).
 * Concrete types extend this (e.g. {@link AcaDifficultyFilterOptions}).
 */
export abstract class DifficultyFilterOptions {
    abstract readonly difficultyType: DifficultyRatingSystem;

    abstract toDifficultyParams(): DifficultyParams;

    abstract toJSON(): Record<string, unknown>;

    /**
     * Parses filter options from JSON/storage. Dispatches on `difficultyType` (case-insensitive);
     * a missing `difficultyType` is treated as {@link DifficultyRatingSystem.ACA} (same default as
     * {@link DifficultyRating.fromResult}).
     */
    static fromResult(result: unknown): DifficultyFilterOptions {
        if (result == null || typeof result !== 'object') {
            throw new Error('DifficultyFilterOptions result must be an object');
        }
        const r = result as Record<string, unknown>;
        const dtypeRaw = r.difficultyType ?? r.DifficultyType;

        let typeEnum: DifficultyRatingSystem;
        if (dtypeRaw === undefined || dtypeRaw === null) {
            typeEnum = DifficultyRatingSystem.ACA;
        } else if (typeof dtypeRaw !== 'string') {
            throw new Error(
                `DifficultyFilterOptions.difficultyType must be a string or null, got: ${typeof dtypeRaw}`,
            );
        } else {
            const normalized = dtypeRaw.toUpperCase();
            const valid = Object.values(DifficultyRatingSystem) as string[];
            if (!valid.includes(normalized)) {
                throw new Error(
                    `Unknown difficultyType on filter options: ${JSON.stringify(dtypeRaw)}`,
                );
            }
            typeEnum = normalized as DifficultyRatingSystem;
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
