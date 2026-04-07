import { DifficultyType } from '../../difficulty/difficulty';

/** Flat query / query-like record for {@link DifficultyParams.fromQueryStringParams}. */
export type DifficultyParamsQueryRecord = Record<string, string | undefined>;

const queryParsers = new Map<
    DifficultyType,
    (q: DifficultyParamsQueryRecord) => DifficultyParams
>();

let queryInference:
    | ((q: DifficultyParamsQueryRecord) => DifficultyType | null)
    | undefined;

let parseFromResult:
    | ((result: unknown) => DifficultyParams | null)
    | undefined;

/**
 * When `difficulty-type` is absent, this hook may return a {@link DifficultyType} to parse with
 * {@link registerDifficultyParamsQueryParser} (e.g. ACA when any `aca-*-rating` key is present).
 */
export function registerDifficultyParamsQueryInference(
    fn: (q: DifficultyParamsQueryRecord) => DifficultyType | null,
): void {
    queryInference = fn;
}

/**
 * Registers the parser for {@link DifficultyParams.fromQueryStringParams} for a given type
 * (see `registerDifficultyParamsParsers.ts`).
 */
export function registerDifficultyParamsQueryParser(
    type: DifficultyType,
    parse: (q: DifficultyParamsQueryRecord) => DifficultyParams,
): void {
    queryParsers.set(type, parse);
}

/**
 * Registers {@link DifficultyParams.fromResult} (see `registerDifficultyParamsParsers.ts`).
 */
export function registerDifficultyParamsResultParser(
    parse: (result: unknown) => DifficultyParams | null,
): void {
    parseFromResult = parse;
}

/**
 * Query serialization for GET /routes and GET /search difficulty filters.
 */
export abstract class DifficultyParams {
    abstract readonly difficultyType: DifficultyType;

    abstract toQueryString(): string;

    abstract isActive(): boolean;

    /**
     * Parses flat query parameters. Dispatches on `difficulty-type` (case-insensitive `aca`);
     * when it is absent, {@link registerDifficultyParamsQueryInference} may select a parser.
     */
    static fromQueryStringParams(
        q: DifficultyParamsQueryRecord,
    ): DifficultyParams | null {
        const rawType = (
            q['difficulty-type'] ??
            q['Difficulty-Type'] ??
            ''
        )
            .trim()
            .toLowerCase();
        if (rawType === '') {
            const inferred = queryInference?.(q) ?? null;
            if (inferred === null) {
                return null;
            }
            const parser = queryParsers.get(inferred);
            if (parser === undefined) {
                throw new Error(
                    `No difficulty params query parser registered for difficultyType ${JSON.stringify(inferred)}`,
                );
            }
            return parser(q);
        }
        if (rawType === 'aca') {
            const parser = queryParsers.get(DifficultyType.ACA);
            if (parser === undefined) {
                throw new Error(
                    'No difficulty params query parser registered for difficultyType ACA',
                );
            }
            return parser(q);
        }
        throw new Error(
            `Query parameter "difficulty-type" must be "aca", got: ${JSON.stringify(rawType)}`,
        );
    }

    /**
     * Parses JSON-like objects (e.g. saved filter bodies). Requires importing
     * `registerDifficultyParamsParsers` so the implementation is registered.
     */
    static fromResult(result: unknown): DifficultyParams | null {
        if (parseFromResult === undefined) {
            throw new Error(
                'DifficultyParams.fromResult: import registerDifficultyParamsParsers (or call registerDifficultyParamsResultParser)',
            );
        }
        return parseFromResult(result);
    }

    /** Appends difficulty query keys to `target` (mutates). Omits axes with empty allow-lists. */
    static appendToUrlSearchParams(
        target: URLSearchParams,
        difficulty: DifficultyParams | null,
    ): void {
        if (difficulty === null || !difficulty.isActive()) return;
        const piece = difficulty.toQueryString();
        if (piece === '') return;
        const inner = new URLSearchParams(piece);
        inner.forEach((v, k) => target.set(k, v));
    }
}

export function isDifficultyParamsActive(
    d: DifficultyParams | null | undefined,
): boolean {
    return d != null && d.isActive();
}
