export type XSocialPostKind = "original" | "quote" | "reply" | "repost";

export type XSocialPostDetail = {
  createdAt: Date;
  id: string;
  kind: XSocialPostKind;
  media: Array<{
    alt: string;
    height?: number | null;
    src: string;
    width?: number | null;
  }>;
  text: string;
  url: string;
};

export type XSocialPostIndex = {
  lastAttemptAt: string | null;
  lastError: string | null;
  lastRetainedCount: number;
  lastScannedCount: number;
  lastSuccessAt: string | null;
  orderedIds: string[];
  scannedBoundaryId: string | null;
};

export type XSocialPostScanResult = {
  posts: XSocialPostDetail[];
};

export type XSocialPostStore = {
  getIndex: () => Promise<XSocialPostIndex>;
  getPost: (id: string) => Promise<XSocialPostDetail | null>;
  putIndex: (index: XSocialPostIndex) => Promise<void>;
  putPost: (post: XSocialPostDetail) => Promise<void>;
};

export type SyncXSocialPostsResult = {
  error?: string;
  retainedCount: number;
  scannedBoundaryId: string | null;
  scannedCount: number;
};

export type SyncXSocialPostsOptions = {
  fetchPosts: (input: {
    afterId: string | null;
    limit: number;
  }) => Promise<XSocialPostScanResult>;
  now?: () => Date;
  store: XSocialPostStore;
};

const X_SYNC_LIMIT = 50;

const emptyIndex = (): XSocialPostIndex => ({
  lastAttemptAt: null,
  lastError: null,
  lastRetainedCount: 0,
  lastScannedCount: 0,
  lastSuccessAt: null,
  orderedIds: [],
  scannedBoundaryId: null,
});

const shouldRetainPost = (post: XSocialPostDetail) =>
  post.kind === "original" || post.kind === "quote";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown X sync error";

export const createMemoryXSocialPostStore = ({
  index,
  posts = [],
}: {
  index?: XSocialPostIndex;
  posts?: XSocialPostDetail[];
} = {}): XSocialPostStore => {
  let currentIndex = index ?? emptyIndex();
  const currentPosts = new Map(posts.map((post) => [post.id, post]));

  return {
    async getIndex() {
      return {
        ...currentIndex,
        orderedIds: [...currentIndex.orderedIds],
      };
    },
    async getPost(id: string) {
      return currentPosts.get(id) ?? null;
    },
    async putIndex(nextIndex: XSocialPostIndex) {
      currentIndex = {
        ...nextIndex,
        orderedIds: [...nextIndex.orderedIds],
      };
    },
    async putPost(post: XSocialPostDetail) {
      currentPosts.set(post.id, post);
    },
  };
};

export async function syncXSocialPosts({
  fetchPosts,
  now = () => new Date(),
  store,
}: SyncXSocialPostsOptions): Promise<SyncXSocialPostsResult> {
  const index = await store.getIndex();
  const attemptedAt = now().toISOString();
  let scan: XSocialPostScanResult;

  try {
    scan = await fetchPosts({
      afterId: index.scannedBoundaryId,
      limit: X_SYNC_LIMIT,
    });
  } catch (error) {
    const message = errorMessage(error);

    await store.putIndex({
      ...index,
      lastAttemptAt: attemptedAt,
      lastError: message,
      orderedIds: [...index.orderedIds],
    });

    return {
      error: message,
      retainedCount: 0,
      scannedBoundaryId: index.scannedBoundaryId,
      scannedCount: 0,
    };
  }

  const scannedPosts = scan.posts.slice(0, X_SYNC_LIMIT);
  const retainedPosts = scannedPosts.filter(shouldRetainPost);

  for (const post of retainedPosts) {
    await store.putPost(post);
  }

  const orderedIds = new Set(index.orderedIds);
  for (const post of retainedPosts) {
    orderedIds.add(post.id);
  }

  const scannedBoundaryId =
    scannedPosts.at(-1)?.id ?? index.scannedBoundaryId;
  const nextIndex: XSocialPostIndex = {
    lastAttemptAt: attemptedAt,
    lastError: null,
    lastRetainedCount: retainedPosts.length,
    lastScannedCount: scannedPosts.length,
    lastSuccessAt: attemptedAt,
    orderedIds: Array.from(orderedIds),
    scannedBoundaryId,
  };

  await store.putIndex(nextIndex);

  return {
    retainedCount: retainedPosts.length,
    scannedBoundaryId,
    scannedCount: scannedPosts.length,
  };
}

export async function listStoredXSocialPosts(
  store: XSocialPostStore,
): Promise<XSocialPostDetail[]> {
  const index = await store.getIndex();
  const posts: XSocialPostDetail[] = [];

  for (const id of index.orderedIds) {
    const post = await store.getPost(id);

    if (post) {
      posts.push(post);
    }
  }

  return posts;
}
