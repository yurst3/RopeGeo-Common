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

function hasEffectiveQueryParams(
  queryParams?: Record<string, string | number | boolean | undefined>
): boolean {
  if (queryParams == null) return false;
  return Object.entries(queryParams).some(
    ([, v]) => v !== undefined && v !== ""
  );
}

function dataLoaderReconnectSemanticKey(
  service: Service,
  method: Method,
  onlinePath: string,
  pathParamsKey: string,
  bodyKey: unknown,
  queryParams: Record<string, string | number | boolean | undefined> | undefined,
  queryParamsKey: string
): string {
  const bodyStr =
    bodyKey === undefined || bodyKey === null
      ? ""
      : typeof bodyKey === "object"
        ? JSON.stringify(bodyKey)
        : String(bodyKey);
  const q = hasEffectiveQueryParams(queryParams) ? queryParamsKey : "";
  return `${service}|${method}|${onlinePath}|${pathParamsKey}|${bodyStr}|${q}`;
}

function offlineDataKeyPart<T>(offlineData: T | null | undefined): string {
  if (offlineData === undefined) return "";
  if (offlineData === null) return "|offline:null";
  return `|obj:${JSON.stringify(offlineData)}`;
}

export type RopeGeoDataLoaderProps<T = unknown> = {
  service: Service;
  method: Method;
  /** HTTP path template (e.g. `/ropewiki/page/:id`). Used when loading from the network. */
  onlinePath: string;
  onlinePathParams?: Record<string, string>;
  queryParams?: Record<string, string | number | boolean | undefined>;
  body?: object;
  /**
   * Request deadline in seconds (abort + timeout error). When omitted, {@link timeoutCountdown}
   * stays `null` and no deadline is enforced.
   */
  timeoutAfterSeconds?: number;
  /**
   * When `false`, the online request is not started and children receive {@link NO_NETWORK_MESSAGE}
   * as the error. Previously loaded `data` is kept until the network returns. When `true` or
   * omitted, behavior is unchanged.
   */
  isOnline?: boolean;
  /**
   * Offline / local-first behavior without reading files inside the loader:
   * - **`undefined`**: omit or leave unset — fetch from {@link onlinePath} as usual.
   * - **`null`**: do not fetch; children receive `data: null` and `errors: null` (loading-style).
   * - **`T`**: use as `data` immediately; no network.
   */
  offlineData?: T | null;
  children: (args: {
    data: T | null;
    errors: Error | null;
    /**
     * Whole seconds remaining until abort while an **online** fetch is in flight, only when
     * `timeoutAfterSeconds` is set. Otherwise always `null`.
     */
    timeoutCountdown: number | null;
    /** Re-runs the online request while online. No-op when `isOnline` is `false`. */
    reload: () => void;
  }) => ReactNode;
};

