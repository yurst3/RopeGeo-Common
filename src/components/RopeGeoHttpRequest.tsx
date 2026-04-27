import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatHttpStatusMessage,
  formatNetworkRequestErrorMessage,
  installNetworkRequestPolicyTimers,
  isAbortError,
  NETWORK_REQUEST_TIMED_OUT_MESSAGE,
  NO_NETWORK_MESSAGE,
  resolveRequestTimeoutMs,
} from "../helpers/network";
import { Result } from "../models";

export const Service = {
  WEBSCRAPER: "WEBSCRAPER",
} as const;
export type Service = (typeof Service)[keyof typeof Service];

export const Method = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
} as const;
export type Method = (typeof Method)[keyof typeof Method];

export const SERVICE_BASE_URL: Record<Service, string> = {
  [Service.WEBSCRAPER]: "https://api.webscraper.ropegeo.com",
};

const PATH_PARAM_PATTERN = /:([a-zA-Z0-9_]+)/g;

function buildUrl(
  baseUrl: string,
  path: string,
  pathParams?: Record<string, string>,
  queryParams?: Record<string, string | number | boolean | undefined>
): string {
  let resolvedPath = path;
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      resolvedPath = resolvedPath.replace(`:${key}`, String(value));
    }
  }
  const unresolved = [...resolvedPath.matchAll(PATH_PARAM_PATTERN)].map(
    (m) => m[1]
  );
  if (unresolved.length > 0) {
    throw new Error(
      `Unresolved path params in "${path}": ${unresolved.join(", ")}`
    );
  }
  const url = new URL(resolvedPath, baseUrl);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export type RopeGeoHttpRequestProps<T = unknown> = {
  service: Service;
  method: Method;
  path: string;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string | number | boolean | undefined>;
  body?: object;
  /**
   * Request deadline in seconds (abort + timeout error). When omitted, no timeout is enforced.
   */
  timeoutAfterSeconds?: number;
  /**
   * When `false`, the request is not started and children receive {@link NO_NETWORK_MESSAGE} as the
   * error. Previously loaded `data` is kept until the network returns. When `true` or omitted,
   * behavior is unchanged. Pass from app-level connectivity (e.g. `expo-network`) so fetches are
   * not fired while offline.
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
   * Response body is parsed via Result.fromResponseBody (must include resultType and result).
   * Children receive the validated result.result as data (typed by T).
   */
  children: (args: {
    loading: boolean;
    /**
     * `true` while a request is in flight after at least one successful response for the current
     * request identity (stale-while-revalidate).
     */
    refreshing: boolean;
    data: T | null;
    errors: Error | null;
    /**
     * Whole seconds remaining until abort, emitted from request start through ~1s before timeout.
     * `null` when idle or after completion/cleanup. UI may choose when to show a toast (e.g. only
     * after `NETWORK_REQUEST_SLOW_THRESHOLD_MS` from `ropegeo-common/helpers`).
     */
    timeoutCountdown: number | null;
  }) => ReactNode;
};

export function RopeGeoHttpRequest<T = unknown>({
  service,
  method,
  path,
  pathParams,
  queryParams,
  body,
  timeoutAfterSeconds,
  isOnline,
  refreshOnReconnect = false,
  children,
}: RopeGeoHttpRequestProps<T>) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const [errors, setErrors] = useState<Error | null>(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState<number | null>(null);
  const [hasCommittedOnce, setHasCommittedOnce] = useState(false);

  const errorsRef = useRef(errors);
  const hasCommittedRef = useRef(hasCommittedOnce);
  errorsRef.current = errors;
  hasCommittedRef.current = hasCommittedOnce;

  const pathParamsKey = JSON.stringify(pathParams ?? null);
  const queryParamsKey = JSON.stringify(queryParams ?? null);
  const bodyKey =
    body === undefined || body === null
      ? body
      : typeof body === "object"
        ? JSON.stringify(body)
        : body;

  const requestKey = useMemo(
    () =>
      `${service}|${method}|${path}|${pathParamsKey}|${queryParamsKey}|${String(bodyKey)}|${timeoutAfterSeconds ?? ""}`,
    [service, method, path, pathParamsKey, queryParamsKey, bodyKey, timeoutAfterSeconds],
  );

  const prevIsOnlineRef = useRef<boolean | undefined>(undefined);
  const lastRequestKeyRef = useRef<string>("");

  useEffect(() => {
    const online = isOnline !== false;
    const prevOnline = prevIsOnlineRef.current;
    const reconnecting = prevOnline === false && online;
    const keyChanged = lastRequestKeyRef.current !== requestKey;

    if (!online) {
      if (keyChanged) {
        lastRequestKeyRef.current = requestKey;
        setData(null);
        setHasCommittedOnce(false);
        setErrors(null);
      }
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
      setErrors(null);
    }

    if (!keyChanged && reconnecting) {
      const onlyNoNetwork = errorsRef.current?.message === NO_NETWORK_MESSAGE;
      if (hasCommittedRef.current && onlyNoNetwork && !refreshOnReconnect) {
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
    if (!keyChanged && !keepStaleDuringFetch) {
      setData(null);
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

    const baseUrl = SERVICE_BASE_URL[service];
    const url = buildUrl(baseUrl, path, pathParams, queryParams);

    const init: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      signal: abortController.signal,
    };
    if (body != null && (method === Method.POST || method === Method.PUT)) {
      init.body = JSON.stringify(body);
    }

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
          setData(null);
          setErrors(null);
          setHasCommittedOnce(true);
          return;
        }
        try {
          const raw = JSON.parse(text) as unknown;
          const parsed = Result.fromResponseBody(raw);
          if (!cancelled) {
            setData(parsed.result as T);
            setErrors(null);
            setHasCommittedOnce(true);
          }
        } catch (parseError) {
          if (!cancelled) {
            console.error("[RopeGeoHttpRequest] Invalid JSON response", {
              url,
              status: res.status,
              responseText: text.slice(0, 500),
              parseError: parseError instanceof Error ? parseError.message : String(parseError),
            });
            setErrors(
              parseError instanceof Error ? parseError : new Error("Invalid JSON response")
            );
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
        console.error("[RopeGeoHttpRequest] Request failed", {
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
    queryParamsKey,
    bodyKey,
    timeoutAfterSeconds,
    isOnline,
    refreshOnReconnect,
    requestKey,
  ]);

  const refreshing = loading && hasCommittedOnce;

  return (
    <>
      {children({
        loading,
        refreshing,
        data,
        errors,
        timeoutCountdown,
      })}
    </>
  );
}
