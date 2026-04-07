import type { AcaRiskRating } from './acaRatings';

/** Discriminator for page/route difficulty scales (extensible). */
export enum DifficultyType {
    ACA = 'ACA',
}

const difficultyParsers = new Map<
    DifficultyType,
    (result: unknown) => Difficulty
>();

/**
 * Registers the parser for {@link Difficulty.fromResult} for a given {@link DifficultyType}.
 * Call once per scale from the corresponding module at load time (see `registerDifficultyParsers.ts`).
 */
export function registerDifficultyParser(
    type: DifficultyType,
    parse: (result: unknown) => Difficulty,
): void {
    difficultyParsers.set(type, parse);
}

/**
 * Base difficulty type for page previews and full page views.
 * Concrete scales extend this (e.g. {@link AcaDifficulty}).
 */
export abstract class Difficulty {
    abstract readonly difficultyType: DifficultyType;

    /** Risk level for display (e.g. effective ACA risk). Non-ACA scales may return null. */
    abstract getEffectiveRiskForDisplay(): AcaRiskRating | null;

    /**
     * Parses a difficulty object from API/JSON. Dispatches on `difficultyType` (case-insensitive);
     * a missing `difficultyType` defaults to {@link DifficultyType.ACA}.
     */
    static fromResult(result: unknown): Difficulty {
        if (result == null || typeof result !== 'object') {
            throw new Error('Difficulty result must be an object');
        }
        const r = result as Record<string, unknown>;
        const dtypeRaw = r.difficultyType ?? r.DifficultyType;

        let typeEnum: DifficultyType;
        if (dtypeRaw === undefined || dtypeRaw === null) {
            typeEnum = DifficultyType.ACA;
        } else if (typeof dtypeRaw !== 'string') {
            throw new Error(
                `Difficulty.difficultyType must be a string or null, got: ${typeof dtypeRaw}`,
            );
        } else {
            const normalized = dtypeRaw.toUpperCase();
            const valid = Object.values(DifficultyType) as string[];
            if (!valid.includes(normalized)) {
                throw new Error(
                    `Unknown difficultyType: ${JSON.stringify(dtypeRaw)}`,
                );
            }
            typeEnum = normalized as DifficultyType;
        }

        const parser = difficultyParsers.get(typeEnum);
        if (parser === undefined) {
            throw new Error(
                `No difficulty parser registered for difficultyType ${JSON.stringify(typeEnum)}`,
            );
        }
        return parser(result);
    }
}
