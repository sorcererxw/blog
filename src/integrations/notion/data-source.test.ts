import type { Client } from "@notionhq/client";
import { afterEach, describe, expect, it, vi } from "vitest";

let mockKv: Record<string, string> = {};

vi.mock("@/lib/cloudflare-env", () => ({
  getWorkerEnv: async () => ({
    BLOG_CACHE: {
      async get(key: string) {
        return mockKv[key] ?? null;
      },
      async put(key: string, value: string) {
        mockKv[key] = value;
      },
    },
  }),
  waitUntilInWorker: (promise: Promise<unknown>) => {
    void promise;
  },
}));

import {
  getPrimaryDataSourceId,
  resetDataSourceIdCacheForTest,
} from "./data-source";

describe("getPrimaryDataSourceId", () => {
  afterEach(() => {
    mockKv = {};
    resetDataSourceIdCacheForTest();
    vi.clearAllMocks();
  });

  it("caches resolved dataSourceId in memory and KV to avoid repeated databases.retrieve calls", async () => {
    const retrieve = vi.fn(async () => ({
      data_sources: [{ id: "ds-123" }],
      object: "database",
    }));
    const notion = {
      databases: { retrieve },
    } as unknown as Client;

    const first = await getPrimaryDataSourceId(notion, "db-1");
    const second = await getPrimaryDataSourceId(notion, "db-1");

    expect(first).toBe("ds-123");
    expect(second).toBe("ds-123");
    expect(retrieve).toHaveBeenCalledTimes(1);

    // Clear memory cache to verify KV fallback avoids Notion call too.
    resetDataSourceIdCacheForTest();
    const third = await getPrimaryDataSourceId(notion, "db-1");
    expect(third).toBe("ds-123");
    expect(retrieve).toHaveBeenCalledTimes(1);
  });
});
