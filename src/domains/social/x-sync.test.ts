import { describe, expect, it } from "vitest";

import {
  createMemoryXSocialPostStore,
  listStoredXSocialPosts,
  syncXSocialPosts,
  type XSocialPostScanResult,
} from "./x-sync";

const post = (
  id: string,
  kind: XSocialPostScanResult["posts"][number]["kind"],
  text = `post ${id}`,
): XSocialPostScanResult["posts"][number] => ({
  createdAt: new Date(`2026-05-21T00:00:${id.padStart(2, "0")}.000Z`),
  id,
  kind,
  media: [],
  text,
  url: `https://x.com/sorcererxw/status/${id}`,
});

describe("X Social Source sync", () => {
  it("retains original and quote posts while advancing the boundary through scanned replies and reposts", async () => {
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
      fetchPosts: async ({ afterId, limit }) => {
        expect(afterId).toBe("100");
        expect(limit).toBe(50);

        return {
          posts: [
            post("101", "reply"),
            post("102", "original"),
            post("103", "repost"),
            post("104", "quote"),
          ],
        };
      },
      now: () => new Date("2026-05-21T01:00:00.000Z"),
      store,
    });

    await expect(store.getPost("101")).resolves.toBeNull();
    await expect(store.getPost("103")).resolves.toBeNull();
    await expect(store.getPost("102")).resolves.toMatchObject({ text: "post 102" });
    await expect(store.getPost("104")).resolves.toMatchObject({ text: "post 104" });
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
      fetchPosts: async () => {
        throw new Error("X API unavailable");
      },
      now: () => new Date("2026-05-21T02:00:00.000Z"),
      store,
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
