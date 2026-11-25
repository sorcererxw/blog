export type EdgeCacheExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
};

export type EdgeCacheStorage = {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
};

export type EdgePageCacheOptions = {
  cache?: EdgeCacheStorage | null;
  cacheVersion?: string;
  context?: EdgeCacheExecutionContext;
  freshTtlSeconds?: number;
  now?: () => number;
  originFetch: (request: Request) => Promise<Response>;
  request: Request;
  staleTtlSeconds?: number;
};

const DEFAULT_FRESH_TTL_SECONDS = 600;
const DEFAULT_STALE_TTL_SECONDS = 60 * 60 * 24;
const EDGE_CACHED_AT_HEADER = "x-blog2-edge-cached-at";
const ORIGINAL_VARY_HEADER = "x-blog2-original-vary";
const ORIGINAL_CACHE_CONTROL_HEADER = "x-blog2-original-cache-control";
const EDGE_CACHE_STATUS_HEADER = "x-blog2-edge-cache";
const EDGE_CACHE_KEY_PREFIX = "/__edge_cache";
const DEFAULT_CACHE_VERSION = "v1";

const BYPASS_REQUEST_HEADERS = [
  "rsc",
  "next-router-prefetch",
  "next-router-segment-prefetch",
  "next-router-state-tree",
  "next-action",
  "authorization",
];

const HOME_ALLOWED_QUERY_KEYS = ["source", "type"] as const;
const ARTICLE_PATH_PATTERN = /^\/articles\/[^/]+$/;
const inFlightRevalidations = new Map<string, Promise<void>>();

const getDefaultEdgeCache = (): EdgeCacheStorage | null => {
  const cachesObj = globalThis.caches as (CacheStorage & { default?: EdgeCacheStorage }) | undefined;
  return cachesObj?.default ?? null;
};

const isCacheablePath = (pathname: string) =>
  pathname === "/" ||
  pathname === "/sitemap.xml" ||
  ARTICLE_PATH_PATTERN.test(pathname);

const hasBypassCookie = (cookieHeader: string | null) => {
  if (!cookieHeader) {
    return false;
  }

  return (
    cookieHeader.includes("__prerender_bypass") ||
    cookieHeader.includes("__next_preview_data")
  );
};

export function isEdgeCacheableRequest(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return false;
  }

  for (const header of BYPASS_REQUEST_HEADERS) {
    if (request.headers.get(header) !== null) {
      return false;
    }
  }

  if (hasBypassCookie(request.headers.get("cookie"))) {
    return false;
  }

  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return false;
  }

  return isCacheablePath(url.pathname);
}

export function buildEdgePageCacheKey(
  request: Request,
  cacheVersion = DEFAULT_CACHE_VERSION,
): Request {
  const url = new URL(request.url);
  const safeVersion = encodeURIComponent(cacheVersion || DEFAULT_CACHE_VERSION);
  const canonicalUrl = new URL(
    `${url.origin}${EDGE_CACHE_KEY_PREFIX}/${safeVersion}${url.pathname}`,
  );

  if (url.pathname === "/") {
    for (const key of HOME_ALLOWED_QUERY_KEYS) {
      const value = url.searchParams.get(key);
      if (value) {
        canonicalUrl.searchParams.set(key, value);
      }
    }
  }

  return new Request(canonicalUrl.toString(), { method: "GET" });
}

