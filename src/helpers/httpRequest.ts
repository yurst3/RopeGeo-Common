/**
 * Wrapper for HTTP requests: sets headers, throws on non-OK or failed request with
 * detailed messages, and optionally routes through a proxy in Lambda dev/prod.
 */

const DEFAULT_HEADERS: Record<string, string> = {
    Accept: 'application/json, text/html, application/xml, */*',
    'Accept-Language': 'en-US,en;q=0.9',
};

const isLambda = (): boolean => typeof process.env.AWS_LAMBDA_FUNCTION_NAME === 'string' && process.env.AWS_LAMBDA_FUNCTION_NAME.length > 0;

const shouldUseProxy = (): boolean => {
    if (!isLambda()) return false;
    const env = process.env.DEV_ENVIRONMENT;
    return env === 'dev' || env === 'production';
};

type UndiciModule = typeof import('undici');

let undiciModulePromise: Promise<UndiciModule> | null = null;

const loadUndici = (): Promise<UndiciModule> => {
    if (undiciModulePromise == null) {
        undiciModulePromise = import('undici');
    }
    return undiciModulePromise;
};

const getProxyDispatcher = async (): Promise<InstanceType<UndiciModule['ProxyAgent']>> => {
    const undici = await loadUndici();
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const proxyUrl = process.env.PROXY_URL ?? process.env.HTTP_PROXY ?? process.env.HTTPS_PROXY;
    if (!proxyUrl) throw new Error(`PROXY_URL not defined in ${process.env.DEV_ENVIRONMENT} environment`);
    return new undici.ProxyAgent(proxyUrl);
};

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
        `httpRequest non-OK: status=${response.status} statusText=${response.statusText} ` +
        `requestUrl=${requestUrl} finalUrl=${finalUrl} server=${server} responseBody=${bodyPreview}`
    );
};

/** Request timeout in ms when using proxy (avoids Lambda hanging until 900s timeout). */
const HTTP_REQUEST_TIMEOUT_MS_PROXY = 30_000;
/** Request timeout in ms when not using proxy (avoids hang on slow or stuck connections). */
const HTTP_REQUEST_TIMEOUT_MS_NO_PROXY = 60_000;

/**
 * Send an HTTP request with default headers and optional proxy (Lambda + dev/prod only by default).
 * Throws an Error with detailed message on non-OK response or failed request.
 * Retries on fetch errors or 5XX (except 502) / 403 responses up to retryCount times (default 5).
 * Every attempt has a request timeout (30s with proxy, 60s without).
 * If abortSignal is provided and aborts, the request is cancelled and retries are not attempted.
 * Pass init.method e.g. 'HEAD' for HEAD requests.
 * When useProxy is provided it overrides the default (isLambda + dev/prod) and forces proxy on (true) or off (false).
 */
export async function httpRequest(
    url: string | URL,
    retryCount = 5,
    abortSignal?: AbortSignal,
    init?: RequestInit,
    useProxy?: boolean,
): Promise<Response> {
    const requestUrl = typeof url === 'string' ? url : url.toString();
    const useProxyResolved = useProxy === undefined ? shouldUseProxy() : useProxy;
    const timeoutMs = useProxyResolved ? HTTP_REQUEST_TIMEOUT_MS_PROXY : HTTP_REQUEST_TIMEOUT_MS_NO_PROXY;

    let lastError: Error | null = null;
    const maxAttempts = retryCount + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (abortSignal?.aborted) {
            const err = abortSignal.reason instanceof Error ? abortSignal.reason : new Error(String(abortSignal.reason));
            throw new Error(`httpRequest aborted: requestUrl=${requestUrl} error=${err.message}`);
        }

        const timeoutSignal = AbortSignal.timeout(timeoutMs);
        const requestSignal =
            abortSignal != null
                ? AbortSignal.any([abortSignal, timeoutSignal])
                : timeoutSignal;

        let dispatcher: InstanceType<UndiciModule['ProxyAgent']> | undefined;
        let fetchImpl: typeof fetch;
        if (useProxyResolved) {
            const undici = await loadUndici();
            fetchImpl = undici.fetch as unknown as typeof fetch;
            dispatcher = await getProxyDispatcher();
        } else {
            fetchImpl = globalThis.fetch.bind(globalThis);
        }

        const requestOptions = {
            headers: DEFAULT_HEADERS,
            ...(dispatcher ? { dispatcher } : {}),
            signal: requestSignal,
            ...init,
        };

        let response: Response;
        try {
            response = (await fetchImpl(
                requestUrl,
                requestOptions as RequestInit,
            )) as Response;
        } catch (error) {
            lastError = new Error(`httpRequest failed: requestUrl=${requestUrl} error=${error}`);
            if (abortSignal?.aborted) {
                throw lastError;
            }
            if (attempt < maxAttempts - 1) {
                console.warn(
                    `httpRequest retry ${attempt + 1}/${retryCount}: fetch failed - ${error}`,
                );
                continue;
            }
            throw lastError;
        }

        if (!response.ok) {
            const message = await buildNonOkMessage(response, requestUrl);
            lastError = new Error(message);
            const isRetryableStatus = (response.status >= 500 && response.status !== 502) || response.status === 403;
            if (abortSignal?.aborted) {
                throw lastError;
            }
            if (isRetryableStatus && attempt < maxAttempts - 1) {
                console.warn(
                    `httpRequest retry ${attempt + 1}/${retryCount}: status ${response.status} ${response.statusText}`,
                );
                continue;
            }
            throw lastError;
        }

        return response;
    }

    throw lastError ?? new Error(`httpRequest failed: requestUrl=${requestUrl}`);
}

export default httpRequest;
