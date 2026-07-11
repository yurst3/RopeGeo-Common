export class BetaSectionExcerpt {
    readonly text?: string;
    readonly start?: number;
    readonly end?: number;
    readonly confidence: number;

    constructor(
        text: string | undefined,
        start: number | undefined,
        end: number | undefined,
        confidence: number,
    ) {
        BetaSectionExcerpt.assertConfidence(confidence);
        this.text = text;
        this.start = start;
        this.end = end;
        this.confidence = confidence;
    }

    toPlain(): Record<string, unknown> {
        const out: Record<string, unknown> = { confidence: this.confidence };
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

    static fromResult(result: unknown): BetaSectionExcerpt {
        if (result == null || typeof result !== 'object' || Array.isArray(result)) {
            throw new Error('BetaSectionExcerpt result must be an object');
        }
        const r = result as Record<string, unknown>;
        BetaSectionExcerpt.assertConfidence(r.confidence);

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

        return new BetaSectionExcerpt(text, start, end, r.confidence as number);
    }

    private static assertConfidence(value: unknown): void {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
            throw new Error(
                `BetaSectionExcerpt.confidence must be a number from 0 to 1, got: ${JSON.stringify(value)}`,
            );
        }
    }

    private static assertNonNegativeInteger(value: unknown, context: string): void {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
            throw new Error(`${context} must be a non-negative integer, got: ${JSON.stringify(value)}`);
        }
    }
}
