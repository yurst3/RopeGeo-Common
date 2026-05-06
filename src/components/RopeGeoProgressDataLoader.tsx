import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatHttpStatusMessage,
  formatNetworkRequestErrorMessage,
  installNetworkRequestPolicyTimers,
  isAbortError,
  mergeParentSignalWithDeadline,
  NETWORK_REQUEST_TIMED_OUT_MESSAGE,
  NO_NETWORK_MESSAGE,
  resolveRequestTimeoutMs,
} from "../helpers/network";
import {
  type PaginationParams,
  PaginationResults,
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

function sumReceived(pagesByNum: Map<number, PaginationResults>): number {
  let sum = 0;
  for (const p of pagesByNum.values()) {
    sum += p.results.length;
  }
  return sum;
}

function concatPaginationResultItemsSorted<T>(
  pagesByNum: Map<number, PaginationResults>
): T[] {
  const keys = [...pagesByNum.keys()].sort((a, b) => a - b);
  const out: T[] = [];
  for (const k of keys) {
    const p = pagesByNum.get(k);
    if (p != null) out.push(...(p.results as T[]));
  }
  return out;
}

export type RopeGeoProgressDataLoaderProps<T = unknown> = {
  service: Service;
  method?: (typeof Method)[keyof typeof Method];
  onlinePath: string;
  onlinePathParams?: Record<string, string>;
  queryParams: PaginationParams;
  batchSize?: number;
  timeoutAfterSeconds?: number;
  isOnline?: boolean;
  children: (args: {
    received: number;
    total: number | null;
    data: T[] | null;
    errors: Error | null;
    timeoutCountdown: number | null;
    reload: () => void;
  }) => ReactNode;
};

export function RopeGeoProgressDataLoader<T = unknown>({
  service,
  method = Method.GET,
  onlinePath,
  onlinePathParams,
  queryParams,
  batchSize = 10,
  timeoutAfterSeconds,
  isOnline,
  children,
}: RopeGeoProgressDataLoaderProps<T>) {
  const [received, setReceived] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [data, setData] = useState<T[] | null>(null);
  const [errors, setErrors] = useState<Error | null>(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState<number | null>(null);
  const [hasCommittedOnce, setHasCommittedOnce] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const pendingReloadRef = useRef(false);

  const errorsRef = useRef(errors);
  const hasCommittedRef = useRef(hasCommittedOnce);
  errorsRef.current = errors;
  hasCommittedRef.current = hasCommittedOnce;

  const dirtyWhileOfflineRef = useRef(false);
  const semanticSnapshotRef = useRef<string | null>(null);
  const prevIsOnlineRef = useRef<boolean | undefined>(undefined);

  const pathParamsKey = JSON.stringify(onlinePathParams ?? null);
  const queryParamsKey = queryParams.toQueryString();
  const effectiveBatch = Math.max(1, Math.floor(batchSize));

  const requestKey = useMemo(
    () =>
      `${service}|${method}|${onlinePath}|${pathParamsKey}|${queryParamsKey}|${effectiveBatch}|${timeoutAfterSeconds ?? ""}`,
    [
      service,
      method,
      onlinePath,
      pathParamsKey,
      queryParamsKey,
      effectiveBatch,
      timeoutAfterSeconds,
    ]
  );

  const reconnectSemanticKey = useMemo(
    () =>
      `${service}|${method}|${onlinePath}|${pathParamsKey}|${queryParams.reconnectIdentityQueryString()}|${effectiveBatch}|${timeoutAfterSeconds ?? ""}`,
    [
      service,
      method,
      onlinePath,
      pathParamsKey,
      queryParams,
      effectiveBatch,
      timeoutAfterSeconds,
    ]
  );

  const lastRequestKeyRef = useRef<string>("");

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
    }

    if (!online) {
      pendingReloadRef.current = false;
      if (keyChanged) {
        lastRequestKeyRef.current = requestKey;
        setHasCommittedOnce(false);
        setReceived(0);
        setTotal(null);
        setData(null);
        setErrors(null);
      }
      prevIsOnlineRef.current = false;
      setErrors(new Error(NO_NETWORK_MESSAGE));
      setTimeoutCountdown(null);
      return;
    }

    if (keyChanged) {
      lastRequestKeyRef.current = requestKey;
      setHasCommittedOnce(false);
      setReceived(0);
      setTotal(null);
      setData(null);
      setErrors(null);
    } else if (isManualReload) {
      setHasCommittedOnce(false);
      setReceived(0);
      setTotal(null);
      setData(null);
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
    const { signal } = abortController;
    const timeoutMs = resolveRequestTimeoutMs(timeoutAfterSeconds);

    setErrors(null);
    setTimeoutCountdown(null);
    /** Same idea as former `refreshOnReconnect`: keep merged pages visible while refetching after offline semantic drift. */
    const keepStaleDuringReconnectRefetch =
      reconnecting &&
      hasCommittedRef.current &&
      errorsRef.current?.message === NO_NETWORK_MESSAGE &&
      dirtyWhileOfflineRef.current;
    if (!keyChanged && !keepStaleDuringReconnectRefetch && !isManualReload) {
      setReceived(0);
      setTotal(null);
      setData(null);
      setHasCommittedOnce(false);
    }

    const baseUrl = SERVICE_BASE_URL[service];
    const resolvedPath = resolvePath(onlinePath, onlinePathParams);
    const baseInit: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    (async () => {
      const pagesByNum = new Map<number, PaginationResults>();
      const limit = queryParams.limit;
      let activePolicyDispose: (() => void) | null = null;

      const clearActivePolicy = () => {
        activePolicyDispose?.();
        activePolicyDispose = null;
      };

      const runWithPhaseCountdown = async <R,>(
        runner: () => Promise<R>
      ): Promise<R> => {
        if (timeoutMs == null) {
          if (!cancelled) setTimeoutCountdown(null);
          return runner();
        }
        let phaseTimedOut = false;
        clearActivePolicy();
        activePolicyDispose = installNetworkRequestPolicyTimers(
          Date.now(),
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
              phaseTimedOut = true;
              abortController.abort();
            },
          }
        );
        try {
          return await runner();
        } catch (err) {
          if (phaseTimedOut) {
            throw new Error(NETWORK_REQUEST_TIMED_OUT_MESSAGE);
          }
          throw err;
        } finally {
          clearActivePolicy();
        }
      };

      const fetchPage = async (pageNum: number): Promise<PaginationResults> => {
        const params = queryParams.withPage(pageNum);
        const queryString = params.toQueryString();
        const fullPath = queryString
          ? `${resolvedPath}?${queryString}`
          : resolvedPath;
        const url = new URL(fullPath, baseUrl).toString();

        let merged: ReturnType<typeof mergeParentSignalWithDeadline> | null = null;
        let signalForFetch: AbortSignal;
        if (pageNum === 1) {
          signalForFetch = signal;
        } else if (timeoutMs == null) {
          signalForFetch = signal;
        } else {
          merged = mergeParentSignalWithDeadline(signal, timeoutMs);
          signalForFetch = merged.signal;
        }

        try {
          const res = await fetch(url, { ...baseInit, signal: signalForFetch });
          const text = await res.text();

          if (!res.ok) {
            abortController.abort();
            throw new Error(formatHttpStatusMessage(res.status, text || res.statusText));
          }

          if (text.length === 0) {
            abortController.abort();
            throw new Error("Empty response body");
          }

          let raw: unknown;
          try {
            raw = JSON.parse(text) as unknown;
          } catch (parseError) {
            abortController.abort();
            console.error("[RopeGeoProgressDataLoader] Invalid JSON response", {
              url,
              status: res.status,
              responseText: text.slice(0, 500),
              parseError:
                parseError instanceof Error
                  ? parseError.message
                  : String(parseError),
            });
            throw new Error("Invalid JSON response");
          }

          try {
            return PaginationResults.fromResponseBody(getResponseBody(raw));
          } catch (e) {
            abortController.abort();
            const msg = e instanceof Error ? e.message : String(e);
            throw new Error(msg);
          }
        } catch (err) {
          if (pageNum !== 1 && merged != null && merged.consumeDidTimeout()) {
            abortController.abort();
            throw new Error(
              formatNetworkRequestErrorMessage(
                new Error(NETWORK_REQUEST_TIMED_OUT_MESSAGE)
              )
            );
          }
          throw err;
        } finally {
          merged?.dispose();
        }
      };

      try {
        const first = await runWithPhaseCountdown(() => fetchPage(1));
        if (cancelled) return;

        pagesByNum.set(1, first);
        const totalCount = first.total;
        let receivedCount = first.results.length;
        setReceived(receivedCount);
        setTotal(totalCount);

        const doneByTotal =
          totalCount !== null && receivedCount >= totalCount;
        const doneByShortPage = first.results.length < limit;

        if (doneByTotal || doneByShortPage) {
          if (cancelled) return;
          setData(concatPaginationResultItemsSorted<T>(pagesByNum));
          setErrors(null);
          setHasCommittedOnce(true);
          dirtyWhileOfflineRef.current = false;
          semanticSnapshotRef.current = null;
          return;
        }

        const lastPage = Math.max(1, Math.ceil(totalCount / limit));
        const toFetch: number[] = [];
        for (let p = 2; p <= lastPage; p++) {
          toFetch.push(p);
        }

        for (let i = 0; i < toFetch.length; i += effectiveBatch) {
          if (cancelled) return;
          if (sumReceived(pagesByNum) >= totalCount) break;

          const chunk = toFetch.slice(i, i + effectiveBatch);
          await runWithPhaseCountdown(() =>
            Promise.all(
              chunk.map(async (pageNum) => {
                const parsed = await fetchPage(pageNum);
                if (cancelled) return;
                pagesByNum.set(pageNum, parsed);
                setReceived(sumReceived(pagesByNum));
                setTotal(totalCount);
              })
            )
          );

          if (cancelled) return;

          if (sumReceived(pagesByNum) >= totalCount) break;
        }

        if (cancelled) return;
        setData(concatPaginationResultItemsSorted<T>(pagesByNum));
        setErrors(null);
        setHasCommittedOnce(true);
        dirtyWhileOfflineRef.current = false;
        semanticSnapshotRef.current = null;
      } catch (err) {
        if (cancelled || isAbortError(err)) return;
        console.error("[RopeGeoProgressDataLoader] Request failed", {
          error: err instanceof Error ? err.message : String(err),
        });
        setErrors(new Error(formatNetworkRequestErrorMessage(err)));
        setData(null);
        setHasCommittedOnce(false);
      } finally {
        clearActivePolicy();
      }
    })();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [
    service,
    method,
    onlinePath,
    pathParamsKey,
    queryParamsKey,
    queryParams,
    effectiveBatch,
    timeoutAfterSeconds,
    isOnline,
    requestKey,
    reloadTick,
    reconnectSemanticKey,
  ]);

  return (
    <>
      {children({
        received,
        total,
        data,
        errors,
        timeoutCountdown,
        reload,
      })}
    </>
  );
}
