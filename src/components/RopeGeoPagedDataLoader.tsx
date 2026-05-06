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
import { Method, Service, SERVICE_BASE_URL } from "./RopeGeoDataLoader";

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

export type RopeGeoPagedDataLoaderProps<T = unknown> = {
  service: Service;
  method?: (typeof Method)[keyof typeof Method];
  onlinePath: string;
  onlinePathParams?: Record<string, string>;
  queryParams: CursorPaginationParams;
  timeoutAfterSeconds?: number;
  isOnline?: boolean;
  children: (args: {
    loadingNextPage: boolean;
    data: T[] | null;
    errors: Error | null;
    loadNextPage: () => void;
    morePages: boolean;
    timeoutCountdown: number | null;
    reload: () => void;
  }) => ReactNode;
};

export function RopeGeoPagedDataLoader<T = unknown>({
  service,
  method = Method.GET,
  onlinePath,
  onlinePathParams,
  queryParams,
  timeoutAfterSeconds,
  isOnline,
  children,
}: RopeGeoPagedDataLoaderProps<T>) {
  const [loadingNextPage, setLoadingNextPage] = useState(false);
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

  const loadingNextPageRef = useRef(false);
  const loadNextPageAbortRef = useRef<AbortController | null>(null);

  const morePages = params.cursor != null;

  const pathParamsKey = JSON.stringify(onlinePathParams ?? null);
  const queryKey = queryParams.toQueryString();
  const requestKey = useMemo(
    () =>
      `${service}|${method}|${onlinePath}|${pathParamsKey}|${queryKey}|${timeoutAfterSeconds ?? ""}`,
    [service, method, onlinePath, pathParamsKey, queryKey, timeoutAfterSeconds]
  );

  const reconnectSemanticKey = useMemo(
    () =>
      `${service}|${method}|${onlinePath}|${pathParamsKey}|${queryParams.reconnectIdentityQueryString()}|${timeoutAfterSeconds ?? ""}`,
    [service, method, onlinePath, pathParamsKey, queryParams, timeoutAfterSeconds]
  );

  const dirtyWhileOfflineRef = useRef(false);
  const semanticSnapshotRef = useRef<string | null>(null);
  const prevIsOnlineRef = useRef<boolean | undefined>(undefined);
  const lastRequestKeyRef = useRef<string>("");

  const buildUrl = useCallback(
    (p: CursorPaginationParams) => {
      const baseUrl = SERVICE_BASE_URL[service];
      const resolvedPath = resolvePath(onlinePath, onlinePathParams);
      const queryString = p.toQueryString();
      const fullPath = queryString
        ? `${resolvedPath}?${queryString}`
        : resolvedPath;
      return new URL(fullPath, baseUrl).toString();
    },
    [service, onlinePath, onlinePathParams]
  );

  const reload = useCallback(() => {
    if (isOnline === false) return;
    pendingReloadRef.current = true;
    setReloadTick((n) => n + 1);
  }, [isOnline]);

  useEffect(() => {
    const online = isOnline !== false;
    const prevOnline = prevIsOnlineRef.current;
    const enteringOffline = prevOnline === true && !online;
    const reconnecting = prevOnline === false && online;

    if (enteringOffline) {
      dirtyWhileOfflineRef.current = false;
      semanticSnapshotRef.current = reconnectSemanticKey;
    }

    if (!online && prevOnline !== undefined) {
      if (
        semanticSnapshotRef.current != null &&
        reconnectSemanticKey !== semanticSnapshotRef.current
      ) {
        dirtyWhileOfflineRef.current = true;
      }
    }

    const keyChanged = lastRequestKeyRef.current !== requestKey;
    const isManualReload = pendingReloadRef.current;
    if (isManualReload) {
      pendingReloadRef.current = false;
      loadNextPageAbortRef.current?.abort();
      loadNextPageAbortRef.current = null;
      loadingNextPageRef.current = false;
      setLoadingNextPage(false);
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
      loadNextPageAbortRef.current?.abort();
      loadNextPageAbortRef.current = null;
      loadingNextPageRef.current = false;
      setLoadingNextPage(false);
      prevIsOnlineRef.current = false;
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
      const shouldRefetchAfterReconnect =
        dirtyWhileOfflineRef.current ||
        !hasCommittedRef.current ||
        !onlyNoNetwork;
      if (!isManualReload && !shouldRefetchAfterReconnect) {
        setErrors(null);
        prevIsOnlineRef.current = true;
        dirtyWhileOfflineRef.current = false;
        semanticSnapshotRef.current = null;
        return;
      }
    }

    prevIsOnlineRef.current = true;

    let cancelled = false;
    const abortController = new AbortController();
    const timedOutRef = { current: false };
    const requestStartedAt = Date.now();
    const timeoutMs = resolveRequestTimeoutMs(timeoutAfterSeconds);

    setErrors(null);
    setTimeoutCountdown(null);
    const keepStaleDuringReconnectRefetch =
      reconnecting &&
      hasCommittedRef.current &&
      errorsRef.current?.message === NO_NETWORK_MESSAGE &&
      dirtyWhileOfflineRef.current;
    if (!keyChanged && !keepStaleDuringReconnectRefetch && !isManualReload) {
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
          dirtyWhileOfflineRef.current = false;
          semanticSnapshotRef.current = null;
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
          dirtyWhileOfflineRef.current = false;
          semanticSnapshotRef.current = null;
        } catch (parseError) {
          if (!cancelled) {
            console.error("[RopeGeoPagedDataLoader] Invalid JSON response", {
              url,
              status: res.status,
              responseText: text.slice(0, 500),
              parseError:
                parseError instanceof Error
                  ? parseError.message
                  : String(parseError),
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
        console.error("[RopeGeoPagedDataLoader] Request failed", {
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
    onlinePath,
    pathParamsKey,
    queryKey,
    buildUrl,
    timeoutAfterSeconds,
    isOnline,
    requestKey,
    reloadTick,
    queryParams,
    reconnectSemanticKey,
  ]);

  useEffect(() => {
    return () => {
      loadNextPageAbortRef.current?.abort();
    };
  }, []);

  const loadNextPage = useCallback(() => {
    if (isOnline === false) return;
    if (params.cursor == null) return;
    if (loadingNextPageRef.current) return;
    loadingNextPageRef.current = true;
    setLoadingNextPage(true);

    const outer = new AbortController();
    loadNextPageAbortRef.current = outer;
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
              isActive: () => loadNextPageAbortRef.current === outer,
              onTimeoutCountdown: (seconds) => {
                if (loadNextPageAbortRef.current === outer) {
                  setTimeoutCountdown(seconds);
                }
              },
              onClearTimeoutCountdown: () => {
                if (loadNextPageAbortRef.current === outer) {
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
        if (!res.ok) {
          setErrors(
            new Error(formatHttpStatusMessage(res.status, text || res.statusText))
          );
          setParams((p) => p.withCursor(null));
          return;
        }
        if (text.length === 0) {
          setErrors(null);
          setParams((p) => p.withCursor(null));
          return;
        }
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
          setErrors(null);
        } catch (parseError) {
          console.error("[RopeGeoPagedDataLoader] loadNextPage: Invalid JSON response", {
            url,
            status: res.status,
            responseText: text.slice(0, 500),
            parseError:
              parseError instanceof Error
                ? parseError.message
                : String(parseError),
          });
          setErrors(new Error("Invalid JSON response"));
          setParams((p) => p.withCursor(null));
        }
      })
      .catch((err) => {
        if (loadNextPageAbortRef.current !== outer) return;
        if (timedOutRef.current) {
          console.error("[RopeGeoPagedDataLoader] loadNextPage: timed out", { url });
          setErrors(
            new Error(
              formatNetworkRequestErrorMessage(
                new Error(NETWORK_REQUEST_TIMED_OUT_MESSAGE)
              )
            )
          );
          setParams((p) => p.withCursor(null));
          return;
        }
        if (isAbortError(err)) return;
        console.error("[RopeGeoPagedDataLoader] loadNextPage: Request failed", {
          url,
          error: err instanceof Error ? err.message : String(err),
        });
        setErrors(new Error(formatNetworkRequestErrorMessage(err)));
        setParams((p) => p.withCursor(null));
      })
      .finally(() => {
        policyDispose();
        if (loadNextPageAbortRef.current === outer) {
          setTimeoutCountdown(null);
          loadNextPageAbortRef.current = null;
        }
        loadingNextPageRef.current = false;
        setLoadingNextPage(false);
      });
  }, [params, method, buildUrl, timeoutAfterSeconds, isOnline]);

  return (
    <>
      {children({
        loadingNextPage,
        data,
        errors,
        loadNextPage,
        morePages,
        timeoutCountdown,
        reload,
      })}
    </>
  );
}
