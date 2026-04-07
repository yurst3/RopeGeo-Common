import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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
   * Response body is parsed via CursorPaginationResults.fromResponseBody (must include resultType).
   * Parsed shape is ValidatedCursorPaginationResponse; children receive result.results as data.
   */
  children: (args: {
    loading: boolean;
    loadingMore: boolean;
    data: T[];
    errors: Error | null;
    loadMore: () => void;
    hasMore: boolean;
  }) => ReactNode;
};

export function RopeGeoCursorPaginationHttpRequest<T = unknown>({
  service,
  method = Method.GET,
  path,
  pathParams,
  queryParams,
  children,
}: RopeGeoCursorPaginationHttpRequestProps<T>) {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [data, setData] = useState<T[]>([]);
  const [params, setParams] = useState<CursorPaginationParams>(queryParams);
  const [errors, setErrors] = useState<Error | null>(null);
  const loadingMoreRef = useRef(false);

  const hasMore = params.cursor != null;

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

  useEffect(() => {
    let cancelled = false;
    setData([]);
    setParams(queryParams);
    setLoading(true);
    setErrors(null);

    const url = buildUrl(queryParams);
    const init: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    fetch(url, init)
      .then(async (res) => {
        if (cancelled) return;
        const text = await res.text();
        if (!res.ok) {
          setErrors(new Error(`HTTP ${res.status}: ${text || res.statusText}`));
          setData([]);
          return;
        }
        if (text.length === 0) {
          setData([]);
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
        } catch (parseError) {
          if (!cancelled) {
            console.error("[RopeGeoCursorPaginationHttpRequest] Invalid JSON response", {
              url,
              status: res.status,
              responseText: text.slice(0, 500),
              parseError: parseError instanceof Error ? parseError.message : String(parseError),
            });
            setErrors(new Error("Invalid JSON response"));
            setData([]);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[RopeGeoCursorPaginationHttpRequest] Request failed", {
            url,
            error: err instanceof Error ? err.message : String(err),
          });
          setErrors(err instanceof Error ? err : new Error(String(err)));
          setData([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [service, method, path, pathParams, queryParams, buildUrl]);

  const loadMore = useCallback(() => {
    if (params.cursor == null) return;
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    const url = buildUrl(params);
    const init: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
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
          setData((prev) => [...prev, ...results]);
          setParams((p) => p.withCursor(nextCursor));
        } catch (parseError) {
          console.error("[RopeGeoCursorPaginationHttpRequest] loadMore: Invalid JSON response", {
            url,
            status: res.status,
            responseText: text.slice(0, 500),
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
          });
          // keep existing data and params
        }
      })
      .catch((err) => {
        console.error("[RopeGeoCursorPaginationHttpRequest] loadMore: Request failed", {
          url,
          error: err instanceof Error ? err.message : String(err),
        });
        // keep existing data and params
      })
      .finally(() => {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [params, method, buildUrl]);

  return (
    <>
      {children({
        loading,
        loadingMore,
        data,
        errors,
        loadMore,
        hasMore,
      })}
    </>
  );
}
