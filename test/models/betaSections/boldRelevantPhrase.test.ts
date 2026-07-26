import { boldRelevantPhraseInHtml } from '../../../src/models/betaSections/boldRelevantPhrase';

describe('boldRelevantPhraseInHtml', () => {
    it('wraps a plain contiguous phrase', () => {
        expect(boldRelevantPhraseInHtml('The first rappel is bolted.', 'first rappel')).toBe(
            'The <b>first rappel</b> is bolted.',
        );
    });

    it('wraps a phrase inside mixed HTML without splitting tags', () => {
        expect(
            boldRelevantPhraseInHtml('<p>Drop to the 1st rap.</p>', '1st rap'),
        ).toBe('<p>Drop to the <b>1st rap</b>.</p>');
    });

    it('leaves already-bold phrases unchanged', () => {
        expect(boldRelevantPhraseInHtml('See <b>R2</b> below.', 'R2')).toBe(
            'See <b>R2</b> below.',
        );
        expect(boldRelevantPhraseInHtml('See <strong>R2</strong> below.', 'R2')).toBe(
            'See <strong>R2</strong> below.',
        );
    });

    it('skips phrases that span tags', () => {
        expect(boldRelevantPhraseInHtml('R<em>2</em>: bolted', 'R2')).toBe('R<em>2</em>: bolted');
    });

    it('returns html unchanged when the phrase is missing', () => {
        expect(boldRelevantPhraseInHtml('<p>No match here</p>', 'Rappel 1')).toBe(
            '<p>No match here</p>',
        );
    });

    it('returns html unchanged for empty phrase or html', () => {
        expect(boldRelevantPhraseInHtml('', 'R1')).toBe('');
        expect(boldRelevantPhraseInHtml('<p>R1</p>', '')).toBe('<p>R1</p>');
        expect(boldRelevantPhraseInHtml('<p>R1</p>', undefined)).toBe('<p>R1</p>');
        expect(boldRelevantPhraseInHtml('<p>R1</p>', null)).toBe('<p>R1</p>');
    });
});
