/** ACA technical rating: 1–4 */
export enum AcaTechnicalRating {
    One = '1',
    Two = '2',
    Three = '3',
    Four = '4',
}

/** ACA water rating: A, B, C, or C1–C4 */
export enum AcaWaterRating {
    A = 'A',
    B = 'B',
    C = 'C',
    C1 = 'C1',
    C2 = 'C2',
    C3 = 'C3',
    C4 = 'C4',
}

/** ACA time rating: I–VI */
export enum AcaTimeRating {
    I = 'I',
    II = 'II',
    III = 'III',
    IV = 'IV',
    V = 'V',
    VI = 'VI',
}

/** ACA risk rating */
export enum AcaRiskRating {
    G = 'G',
    PG = 'PG',
    PG13 = 'PG13',
    R = 'R',
    X = 'X',
    XX = 'XX',
}

/** Total order for technical (lower index = easier). */
export const ACA_TECHNICAL_ORDER: Record<AcaTechnicalRating, number> = {
    [AcaTechnicalRating.One]: 0,
    [AcaTechnicalRating.Two]: 1,
    [AcaTechnicalRating.Three]: 2,
    [AcaTechnicalRating.Four]: 3,
};

/** Total order for water: A < B < C < C1 < C2 < C3 < C4 */
export const ACA_WATER_ORDER: Record<AcaWaterRating, number> = {
    [AcaWaterRating.A]: 0,
    [AcaWaterRating.B]: 1,
    [AcaWaterRating.C]: 2,
    [AcaWaterRating.C1]: 3,
    [AcaWaterRating.C2]: 4,
    [AcaWaterRating.C3]: 5,
    [AcaWaterRating.C4]: 6,
};

export const ACA_TIME_ORDER: Record<AcaTimeRating, number> = {
    [AcaTimeRating.I]: 0,
    [AcaTimeRating.II]: 1,
    [AcaTimeRating.III]: 2,
    [AcaTimeRating.IV]: 3,
    [AcaTimeRating.V]: 4,
    [AcaTimeRating.VI]: 5,
};

/** Lower index = milder risk */
export const ACA_RISK_ORDER: Record<AcaRiskRating, number> = {
    [AcaRiskRating.G]: 0,
    [AcaRiskRating.PG]: 1,
    [AcaRiskRating.PG13]: 2,
    [AcaRiskRating.R]: 3,
    [AcaRiskRating.X]: 4,
    [AcaRiskRating.XX]: 5,
};

/** @deprecated Use ACA_RISK_ORDER */
export const RISK_ORDER = ACA_RISK_ORDER;
