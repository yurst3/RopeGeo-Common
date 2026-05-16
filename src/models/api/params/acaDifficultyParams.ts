import { DifficultyRatingSystem } from '../../difficulty/difficultyRating';
import {
    AcaRiskSubRating,
    AcaTechnicalSubRating,
    AcaTimeSubRating,
    AcaWaterSubRating,
} from '../../difficulty/acaSubRatings';
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
    readonly difficultyType = DifficultyRatingSystem.ACA;

    readonly technical: AcaTechnicalSubRating[];
    readonly water: AcaWaterSubRating[];
    readonly time: AcaTimeSubRating[];
    readonly effectiveRisk: AcaRiskSubRating[];

    constructor(
        technical: AcaTechnicalSubRating[],
        water: AcaWaterSubRating[],
        time: AcaTimeSubRating[],
        effectiveRisk: AcaRiskSubRating[],
    ) {
        super();
        this.technical = [...technical];
        this.water = [...water];
        this.time = [...time];
        this.effectiveRisk = [...effectiveRisk];
    }

    isActive(): boolean {
        return (
            this.technical.length > 0 ||
            this.water.length > 0 ||
            this.time.length > 0 ||
            this.effectiveRisk.length > 0
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
        if (this.effectiveRisk.length > 0) {
            p.set(
                Q_ACA_RISK,
                this.effectiveRisk.map((x) => x.toLowerCase()).join('|'),
            );
        }
        return p.toString();
    }

    static fromQueryStringParams(
        q: DifficultyParamsQueryRecord,
    ): AcaDifficultyParams {
        const technical = parseEnumTokens(
            q[Q_ACA_TECHNICAL] ?? q['Aca-Technical-Rating'],
            Object.values(AcaTechnicalSubRating),
            'aca-technical-rating',
        );
        const water = parseEnumTokens(
            q[Q_ACA_WATER] ?? q['Aca-Water-Rating'],
            Object.values(AcaWaterSubRating),
            'aca-water-rating',
        );
        const time = parseEnumTokens(
            q[Q_ACA_TIME] ?? q['Aca-Time-Rating'],
            Object.values(AcaTimeSubRating),
            'aca-time-rating',
        );
        const effectiveRisk = parseEnumTokens(
            q[Q_ACA_RISK] ?? q['Aca-Risk-Rating'],
            Object.values(AcaRiskSubRating),
            'aca-risk-rating',
        );
        return new AcaDifficultyParams(technical, water, time, effectiveRisk);
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
            Object.values(AcaTechnicalSubRating),
            'aca-technical-rating',
        );
        const water = parseEnumTokens(
            AcaDifficultyParams.optionalString(
                obj,
                Q_ACA_WATER,
                'Aca-Water-Rating',
            ),
            Object.values(AcaWaterSubRating),
            'aca-water-rating',
        );
        const time = parseEnumTokens(
            AcaDifficultyParams.optionalString(obj, Q_ACA_TIME, 'Aca-Time-Rating'),
            Object.values(AcaTimeSubRating),
            'aca-time-rating',
        );
        const effectiveRisk = parseEnumTokens(
            AcaDifficultyParams.optionalString(obj, Q_ACA_RISK, 'Aca-Risk-Rating'),
            Object.values(AcaRiskSubRating),
            'aca-risk-rating',
        );
        return new AcaDifficultyParams(technical, water, time, effectiveRisk);
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
    acaAxisKeysPresent(q) ? DifficultyRatingSystem.ACA : null,
);

registerDifficultyParamsQueryParser(DifficultyRatingSystem.ACA, (q) =>
    AcaDifficultyParams.fromQueryStringParams(q),
);
