import { describe, expect, it, vi } from "vitest";

import type { KVNamespace } from "@/types/cloudflare";

import { createKvXSocialPostStore } from "./x-social-post-store";

const createMemoryKvNamespace = () => {
  const values = new Map<string, string>();

  return {
    namespace: {
      async delete(key: string) {
        values.delete(key);
      },
      async get(key: string) {
        return values.get(key) ?? null;
      },
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
    } as unknown as KVNamespace & { put: ReturnType<typeof vi.fn> },
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
});
