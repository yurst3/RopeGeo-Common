function countTags(html: string, pattern: RegExp): number {
    return html.match(pattern)?.length ?? 0;
}

export type NormalizeExcerptListOptions = {
    /**
     * When true, an unpaired closing `</ol>` is repaired by prepending an
     * opening `<ol>` (preserving the ordered list). When false (the default,
     * used for excerpt-only text with no known source order), it is converted
     * to `</ul>` and an opening `<ul>` is prepended instead.
     */
    preserveOrderedLists?: boolean;
};

/**
 * Repairs the list fragments Ropewiki excerpts commonly produce without
 * otherwise rewriting the source HTML, so the result is well-formed on its own.
 */
export function normalizeExcerptListHtml(
    html: string,
    { preserveOrderedLists = false }: NormalizeExcerptListOptions = {},
): string {
    if (html.length === 0) return html;

    let normalized = html;
    const olOpenCount = countTags(normalized, /<ol\b[^>]*>/gi);
    const olCloseCount = countTags(normalized, /<\/ol\s*>/gi);

    if (!preserveOrderedLists && olOpenCount === 0 && olCloseCount > 0) {
        normalized = normalized.replace(/<\/ol\s*>/gi, '</ul>');
        normalized = '<ul>'.repeat(olCloseCount) + normalized;
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
