import type { AcaRiskSubRating } from './acaSubRatings';

/** Discriminator for page/route difficulty rating scales (extensible). */
export enum DifficultyRatingSystem {
    ACA = 'ACA',
}

const difficultyRatingParsers = new Map<
    DifficultyRatingSystem,
    (result: unknown) => DifficultyRating
>();

/**
 * Registers the parser for {@link DifficultyRating.fromResult} for a given
 * {@link DifficultyRatingSystem}. Call once per scale from the corresponding module at load time
 * (see `registerDifficultyRatingParsers.ts`).
 */
export function registerDifficultyParser(
    type: DifficultyRatingSystem,
    parse: (result: unknown) => DifficultyRating,
): void {
    difficultyRatingParsers.set(type, parse);
}

/**
 * Base difficulty rating type for page previews and full page views.
 * Concrete scales extend this (e.g. {@link AcaDifficultyRating}).
 */
export abstract class DifficultyRating {
    abstract readonly difficultyRatingSystem: DifficultyRatingSystem;

    /** Risk level for display (e.g. effective ACA risk). Non-ACA scales may return null. */
    abstract getEffectiveRiskForDisplay(): AcaRiskSubRating | null;

    /**
     * Parses a difficulty rating object from API/JSON. Dispatches on `difficultyRatingSystem`
     * (or legacy `difficultyType`, case-insensitive); a missing discriminator defaults to
     * {@link DifficultyRatingSystem.ACA}.
     */
    static fromResult(result: unknown): DifficultyRating {
        if (result == null || typeof result !== 'object') {
            throw new Error('DifficultyRating result must be an object');
        }
        const r = result as Record<string, unknown>;
        const dtypeRaw =
            r.difficultyRatingSystem ??
            r.DifficultyRatingSystem ??
            r.difficultyType ??
            r.DifficultyType;

        let typeEnum: DifficultyRatingSystem;
        if (dtypeRaw === undefined || dtypeRaw === null) {
            typeEnum = DifficultyRatingSystem.ACA;
        } else if (typeof dtypeRaw !== 'string') {
            throw new Error(
                `DifficultyRating.difficultyRatingSystem must be a string or null, got: ${typeof dtypeRaw}`,
            );
        } else {
            const normalized = dtypeRaw.toUpperCase();
            const valid = Object.values(DifficultyRatingSystem) as string[];
            if (!valid.includes(normalized)) {
                throw new Error(
                    `Unknown difficultyRatingSystem: ${JSON.stringify(dtypeRaw)}`,
                );
            }
            typeEnum = normalized as DifficultyRatingSystem;
        }

        const parser = difficultyRatingParsers.get(typeEnum);
        if (parser === undefined) {
            throw new Error(
                `No difficulty rating parser registered for difficultyRatingSystem ${JSON.stringify(typeEnum)}`,
            );
        }
        return parser(result);
    }
}

/** Reads nested difficulty rating JSON from legacy or current property names. */
export function resolveDifficultyRatingFromRecord(
    r: Record<string, unknown>,
): unknown {
    return r.difficultyRating ?? r.difficulty ?? r.Difficulty;
}
