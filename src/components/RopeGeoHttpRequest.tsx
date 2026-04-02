import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Result } from "../classes";

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
   * Response body is parsed via Result.fromResponseBody (must include resultType and result).
   * Children receive the validated result.result as data (typed by T).
   */
  children: (args: {
    loading: boolean;
    data: T | null;
    errors: Error | null;
  }) => ReactNode;
};

export function RopeGeoHttpRequest<T = unknown>({
  service,
  method,
  path,
  pathParams,
  queryParams,
  body,
  children,
}: RopeGeoHttpRequestProps<T>) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const [errors, setErrors] = useState<Error | null>(null);

  const pathParamsKey = JSON.stringify(pathParams ?? null);
  const queryParamsKey = JSON.stringify(queryParams ?? null);
  const bodyKey =
    body === undefined || body === null
      ? body
      : typeof body === "object"
        ? JSON.stringify(body)
        : body;

  useEffect(() => {
    let cancelled = false;
    const baseUrl = SERVICE_BASE_URL[service];
    const url = buildUrl(baseUrl, path, pathParams, queryParams);

    setLoading(true);
    setErrors(null);

    const init: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };
    if (body != null && (method === Method.POST || method === Method.PUT)) {
      init.body = JSON.stringify(body);
    }

    fetch(url, init)
      .then(async (res) => {
        if (cancelled) return;
        const text = await res.text();
        if (!res.ok) {
          setErrors(new Error(`HTTP ${res.status}: ${text || res.statusText}`));
          setData(null);
          return;
        }
        if (text.length === 0) {
          setData(null);
          return;
        }
        try {
          const raw = JSON.parse(text) as unknown;
          const parsed = Result.fromResponseBody(raw);
          if (!cancelled) {
            setData(parsed.result as T);
            setErrors(null);
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
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[RopeGeoHttpRequest] Request failed", {
            url,
            error: err instanceof Error ? err.message : String(err),
          });
          setErrors(err instanceof Error ? err : new Error(String(err)));
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [service, method, path, pathParamsKey, queryParamsKey, bodyKey]);

  return <>{children({ loading, data, errors })}</>;
}
