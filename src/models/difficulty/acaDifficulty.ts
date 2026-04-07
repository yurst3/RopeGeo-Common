import { Difficulty, DifficultyType, registerDifficultyParser } from './difficulty';
import {
    ACA_RISK_ORDER,
    AcaRiskRating,
    AcaTechnicalRating,
    AcaTimeRating,
    AcaWaterRating,
} from './acaRatings';

type AcaParts = {
    technical: AcaTechnicalRating | null;
    water: AcaWaterRating | null;
    time: AcaTimeRating | null;
    additionalRisk: AcaRiskRating | null;
    effectiveRisk: AcaRiskRating | null;
};

/**
 * ACA canyon difficulty from DB strings. `additionalRisk` is the raw stored value (`riskRating`
 * column); `effectiveRisk` applies the technical default floor when `additionalRisk` is null or
 * milder than that default.
 */
export class AcaDifficulty extends Difficulty {
    readonly difficultyType = DifficultyType.ACA;

    readonly technical!: AcaTechnicalRating | null;
    readonly water!: AcaWaterRating | null;
    readonly time!: AcaTimeRating | null;
    /** Raw additional risk from ropewiki (`riskRating` column), after enum parse; null if unset. */
    readonly additionalRisk!: AcaRiskRating | null;
    /** Risk used for display and sorting (never milder than the default implied by technical). */
    readonly effectiveRisk!: AcaRiskRating | null;

    constructor(
        technicalRating: string | null | undefined,
        waterRating: string | null | undefined,
        timeRating: string | null | undefined,
        additionalRiskRating: string | null | undefined,
    ) {
        super();
        const technical = AcaDifficulty.parseField(
            technicalRating,
            Object.values(AcaTechnicalRating),
            'technical',
        );
        const water = AcaDifficulty.parseField(
            waterRating,
            Object.values(AcaWaterRating),
            'water',
        );
        const time = AcaDifficulty.parseField(
            timeRating,
            Object.values(AcaTimeRating),
            'time',
        );
        const parsedAdditionalRisk = AcaDifficulty.parseField(
            additionalRiskRating,
            Object.values(AcaRiskRating),
            'additionalRisk',
        );
        const parts: AcaParts = {
            technical,
            water,
            time,
            additionalRisk: parsedAdditionalRisk,
            effectiveRisk: AcaDifficulty.computeEffectiveRisk(
                parsedAdditionalRisk,
                technical,
            ),
        };
        AcaDifficulty.assignParts(this, parts);
    }

    getEffectiveRiskForDisplay(): AcaRiskRating | null {
        return this.effectiveRisk;
    }

    private static assignParts(target: AcaDifficulty, parts: AcaParts): void {
        (target as { technical: typeof parts.technical }).technical = parts.technical;
        (target as { water: typeof parts.water }).water = parts.water;
        (target as { time: typeof parts.time }).time = parts.time;
        (target as { additionalRisk: typeof parts.additionalRisk }).additionalRisk =
            parts.additionalRisk;
        (target as { effectiveRisk: typeof parts.effectiveRisk }).effectiveRisk =
            parts.effectiveRisk;
    }

    private static defaultRiskFromTechnical(
        technical: AcaTechnicalRating | null,
    ): AcaRiskRating | null {
        if (technical === AcaTechnicalRating.One) return AcaRiskRating.G;
        if (technical === AcaTechnicalRating.Two) return AcaRiskRating.PG;
        if (
            technical === AcaTechnicalRating.Three ||
            technical === AcaTechnicalRating.Four
        ) {
            return AcaRiskRating.PG13;
        }
        return null;
    }

    private static computeEffectiveRisk(
        additionalRisk: AcaRiskRating | null,
        technical: AcaTechnicalRating | null,
    ): AcaRiskRating | null {
        const defaultRisk = AcaDifficulty.defaultRiskFromTechnical(technical);
        if (additionalRisk != null) {
            return defaultRisk != null &&
                ACA_RISK_ORDER[additionalRisk] < ACA_RISK_ORDER[defaultRisk]
                ? defaultRisk
                : additionalRisk;
        }
        return defaultRisk;
    }

    private static parseField<T extends string>(
        value: string | null | undefined,
        allowed: readonly T[],
        fieldName: string,
    ): T | null {
        if (value == null || value === '') return null;
        const trimmed = value.trim();
        if (!(allowed as readonly string[]).includes(trimmed)) {
            throw new Error(
                `Invalid difficulty ${fieldName}: "${value}" is not one of [${(allowed as readonly string[]).join(', ')}]`,
            );
        }
        return trimmed as T;
    }

    /**
     * Parses JSON/API objects: `difficultyType: 'ACA'` (optional when dispatched via
     * {@link Difficulty.fromResult}), `technical`, `water`, `time`, `additionalRisk` (raw), optional
     * `effectiveRisk` override.
     */
    static fromResult(result: unknown): AcaDifficulty {
        if (result == null || typeof result !== 'object') {
            throw new Error('AcaDifficulty result must be an object');
        }
        const r = result as Record<string, unknown>;
        const dtype = r.difficultyType ?? r.DifficultyType;
        if (
            dtype !== undefined &&
            dtype !== null &&
            typeof dtype === 'string' &&
            dtype.toUpperCase() !== DifficultyType.ACA
        ) {
            throw new Error(
                `Unsupported difficultyType for AcaDifficulty.fromResult: ${JSON.stringify(dtype)}`,
            );
        }

        const tech = AcaDifficulty.coerceOptionalString(r.technical ?? r.Technical);
        const water = AcaDifficulty.coerceOptionalString(r.water ?? r.Water);
        const time = AcaDifficulty.coerceOptionalString(r.time ?? r.Time);
        const additionalRiskRaw = AcaDifficulty.coerceOptionalString(
            r.additionalRisk ?? r.AdditionalRisk,
        );
        const effectiveRaw = AcaDifficulty.coerceOptionalString(
            r.effectiveRisk ?? r.EffectiveRisk,
        );

        if (effectiveRaw !== null) {
            const inst = new AcaDifficulty(tech, water, time, additionalRiskRaw);
            const effParsed = AcaDifficulty.parseField(
                effectiveRaw,
                Object.values(AcaRiskRating),
                'effectiveRisk',
            );
            (inst as { effectiveRisk: AcaRiskRating | null }).effectiveRisk = effParsed;
            return inst;
        }

        return new AcaDifficulty(tech, water, time, additionalRiskRaw);
    }

    private static coerceOptionalString(v: unknown): string | null {
        if (v === undefined || v === null || v === '') return null;
        if (typeof v !== 'string') {
            throw new Error('AcaDifficulty field must be string or null');
        }
        return v;
    }
}

registerDifficultyParser(DifficultyType.ACA, (v) => AcaDifficulty.fromResult(v));
