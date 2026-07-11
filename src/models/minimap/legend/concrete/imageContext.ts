export class ImageContext {
    readonly id: string;
    readonly confidence: number;

    constructor(id: string, confidence: number) {
        ImageContext.assertNonEmptyString(id, 'ImageContext.id');
        ImageContext.assertConfidence(confidence);
        this.id = id;
        this.confidence = confidence;
    }

    toPlain(): Record<string, unknown> {
        return {
            id: this.id,
            confidence: this.confidence,
        };
    }

    static fromResult(result: unknown): ImageContext {
        if (result == null || typeof result !== 'object' || Array.isArray(result)) {
            throw new Error('ImageContext result must be an object');
        }
        const r = result as Record<string, unknown>;
        const id = ImageContext.assertNonEmptyString(r.id, 'ImageContext.id');
        ImageContext.assertConfidence(r.confidence);
        return new ImageContext(id, r.confidence as number);
    }

    private static assertNonEmptyString(value: unknown, context: string): string {
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`${context} must be a non-empty string`);
        }
        return value;
    }

    private static assertConfidence(value: unknown): void {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
            throw new Error(
                `ImageContext.confidence must be a number from 0 to 1, got: ${JSON.stringify(value)}`,
            );
        }
    }
}
