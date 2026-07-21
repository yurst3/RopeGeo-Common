function countTags(html: string, pattern: RegExp): number {
    return html.match(pattern)?.length ?? 0;
}

/** Leading/trailing context around an excerpt body, split for independent styling. */
export type ExcerptHtmlParts = {
    before: string;
    body: string;
    after: string;
};

/**
 * Repairs the list fragments Ropewiki excerpts commonly produce, distributing
 * any added opening tags to `before` and closing tags to `after` so the three
 * parts remain a well-formed list when concatenated as `before + body + after`.
 */
export function normalizeExcerptListHtmlParts(parts: ExcerptHtmlParts): ExcerptHtmlParts {
    let { before, body, after } = parts;
    const combined = () => before + body + after;

    const olOpenCount = countTags(combined(), /<ol\b[^>]*>/gi);
    const olCloseCount = countTags(combined(), /<\/ol\s*>/gi);

    if (olOpenCount === 0 && olCloseCount > 0) {
        before = before.replace(/<\/ol\s*>/gi, '</ul>');
        body = body.replace(/<\/ol\s*>/gi, '</ul>');
        after = after.replace(/<\/ol\s*>/gi, '</ul>');
        before = '<ul>'.repeat(olCloseCount) + before;
    } else if (olOpenCount > olCloseCount) {
        after += '</ol>'.repeat(olOpenCount - olCloseCount);
    } else if (olCloseCount > olOpenCount) {
        before = '<ol>'.repeat(olCloseCount - olOpenCount) + before;
    }

    const ulOpenCount = countTags(combined(), /<ul\b[^>]*>/gi);
    const ulCloseCount = countTags(combined(), /<\/ul\s*>/gi);
    if (ulOpenCount > ulCloseCount) {
        after += '</ul>'.repeat(ulOpenCount - ulCloseCount);
    } else if (ulCloseCount > ulOpenCount) {
        before = '<ul>'.repeat(ulCloseCount - ulOpenCount) + before;
    }

    const hasListItem = /<li\b[^>]*>/i.test(combined());
    const hasListContainer = /<\/?(?:ul|ol)\b[^>]*>/i.test(combined());
    if (hasListItem && !hasListContainer) {
        before = `<ul>${before}`;
        after = `${after}</ul>`;
    }

    return { before, body, after };
}

/**
 * Repairs the list fragments Ropewiki excerpts commonly produce without
 * otherwise rewriting the source HTML.
 */
export function normalizeExcerptListHtml(html: string): string {
    if (html.length === 0) return html;
    const { before, body, after } = normalizeExcerptListHtmlParts({
        before: '',
        body: html,
        after: '',
    });
    return before + body + after;
}
