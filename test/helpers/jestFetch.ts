/** URL string from `fetch` first argument (string, URL, or Request). */
export function requestUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    return input.url;
}

/** Minimal `Response` for mocked `global.fetch`. */
export function mockJsonResponse(
    ok: boolean,
    status: number,
    body: string,
): Response {
    return {
        ok,
        status,
        text: () => Promise.resolve(body),
    } as Response;
}
