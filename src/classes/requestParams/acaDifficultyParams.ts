import { DifficultyType } from '../difficulty/difficulty';
import {
    AcaRiskRating,
    AcaTechnicalRating,
    AcaTimeRating,
    AcaWaterRating,
} from '../difficulty/acaRatings';
import {
    DifficultyParams,
    type DifficultyParamsQueryRecord,
    registerDifficultyParamsQueryInference,
    registerDifficultyParamsQueryParser,
} from './difficultyParams';

export const Q_DIFFICULTY_TYPE = 'difficulty-type';
export const Q_ACA_TECHNICAL = 'aca-technical-rating';
export const Q_ACA_WATER = 'aca-water-rating';
export const Q_ACA_TIME = 'aca-time-rating';
export const Q_ACA_RISK = 'aca-risk-rating';

function splitPipeList(raw: string): string[] {
    return raw
        .split('|')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

function parseEnumTokens<T extends string>(
    raw: string | undefined,
    enumValues: readonly T[],
    label: string,
): T[] {
    if (raw === undefined || raw.trim() === '') return [];
    const upperAllowed = new Map<string, T>();
    for (const v of enumValues) {
        upperAllowed.set(v.toUpperCase(), v);
        upperAllowed.set(v, v);
    }
    const out: T[] = [];
    for (const token of splitPipeList(raw)) {
        const key = token.toUpperCase();
        const mapped =
            upperAllowed.get(token) ??
            upperAllowed.get(key) ??
            enumValues.find((v) => v.toUpperCase() === key);
        if (mapped === undefined) {
            throw new Error(
                `Invalid ${label} token: ${JSON.stringify(token)} is not one of [${enumValues.join(', ')}]`,
            );
        }
        out.push(mapped);
    }
    return [...new Set(out)].sort();
}

function acaAxisKeysPresent(q: DifficultyParamsQueryRecord): boolean {
    return (
        (q[Q_ACA_TECHNICAL] ?? '').trim() !== '' ||
        (q[Q_ACA_WATER] ?? '').trim() !== '' ||
        (q[Q_ACA_TIME] ?? '').trim() !== '' ||
        (q[Q_ACA_RISK] ?? '').trim() !== ''
    );
}

export class AcaDifficultyParams extends DifficultyParams {
    readonly difficultyType = DifficultyType.ACA;

    readonly technical: AcaTechnicalRating[];
    readonly water: AcaWaterRating[];
    readonly time: AcaTimeRating[];
    readonly risk: AcaRiskRating[];

    constructor(
        technical: AcaTechnicalRating[],
        water: AcaWaterRating[],
        time: AcaTimeRating[],
        risk: AcaRiskRating[],
    ) {
        super();
        this.technical = [...technical];
        this.water = [...water];
        this.time = [...time];
        this.risk = [...risk];
    }

    isActive(): boolean {
        return (
            this.technical.length > 0 ||
            this.water.length > 0 ||
            this.time.length > 0 ||
            this.risk.length > 0
        );
    }

    toQueryString(): string {
        const p = new URLSearchParams();
        p.set(Q_DIFFICULTY_TYPE, 'aca');
        if (this.technical.length > 0) {
            p.set(
                Q_ACA_TECHNICAL,
                this.technical.map((x) => x.toLowerCase()).join('|'),
            );
        }
        if (this.water.length > 0) {
            p.set(Q_ACA_WATER, this.water.map((x) => x.toLowerCase()).join('|'));
        }
        if (this.time.length > 0) {
            p.set(Q_ACA_TIME, this.time.map((x) => x.toLowerCase()).join('|'));
        }
        if (this.risk.length > 0) {
            p.set(Q_ACA_RISK, this.risk.map((x) => x.toLowerCase()).join('|'));
        }
        return p.toString();
    }

    static fromQueryStringParams(
        q: DifficultyParamsQueryRecord,
    ): AcaDifficultyParams {
        const technical = parseEnumTokens(
            q[Q_ACA_TECHNICAL] ?? q['Aca-Technical-Rating'],
            Object.values(AcaTechnicalRating),
            'aca-technical-rating',
        );
        const water = parseEnumTokens(
            q[Q_ACA_WATER] ?? q['Aca-Water-Rating'],
            Object.values(AcaWaterRating),
            'aca-water-rating',
        );
        const time = parseEnumTokens(
            q[Q_ACA_TIME] ?? q['Aca-Time-Rating'],
            Object.values(AcaTimeRating),
            'aca-time-rating',
        );
        const risk = parseEnumTokens(
            q[Q_ACA_RISK] ?? q['Aca-Risk-Rating'],
            Object.values(AcaRiskRating),
            'aca-risk-rating',
        );
        return new AcaDifficultyParams(technical, water, time, risk);
    }

    private static optionalString(
        obj: Record<string, unknown>,
        ...keys: string[]
    ): string | undefined {
        for (const k of keys) {
            const v = obj[k];
            if (typeof v === 'string') return v;
        }
        return undefined;
    }

    /** Parses JSON objects with the same key variants as {@link fromQueryStringParams}. */
    static fromResult(obj: Record<string, unknown>): AcaDifficultyParams {
        const technical = parseEnumTokens(
            AcaDifficultyParams.optionalString(
                obj,
                Q_ACA_TECHNICAL,
                'Aca-Technical-Rating',
            ),
            Object.values(AcaTechnicalRating),
            'aca-technical-rating',
        );
        const water = parseEnumTokens(
            AcaDifficultyParams.optionalString(
                obj,
                Q_ACA_WATER,
                'Aca-Water-Rating',
            ),
            Object.values(AcaWaterRating),
            'aca-water-rating',
        );
        const time = parseEnumTokens(
            AcaDifficultyParams.optionalString(obj, Q_ACA_TIME, 'Aca-Time-Rating'),
            Object.values(AcaTimeRating),
            'aca-time-rating',
        );
        const risk = parseEnumTokens(
            AcaDifficultyParams.optionalString(obj, Q_ACA_RISK, 'Aca-Risk-Rating'),
            Object.values(AcaRiskRating),
            'aca-risk-rating',
        );
        return new AcaDifficultyParams(technical, water, time, risk);
    }

    /** Returns null if every axis is empty (no difficulty filter). */
    static normalizeEmpty(
        params: AcaDifficultyParams | null,
    ): AcaDifficultyParams | null {
        if (params === null || !params.isActive()) return null;
        return params;
    }
}

registerDifficultyParamsQueryInference((q) =>
    acaAxisKeysPresent(q) ? DifficultyType.ACA : null,
);

registerDifficultyParamsQueryParser(DifficultyType.ACA, (q) =>
    AcaDifficultyParams.fromQueryStringParams(q),
);
