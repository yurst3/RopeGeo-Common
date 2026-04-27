import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatHttpStatusMessage,
  formatNetworkRequestErrorMessage,
  installNetworkRequestPolicyTimers,
  isAbortError,
  NETWORK_REQUEST_TIMED_OUT_MESSAGE,
  NO_NETWORK_MESSAGE,
  resolveRequestTimeoutMs,
} from "../helpers/network";
import {
  type CursorPaginationParams,
  CursorPaginationResults,
} from "../models";
import { Method, Service, SERVICE_BASE_URL } from "./RopeGeoHttpRequest";

const PATH_PARAM_PATTERN = /:([a-zA-Z0-9_]+)/g;

function resolvePath(
  path: string,
  pathParams?: Record<string, string>
): string {
  let resolved = path;
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      resolved = resolved.replace(`:${key}`, String(value));
    }
  }
  const unresolved = [...resolved.matchAll(PATH_PARAM_PATTERN)].map(
    (m) => m[1]
  );
  if (unresolved.length > 0) {
    throw new Error(
      `Unresolved path params in "${path}": ${unresolved.join(", ")}`
    );
  }
  return resolved;
}

/** Extracts the response payload (body) for cursor-paginated APIs. */
function getResponseBody(raw: unknown): unknown {
  if (
    raw != null &&
    typeof raw === "object" &&
    "data" in raw &&
    (raw as { data: unknown }).data != null
  ) {
    return (raw as { data: unknown }).data;
  }
  return raw;
}

export type RopeGeoCursorPaginationHttpRequestProps<T = unknown> = {
  service: Service;
  method?: (typeof Method)[keyof typeof Method];
  path: string;
  pathParams?: Record<string, string>;
  queryParams: CursorPaginationParams;
  /**
   * Request deadline in seconds for each fetch (initial and `loadMore`). When omitted, timeout
   * and countdown are disabled.
   */
  timeoutAfterSeconds?: number;
  /**
   * When `false`, no HTTP requests run and children receive {@link NO_NETWORK_MESSAGE} as the error.
   * Previously loaded `data` and cursor `params` are kept until the network returns.
   */
  isOnline?: boolean;
  /**
   * When `isOnline` goes from `false` to online and there is already successful data for the same
   * request (only the soft {@link NO_NETWORK_MESSAGE} error), a new fetch runs only if this is
   * `true`. Otherwise stale data stays visible and `errors` is cleared. When there is no
   * successful data yet, or the last error was not the offline placeholder, a fetch always runs.
   * @default false
   */
  refreshOnReconnect?: boolean;
  /**
   * Response body is parsed via CursorPaginationResults.fromResponseBody (must include resultType).
   * Parsed shape is ValidatedCursorPaginationResponse; children receive result.results as data.
   * `data` is `null` until the first successful response for the current request identity, then an
   * array (possibly empty) for loaded pages.
   */
  children: (args: {
    loading: boolean;
    loadingMore: boolean;
    /**
     * `true` while the initial request is in flight after at least one successful response for the
     * current request identity (stale-while-revalidate). Not used for `loadMore` alone.
     */
    refreshing: boolean;
    data: T[] | null;
    errors: Error | null;
    loadMore: () => void;
    hasMore: boolean;
    timeoutCountdown: number | null;
    /**
     * Re-runs from the first page while online: aborts any `loadMore`, resets the cursor to the
     * initial `queryParams`, sets `loading` to `true`, clears `errors`, and clears `data` until the
     * new first page resolves. No-op when `isOnline` is `false`.
     */
    reload: () => void;
  }) => ReactNode;
};

