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

  it("returns stale data immediately on SWR miss and refreshes in background only when changed", async () => {
    const { namespace, store } = createMemoryKvNamespace();
    const cache = createKvProviderCache(namespace, 600);
    let currentTime = 1_000_000;
    let version = 1;
    const backgroundTasks: Promise<unknown>[] = [];
    const load = vi.fn(async () => ({ version }));

    const first = await readThroughProviderCache(cache, "swr-key", load, {
      freshTtlSeconds: 600,
      kvEdgeCacheTtlSeconds: 300,
      now: () => currentTime,
      scheduleBackground: (promise) => {
        backgroundTasks.push(promise);
      },
      staleTtlSeconds: 604_800,
    });

    expect(first).toEqual({ version: 1 });
    expect(namespace.put).toHaveBeenCalledTimes(1);
    expect(namespace.put).toHaveBeenCalledWith(
      "swr-key",
      expect.any(String),
      { expirationTtl: 604_800 },
    );

    // Advance past fresh TTL with unchanged upstream data -> should skip KV write.
    currentTime += 601_000;
    const staleSame = await readThroughProviderCache(cache, "swr-key", load, {
      freshTtlSeconds: 600,
      kvEdgeCacheTtlSeconds: 300,
      now: () => currentTime,
      scheduleBackground: (promise) => {
        backgroundTasks.push(promise);
      },
      staleTtlSeconds: 604_800,
    });
    expect(staleSame).toEqual({ version: 1 });
    await Promise.all(backgroundTasks.splice(0));
    expect(load).toHaveBeenCalledTimes(2);
    expect(namespace.put).toHaveBeenCalledTimes(1);

    // Advance past another fresh TTL with changed upstream data -> should persist to KV.
    version = 2;
    currentTime += 601_000;
    const staleChanged = await readThroughProviderCache(cache, "swr-key", load, {
      freshTtlSeconds: 600,
      kvEdgeCacheTtlSeconds: 300,
      now: () => currentTime,
      scheduleBackground: (promise) => {
        backgroundTasks.push(promise);
      },
      staleTtlSeconds: 604_800,
    });
    expect(staleChanged).toEqual({ version: 1 });
    await Promise.all(backgroundTasks.splice(0));
    expect(namespace.put).toHaveBeenCalledTimes(2);
    expect(store.get("swr-key")).toContain('"version":2');
  });

  it("reads legacy un-enveloped KV entries seamlessly and deduplicates concurrent cold misses", async () => {
    const cache = createMemoryProviderCache();
    await cache.set("legacy-key", { ok: "legacy" });
    const backgroundTasks: Promise<unknown>[] = [];

    const legacyValue = await readThroughProviderCache(
      cache,
      "legacy-key",
      async () => ({ ok: "refreshed" }),
      {
        freshTtlSeconds: 600,
        scheduleBackground: (promise) => {
          backgroundTasks.push(promise);
        },
      },
    );
    expect(legacyValue).toEqual({ ok: "legacy" });
    await Promise.all(backgroundTasks);

    const slowProvider = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve("deduped"), 10);
        }),
    );
    const [a, b] = await Promise.all([
      readThroughProviderCache(cache, "cold-key", slowProvider, { freshTtlSeconds: 600 }),
      readThroughProviderCache(cache, "cold-key", slowProvider, { freshTtlSeconds: 600 }),
    ]);

    expect(a).toBe("deduped");
    expect(b).toBe("deduped");
    expect(slowProvider).toHaveBeenCalledTimes(1);
  });
});
