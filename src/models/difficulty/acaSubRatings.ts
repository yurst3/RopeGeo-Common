/** ACA technical rating: 1–4 */
export enum AcaTechnicalSubRating {
    One = '1',
    Two = '2',
    Three = '3',
    Four = '4',
}

/** ACA water rating: A, B, C, or C1–C4 */
export enum AcaWaterSubRating {
    A = 'A',
    B = 'B',
    C = 'C',
    C1 = 'C1',
    C2 = 'C2',
    C3 = 'C3',
    C4 = 'C4',
}

/** ACA time rating: I–VI */
export enum AcaTimeSubRating {
    I = 'I',
    II = 'II',
    III = 'III',
    IV = 'IV',
    V = 'V',
    VI = 'VI',
}

/** ACA risk rating */
export enum AcaRiskSubRating {
    G = 'G',
    PG = 'PG',
    PG13 = 'PG13',
    R = 'R',
    X = 'X',
    XX = 'XX',
}

/** Total order for technical (lower index = easier). */
export const ACA_TECHNICAL_ORDER: Record<AcaTechnicalSubRating, number> = {
    [AcaTechnicalSubRating.One]: 0,
    [AcaTechnicalSubRating.Two]: 1,
    [AcaTechnicalSubRating.Three]: 2,
    [AcaTechnicalSubRating.Four]: 3,
};

/** Total order for water: A < B < C < C1 < C2 < C3 < C4 */
export const ACA_WATER_ORDER: Record<AcaWaterSubRating, number> = {
    [AcaWaterSubRating.A]: 0,
    [AcaWaterSubRating.B]: 1,
    [AcaWaterSubRating.C]: 2,
    [AcaWaterSubRating.C1]: 3,
    [AcaWaterSubRating.C2]: 4,
    [AcaWaterSubRating.C3]: 5,
    [AcaWaterSubRating.C4]: 6,
};

export const ACA_TIME_ORDER: Record<AcaTimeSubRating, number> = {
    [AcaTimeSubRating.I]: 0,
    [AcaTimeSubRating.II]: 1,
    [AcaTimeSubRating.III]: 2,
    [AcaTimeSubRating.IV]: 3,
    [AcaTimeSubRating.V]: 4,
    [AcaTimeSubRating.VI]: 5,
};

/** Lower index = milder risk */
export const ACA_RISK_ORDER: Record<AcaRiskSubRating, number> = {
    [AcaRiskSubRating.G]: 0,
    [AcaRiskSubRating.PG]: 1,
    [AcaRiskSubRating.PG13]: 2,
    [AcaRiskSubRating.R]: 3,
    [AcaRiskSubRating.X]: 4,
    [AcaRiskSubRating.XX]: 5,
};

/** @deprecated Use ACA_RISK_ORDER */
export const RISK_ORDER = ACA_RISK_ORDER;
