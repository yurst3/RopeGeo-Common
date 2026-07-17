function countTags(html: string, pattern: RegExp): number {
    return html.match(pattern)?.length ?? 0;
}

/**
 * Repairs the list fragments Ropewiki excerpts commonly produce without
 * otherwise rewriting the source HTML.
 */
export function normalizeExcerptListHtml(html: string): string {
    if (html.length === 0) return html;

    let normalized = html;
    let olOpenCount = countTags(normalized, /<ol\b[^>]*>/gi);
    let olCloseCount = countTags(normalized, /<\/ol\s*>/gi);

    if (olOpenCount === 0 && olCloseCount > 0) {
        normalized = normalized.replace(/<\/ol\s*>/gi, '</ul>');
        normalized = '<ul>'.repeat(olCloseCount) + normalized;
        olCloseCount = 0;
    } else if (olOpenCount > olCloseCount) {
        normalized += '</ol>'.repeat(olOpenCount - olCloseCount);
    } else if (olCloseCount > olOpenCount) {
        normalized = '<ol>'.repeat(olCloseCount - olOpenCount) + normalized;
    }

    const ulOpenCount = countTags(normalized, /<ul\b[^>]*>/gi);
    const ulCloseCount = countTags(normalized, /<\/ul\s*>/gi);
    if (ulOpenCount > ulCloseCount) {
        normalized += '</ul>'.repeat(ulOpenCount - ulCloseCount);
    } else if (ulCloseCount > ulOpenCount) {
        normalized = '<ul>'.repeat(ulCloseCount - ulOpenCount) + normalized;
    }

    const hasListItem = /<li\b[^>]*>/i.test(normalized);
    const hasListContainer = /<\/?(?:ul|ol)\b[^>]*>/i.test(normalized);
    if (hasListItem && !hasListContainer) {
        normalized = `<ul>${normalized}</ul>`;
    }

    return normalized;
}