export function RopeGeoCursorPaginationHttpRequest<T = unknown>({
  service,
  method = Method.GET,
  path,
  pathParams,
  queryParams,
  timeoutAfterSeconds,
  isOnline,
  refreshOnReconnect = false,
  children,
}: RopeGeoCursorPaginationHttpRequestProps<T>) {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [data, setData] = useState<T[] | null>(null);
  const [params, setParams] = useState<CursorPaginationParams>(queryParams);
  const [errors, setErrors] = useState<Error | null>(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState<number | null>(null);
  const [hasCommittedOnce, setHasCommittedOnce] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const pendingReloadRef = useRef(false);

  const errorsRef = useRef(errors);
  const hasCommittedRef = useRef(hasCommittedOnce);
  errorsRef.current = errors;
  hasCommittedRef.current = hasCommittedOnce;

  const loadingMoreRef = useRef(false);
  const loadMoreAbortRef = useRef<AbortController | null>(null);

  const hasMore = params.cursor != null;

  const pathParamsKey = JSON.stringify(pathParams ?? null);
  const queryKey = queryParams.toQueryString();
  const requestKey = useMemo(
    () =>
      `${service}|${method}|${path}|${pathParamsKey}|${queryKey}|${timeoutAfterSeconds ?? ""}`,
    [service, method, path, pathParamsKey, queryKey, timeoutAfterSeconds],
  );

  const prevIsOnlineRef = useRef<boolean | undefined>(undefined);
  const lastRequestKeyRef = useRef<string>("");

  const buildUrl = useCallback(
    (p: CursorPaginationParams) => {
      const baseUrl = SERVICE_BASE_URL[service];
      const resolvedPath = resolvePath(path, pathParams);
      const queryString = p.toQueryString();
      const fullPath = queryString ? `${resolvedPath}?${queryString}` : resolvedPath;
      return new URL(fullPath, baseUrl).toString();
    },
    [service, path, pathParams]
  );

  const reload = useCallback(() => {
    if (isOnline === false) return;
    pendingReloadRef.current = true;
    setReloadTick((n) => n + 1);
  }, [isOnline]);

  useEffect(() => {
    const online = isOnline !== false;
    const prevOnline = prevIsOnlineRef.current;
    const reconnecting = prevOnline === false && online;
    const keyChanged = lastRequestKeyRef.current !== requestKey;
    const isManualReload = pendingReloadRef.current;
    if (isManualReload) {
      pendingReloadRef.current = false;
      loadMoreAbortRef.current?.abort();
      loadMoreAbortRef.current = null;
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }

    if (!online) {
      pendingReloadRef.current = false;
      if (keyChanged) {
        lastRequestKeyRef.current = requestKey;
        setData(null);
        setHasCommittedOnce(false);
        setParams(queryParams);
        setErrors(null);
      }
      loadMoreAbortRef.current?.abort();
      loadMoreAbortRef.current = null;
      loadingMoreRef.current = false;
      setLoadingMore(false);
      prevIsOnlineRef.current = false;
      setLoading(false);
      setErrors(new Error(NO_NETWORK_MESSAGE));
      setTimeoutCountdown(null);
      return;
    }

    if (keyChanged) {
      lastRequestKeyRef.current = requestKey;
      setHasCommittedOnce(false);
      setData(null);
      setParams(queryParams);
      setErrors(null);
    } else if (isManualReload) {
      setHasCommittedOnce(false);
      setData(null);
      setParams(queryParams);
      setErrors(null);
    }

    if (!keyChanged && reconnecting) {
      const onlyNoNetwork = errorsRef.current?.message === NO_NETWORK_MESSAGE;
      if (
        !isManualReload &&
        hasCommittedRef.current &&
        onlyNoNetwork &&
        !refreshOnReconnect
      ) {
        setErrors(null);
        setLoading(false);
        prevIsOnlineRef.current = true;
        return;
      }
    }

    prevIsOnlineRef.current = true;

    let cancelled = false;
    const abortController = new AbortController();
    const timedOutRef = { current: false };
    const requestStartedAt = Date.now();
    const timeoutMs = resolveRequestTimeoutMs(timeoutAfterSeconds);

    setLoading(true);
    setErrors(null);
    setTimeoutCountdown(null);
    const keepStaleDuringFetch =
      reconnecting &&
      hasCommittedRef.current &&
      errorsRef.current?.message === NO_NETWORK_MESSAGE &&
      refreshOnReconnect;
    if (!keyChanged && !keepStaleDuringFetch && !isManualReload) {
      setData(null);
      setParams(queryParams);
    }

    const policyDispose =
      timeoutMs == null
        ? () => {}
        : installNetworkRequestPolicyTimers(
            requestStartedAt,
            timeoutMs,
            {
              isActive: () => !cancelled,
              onTimeoutCountdown: (seconds) => {
                if (!cancelled) setTimeoutCountdown(seconds);
              },
              onClearTimeoutCountdown: () => {
                if (!cancelled) setTimeoutCountdown(null);
              },
              onHardTimeout: () => {
                timedOutRef.current = true;
                abortController.abort();
              },
            }
          );

    const url = buildUrl(queryParams);
    const init: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
      signal: abortController.signal,
    };

    fetch(url, init)
      .then(async (res) => {
        if (cancelled) return;
        const text = await res.text();
        if (!res.ok) {
          setErrors(
            new Error(formatHttpStatusMessage(res.status, text || res.statusText))
          );
          setData(null);
          setHasCommittedOnce(false);
          return;
        }
        if (text.length === 0) {
          setData([]);
          setParams(queryParams.withCursor(null));
          setErrors(null);
          setHasCommittedOnce(true);
          return;
        }
        try {
          const raw = JSON.parse(text) as unknown;
          const body = getResponseBody(raw);
          if (cancelled) return;
          const result = CursorPaginationResults.fromResponseBody(body);
          const { results, nextCursor } = result as {
            results: T[];
            nextCursor: string | null;
          };
          setData(results);
          setParams(queryParams.withCursor(nextCursor));
          setErrors(null);
          setHasCommittedOnce(true);
        } catch (parseError) {
          if (!cancelled) {
            console.error("[RopeGeoCursorPaginationHttpRequest] Invalid JSON response", {
              url,
              status: res.status,
              responseText: text.slice(0, 500),
              parseError: parseError instanceof Error ? parseError.message : String(parseError),
            });
            setErrors(new Error("Invalid JSON response"));
            setData(null);
            setHasCommittedOnce(false);
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (timedOutRef.current) {
          setErrors(
            new Error(
              formatNetworkRequestErrorMessage(
                new Error(NETWORK_REQUEST_TIMED_OUT_MESSAGE)
              )
            )
          );
          setData(null);
          setHasCommittedOnce(false);
          return;
        }
        if (isAbortError(err)) return;
        console.error("[RopeGeoCursorPaginationHttpRequest] Request failed", {
          url,
          error: err instanceof Error ? err.message : String(err),
        });
        setErrors(new Error(formatNetworkRequestErrorMessage(err)));
        setData(null);
        setHasCommittedOnce(false);
      })
      .finally(() => {
        policyDispose();
        if (!cancelled) {
          setTimeoutCountdown(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      policyDispose();
      abortController.abort();
    };
  }, [
    service,
    method,
    path,
    pathParamsKey,
    queryKey,
    buildUrl,
    timeoutAfterSeconds,
    isOnline,
    refreshOnReconnect,
    requestKey,
    reloadTick,
  ]);

  useEffect(() => {
    return () => {
      loadMoreAbortRef.current?.abort();
    };
  }, []);

  const loadMore = useCallback(() => {
    if (isOnline === false) return;
    if (params.cursor == null) return;
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    const outer = new AbortController();
    loadMoreAbortRef.current = outer;
    const timedOutRef = { current: false };
    const requestStartedAt = Date.now();
    const timeoutMs = resolveRequestTimeoutMs(timeoutAfterSeconds);
    const policyDispose =
      timeoutMs == null
        ? () => {}
        : installNetworkRequestPolicyTimers(
            requestStartedAt,
            timeoutMs,
            {
              isActive: () => loadMoreAbortRef.current === outer,
              onTimeoutCountdown: (seconds) => {
                if (loadMoreAbortRef.current === outer) {
                  setTimeoutCountdown(seconds);
                }
              },
              onClearTimeoutCountdown: () => {
                if (loadMoreAbortRef.current === outer) {
                  setTimeoutCountdown(null);
                }
              },
              onHardTimeout: () => {
                timedOutRef.current = true;
                outer.abort();
              },
            }
          );

    const url = buildUrl(params);
    const init: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
      signal: outer.signal,
    };

    fetch(url, init)
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) return;
        if (text.length === 0) return;
        try {
          const raw = JSON.parse(text) as unknown;
          const body = getResponseBody(raw);
          const result = CursorPaginationResults.fromResponseBody(body);
          const { results, nextCursor } = result as {
            results: T[];
            nextCursor: string | null;
          };
          setData((prev) => [...(prev ?? []), ...results]);
          setParams((p) => p.withCursor(nextCursor));
        } catch (parseError) {
          console.error("[RopeGeoCursorPaginationHttpRequest] loadMore: Invalid JSON response", {
            url,
            status: res.status,
            responseText: text.slice(0, 500),
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
          });
        }
      })
      .catch((err) => {
        if (loadMoreAbortRef.current !== outer) return;
        if (timedOutRef.current) {
          console.error("[RopeGeoCursorPaginationHttpRequest] loadMore: timed out", { url });
          return;
        }
        if (isAbortError(err)) return;
        console.error("[RopeGeoCursorPaginationHttpRequest] loadMore: Request failed", {
          url,
          error: err instanceof Error ? err.message : String(err),
        });
      })
      .finally(() => {
        policyDispose();
        if (loadMoreAbortRef.current === outer) {
          setTimeoutCountdown(null);
          loadMoreAbortRef.current = null;
        }
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [params, method, buildUrl, timeoutAfterSeconds, isOnline]);

  const refreshing = loading && hasCommittedOnce;

  return (
    <>
      {children({
        loading,
        loadingMore,
        refreshing,
        data,
        errors,
        loadMore,
        hasMore,
        timeoutCountdown,
        reload,
      })}
    </>
  );
}
