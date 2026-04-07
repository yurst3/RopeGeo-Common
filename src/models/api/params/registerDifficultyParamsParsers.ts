/**
 * Side-effect import so ACA (and future) difficulty param query parsers register with
 * {@link DifficultyParams.fromQueryStringParams}, and {@link DifficultyParams.fromResult} is wired.
 * Imported from the package types barrel.
 */
import {
    AcaDifficultyParams,
    Q_ACA_RISK,
    Q_ACA_TECHNICAL,
    Q_ACA_TIME,
    Q_ACA_WATER,
} from './acaDifficultyParams';
import { registerDifficultyParamsResultParser } from './difficultyParams';

function firstString(obj: Record<string, unknown>, ...keys: string[]): string {
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === 'string') return v;
    }
    return '';
}

function acaAxisKeysPresentInObject(obj: Record<string, unknown>): boolean {
    return (
        firstString(obj, Q_ACA_TECHNICAL, 'Aca-Technical-Rating').trim() !==
            '' ||
        firstString(obj, Q_ACA_WATER, 'Aca-Water-Rating').trim() !== '' ||
        firstString(obj, Q_ACA_TIME, 'Aca-Time-Rating').trim() !== '' ||
        firstString(obj, Q_ACA_RISK, 'Aca-Risk-Rating').trim() !== ''
    );
}

registerDifficultyParamsResultParser((result: unknown) => {
    if (result == null || typeof result !== 'object') {
        throw new Error('DifficultyParams result must be an object');
    }
    const obj = result as Record<string, unknown>;
    const rawType = (
        firstString(obj, 'difficulty-type', 'Difficulty-Type') ||
        (typeof obj.difficultyType === 'string' ? obj.difficultyType : '')
    )
        .trim()
        .toLowerCase();

    if (rawType === 'aca' || (rawType === '' && acaAxisKeysPresentInObject(obj))) {
        return AcaDifficultyParams.fromResult(obj);
    }
    if (rawType === '') {
        return null;
    }
    throw new Error(
        `Field "difficulty-type" must be "aca", got: ${JSON.stringify(rawType)}`,
    );
});
