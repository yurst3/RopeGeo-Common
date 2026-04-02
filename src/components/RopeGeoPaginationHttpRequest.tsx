import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  type PaginationParams,
  PaginationResults,
} from "../classes";
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

/**
 * Concatenates each page's `results` in fetch order. Call only after every page was built via
 * {@link PaginationResults.fromResponseBody}.
 */
function concatPaginationResultItems<T>(pages: PaginationResults[]): T[] {
  const out: T[] = [];
  for (const p of pages) {
    out.push(...(p.results as T[]));
  }
  return out;
}

export type RopeGeoPaginationHttpRequestProps<T = unknown> = {
  service: Service;
  method?: (typeof Method)[keyof typeof Method];
  path: string;
  pathParams?: Record<string, string>;
  queryParams: PaginationParams;
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
  }) => ReactNode;
};

/**
 * Fetches page 1, 2, … until all items for {@link queryParams} are loaded (same `limit` and filters,
 * advancing `page` via {@link PaginationParams.withPage}). The initial `page` on `queryParams` is ignored.
 * Each response body is parsed with {@link PaginationResults.fromResponseBody} before continuing.
 * When every page succeeds, `data` is the concatenation of each page's `results`; otherwise `data` is `null`
 * and `errors` is set.
 */
export function RopeGeoPaginationHttpRequest<T = unknown>({
  service,
  method = Method.GET,
  path,
  pathParams,
  queryParams,
  children,
}: RopeGeoPaginationHttpRequestProps<T>) {
  const [loading, setLoading] = useState(true);
  const [received, setReceived] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [data, setData] = useState<T[] | null>(null);
  const [errors, setErrors] = useState<Error | null>(null);

  const pathParamsKey = JSON.stringify(pathParams ?? null);
  const queryParamsKey = queryParams.toQueryString();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setReceived(0);
    setTotal(null);
    setData(null);
    setErrors(null);

    const baseUrl = SERVICE_BASE_URL[service];
    const resolvedPath = resolvePath(path, pathParams);
    const init: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    (async () => {
      const pages: PaginationResults[] = [];
      let pageNum = 1;
      let receivedCount = 0;
      let totalCount: number | null = null;

      try {
        while (true) {
          const params = queryParams.withPage(pageNum);
          const queryString = params.toQueryString();
          const fullPath = queryString
            ? `${resolvedPath}?${queryString}`
            : resolvedPath;
          const url = new URL(fullPath, baseUrl).toString();

          const res = await fetch(url, init);
          const text = await res.text();
          if (cancelled) return;

          if (!res.ok) {
            setErrors(
              new Error(`HTTP ${res.status}: ${text || res.statusText}`)
            );
            setData(null);
            return;
          }

          if (text.length === 0) {
            setErrors(new Error("Empty response body"));
            setData(null);
            return;
          }

          let raw: unknown;
          try {
            raw = JSON.parse(text) as unknown;
          } catch (parseError) {
            console.error("[RopeGeoPaginationHttpRequest] Invalid JSON response", {
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
            return;
          }

          let parsed: PaginationResults;
          try {
            parsed = PaginationResults.fromResponseBody(getResponseBody(raw));
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setErrors(new Error(msg));
            setData(null);
            return;
          }

          if (cancelled) return;

          pages.push(parsed);
          receivedCount += parsed.results.length;
          if (totalCount === null) {
            totalCount = parsed.total;
          }
          setReceived(receivedCount);
          setTotal(totalCount);

          const doneByTotal =
            totalCount !== null && receivedCount >= totalCount;
          const doneByShortPage = parsed.results.length < queryParams.limit;
          if (doneByTotal || doneByShortPage) {
            break;
          }

          pageNum += 1;
        }

        if (cancelled) return;
        setData(concatPaginationResultItems<T>(pages));
        setErrors(null);
      } catch (err) {
        if (cancelled) return;
        console.error("[RopeGeoPaginationHttpRequest] Request failed", {
          error: err instanceof Error ? err.message : String(err),
        });
        setErrors(err instanceof Error ? err : new Error(String(err)));
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [service, method, path, pathParamsKey, queryParamsKey, queryParams]);

  return (
    <>
      {children({
        loading,
        received,
        total,
        data,
        errors,
      })}
    </>
  );
}
