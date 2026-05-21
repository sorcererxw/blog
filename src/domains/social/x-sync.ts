import type { Client } from "@xdevplatform/xdk";

export type XSocialPostKind = "original" | "quote" | "reply" | "repost";

export type XSocialQuotedPost = {
  authorName?: string | null;
  authorUsername?: string | null;
  id: string;
  media: XSocialPostDetail["media"];
  text: string;
  url: string;
};

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
  quotedPost?: XSocialQuotedPost | null;
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
  authorId?: string;
  author_id?: string;
  createdAt?: string;
  created_at?: string;
  entities?: {
    urls?: XUrlEntity[];
  };
  id?: string;
  referencedTweets?: XReferencedPost[];
  referenced_tweets?: XReferencedPost[];
  text?: string;
};

type XUrlEntity = {
  displayUrl?: string;
  display_url?: string;
  expandedUrl?: string;
  expanded_url?: string;
  url?: string;
  unwoundUrl?: string;
  unwound_url?: string;
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
    tweets?: XPost[];
    users?: XUser[];
  };
};

type XUser = {
  id?: string;
  name?: string;
  profileImageUrl?: string;
  profile_image_url?: string;
  username?: string;
  verified?: boolean;
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

const getMediaKeys = (post: XPost) =>
  post.attachments?.mediaKeys ?? post.attachments?.media_keys ?? [];

const normalizePostMedia = (
  post: XPost,
  mediaByKey: Map<string, XMedia>,
): XSocialPostDetail["media"] =>
  getMediaKeys(post).flatMap((key) => {
    const media = mediaByKey.get(key);
    const normalized = media ? normalizeXMedia(media) : null;

    return normalized ? [normalized] : [];
  });

const getReferencedTweets = (post: XPost) =>
  post.referencedTweets ?? post.referenced_tweets ?? [];

const getQuotedReference = (post: XPost) =>
  getReferencedTweets(post).find((reference) => reference.type === "quoted");

const authorId = (post: XPost) => post.authorId ?? post.author_id ?? null;

const postUrl = (post: XPost, user?: XUser | null) =>
  user?.username
    ? `https://x.com/${user.username}/status/${post.id}`
    : `https://x.com/i/web/status/${post.id}`;

const entityUrls = (post: XPost) => post.entities?.urls ?? [];

const entityMatchesQuotedPost = (
  entity: XUrlEntity,
  quotedPostId: string,
) => {
  const candidates = [
    entity.expandedUrl,
    entity.expanded_url,
    entity.unwoundUrl,
    entity.unwound_url,
    entity.displayUrl,
    entity.display_url,
  ].filter(Boolean);

  return candidates.some((candidate) => candidate?.includes(`/status/${quotedPostId}`));
};

const stripTrailingQuotedUrl = (text: string, post: XPost, quotedPostId?: string) => {
  if (!quotedPostId) {
    return text;
  }

  const quotedEntityUrl = entityUrls(post).find(
    (entity) => entity.url && entityMatchesQuotedPost(entity, quotedPostId),
  )?.url;

  if (quotedEntityUrl && text.endsWith(quotedEntityUrl)) {
    return text.slice(0, -quotedEntityUrl.length).trimEnd();
  }

  return text.replace(/\s+https:\/\/t\.co\/[A-Za-z0-9_]+$/u, "").trimEnd();
};

const normalizeQuotedPost = ({
  mediaByKey,
  quotedReference,
  tweetById,
  userById,
}: {
  mediaByKey: Map<string, XMedia>;
  quotedReference?: XReferencedPost;
  tweetById: Map<string, XPost>;
  userById: Map<string, XUser>;
}): XSocialQuotedPost | null => {
  if (!quotedReference?.id) {
    return null;
  }

  const quotedPost = tweetById.get(quotedReference.id);

  if (!quotedPost?.id) {
    return null;
  }

  const author = authorId(quotedPost);
  const user = author ? userById.get(author) : null;

  return {
    authorName: user?.name ?? null,
    authorUsername: user?.username ?? null,
    id: quotedPost.id,
    media: normalizePostMedia(quotedPost, mediaByKey),
    text: quotedPost.text ?? "",
    url: postUrl(quotedPost, user),
  };
};

const normalizeXPosts = (response: XUserPostsResponse): XSocialPostScanResult => {
  const mediaByKey = new Map(
    response.includes?.media?.flatMap((media) => {
      const mediaKey = media.mediaKey ?? media.media_key;

      return mediaKey ? [[mediaKey, media] as const] : [];
    }) ?? [],
  );
  const tweetById = new Map(
    response.includes?.tweets?.flatMap((post) =>
      post.id ? [[post.id, post] as const] : [],
    ) ?? [],
  );
  const userById = new Map(
    response.includes?.users?.flatMap((user) =>
      user.id ? [[user.id, user] as const] : [],
    ) ?? [],
  );

  return {
    posts: (response.data ?? []).flatMap((post) => {
      if (!post.id) {
        return [];
      }

      const kind = xPostKind(post);
      const quotedReference = getQuotedReference(post);
      const quotedPost = normalizeQuotedPost({
        mediaByKey,
        quotedReference,
        tweetById,
        userById,
      });

      return [
        {
          createdAt: post.createdAt || post.created_at
            ? new Date(post.createdAt ?? post.created_at ?? "")
            : new Date(0),
          id: post.id,
          kind,
          media: normalizePostMedia(post, mediaByKey),
          quotedPost,
          text: kind === "quote"
            ? stripTrailingQuotedUrl(post.text ?? "", post, quotedReference?.id)
            : post.text ?? "",
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
        expansions: [
          "attachments.media_keys",
          "referenced_tweets.id",
          "referenced_tweets.id.attachments.media_keys",
          "referenced_tweets.id.author_id",
        ],
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
        userFields: ["id", "name", "profile_image_url", "username", "verified"],
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
