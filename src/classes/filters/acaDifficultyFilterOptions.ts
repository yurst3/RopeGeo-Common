import { DifficultyType } from '../difficulty/difficulty';
import {
    ACA_RISK_ORDER,
    ACA_TECHNICAL_ORDER,
    ACA_TIME_ORDER,
    ACA_WATER_ORDER,
    AcaRiskRating,
    AcaTechnicalRating,
    AcaTimeRating,
    AcaWaterRating,
} from '../difficulty/acaRatings';
import { DifficultyFilterOptions, registerDifficultyFilterOptionsParser } from './difficultyFilterOptions';
import { AcaDifficultyParams } from '../requestParams/acaDifficultyParams';

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

const TECHNICAL_ORDERED: AcaTechnicalRating[] = (
    Object.entries(ACA_TECHNICAL_ORDER) as [AcaTechnicalRating, number][]
)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k);

const WATER_ORDERED: AcaWaterRating[] = (
    Object.entries(ACA_WATER_ORDER) as [AcaWaterRating, number][]
)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k);

const TIME_ORDERED: AcaTimeRating[] = (
    Object.entries(ACA_TIME_ORDER) as [AcaTimeRating, number][]
)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k);

const RISK_ORDERED: AcaRiskRating[] = (
    Object.entries(ACA_RISK_ORDER) as [AcaRiskRating, number][]
)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k);

export class TechnicalMinMax {
    readonly min: AcaTechnicalRating;
    readonly max: AcaTechnicalRating;
    constructor(min: AcaTechnicalRating, max: AcaTechnicalRating) {
        assertOrdered(min, max, ACA_TECHNICAL_ORDER, 'TechnicalMinMax');
        this.min = min;
        this.max = max;
    }
}

export class WaterMinMax {
    readonly min: AcaWaterRating;
    readonly max: AcaWaterRating;
    constructor(min: AcaWaterRating, max: AcaWaterRating) {
        assertOrdered(min, max, ACA_WATER_ORDER, 'WaterMinMax');
        this.min = min;
        this.max = max;
    }
}

export class TimeMinMax {
    readonly min: AcaTimeRating;
    readonly max: AcaTimeRating;
    constructor(min: AcaTimeRating, max: AcaTimeRating) {
        assertOrdered(min, max, ACA_TIME_ORDER, 'TimeMinMax');
        this.min = min;
        this.max = max;
    }
}

export class RiskMinMax {
    readonly min: AcaRiskRating;
    readonly max: AcaRiskRating;
    constructor(min: AcaRiskRating, max: AcaRiskRating) {
        assertOrdered(min, max, ACA_RISK_ORDER, 'RiskMinMax');
        this.min = min;
        this.max = max;
    }
}

export class AcaDifficultyFilterOptions extends DifficultyFilterOptions {
    readonly difficultyType = DifficultyType.ACA;
    readonly technical: TechnicalMinMax;
    readonly water: WaterMinMax;
    readonly time: TimeMinMax;
    readonly risk: RiskMinMax;

    constructor(
        technical: TechnicalMinMax,
        water: WaterMinMax,
        time: TimeMinMax,
        risk: RiskMinMax,
    ) {
        super();
        this.technical = technical;
        this.water = water;
        this.time = time;
        this.risk = risk;
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
                this.risk.min,
                this.risk.max,
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
            risk: { min: this.risk.min, max: this.risk.max },
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
            (dtype !== DifficultyType.ACA &&
                !(typeof dtype === 'string' && dtype.toUpperCase() === DifficultyType.ACA))
        ) {
            throw new Error('AcaDifficultyFilterOptions.difficultyType must be ACA');
        }
        const tech = r.technical as Record<string, unknown>;
        const water = r.water as Record<string, unknown>;
        const time = r.time as Record<string, unknown>;
        const risk = r.risk as Record<string, unknown>;
        return new AcaDifficultyFilterOptions(
            new TechnicalMinMax(
                tech.min as AcaTechnicalRating,
                tech.max as AcaTechnicalRating,
            ),
            new WaterMinMax(water.min as AcaWaterRating, water.max as AcaWaterRating),
            new TimeMinMax(time.min as AcaTimeRating, time.max as AcaTimeRating),
            new RiskMinMax(risk.min as AcaRiskRating, risk.max as AcaRiskRating),
        );
    }
}

registerDifficultyFilterOptionsParser(DifficultyType.ACA, (v) =>
    AcaDifficultyFilterOptions.fromResult(v),
);
