import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
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

/** Extracts the response payload (body) for paginated APIs behind a `{ data }` wrapper. */
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

/**
 * Concatenates each page's `results` in ascending page order. Call only after every page was built via
 * {@link PaginationResults.fromResponseBody}.
 */
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

export type RopeGeoPaginationHttpRequestProps<T = unknown> = {
  service: Service;
  method?: (typeof Method)[keyof typeof Method];
  path: string;
  pathParams?: Record<string, string>;
  queryParams: PaginationParams;
  /**
   * Max concurrent page requests after page 1 completes (page 1 is always alone so `total` is known).
   * Clamped to at least 1.
   * @default 10
   */
  batchSize?: number;
  /**
   * Deadline in seconds for each request phase: initial page fetch, then each concurrent page batch.
   * When omitted, timeout and countdown are disabled.
   */
  timeoutAfterSeconds?: number;
  /**
   * When `false`, no HTTP requests run and children receive {@link NO_NETWORK_MESSAGE} as the error.
   * Same semantics as `isOnline` on {@link RopeGeoHttpRequest}.
   */
  isOnline?: boolean;
  children: (args: {
    loading: boolean;
    received: number;
    total: number | null;
    /**
     * Concatenated `results` from every page after each body was parsed with
     * {@link PaginationResults.fromResponseBody}. `null` if any page fails HTTP, JSON parse, or validation.
     */
    data: T[] | null;
    /** Set when `data` is `null` after a terminal failure; cleared only when all pages succeed. */
    errors: Error | null;
    /** Timeout countdown for the active phase (initial page or current batch); `null` between phases. */
    timeoutCountdown: number | null;
  }) => ReactNode;
};

/**
 * Fetches page 1, then remaining pages in parallel batches of {@link batchSize}.
 * The initial `page` on `queryParams` is ignored. Each body is parsed with
 * {@link PaginationResults.fromResponseBody}. Final `data` is pages concatenated in page order.
 * In-flight requests use one {@link AbortController}: unmount or any failure aborts the rest.
 */
export function RopeGeoPaginationHttpRequest<T = unknown>({
  service,
  method = Method.GET,
  path,
  pathParams,
  queryParams,
  batchSize = 10,
  timeoutAfterSeconds,
  isOnline,
  children,
}: RopeGeoPaginationHttpRequestProps<T>) {
  const [loading, setLoading] = useState(true);
  const [received, setReceived] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [data, setData] = useState<T[] | null>(null);
  const [errors, setErrors] = useState<Error | null>(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState<number | null>(null);

  const pathParamsKey = JSON.stringify(pathParams ?? null);
  const queryParamsKey = queryParams.toQueryString();
  const effectiveBatch = Math.max(1, Math.floor(batchSize));

  useEffect(() => {
    if (isOnline === false) {
      setLoading(false);
      setReceived(0);
      setTotal(null);
      setData(null);
      setErrors(new Error(NO_NETWORK_MESSAGE));
      setTimeoutCountdown(null);
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();
    const { signal } = abortController;
    const timeoutMs = resolveRequestTimeoutMs(timeoutAfterSeconds);

    setLoading(true);
    setReceived(0);
    setTotal(null);
    setData(null);
    setErrors(null);
    setTimeoutCountdown(null);

    const baseUrl = SERVICE_BASE_URL[service];
    const resolvedPath = resolvePath(path, pathParams);
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
        activePolicyDispose = installNetworkRequestPolicyTimers(Date.now(), timeoutMs, {
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
        });
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
            throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
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
            console.error("[RopeGeoPaginationHttpRequest] Invalid JSON response", {
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
            throw new Error(NETWORK_REQUEST_TIMED_OUT_MESSAGE);
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
      } catch (err) {
        if (cancelled || isAbortError(err)) return;
        console.error("[RopeGeoPaginationHttpRequest] Request failed", {
          error: err instanceof Error ? err.message : String(err),
        });
        setErrors(err instanceof Error ? err : new Error(String(err)));
        setData(null);
      } finally {
        clearActivePolicy();
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [
    service,
    method,
    path,
    pathParamsKey,
    queryParamsKey,
    queryParams,
    effectiveBatch,
    timeoutAfterSeconds,
    isOnline,
  ]);

  return (
    <>
      {children({
        loading,
        received,
        total,
        data,
        errors,
        timeoutCountdown,
      })}
    </>
  );
}
