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

/**
 * Difficulty ratings for a page (e.g. Ropewiki technical, water, time, risk).
 * Each property is nullable; the object is always present on PagePreview.
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
        this.risk = Difficulty.parseDifficultyField(
            riskRating,
            Object.values(DifficultyRisk),
            'risk',
        );
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
