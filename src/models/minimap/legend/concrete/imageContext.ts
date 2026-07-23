import {
    assertRelevanceStrength,
    type RelevanceStrength,
} from '../../../relevanceStrength';

export class ImageContext {
    readonly id: string;
    readonly relevanceStrength: RelevanceStrength;
    /** Verbatim substring of the image caption and/or file URL. */
    readonly relevantPhrase: string;

    constructor(id: string, relevanceStrength: RelevanceStrength, relevantPhrase: string) {
        ImageContext.assertNonEmptyString(id, 'ImageContext.id');
        assertRelevanceStrength(relevanceStrength, 'ImageContext.relevanceStrength');
        ImageContext.assertNonEmptyString(relevantPhrase, 'ImageContext.relevantPhrase');
        this.id = id;
        this.relevanceStrength = relevanceStrength;
        this.relevantPhrase = relevantPhrase;
    }

    toPlain(): Record<string, unknown> {
        return {
            id: this.id,
            relevanceStrength: this.relevanceStrength,
            relevantPhrase: this.relevantPhrase,
        };
    }

    static fromResult(result: unknown): ImageContext {
        if (result == null || typeof result !== 'object' || Array.isArray(result)) {
            throw new Error('ImageContext result must be an object');
        }
        const r = result as Record<string, unknown>;
        const id = ImageContext.assertNonEmptyString(r.id, 'ImageContext.id');
        const relevanceStrength = assertRelevanceStrength(
            r.relevanceStrength,
            'ImageContext.relevanceStrength',
        );
        const relevantPhrase = ImageContext.assertNonEmptyString(
            r.relevantPhrase,
            'ImageContext.relevantPhrase',
        );
        return new ImageContext(id, relevanceStrength, relevantPhrase);
    }

    private static assertNonEmptyString(value: unknown, context: string): string {
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`${context} must be a non-empty string`);
        }
        return value;
    }
}
