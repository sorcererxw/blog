import type { Client } from "@xdevplatform/xdk";

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

type XReferencedPost = {
  id?: string;
  type?: string;
};

type XPost = {
  attachments?: {
    mediaKeys?: string[];
    media_keys?: string[];
  };
  createdAt?: string;
  created_at?: string;
  id?: string;
  referencedTweets?: XReferencedPost[];
  referenced_tweets?: XReferencedPost[];
  text?: string;
};

type XMedia = {
  altText?: string;
  alt_text?: string;
  height?: number;
  mediaKey?: string;
  media_key?: string;
  previewImageUrl?: string;
  preview_image_url?: string;
  type?: string;
  url?: string;
  width?: number;
};

type XUserPostsResponse = {
  data?: XPost[];
  includes?: {
    media?: XMedia[];
  };
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

const xPostKind = (post: XPost): XSocialPostKind => {
  const referenceTypes = new Set(
    (post.referencedTweets ?? post.referenced_tweets)?.map((reference) => reference.type) ?? [],
  );

  if (referenceTypes.has("replied_to")) {
    return "reply";
  }

  if (referenceTypes.has("retweeted")) {
    return "repost";
  }

  if (referenceTypes.has("quoted")) {
    return "quote";
  }

  return "original";
};

const normalizeXMedia = (media: XMedia): XSocialPostDetail["media"][number] | null => {
  const src = media.url ?? media.previewImageUrl ?? media.preview_image_url ?? null;

  if (!src) {
    return null;
  }

  return {
    alt: media.altText ?? media.alt_text ?? "",
    height: media.height ?? null,
    src,
    width: media.width ?? null,
  };
};

const normalizeXPosts = (response: XUserPostsResponse): XSocialPostScanResult => {
  const mediaByKey = new Map(
    response.includes?.media?.flatMap((media) => {
      const mediaKey = media.mediaKey ?? media.media_key;

      return mediaKey ? [[mediaKey, media] as const] : [];
    }) ?? [],
  );

  return {
    posts: (response.data ?? []).flatMap((post) => {
      if (!post.id) {
        return [];
      }

      return [
        {
          createdAt: post.createdAt || post.created_at
            ? new Date(post.createdAt ?? post.created_at ?? "")
            : new Date(0),
          id: post.id,
          kind: xPostKind(post),
          media: (post.attachments?.mediaKeys ?? post.attachments?.media_keys ?? []).flatMap((key) => {
            const media = mediaByKey.get(key);
            const normalized = media ? normalizeXMedia(media) : null;

            return normalized ? [normalized] : [];
          }),
          text: post.text ?? "",
          url: `https://x.com/sorcererxw/status/${post.id}`,
        },
      ];
    }),
  };
};

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
  now = () => new Date(),
  store,
  userId,
  xClient,
}: {
  now?: () => Date;
  store: XSocialPostStore;
  userId: string;
  xClient: Client;
}): Promise<SyncXSocialPostsResult> {
  const index = await store.getIndex();
  const attemptedAt = now().toISOString();
  let scan: XSocialPostScanResult;

  try {
    scan = normalizeXPosts(
      await xClient.users.getPosts(userId, {
        expansions: ["attachments.media_keys"],
        exclude: ["replies", "retweets"],
        maxResults: X_SYNC_LIMIT,
        mediaFields: [
          "alt_text",
          "height",
          "media_key",
          "preview_image_url",
          "type",
          "url",
          "width",
        ],
        sinceId: index.scannedBoundaryId ?? undefined,
        tweetFields: [
          "attachments",
          "created_at",
          "entities",
          "referenced_tweets",
          "text",
        ],
      }),
    );
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
