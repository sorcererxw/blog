import { describe, expect, it, vi } from "vitest";

import type { KVNamespace } from "@/types/cloudflare";

import {
  createKvProviderCache,
  createMemoryProviderCache,
  readThroughProviderCache,
} from "./provider-cache";

const createMemoryKvNamespace = () => {
  const store = new Map<string, string>();

  return {
    namespace: {
      async delete(key: string) {
        store.delete(key);
      },
      async get(key: string) {
        return store.get(key) ?? null;
      },
      async list() {
        return {
          cursor: "",
          keys: Array.from(store.keys()).map((name) => ({ name })),
          list_complete: true,
        };
      },
      put: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
    } as unknown as KVNamespace & { put: ReturnType<typeof vi.fn> },
    store,
  };
};

describe("provider cache", () => {
  it("preserves Date values through the memory cache serialization path", async () => {
    const cache = createMemoryProviderCache();
    const publishedAt = new Date("2026-05-18T01:02:03.000Z");

    await cache.set("item", {
      items: [{ publishedAt }],
    });

    const cached = await cache.get<{ items: Array<{ publishedAt: Date }> }>("item");

    expect(cached?.items[0]?.publishedAt).toBeInstanceOf(Date);
    expect(cached?.items[0]?.publishedAt.toISOString()).toBe(publishedAt.toISOString());
  });

  it("uses KV expiration TTL for provider cache writes", async () => {
    const { namespace } = createMemoryKvNamespace();
    const cache = createKvProviderCache(namespace, 600);

    await cache.set("provider-key", { ok: true });

    expect(namespace.put).toHaveBeenCalledWith(
      "provider-key",
      expect.any(String),
      { expirationTtl: 600 },
    );
  });

  it("read-through calls the provider once when a cached value exists", async () => {
    const cache = createMemoryProviderCache();
    const provider = vi.fn(async () => [{ id: "fresh", date: new Date() }]);

    await expect(
      readThroughProviderCache(cache, "items", provider),
    ).resolves.toHaveLength(1);
    await expect(
      readThroughProviderCache(cache, "items", provider),
    ).resolves.toHaveLength(1);

    expect(provider).toHaveBeenCalledTimes(1);
  });
});
