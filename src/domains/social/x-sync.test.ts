import { describe, expect, it } from "vitest";
import { Client } from "@xdevplatform/xdk";

import {
  createMemoryXSocialPostStore,
  listStoredXSocialPosts,
  syncXSocialPosts,
} from "./x-sync";

const createTestXClient = (
  getPosts: Parameters<typeof syncXSocialPosts>[0]["xClient"]["users"]["getPosts"],
) => {
  const client = new Client({ bearerToken: "test-token" });

  client.users.getPosts = getPosts;

  return client;
};

describe("X Social Source sync", () => {
  it("asks X to exclude replies and reposts while retaining returned original and quote posts", async () => {
    const store = createMemoryXSocialPostStore({
      index: {
        lastAttemptAt: null,
        lastError: null,
        lastRetainedCount: 0,
        lastScannedCount: 0,
        lastSuccessAt: null,
        orderedIds: ["100"],
        scannedBoundaryId: "100",
      },
    });
    await store.putPost({
      createdAt: new Date("2026-05-20T00:00:00.000Z"),
      id: "100",
      kind: "original",
      media: [],
      text: "existing",
      url: "https://x.com/sorcererxw/status/100",
    });

    const result = await syncXSocialPosts({
      now: () => new Date("2026-05-21T01:00:00.000Z"),
      store,
      userId: "3798600074",
      xClient: createTestXClient(async (id, options) => {
        expect(id).toBe("3798600074");
        expect(options).toEqual({
          expansions: [
            "attachments.media_keys",
            "referenced_tweets.id",
            "referenced_tweets.id.attachments.media_keys",
            "referenced_tweets.id.author_id",
          ],
          exclude: ["replies", "retweets"],
          maxResults: 50,
          mediaFields: ["alt_text", "height", "media_key", "preview_image_url", "type", "url", "width"],
          sinceId: "100",
          tweetFields: ["attachments", "created_at", "entities", "referenced_tweets", "text"],
          userFields: ["id", "name", "profile_image_url", "username", "verified"],
        });

        return {
          data: [
            {
              createdAt: "2026-05-21T00:00:01.000Z",
              id: "101",
              referencedTweets: [{ id: "1", type: "replied_to" }],
              text: "post 101",
            },
            {
              createdAt: "2026-05-21T00:00:02.000Z",
              id: "102",
              text: "post 102",
            },
            {
              createdAt: "2026-05-21T00:00:03.000Z",
              id: "103",
              referencedTweets: [{ id: "2", type: "retweeted" }],
              text: "post 103",
            },
            {
              createdAt: "2026-05-21T00:00:04.000Z",
              entities: {
                urls: [
                  {
                    expandedUrl: "https://x.com/supezen/status/3",
                    url: "https://t.co/C6afVyxUzX",
                  },
                ],
              },
              id: "104",
              referencedTweets: [{ id: "3", type: "quoted" }],
              text: "post 104 https://t.co/C6afVyxUzX",
            },
          ],
          includes: {
            media: [
              {
                altText: "Quoted image",
                height: 720,
                mediaKey: "quoted-media",
                type: "photo",
                url: "https://pbs.twimg.com/media/quoted.jpg",
                width: 1280,
              },
            ],
            tweets: [
              {
                attachments: { mediaKeys: ["quoted-media"] },
                authorId: "200",
                createdAt: "2026-05-20T00:00:00.000Z",
                id: "3",
                text: "quoted text",
              },
            ],
            users: [
              {
                id: "200",
                name: "ZEN",
                username: "supezen",
              },
            ],
          },
        };
      }),
    });

    await expect(store.getPost("101")).resolves.toBeNull();
    await expect(store.getPost("103")).resolves.toBeNull();
    await expect(store.getPost("102")).resolves.toMatchObject({ text: "post 102" });
    await expect(store.getPost("104")).resolves.toMatchObject({
      quotedPost: {
        authorName: "ZEN",
        authorUsername: "supezen",
        id: "3",
        media: [
          {
            alt: "Quoted image",
            height: 720,
            src: "https://pbs.twimg.com/media/quoted.jpg",
            width: 1280,
          },
        ],
        text: "quoted text",
        url: "https://x.com/supezen/status/3",
      },
      text: "post 104",
    });
    await expect(store.getIndex()).resolves.toMatchObject({
      lastError: null,
      lastRetainedCount: 2,
      lastScannedCount: 4,
      lastSuccessAt: "2026-05-21T01:00:00.000Z",
      orderedIds: ["100", "102", "104"],
      scannedBoundaryId: "104",
    });
    expect(result).toEqual({
      retainedCount: 2,
      scannedBoundaryId: "104",
      scannedCount: 4,
    });
  });

  it("records sync failure metadata without advancing the existing boundary", async () => {
    const store = createMemoryXSocialPostStore({
      index: {
        lastAttemptAt: "2026-05-20T01:00:00.000Z",
        lastError: null,
        lastRetainedCount: 1,
        lastScannedCount: 1,
        lastSuccessAt: "2026-05-20T01:00:00.000Z",
        orderedIds: ["100"],
        scannedBoundaryId: "100",
      },
    });

    const result = await syncXSocialPosts({
      now: () => new Date("2026-05-21T02:00:00.000Z"),
      store,
      userId: "3798600074",
      xClient: createTestXClient(async () => {
        throw new Error("X API unavailable");
      }),
    });

    await expect(store.getIndex()).resolves.toMatchObject({
      lastAttemptAt: "2026-05-21T02:00:00.000Z",
      lastError: "X API unavailable",
      lastRetainedCount: 1,
      lastScannedCount: 1,
      lastSuccessAt: "2026-05-20T01:00:00.000Z",
      orderedIds: ["100"],
      scannedBoundaryId: "100",
    });
    expect(result).toEqual({
      error: "X API unavailable",
      retainedCount: 0,
      scannedBoundaryId: "100",
      scannedCount: 0,
    });
  });

  it("skips missing post details when listing stored X Social Posts", async () => {
    const store = createMemoryXSocialPostStore({
      index: {
        lastAttemptAt: null,
        lastError: null,
        lastRetainedCount: 0,
        lastScannedCount: 0,
        lastSuccessAt: null,
        orderedIds: ["100", "101"],
        scannedBoundaryId: "101",
      },
      posts: [
        {
          createdAt: new Date("2026-05-21T00:00:00.000Z"),
          id: "101",
          kind: "original",
          media: [],
          text: "available",
          url: "https://x.com/sorcererxw/status/101",
        },
      ],
    });

    await expect(listStoredXSocialPosts(store)).resolves.toEqual([
      {
        createdAt: new Date("2026-05-21T00:00:00.000Z"),
        id: "101",
        kind: "original",
        media: [],
        text: "available",
        url: "https://x.com/sorcererxw/status/101",
      },
    ]);
  });
});
