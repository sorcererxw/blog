import { describe, expect, it, vi } from "vitest";

import type { KVNamespace } from "@/types/cloudflare";

import { createKvXSocialPostStore } from "./x-social-post-store";

const createMemoryKvNamespace = () => {
    const values = new Map<string, string>();
    const get = vi.fn(async (key: string | string[]) => {
      if (Array.isArray(key)) {
        return new Map(key.map((entry) => [entry, values.get(entry) ?? null]));
      }

      return values.get(key) ?? null;
    });

  return {
    namespace: {
      async delete(key: string) {
        values.delete(key);
      },
      get,
      async list() {
        return {
          cursor: "",
          keys: Array.from(values.keys()).map((name) => ({ name })),
          list_complete: true,
        };
      },
      put: vi.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    } as unknown as KVNamespace & {
      get: ReturnType<typeof vi.fn>;
      put: ReturnType<typeof vi.fn>;
    },
    values,
  };
};

describe("X Social Source KV store", () => {
  it("persists the durable index and per-post detail records without TTL", async () => {
    const { namespace } = createMemoryKvNamespace();
    const store = createKvXSocialPostStore(namespace);

    await store.putPost({
      createdAt: new Date("2026-05-21T00:00:00.000Z"),
      id: "101",
      kind: "original",
      media: [],
      quotedPost: {
        authorName: "ZEN",
        authorUsername: "supezen",
        id: "100",
        media: [],
        text: "quoted",
        url: "https://x.com/supezen/status/100",
      },
      text: "hello",
      url: "https://x.com/sorcererxw/status/101",
    });
    await store.putIndex({
      lastAttemptAt: "2026-05-21T01:00:00.000Z",
      lastError: null,
      lastRetainedCount: 1,
      lastScannedCount: 2,
      lastSuccessAt: "2026-05-21T01:00:00.000Z",
      orderedIds: ["101"],
      scannedBoundaryId: "102",
    });

    await expect(store.getPost("101")).resolves.toMatchObject({
      createdAt: new Date("2026-05-21T00:00:00.000Z"),
      id: "101",
      quotedPost: {
        authorName: "ZEN",
        authorUsername: "supezen",
        id: "100",
        media: [],
        text: "quoted",
        url: "https://x.com/supezen/status/100",
      },
      text: "hello",
    });
    await expect(store.getIndex()).resolves.toMatchObject({
      orderedIds: ["101"],
      scannedBoundaryId: "102",
    });
    expect(namespace.put).toHaveBeenCalledWith(
      "social:x:posts:101",
      expect.any(String),
    );
    expect(namespace.put).toHaveBeenCalledWith(
      "social:x:index",
      expect.any(String),
    );
  });

  it("reads and writes a single-key feed snapshot and batches per-post reads", async () => {
    const { namespace } = createMemoryKvNamespace();
    const store = createKvXSocialPostStore(namespace);
    const post = {
      createdAt: new Date("2026-05-21T00:00:00.000Z"),
      id: "201",
      kind: "original" as const,
      media: [],
      text: "batched",
      url: "https://x.com/sorcererxw/status/201",
    };

    await store.putPost(post);
    await store.putFeedSnapshot?.([post]);

    const snapshot = await store.getFeedSnapshot?.();
    expect(snapshot).toHaveLength(1);
    expect(snapshot?.[0]?.createdAt).toBeInstanceOf(Date);
    expect(snapshot?.[0]?.id).toBe("201");

    namespace.get.mockClear();
    const batched = await store.getPostsBatch?.(["201", "missing"]);
    expect(namespace.get).toHaveBeenCalledTimes(1);
    expect(batched?.[0]?.id).toBe("201");
    expect(batched?.[1]).toBeNull();
  });
});
