/**
 * HTTP client for download tasks. Uses global `fetch` only (no undici / Lambda proxy)
 * so the download module graph is safe for React Native Metro bundling.
 */

import { mergeParentSignalWithDeadline } from '../../helpers/network/networkRequestPolicy';

const DEFAULT_HEADERS: Record<string, string> = {
    Accept: 'application/json, text/html, application/xml, */*',
    'Accept-Language': 'en-US,en;q=0.9',
};

const DOWNLOAD_HTTP_REQUEST_TIMEOUT_MS = 30_000;

const buildNonOkMessage = async (
    response: Response,
    requestUrl: string,
): Promise<string> => {
    const finalUrl = response.url;
    const server =
        response.headers.get('server') ?? response.headers.get('x-powered-by') ?? '(none)';
    let bodyText = '';
    try {
        bodyText = await response.clone().text();
    } catch {
        bodyText = '(failed to read body)';
    }
    const bodyPreview = bodyText.length > 2000 ? `${bodyText.slice(0, 2000)}...` : bodyText;
    return (
        `downloadHttpRequest non-OK: status=${response.status} statusText=${response.statusText} ` +
        `requestUrl=${requestUrl} finalUrl=${finalUrl} server=${server} responseBody=${bodyPreview}`
    );
};

function abortSignalAfterMs(ms: number): { signal: AbortSignal; dispose: () => void } {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
            controller.abort();
        }
    }, ms);
    return {
        signal: controller.signal,
        dispose: () => {
            clearTimeout(timeoutId);
        },
    };
}

/**
 * Send a single HTTP request for download list/page JSON fetches.
 * Aborts when `abortSignal` fires or after 30 seconds. Throws on non-OK responses.
 */
export async function downloadHttpRequest(
    url: string | URL,
    abortSignal?: AbortSignal,
    init?: RequestInit,
): Promise<Response> {
    const requestUrl = typeof url === 'string' ? url : url.toString();

    if (abortSignal?.aborted) {
        const err =
            abortSignal.reason instanceof Error
                ? abortSignal.reason
                : new Error(String(abortSignal.reason));
        throw new Error(
            `downloadHttpRequest aborted: requestUrl=${requestUrl} error=${err.message}`,
        );
    }

    const deadline =
        abortSignal != null
            ? mergeParentSignalWithDeadline(abortSignal, DOWNLOAD_HTTP_REQUEST_TIMEOUT_MS)
            : null;
    const timeoutOnly =
        deadline == null ? abortSignalAfterMs(DOWNLOAD_HTTP_REQUEST_TIMEOUT_MS) : null;
    const requestSignal = deadline?.signal ?? timeoutOnly!.signal;

    let response: Response;
    try {
        response = await globalThis.fetch(requestUrl, {
            headers: DEFAULT_HEADERS,
            signal: requestSignal,
            ...init,
        });
    } catch (error) {
        throw new Error(`downloadHttpRequest failed: requestUrl=${requestUrl} error=${error}`);
    } finally {
        deadline?.dispose();
        timeoutOnly?.dispose();
    }

    if (!response.ok) {
        throw new Error(await buildNonOkMessage(response, requestUrl));
    }

    return response;
}
