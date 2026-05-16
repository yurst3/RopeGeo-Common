import {
    DifficultyRating,
    DifficultyRatingSystem,
    registerDifficultyParser,
} from './difficultyRating';
import {
    ACA_RISK_ORDER,
    AcaRiskSubRating,
    AcaTechnicalSubRating,
    AcaTimeSubRating,
    AcaWaterSubRating,
} from './acaSubRatings';

type AcaParts = {
    technical: AcaTechnicalSubRating | null;
    water: AcaWaterSubRating | null;
    time: AcaTimeSubRating | null;
    additionalRisk: AcaRiskSubRating | null;
    effectiveRisk: AcaRiskSubRating | null;
};

/**
 * ACA canyon difficulty rating from DB strings. `additionalRisk` is the raw stored value
 * (`riskRating` column); `effectiveRisk` applies the technical default floor when `additionalRisk`
 * is null or milder than that default.
 */
export class AcaDifficultyRating extends DifficultyRating {
    readonly difficultyRatingSystem = DifficultyRatingSystem.ACA;

    readonly technical!: AcaTechnicalSubRating | null;
    readonly water!: AcaWaterSubRating | null;
    readonly time!: AcaTimeSubRating | null;
    /** Raw additional risk from ropewiki (`riskRating` column), after enum parse; null if unset. */
    readonly additionalRisk!: AcaRiskSubRating | null;
    /** Risk used for display and sorting (never milder than the default implied by technical). */
    readonly effectiveRisk!: AcaRiskSubRating | null;

    constructor(
        technicalRating: string | null | undefined,
        waterRating: string | null | undefined,
        timeRating: string | null | undefined,
        additionalRiskRating: string | null | undefined,
    ) {
        super();
        const technical = AcaDifficultyRating.parseField(
            technicalRating,
            Object.values(AcaTechnicalSubRating),
            'technical',
        );
        const water = AcaDifficultyRating.parseField(
            waterRating,
            Object.values(AcaWaterSubRating),
            'water',
        );
        const time = AcaDifficultyRating.parseField(
            timeRating,
            Object.values(AcaTimeSubRating),
            'time',
        );
        const parsedAdditionalRisk = AcaDifficultyRating.parseField(
            additionalRiskRating,
            Object.values(AcaRiskSubRating),
            'additionalRisk',
        );
        const parts: AcaParts = {
            technical,
            water,
            time,
            additionalRisk: parsedAdditionalRisk,
            effectiveRisk: AcaDifficultyRating.computeEffectiveRisk(
                parsedAdditionalRisk,
                technical,
            ),
        };
        AcaDifficultyRating.assignParts(this, parts);
    }

    getEffectiveRiskForDisplay(): AcaRiskSubRating | null {
        return this.effectiveRisk;
    }

    private static assignParts(
        target: AcaDifficultyRating,
        parts: AcaParts,
    ): void {
        (target as { technical: typeof parts.technical }).technical = parts.technical;
        (target as { water: typeof parts.water }).water = parts.water;
        (target as { time: typeof parts.time }).time = parts.time;
        (target as { additionalRisk: typeof parts.additionalRisk }).additionalRisk =
            parts.additionalRisk;
        (target as { effectiveRisk: typeof parts.effectiveRisk }).effectiveRisk =
            parts.effectiveRisk;
    }

    private static defaultRiskFromTechnical(
        technical: AcaTechnicalSubRating | null,
    ): AcaRiskSubRating | null {
        if (technical === AcaTechnicalSubRating.One) return AcaRiskSubRating.G;
        if (technical === AcaTechnicalSubRating.Two) return AcaRiskSubRating.PG;
        if (
            technical === AcaTechnicalSubRating.Three ||
            technical === AcaTechnicalSubRating.Four
        ) {
            return AcaRiskSubRating.PG13;
        }
        return null;
    }

    private static computeEffectiveRisk(
        additionalRisk: AcaRiskSubRating | null,
        technical: AcaTechnicalSubRating | null,
    ): AcaRiskSubRating | null {
        const defaultRisk = AcaDifficultyRating.defaultRiskFromTechnical(technical);
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
     * Parses JSON/API objects: `difficultyRatingSystem: 'ACA'` (optional when dispatched via
     * {@link DifficultyRating.fromResult}), `technical`, `water`, `time`, `additionalRisk` (raw),
     * optional `effectiveRisk` override. Legacy `difficultyType` is accepted.
     */
    static fromResult(result: unknown): AcaDifficultyRating {
        if (result == null || typeof result !== 'object') {
            throw new Error('AcaDifficultyRating result must be an object');
        }
        const r = result as Record<string, unknown>;
        const dtype =
            r.difficultyRatingSystem ??
            r.DifficultyRatingSystem ??
            r.difficultyType ??
            r.DifficultyType;
        if (
            dtype !== undefined &&
            dtype !== null &&
            typeof dtype === 'string' &&
            dtype.toUpperCase() !== DifficultyRatingSystem.ACA
        ) {
            throw new Error(
                `Unsupported difficultyRatingSystem for AcaDifficultyRating.fromResult: ${JSON.stringify(dtype)}`,
            );
        }

        const tech = AcaDifficultyRating.coerceOptionalString(r.technical ?? r.Technical);
        const water = AcaDifficultyRating.coerceOptionalString(r.water ?? r.Water);
        const time = AcaDifficultyRating.coerceOptionalString(r.time ?? r.Time);
        const additionalRiskRaw = AcaDifficultyRating.coerceOptionalString(
            r.additionalRisk ?? r.AdditionalRisk,
        );
        const effectiveRaw = AcaDifficultyRating.coerceOptionalString(
            r.effectiveRisk ?? r.EffectiveRisk,
        );

        if (effectiveRaw !== null) {
            const inst = new AcaDifficultyRating(tech, water, time, additionalRiskRaw);
            const effParsed = AcaDifficultyRating.parseField(
                effectiveRaw,
                Object.values(AcaRiskSubRating),
                'effectiveRisk',
            );
            (inst as { effectiveRisk: AcaRiskSubRating | null }).effectiveRisk = effParsed;
            return inst;
        }

        return new AcaDifficultyRating(tech, water, time, additionalRiskRaw);
    }

    private static coerceOptionalString(v: unknown): string | null {
        if (v === undefined || v === null || v === '') return null;
        if (typeof v !== 'string') {
            throw new Error('AcaDifficultyRating field must be string or null');
        }
        return v;
    }
}

registerDifficultyParser(DifficultyRatingSystem.ACA, (v) =>
    AcaDifficultyRating.fromResult(v),
);
