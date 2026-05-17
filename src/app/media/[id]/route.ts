import { getCloudflareContext } from "@opennextjs/cloudflare";

import {
  createCanonicalImageId,
  decodeCanonicalImageSource,
  isSafeCanonicalSourceUrl,
} from "@/domains/media/canonical-image";
import {
  createKvCanonicalMediaCache,
  createNoopCanonicalMediaCache,
} from "@/integrations/kv/canonical-media-cache";
import type { CloudflareEnv } from "@/types/cloudflare";

const CANONICAL_CACHE_TTL_SECONDS = 60 * 60 * 24;
const CANONICAL_CACHE_NAME = "blog2:canonical-media";

const badRequest = (message: string, status = 400) => new Response(message, { status });

const redirectToSource = (sourceUrl: string) => Response.redirect(sourceUrl, 302);

async function getCloudflareEnv(testEnv?: Partial<CloudflareEnv>): Promise<Partial<CloudflareEnv> | null> {
  if (testEnv) {
    return testEnv;
  }

  try {
    return getCloudflareContext().env as Partial<CloudflareEnv>;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  const { id } = await params;

  if (!id) {
    return badRequest("Missing media id.", 404);
  }

  const url = new URL(request.url);
  const encodedSource = url.searchParams.get("u");
  const cacheKey = new Request(`${url.origin}/media/${id}`);
  const edgeCache = globalThis.caches ? await globalThis.caches.open(CANONICAL_CACHE_NAME) : null;
  const runtimeEnv = await getCloudflareEnv();
  const mediaCache = runtimeEnv?.BLOG_CACHE
    ? createKvCanonicalMediaCache(runtimeEnv.BLOG_CACHE)
    : createNoopCanonicalMediaCache();
  const cached = edgeCache ? await edgeCache.match(cacheKey) : null;

  if (cached) {
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

  const kvCached = await mediaCache.get(id);
  if (kvCached) {
    return new Response(kvCached.body, {
      status: 200,
      headers: {
        "Cache-Control": `public, max-age=0, s-maxage=${String(CANONICAL_CACHE_TTL_SECONDS)}`,
        "Content-Type": kvCached.record.contentType,
        ETag: `"${id}"`,
        "X-Blog2-Canonical-Media": "1",
        "X-Blog2-Canonical-Media-Cache": "kv-hit",
      },
    });
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

  const response = new Response(await upstream.arrayBuffer(), {
    status: 200,
    headers: {
      "Cache-Control": `public, max-age=0, s-maxage=${String(CANONICAL_CACHE_TTL_SECONDS)}`,
      "Content-Type": contentType,
      ETag: `"${id}"`,
      "X-Blog2-Canonical-Media": "1",
      "X-Blog2-Canonical-Media-Cache": "miss",
    },
  });

  await mediaCache.set(id, {
    body: await response.clone().arrayBuffer(),
    record: {
      contentType,
      sourceUrl,
    },
  });

  if (edgeCache) {
    await edgeCache.put(cacheKey, response.clone());
  }

  return response;
}
