import { DifficultyRatingSystem } from '../difficulty/difficultyRating';
import {
    ACA_RISK_ORDER,
    ACA_TECHNICAL_ORDER,
    ACA_TIME_ORDER,
    ACA_WATER_ORDER,
    AcaRiskSubRating,
    AcaTechnicalSubRating,
    AcaTimeSubRating,
    AcaWaterSubRating,
} from '../difficulty/acaSubRatings';
import { DifficultyFilterOptions, registerDifficultyFilterOptionsParser } from './difficultyFilterOptions';
import { AcaDifficultyParams } from '../api/params/acaDifficultyParams';

function assertOrdered<T extends string>(
    min: T,
    max: T,
    order: Record<T, number>,
    label: string,
): void {
    if (order[min] > order[max]) {
        throw new Error(
            `${label}: min (${String(min)}) must not be greater than max (${String(max)})`,
        );
    }
}

function expandInclusive<T extends string>(
    min: T,
    max: T,
    orderedValues: readonly T[],
    order: Record<T, number>,
): T[] {
    const lo = order[min];
    const hi = order[max];
    return orderedValues.filter((v) => order[v] >= lo && order[v] <= hi);
}

const TECHNICAL_ORDERED: AcaTechnicalSubRating[] = (
    Object.entries(ACA_TECHNICAL_ORDER) as [AcaTechnicalSubRating, number][]
)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k);

const WATER_ORDERED: AcaWaterSubRating[] = (
    Object.entries(ACA_WATER_ORDER) as [AcaWaterSubRating, number][]
)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k);

const TIME_ORDERED: AcaTimeSubRating[] = (
    Object.entries(ACA_TIME_ORDER) as [AcaTimeSubRating, number][]
)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k);

const RISK_ORDERED: AcaRiskSubRating[] = (
    Object.entries(ACA_RISK_ORDER) as [AcaRiskSubRating, number][]
)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k);

export class TechnicalMinMax {
    readonly min: AcaTechnicalSubRating;
    readonly max: AcaTechnicalSubRating;
    constructor(min: AcaTechnicalSubRating, max: AcaTechnicalSubRating) {
        assertOrdered(min, max, ACA_TECHNICAL_ORDER, 'TechnicalMinMax');
        this.min = min;
        this.max = max;
    }
}

export class WaterMinMax {
    readonly min: AcaWaterSubRating;
    readonly max: AcaWaterSubRating;
    constructor(min: AcaWaterSubRating, max: AcaWaterSubRating) {
        assertOrdered(min, max, ACA_WATER_ORDER, 'WaterMinMax');
        this.min = min;
        this.max = max;
    }
}

export class TimeMinMax {
    readonly min: AcaTimeSubRating;
    readonly max: AcaTimeSubRating;
    constructor(min: AcaTimeSubRating, max: AcaTimeSubRating) {
        assertOrdered(min, max, ACA_TIME_ORDER, 'TimeMinMax');
        this.min = min;
        this.max = max;
    }
}

export class RiskMinMax {
    readonly min: AcaRiskSubRating;
    readonly max: AcaRiskSubRating;
    constructor(min: AcaRiskSubRating, max: AcaRiskSubRating) {
        assertOrdered(min, max, ACA_RISK_ORDER, 'RiskMinMax');
        this.min = min;
        this.max = max;
    }
}

export class AcaDifficultyFilterOptions extends DifficultyFilterOptions {
    readonly difficultyType = DifficultyRatingSystem.ACA;
    readonly technical: TechnicalMinMax;
    readonly water: WaterMinMax;
    readonly time: TimeMinMax;
    readonly effectiveRisk: RiskMinMax;

    constructor(
        technical: TechnicalMinMax,
        water: WaterMinMax,
        time: TimeMinMax,
        effectiveRisk: RiskMinMax,
    ) {
        super();
        this.technical = technical;
        this.water = water;
        this.time = time;
        this.effectiveRisk = effectiveRisk;
    }

    toDifficultyParams(): AcaDifficultyParams {
        return new AcaDifficultyParams(
            expandInclusive(
                this.technical.min,
                this.technical.max,
                TECHNICAL_ORDERED,
                ACA_TECHNICAL_ORDER,
            ),
            expandInclusive(
                this.water.min,
                this.water.max,
                WATER_ORDERED,
                ACA_WATER_ORDER,
            ),
            expandInclusive(
                this.time.min,
                this.time.max,
                TIME_ORDERED,
                ACA_TIME_ORDER,
            ),
            expandInclusive(
                this.effectiveRisk.min,
                this.effectiveRisk.max,
                RISK_ORDERED,
                ACA_RISK_ORDER,
            ),
        );
    }

    toJSON(): Record<string, unknown> {
        return {
            difficultyType: this.difficultyType,
            technical: { min: this.technical.min, max: this.technical.max },
            water: { min: this.water.min, max: this.water.max },
            time: { min: this.time.min, max: this.time.max },
            effectiveRisk: {
                min: this.effectiveRisk.min,
                max: this.effectiveRisk.max,
            },
        };
    }

    /**
     * Parses ACA filter options from JSON/storage. When `difficultyType` is omitted,
     * ACA is assumed (after {@link DifficultyFilterOptions.fromResult} routing).
     */
    static fromResult(result: unknown): AcaDifficultyFilterOptions {
        if (result == null || typeof result !== 'object') {
            throw new Error('AcaDifficultyFilterOptions result must be an object');
        }
        const r = result as Record<string, unknown>;
        const dtype = r.difficultyType ?? r.DifficultyType;
        if (
            dtype !== undefined &&
            dtype !== null &&
            (dtype !== DifficultyRatingSystem.ACA &&
                !(typeof dtype === 'string' && dtype.toUpperCase() === DifficultyRatingSystem.ACA))
        ) {
            throw new Error('AcaDifficultyFilterOptions.difficultyType must be ACA');
        }
        const tech = r.technical as Record<string, unknown>;
        const water = r.water as Record<string, unknown>;
        const time = r.time as Record<string, unknown>;
        const riskRec = r.effectiveRisk as Record<string, unknown>;
        return new AcaDifficultyFilterOptions(
            new TechnicalMinMax(
                tech.min as AcaTechnicalSubRating,
                tech.max as AcaTechnicalSubRating,
            ),
            new WaterMinMax(water.min as AcaWaterSubRating, water.max as AcaWaterSubRating),
            new TimeMinMax(time.min as AcaTimeSubRating, time.max as AcaTimeSubRating),
            new RiskMinMax(
                riskRec.min as AcaRiskSubRating,
                riskRec.max as AcaRiskSubRating,
            ),
        );
    }
}

registerDifficultyFilterOptionsParser(DifficultyRatingSystem.ACA, (v) =>
    AcaDifficultyFilterOptions.fromResult(v),
);
