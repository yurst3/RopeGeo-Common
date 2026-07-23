/**
 * Wraps the first contiguous text-run occurrence of `phrase` in `<b>…</b>`
 * without splitting HTML tags. If the phrase already sits fully inside a
 * `<b>`/`<strong>` element, or spans multiple text runs (tags in between),
 * returns `html` unchanged.
 */
export function boldRelevantPhraseInHtml(html: string, phrase: string): string {
    if (html.length === 0 || phrase.length === 0) return html;

    const tokens = tokenizeHtml(html);
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]!;
        if (token.kind !== 'text') continue;
        const at = token.value.indexOf(phrase);
        if (at === -1) continue;
        if (isInsideBold(tokens, i)) return html;

        tokens[i] = {
            kind: 'text',
            value:
                token.value.slice(0, at) +
                '<b>' +
                phrase +
                '</b>' +
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

function isInsideBold(tokens: HtmlToken[], textTokenIndex: number): boolean {
    let depth = 0;
    for (let i = 0; i < textTokenIndex; i++) {
        const token = tokens[i]!;
        if (token.kind !== 'tag') continue;
        if (/^<\s*(b|strong)\b[^>]*>$/i.test(token.value)) depth += 1;
        else if (/^<\s*\/\s*(b|strong)\s*>$/i.test(token.value)) {
            depth = Math.max(0, depth - 1);
        }
    }
    return depth > 0;
}
