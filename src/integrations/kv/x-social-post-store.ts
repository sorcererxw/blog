import type {
  XSocialPostDetail,
  XSocialPostIndex,
  XSocialPostStore,
} from "@/domains/social/x-sync";
import type { KVNamespace } from "@/types/cloudflare";

const X_SOCIAL_INDEX_KEY = "social:x:index";
const X_SOCIAL_POST_KEY_PREFIX = "social:x:posts:";

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
  return {
    async getIndex() {
      return parseJson<XSocialPostIndex>(await namespace.get(X_SOCIAL_INDEX_KEY, "text")) ?? emptyIndex();
    },
    async getPost(id: string) {
      const post = parseJson<StoredXSocialPostDetail>(
        await namespace.get(postKey(id), "text"),
      );

      return post ? deserializePost(post) : null;
    },
    async putIndex(index: XSocialPostIndex) {
      await namespace.put(X_SOCIAL_INDEX_KEY, JSON.stringify(index));
    },
    async putPost(post: XSocialPostDetail) {
      await namespace.put(postKey(post.id), JSON.stringify(serializePost(post)));
    },
  };
}
