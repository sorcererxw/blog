import {
  createCanonicalImageId,
  decodeCanonicalImageSource,
  isSafeCanonicalSourceUrl,
} from "@/domains/media/canonical-image";
import {
  createKvCanonicalMediaCache,
  createNoopCanonicalMediaCache,
} from "@/integrations/kv/canonical-media-cache";
import { getWorkerEnv, waitUntilInWorker } from "@/lib/cloudflare-env";

const CANONICAL_CACHE_CONTROL = "public, max-age=31536000, immutable";
const CANONICAL_CACHE_NAME = "blog2:canonical-media";

const badRequest = (message: string, status = 400) =>
  new Response(message, { status });

const redirectToSource = (sourceUrl: string) =>
  Response.redirect(sourceUrl, 302);

const matchesIfNoneMatch = (request: Request, etag: string) => {
  const header = request.headers.get("if-none-match");
  if (!header) {
    return false;
  }

  return header
    .split(",")
    .map((token) => token.trim())
    .some((token) => token === "*" || token === etag || token === `W/${etag}`);
};

export async function handleCanonicalMediaRequest(request: Request, id: string) {
  if (!id) {
    return badRequest("Missing media id.", 404);
  }

  const etag = `"${id}"`;
  const url = new URL(request.url);
  const encodedSource = url.searchParams.get("u");
  const cacheKey = new Request(`${url.origin}/media/${id}`);
  const edgeCache = globalThis.caches
    ? await globalThis.caches.open(CANONICAL_CACHE_NAME)
    : null;
  const cached = edgeCache ? await edgeCache.match(cacheKey) : null;

  if (cached) {
    if (matchesIfNoneMatch(request, etag)) {
      return new Response(null, {
        headers: {
          "Cache-Control": CANONICAL_CACHE_CONTROL,
          ETag: etag,
          "X-Blog2-Canonical-Media": "1",
          "X-Blog2-Canonical-Media-Cache": "edge-hit",
        },
        status: 304,
      });
    }

    return cached;
  }

  if (!encodedSource) {
    return badRequest("Missing canonical media source.", 400);
  }

  let sourceUrl: string;

  try {
    sourceUrl = decodeCanonicalImageSource(encodedSource);
  } catch {
    return badRequest("Invalid canonical media source.", 400);
  }

  if (!isSafeCanonicalSourceUrl(sourceUrl)) {
    return badRequest("Source host is not allowed for canonical media.", 403);
  }

  if (createCanonicalImageId(sourceUrl) !== id) {
    return badRequest("Canonical media id does not match source.", 400);
  }

  if (matchesIfNoneMatch(request, etag)) {
    return new Response(null, {
      headers: {
        "Cache-Control": CANONICAL_CACHE_CONTROL,
        ETag: etag,
        "X-Blog2-Canonical-Media": "1",
        "X-Blog2-Canonical-Media-Cache": "not-modified",
      },
      status: 304,
    });
  }

  const runtimeEnv = await getWorkerEnv();
  const mediaCache = runtimeEnv.BLOG_CACHE
    ? createKvCanonicalMediaCache(runtimeEnv.BLOG_CACHE)
    : createNoopCanonicalMediaCache();

  const kvCached = await mediaCache.get(id);
  if (kvCached) {
    const response = new Response(kvCached.body, {
      headers: {
        "Cache-Control": CANONICAL_CACHE_CONTROL,
        "Content-Type": kvCached.record.contentType,
        ETag: etag,
        "X-Blog2-Canonical-Media": "1",
        "X-Blog2-Canonical-Media-Cache": "kv-hit",
      },
      status: 200,
    });

    if (edgeCache) {
      waitUntilInWorker(edgeCache.put(cacheKey, response.clone()));
    }

    return response;
  }

  const upstream = await fetch(sourceUrl, {
    headers: {
      accept: "image/avif,image/webp,image/*,*/*;q=0.8",
    },
  });

  if (!upstream.ok) {
    return redirectToSource(sourceUrl);
  }

  const contentType = upstream.headers.get("content-type");
  if (!contentType || !contentType.startsWith("image/")) {
    return redirectToSource(sourceUrl);
  }

  const body = await upstream.arrayBuffer();
  const response = new Response(body, {
    headers: {
      "Cache-Control": CANONICAL_CACHE_CONTROL,
      "Content-Type": contentType,
      ETag: etag,
      "X-Blog2-Canonical-Media": "1",
      "X-Blog2-Canonical-Media-Cache": "miss",
    },
    status: 200,
  });

  const bodyCopy = body.slice(0);
  const edgeCopy = edgeCache ? response.clone() : null;

  waitUntilInWorker(
    Promise.all([
      mediaCache.set(id, {
        body: bodyCopy,
        record: {
          contentType,
          sourceUrl,
        },
      }),
      edgeCache && edgeCopy
        ? edgeCache.put(cacheKey, edgeCopy)
        : Promise.resolve(),
    ]),
  );

  return response;
}