const isCacheableResponse = (response: Response) => {
  if (response.status !== 200) {
    return false;
  }

  if (response.headers.get("set-cookie")) {
    return false;
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  return (
    contentType.startsWith("text/html") ||
    contentType.startsWith("application/xml") ||
    contentType.startsWith("text/xml")
  );
};

const buildStorableResponse = (
  response: Response,
  cachedAtMs: number,
  staleTtlSeconds: number,
) => {
  const headers = new Headers(response.headers);
  const originalVary = headers.get("vary");
  const originalCacheControl = headers.get("cache-control");

  if (originalVary) {
    headers.set(ORIGINAL_VARY_HEADER, originalVary);
  }
  if (originalCacheControl) {
    headers.set(ORIGINAL_CACHE_CONTROL_HEADER, originalCacheControl);
  }

  // Cloudflare Cache API ignores responses with Vary values other than Accept-Encoding.
  headers.set("vary", "Accept-Encoding");
  headers.set("cache-control", `public, max-age=0, s-maxage=${String(staleTtlSeconds)}`);
  headers.set(EDGE_CACHED_AT_HEADER, String(cachedAtMs));
  headers.delete(EDGE_CACHE_STATUS_HEADER);

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
};

const buildClientResponseFromCache = (
  cached: Response,
  cacheStatus: "hit" | "stale",
  isHead: boolean,
) => {
  const headers = new Headers(cached.headers);
  const originalVary = headers.get(ORIGINAL_VARY_HEADER);
  const originalCacheControl = headers.get(ORIGINAL_CACHE_CONTROL_HEADER);

  if (originalVary) {
    headers.set("vary", originalVary);
  } else {
    headers.delete("vary");
  }

  if (originalCacheControl) {
    headers.set("cache-control", originalCacheControl);
  }

  headers.delete(ORIGINAL_VARY_HEADER);
  headers.delete(ORIGINAL_CACHE_CONTROL_HEADER);
  headers.delete(EDGE_CACHED_AT_HEADER);
  headers.set(EDGE_CACHE_STATUS_HEADER, cacheStatus);

  return new Response(isHead ? null : cached.body, {
    headers,
    status: cached.status,
    statusText: cached.statusText,
  });
};

const buildClientResponseFromOrigin = (
  response: Response,
  cacheStatus: "miss" | "bypass",
) => {
  const headers = new Headers(response.headers);
  headers.set(EDGE_CACHE_STATUS_HEADER, cacheStatus);

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
};

const runInBackground = (
  context: EdgeCacheExecutionContext | undefined,
  promise: Promise<unknown>,
) => {
  const safePromise = promise.catch(() => undefined);

  if (context && typeof context.waitUntil === "function") {
    context.waitUntil(safePromise);
    return;
  }

  void safePromise;
};

export async function handleEdgeCachedFetch({
  cache = getDefaultEdgeCache(),
  cacheVersion = DEFAULT_CACHE_VERSION,
  context,
  freshTtlSeconds = DEFAULT_FRESH_TTL_SECONDS,
  now = () => Date.now(),
  originFetch,
  request,
  staleTtlSeconds = DEFAULT_STALE_TTL_SECONDS,
}: EdgePageCacheOptions): Promise<Response> {
  if (!cache || !isEdgeCacheableRequest(request)) {
    return originFetch(request);
  }

  const cacheKey = buildEdgePageCacheKey(request, cacheVersion);
  const cacheKeyId = cacheKey.url;
  const isHead = request.method === "HEAD";

  let cached: Response | undefined;
  try {
    cached = await cache.match(cacheKey);
  } catch {
    return originFetch(request);
  }

  if (cached) {
    const cachedAtHeader = cached.headers.get(EDGE_CACHED_AT_HEADER);
    const cachedAtMs = cachedAtHeader ? Number(cachedAtHeader) : 0;
    const isStale =
      !Number.isFinite(cachedAtMs) || now() - cachedAtMs >= freshTtlSeconds * 1000;

    if (isStale && !inFlightRevalidations.has(cacheKeyId)) {
      const revalidateRequest = isHead
        ? new Request(request.url, { headers: request.headers, method: "GET" })
        : request;
      const revalidation = (async () => {
        const fresh = await originFetch(revalidateRequest);
        if (isCacheableResponse(fresh)) {
          await cache.put(
            cacheKey,
            buildStorableResponse(fresh, now(), staleTtlSeconds),
          );
        }
      })().finally(() => {
        inFlightRevalidations.delete(cacheKeyId);
      });

      inFlightRevalidations.set(cacheKeyId, revalidation);
      runInBackground(context, revalidation);
    }

    return buildClientResponseFromCache(cached, isStale ? "stale" : "hit", isHead);
  }

  const originResponse = await originFetch(request);

  if (!isHead && isCacheableResponse(originResponse)) {
    const storable = buildStorableResponse(
      originResponse.clone(),
      now(),
      staleTtlSeconds,
    );
    runInBackground(context, cache.put(cacheKey, storable));
    return buildClientResponseFromOrigin(originResponse, "miss");
  }

  return originResponse;
}
