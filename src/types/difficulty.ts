/** Technical difficulty: 1–4 */
export enum DifficultyTechnical {
    One = '1',
    Two = '2',
    Three = '3',
    Four = '4',
}

/** Water difficulty: A, B, C, or C1–C4 */
export enum DifficultyWater {
    A = 'A',
    B = 'B',
    C = 'C',
    C1 = 'C1',
    C2 = 'C2',
    C3 = 'C3',
    C4 = 'C4',
}

/** Time difficulty: I–VI (Roman numerals) */
export enum DifficultyTime {
    I = 'I',
    II = 'II',
    III = 'III',
    IV = 'IV',
    V = 'V',
    VI = 'VI',
}

/** Risk rating: G, PG, PG13, R, X, XX */
export enum DifficultyRisk {
    G = 'G',
    PG = 'PG',
    PG13 = 'PG13',
    R = 'R',
    X = 'X',
    XX = 'XX',
}

/** Order of risk levels for effective-risk comparison (lower index = milder). */
const RISK_ORDER: Record<DifficultyRisk, number> = {
    [DifficultyRisk.G]: 0,
    [DifficultyRisk.PG]: 1,
    [DifficultyRisk.PG13]: 2,
    [DifficultyRisk.R]: 3,
    [DifficultyRisk.X]: 4,
    [DifficultyRisk.XX]: 5,
};

/**
 * Difficulty ratings for a page (e.g. Ropewiki technical, water, time, risk).
 * Each property is nullable; the object is always present on PagePreview.
 * risk is set to the effective risk (derived from technical when risk is not set).
 * Throws if a non-empty rating string is not one of the allowed enum values.
 */
export class Difficulty {
    technical: DifficultyTechnical | null;
    water: DifficultyWater | null;
    time: DifficultyTime | null;
    risk: DifficultyRisk | null;

    constructor(
        technicalRating: string | null | undefined,
        waterRating: string | null | undefined,
        timeRating: string | null | undefined,
        riskRating: string | null | undefined,
    ) {
        this.technical = Difficulty.parseDifficultyField(
            technicalRating,
            Object.values(DifficultyTechnical),
            'technical',
        );
        this.water = Difficulty.parseDifficultyField(
            waterRating,
            Object.values(DifficultyWater),
            'water',
        );
        this.time = Difficulty.parseDifficultyField(
            timeRating,
            Object.values(DifficultyTime),
            'time',
        );
        const parsedRisk = Difficulty.parseDifficultyField(
            riskRating,
            Object.values(DifficultyRisk),
            'risk',
        );
        this.risk = this.getEffectiveRisk(parsedRisk);
    }

    private getDefaultRisk(): DifficultyRisk | null {
        if (this.technical === DifficultyTechnical.One) return DifficultyRisk.G;
        if (this.technical === DifficultyTechnical.Two) return DifficultyRisk.PG;
        if (this.technical === DifficultyTechnical.Three || this.technical === DifficultyTechnical.Four) {
            return DifficultyRisk.PG13;
        }
        return null;
    }

    private getEffectiveRisk(rawRisk: DifficultyRisk | null): DifficultyRisk | null {
        const defaultRisk = this.getDefaultRisk();
        if (rawRisk != null) {
            return defaultRisk != null && RISK_ORDER[rawRisk] < RISK_ORDER[defaultRisk]
                ? defaultRisk
                : rawRisk;
        }
        return defaultRisk;
    }

    private static parseDifficultyField<T extends string>(
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
}
