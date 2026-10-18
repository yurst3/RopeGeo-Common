/** UUID v4 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validated params for getPagePreviews (GET /page/preview).
 * `ids` is a pipe-delimited list of page ids in the query string (`?ids=a|b|c`).
 * Ids are trimmed and deduplicated, preserving first-seen order.
 */
export class PagePreviewsParams {
    static readonly MAX_IDS = 100;

    public readonly ids: string[];

    constructor(ids: string[]) {
        if (!Array.isArray(ids)) {
            throw new Error('PagePreviewsParams.ids must be an array');
        }
        const out: string[] = [];
        for (const raw of ids) {
            if (typeof raw !== 'string') {
                throw new Error('Query parameter "ids" must only contain strings');
            }
            const id = raw.trim();
            if (id === '') continue;
            if (!UUID_REGEX.test(id)) {
                throw new Error(
                    `Query parameter "ids" must only contain valid UUIDs, got: ${JSON.stringify(id)}`,
                );
            }
            if (!out.includes(id)) out.push(id);
        }
        if (out.length === 0) {
            throw new Error('Query parameter "ids" must contain at least one page id');
        }
        if (out.length > PagePreviewsParams.MAX_IDS) {
            throw new Error(
                `Query parameter "ids" must not contain more than ${PagePreviewsParams.MAX_IDS} page ids`,
            );
        }
        this.ids = out;
    }

    toQueryString(): string {
        const p = new URLSearchParams();
        p.set('ids', this.ids.join('|'));
        return p.toString();
    }

    /**
     * Parses query string parameters and returns validated params.
     * Validation is performed by the constructor.
     */
    static fromQueryStringParams(
        q: Record<string, string | undefined>,
    ): PagePreviewsParams {
        const raw = (q.ids ?? q.Ids ?? '').trim();
        if (raw === '') {
            throw new Error('Query parameter "ids" is required');
        }
        return new PagePreviewsParams(raw.split('|'));
    }
}