export function RopeGeoDataLoader<T = unknown>({
  service,
  method,
  onlinePath,
  onlinePathParams,
  queryParams,
  body,
  timeoutAfterSeconds,
  isOnline,
  offlineData,
  children,
}: RopeGeoDataLoaderProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [errors, setErrors] = useState<Error | null>(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState<number | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const pendingReloadRef = useRef(false);

  const errorsRef = useRef(errors);
  const hasCommittedRef = useRef(false);
  errorsRef.current = errors;

  const dirtyWhileOfflineRef = useRef(false);
  const semanticSnapshotRef = useRef<string | null>(null);
  const prevIsOnlineRef = useRef<boolean | undefined>(undefined);

  const pathParamsKey = JSON.stringify(onlinePathParams ?? null);
  const queryParamsKey = JSON.stringify(queryParams ?? null);
  const bodyKey =
    body === undefined || body === null
      ? body
      : typeof body === "object"
        ? JSON.stringify(body)
        : body;

  const requestKey = useMemo(
    () =>
      `${service}|${method}|${onlinePath}|${pathParamsKey}|${queryParamsKey}|${String(bodyKey)}|${timeoutAfterSeconds ?? ""}${offlineDataKeyPart(offlineData)}`,
    [
      service,
      method,
      onlinePath,
      pathParamsKey,
      queryParamsKey,
      bodyKey,
      timeoutAfterSeconds,
      offlineData,
    ]
  );

  const reconnectSemanticKey = useMemo(
    () =>
      dataLoaderReconnectSemanticKey(
        service,
        method,
        onlinePath,
        pathParamsKey,
        bodyKey,
        queryParams,
        queryParamsKey
      ),
    [
      service,
      method,
      onlinePath,
      pathParamsKey,
      bodyKey,
      queryParams,
      queryParamsKey,
    ]
  );

  const reload = useCallback(() => {
    if (isOnline === false) return;
    pendingReloadRef.current = true;
    setReloadTick((n) => n + 1);
  }, [isOnline]);

  const lastRequestKeyRef = useRef<string>("");

  /** Sync `data` from {@link offlineData} when it is `null` or `T`; `undefined` defers to the network effect. */
  useEffect(() => {
    if (offlineData === undefined) {
      return;
    }
    if (offlineData === null) {
      setData(null);
      setErrors(null);
      hasCommittedRef.current = false;
      dirtyWhileOfflineRef.current = false;
      semanticSnapshotRef.current = null;
      return;
    }
    setData(offlineData);
    setErrors(null);
    hasCommittedRef.current = true;
    dirtyWhileOfflineRef.current = false;
    semanticSnapshotRef.current = null;
  }, [offlineData]);

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

    /** `offlineData` is `null` or `T`: own `data`; never hit the network here. */
    if (offlineData !== undefined) {
      prevIsOnlineRef.current = online;
      return;
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
        setData(null);
        hasCommittedRef.current = false;
        setErrors(null);
      }
      prevIsOnlineRef.current = false;
      setErrors(new Error(NO_NETWORK_MESSAGE));
      setTimeoutCountdown(null);
      return;
    }

    if (keyChanged) {
      lastRequestKeyRef.current = requestKey;
      hasCommittedRef.current = false;
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
    const timedOutRef = { current: false };
    const requestStartedAt = Date.now();
    const timeoutMs = resolveRequestTimeoutMs(timeoutAfterSeconds);

    setErrors(null);
    setTimeoutCountdown(null);
    const keepStaleForManualReload = isManualReload && hasCommittedRef.current;
    const keepStaleDuringReconnectRefetch =
      reconnecting &&
      hasCommittedRef.current &&
      errorsRef.current?.message === NO_NETWORK_MESSAGE &&
      dirtyWhileOfflineRef.current;
    if (!keyChanged && !keepStaleForManualReload && !keepStaleDuringReconnectRefetch) {
      setData(null);
    }

    const policyDispose =
      timeoutMs == null
        ? () => {}
        : installNetworkRequestPolicyTimers(requestStartedAt, timeoutMs, {
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
          });

    const baseUrl = SERVICE_BASE_URL[service];
    const url = buildUrl(baseUrl, onlinePath, onlinePathParams, queryParams);

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
          hasCommittedRef.current = false;
          return;
        }
        if (text.length === 0) {
          setData(null);
          setErrors(null);
          hasCommittedRef.current = true;
          dirtyWhileOfflineRef.current = false;
          semanticSnapshotRef.current = null;
          return;
        }
        try {
          const raw = JSON.parse(text) as unknown;
          const parsed = Result.fromResponseBody(raw);
          if (!cancelled) {
            setData(parsed.result as T);
            setErrors(null);
            hasCommittedRef.current = true;
            dirtyWhileOfflineRef.current = false;
            semanticSnapshotRef.current = null;
          }
        } catch (parseError) {
          if (!cancelled) {
            console.error("[RopeGeoDataLoader] Invalid JSON response", {
              url,
              status: res.status,
              responseText: text.slice(0, 500),
              parseError:
                parseError instanceof Error
                  ? parseError.message
                  : String(parseError),
            });
            setErrors(
              parseError instanceof Error
                ? parseError
                : new Error("Invalid JSON response")
            );
            setData(null);
            hasCommittedRef.current = false;
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
          hasCommittedRef.current = false;
          return;
        }
        if (isAbortError(err)) return;
        console.error("[RopeGeoDataLoader] Request failed", {
          url,
          error: err instanceof Error ? err.message : String(err),
        });
        setErrors(new Error(formatNetworkRequestErrorMessage(err)));
        setData(null);
        hasCommittedRef.current = false;
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
    queryParamsKey,
    bodyKey,
    timeoutAfterSeconds,
    isOnline,
    requestKey,
    reloadTick,
    offlineData,
    reconnectSemanticKey,
    queryParams,
  ]);

  return (
    <>
      {children({
        data,
        errors,
        timeoutCountdown,
        reload,
      })}
    </>
  );
}
