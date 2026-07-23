/**
 * How strongly a measurement, text excerpt, or image is tied to a map feature.
 * Values match the AI model / Zod enum exactly (spaced strings).
 */
export const RELEVANCE_STRENGTHS = [
    'Maybe Relevant',
    'Somewhat Relevant',
    'Definitely Relevant',
] as const;

export type RelevanceStrength = (typeof RELEVANCE_STRENGTHS)[number];

export function isRelevanceStrength(value: unknown): value is RelevanceStrength {
    return (
        typeof value === 'string' &&
        (RELEVANCE_STRENGTHS as readonly string[]).includes(value)
    );
}

export function assertRelevanceStrength(value: unknown, context: string): RelevanceStrength {
    if (!isRelevanceStrength(value)) {
        throw new Error(
            `${context} must be one of ${RELEVANCE_STRENGTHS.map((s) => JSON.stringify(s)).join(', ')}, got: ${JSON.stringify(value)}`,
        );
    }
    return value;
}
