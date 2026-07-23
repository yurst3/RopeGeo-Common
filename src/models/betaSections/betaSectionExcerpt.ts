import { normalizeExcerptListHtml } from './normalizeExcerptHtml';
import { boldRelevantPhraseInHtml } from './boldRelevantPhrase';
import {
    assertRelevanceStrength,
    type RelevanceStrength,
} from '../relevanceStrength';

export class BetaSectionExcerpt {
    readonly text?: string;
    readonly start?: number;
    readonly end?: number;
    readonly relevanceStrength: RelevanceStrength;
    /**
     * Verbatim substring of the text block’s title and/or body that connects
     * this excerpt to the map feature. Required even for title-only relevance
     * (when `text` is omitted).
     */
    readonly relevantPhrase: string;

    constructor(
        text: string | undefined,
        start: number | undefined,
        end: number | undefined,
        relevanceStrength: RelevanceStrength,
        relevantPhrase: string,
    ) {
        assertRelevanceStrength(relevanceStrength, 'BetaSectionExcerpt.relevanceStrength');
        BetaSectionExcerpt.assertNonEmptyString(
            relevantPhrase,
            'BetaSectionExcerpt.relevantPhrase',
        );
        this.text = text;
        this.start = start;
        this.end = end;
        this.relevanceStrength = relevanceStrength;
        this.relevantPhrase = relevantPhrase;
    }

    toPlain(): Record<string, unknown> {
        const out: Record<string, unknown> = {
            relevanceStrength: this.relevanceStrength,
            relevantPhrase: this.relevantPhrase,
        };
        if (this.text !== undefined) {
            out.text = this.text;
        }
        if (this.start !== undefined) {
            out.start = this.start;
        }
        if (this.end !== undefined) {
            out.end = this.end;
        }
        return out;
    }

    /** Returns displayable excerpt HTML when the owning beta section is unavailable. */
    toHtml(): string {
        return boldRelevantPhraseInHtml(
            normalizeExcerptListHtml(this.text ?? ''),
            this.relevantPhrase,
        );
    }

    static fromResult(result: unknown): BetaSectionExcerpt {
        if (result == null || typeof result !== 'object' || Array.isArray(result)) {
            throw new Error('BetaSectionExcerpt result must be an object');
        }
        const r = result as Record<string, unknown>;
        const relevanceStrength = assertRelevanceStrength(
            r.relevanceStrength,
            'BetaSectionExcerpt.relevanceStrength',
        );
        const relevantPhrase = BetaSectionExcerpt.assertNonEmptyString(
            r.relevantPhrase,
            'BetaSectionExcerpt.relevantPhrase',
        );

        let text: string | undefined;
        if (r.text !== undefined) {
            if (typeof r.text !== 'string') {
                throw new Error(
                    `BetaSectionExcerpt.text must be a string, got: ${typeof r.text}`,
                );
            }
            text = r.text;
        }

        let start: number | undefined;
        if (r.start !== undefined) {
            BetaSectionExcerpt.assertNonNegativeInteger(r.start, 'BetaSectionExcerpt.start');
            start = r.start as number;
        }

        let end: number | undefined;
        if (r.end !== undefined) {
            BetaSectionExcerpt.assertNonNegativeInteger(r.end, 'BetaSectionExcerpt.end');
            end = r.end as number;
        }

        return new BetaSectionExcerpt(
            text,
            start,
            end,
            relevanceStrength,
            relevantPhrase,
        );
    }

    private static assertNonEmptyString(value: unknown, context: string): string {
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`${context} must be a non-empty string`);
        }
        return value;
    }

    private static assertNonNegativeInteger(value: unknown, context: string): void {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
            throw new Error(`${context} must be a non-negative integer, got: ${JSON.stringify(value)}`);
        }
    }
}
