import { describe, expect, it } from "vitest";

import { createXUserPostsSource } from "./user-posts";

describe("X user posts source", () => {
  it("fetches up to 50 posts after the scanned boundary and preserves scanned replies and reposts", async () => {
    const requestedUrls: string[] = [];
    const source = createXUserPostsSource({
      bearerToken: "secret-token",
      fetchImpl: async (input, init) => {
        const url = String(input);
        requestedUrls.push(url);

        expect(init?.headers).toEqual({
          Authorization: "Bearer secret-token",
        });

        return new Response(
          JSON.stringify({
            data: [
              {
                created_at: "2026-05-21T00:00:01.000Z",
                id: "101",
                referenced_tweets: [{ id: "1", type: "replied_to" }],
                text: "reply",
              },
              {
                created_at: "2026-05-21T00:00:02.000Z",
                id: "102",
                text: "original",
              },
              {
                created_at: "2026-05-21T00:00:03.000Z",
                id: "103",
                referenced_tweets: [{ id: "2", type: "retweeted" }],
                text: "repost",
              },
              {
                attachments: { media_keys: ["photo-1"] },
                created_at: "2026-05-21T00:00:04.000Z",
                id: "104",
                referenced_tweets: [{ id: "3", type: "quoted" }],
                text: "quote https://t.co/example",
              },
            ],
            includes: {
              media: [
                {
                  alt_text: "Diagram",
                  height: 720,
                  media_key: "photo-1",
                  type: "photo",
                  url: "https://pbs.twimg.com/media/photo.jpg",
                  width: 1280,
                },
              ],
            },
          }),
          { status: 200 },
        );
      },
      userId: "3798600074",
    });

    const result = await source.fetchPosts({ afterId: "100", limit: 50 });
    const url = new URL(requestedUrls[0] ?? "");

    expect(url.origin + url.pathname).toBe(
      "https://api.x.com/2/users/3798600074/tweets",
    );
    expect(url.searchParams.get("since_id")).toBe("100");
    expect(url.searchParams.get("max_results")).toBe("50");
    expect(url.searchParams.get("exclude")).toBeNull();
    expect(url.searchParams.get("tweet.fields")).toContain("created_at");
    expect(url.searchParams.get("tweet.fields")).toContain("referenced_tweets");
    expect(url.searchParams.get("expansions")).toContain("attachments.media_keys");
    expect(url.searchParams.get("media.fields")).toContain("preview_image_url");

    expect(result.posts).toEqual([
      expect.objectContaining({ id: "101", kind: "reply", text: "reply" }),
      expect.objectContaining({ id: "102", kind: "original", text: "original" }),
      expect.objectContaining({ id: "103", kind: "repost", text: "repost" }),
      expect.objectContaining({
        id: "104",
        kind: "quote",
        media: [
          {
            alt: "Diagram",
            height: 720,
            src: "https://pbs.twimg.com/media/photo.jpg",
            width: 1280,
          },
        ],
        text: "quote https://t.co/example",
      }),
    ]);
  });
});
