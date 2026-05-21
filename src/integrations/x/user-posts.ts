import type {
  XSocialPostDetail,
  XSocialPostKind,
  XSocialPostScanResult,
} from "@/domains/social/x-sync";

type XReferencedPost = {
  id: string;
  type: string;
};

type XPost = {
  attachments?: {
    media_keys?: string[];
  };
  created_at?: string;
  id: string;
  referenced_tweets?: XReferencedPost[];
  text?: string;
};

type XMedia = {
  alt_text?: string;
  height?: number;
  media_key: string;
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

export type XUserPostsSource = {
  fetchPosts: (input: {
    afterId: string | null;
    limit: number;
  }) => Promise<XSocialPostScanResult>;
};

export function createXUserPostsSource({
  bearerToken,
  fetchImpl = fetch,
  userId,
}: {
  bearerToken: string;
  fetchImpl?: typeof fetch;
  userId: string;
}): XUserPostsSource {
  return {
    async fetchPosts({ afterId, limit }) {
      const url = new URL(`https://api.x.com/2/users/${userId}/tweets`);
      url.searchParams.set("max_results", String(limit));
      url.searchParams.set(
        "tweet.fields",
        [
          "attachments",
          "created_at",
          "entities",
          "referenced_tweets",
          "text",
        ].join(","),
      );
      url.searchParams.set("expansions", "attachments.media_keys");
      url.searchParams.set(
        "media.fields",
        ["alt_text", "height", "media_key", "preview_image_url", "type", "url", "width"].join(","),
      );

      if (afterId) {
        url.searchParams.set("since_id", afterId);
      }

      const response = await fetchImpl(url.toString(), {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`X user posts request failed with ${response.status}`);
      }

      return normalizeXUserPostsResponse(await response.json() as XUserPostsResponse);
    },
  };
}

function postKind(post: XPost): XSocialPostKind {
  const referenceTypes = new Set(
    post.referenced_tweets?.map((reference) => reference.type) ?? [],
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
}

function normalizeMedia(media: XMedia): XSocialPostDetail["media"][number] | null {
  const src = media.url ?? media.preview_image_url ?? null;

  if (!src) {
    return null;
  }

  return {
    alt: media.alt_text ?? "",
    height: media.height ?? null,
    src,
    width: media.width ?? null,
  };
}

export function normalizeXUserPostsResponse(
  response: XUserPostsResponse,
): XSocialPostScanResult {
  const mediaByKey = new Map(
    response.includes?.media?.map((media) => [media.media_key, media]) ?? [],
  );

  return {
    posts: (response.data ?? []).map((post) => ({
      createdAt: post.created_at ? new Date(post.created_at) : new Date(0),
      id: post.id,
      kind: postKind(post),
      media: (post.attachments?.media_keys ?? []).flatMap((key) => {
        const media = mediaByKey.get(key);
        const normalized = media ? normalizeMedia(media) : null;

        return normalized ? [normalized] : [];
      }),
      text: post.text ?? "",
      url: `https://x.com/sorcererxw/status/${post.id}`,
    })),
  };
}
