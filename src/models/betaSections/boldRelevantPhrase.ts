/** Custom HTML tag used to mark a relevant phrase for client styling. */
export const RELEVANT_PHRASE_HTML_TAG = 'RelevantPhrase';

/**
 * Wraps the first contiguous text-run occurrence of `phrase` in
 * `<RelevantPhrase>…</RelevantPhrase>` without splitting HTML tags.
 * If the phrase already sits fully inside a `<RelevantPhrase>` element, or
 * spans multiple text runs (tags in between), returns `html` unchanged.
 * When `phrase` is undefined/null/empty, returns `html` unchanged (no highlighting).
 *
 * Uses a dedicated tag (not `<b>`/`<strong>`) so clients can style relevant
 * phrases independently of wiki bold emphasis.
 */
export function boldRelevantPhraseInHtml(
    html: string,
    phrase: string | undefined | null,
): string {
    if (html.length === 0 || phrase == null || phrase.length === 0) return html;

    const open = `<${RELEVANT_PHRASE_HTML_TAG}>`;
    const close = `</${RELEVANT_PHRASE_HTML_TAG}>`;

    const tokens = tokenizeHtml(html);
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]!;
        if (token.kind !== 'text') continue;
        const at = token.value.indexOf(phrase);
        if (at === -1) continue;
        if (isInsideRelevantPhrase(tokens, i)) return html;

        tokens[i] = {
            kind: 'text',
            value:
                token.value.slice(0, at) +
                open +
                phrase +
                close +
                token.value.slice(at + phrase.length),
        };
        return tokens.map((t) => t.value).join('');
    }
    return html;
}

type HtmlToken =
    | { kind: 'text'; value: string }
    | { kind: 'tag'; value: string };

function tokenizeHtml(html: string): HtmlToken[] {
    const tokens: HtmlToken[] = [];
    for (const part of html.split(/(<[^>]+>)/g)) {
        if (part.length === 0) continue;
        if (part.startsWith('<') && part.endsWith('>')) {
            tokens.push({ kind: 'tag', value: part });
        } else {
            tokens.push({ kind: 'text', value: part });
        }
    }
    return tokens;
}

function isInsideRelevantPhrase(tokens: HtmlToken[], textTokenIndex: number): boolean {
    let depth = 0;
    for (let i = 0; i < textTokenIndex; i++) {
        const token = tokens[i]!;
        if (token.kind !== 'tag') continue;
        if (/^<\s*RelevantPhrase\b[^>]*>$/i.test(token.value)) depth += 1;
        else if (/^<\s*\/\s*RelevantPhrase\s*>$/i.test(token.value)) {
            depth = Math.max(0, depth - 1);
        }
    }
    return depth > 0;
}
