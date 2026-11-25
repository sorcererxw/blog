import type {
  XSocialPostDetail,
  XSocialPostIndex,
  XSocialPostStore,
} from "@/domains/social/x-sync";
import type { KVNamespace } from "@/types/cloudflare";

const X_SOCIAL_INDEX_KEY = "social:x:index";
const X_SOCIAL_FEED_SNAPSHOT_KEY = "social:x:feed:v1";
const X_SOCIAL_POST_KEY_PREFIX = "social:x:posts:";
const X_SOCIAL_KV_CACHE_TTL_SECONDS = 600;
const KV_BULK_GET_LIMIT = 100;

type StoredXSocialPostDetail = Omit<XSocialPostDetail, "createdAt"> & {
  createdAt: string;
};

const emptyIndex = (): XSocialPostIndex => ({
  lastAttemptAt: null,
  lastError: null,
  lastRetainedCount: 0,
  lastScannedCount: 0,
  lastSuccessAt: null,
  orderedIds: [],
  scannedBoundaryId: null,
});

const postKey = (id: string) => `${X_SOCIAL_POST_KEY_PREFIX}${id}`;

const parseJson = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const serializePost = (post: XSocialPostDetail): StoredXSocialPostDetail => ({
  ...post,
  createdAt: post.createdAt.toISOString(),
});

const deserializePost = (
  post: StoredXSocialPostDetail,
): XSocialPostDetail => ({
  ...post,
  createdAt: new Date(post.createdAt),
});

export function createKvXSocialPostStore(
  namespace: KVNamespace,
): XSocialPostStore {
  const readSinglePost = async (id: string) => {
    const post = parseJson<StoredXSocialPostDetail>(
      await namespace.get(postKey(id), {
        cacheTtl: X_SOCIAL_KV_CACHE_TTL_SECONDS,
        type: "text",
      }),
    );

    return post ? deserializePost(post) : null;
  };

  return {
    async getFeedSnapshot() {
      const stored = parseJson<StoredXSocialPostDetail[]>(
        await namespace.get(X_SOCIAL_FEED_SNAPSHOT_KEY, {
          cacheTtl: X_SOCIAL_KV_CACHE_TTL_SECONDS,
          type: "text",
        }),
      );

      if (!Array.isArray(stored)) {
        return null;
      }

      return stored.map(deserializePost);
    },
    async getIndex() {
      return (
        parseJson<XSocialPostIndex>(
          await namespace.get(X_SOCIAL_INDEX_KEY, {
            cacheTtl: X_SOCIAL_KV_CACHE_TTL_SECONDS,
            type: "text",
          }),
        ) ?? emptyIndex()
      );
    },
    getPost: readSinglePost,
    async getPostsBatch(ids: string[]) {
      if (ids.length === 0) {
        return [];
      }

      const results: Array<XSocialPostDetail | null> = [];

      for (let start = 0; start < ids.length; start += KV_BULK_GET_LIMIT) {
        const chunk = ids.slice(start, start + KV_BULK_GET_LIMIT);
        const keys = chunk.map(postKey);
        const batchResult = await namespace.get(keys, {
          cacheTtl: X_SOCIAL_KV_CACHE_TTL_SECONDS,
          type: "text",
        });

        if (batchResult instanceof Map) {
          for (const key of keys) {
            const raw = batchResult.get(key) ?? null;
            const parsed = parseJson<StoredXSocialPostDetail>(raw);
            results.push(parsed ? deserializePost(parsed) : null);
          }
          continue;
        }

        const fallback = await Promise.all(chunk.map(readSinglePost));
        results.push(...fallback);
      }

      return results;
    },
    async putFeedSnapshot(posts: XSocialPostDetail[]) {
      await namespace.put(
        X_SOCIAL_FEED_SNAPSHOT_KEY,
        JSON.stringify(posts.map(serializePost)),
      );
    },
    async putIndex(index: XSocialPostIndex) {
      await namespace.put(X_SOCIAL_INDEX_KEY, JSON.stringify(index));
    },
    async putPost(post: XSocialPostDetail) {
      await namespace.put(postKey(post.id), JSON.stringify(serializePost(post)));
    },
  };
}
