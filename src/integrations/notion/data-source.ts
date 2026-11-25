import { Client } from "@notionhq/client";

import { getWorkerEnv, waitUntilInWorker } from "@/lib/cloudflare-env";

const DATA_SOURCE_KV_TTL_SECONDS = 60 * 60 * 24 * 30;
const DATA_SOURCE_EDGE_CACHE_TTL_SECONDS = 3600;
const dataSourceIdMemoryCache = new Map<string, string>();
const inFlightDataSourceId = new Map<string, Promise<string>>();

const kvKey = (databaseId: string) => `blog2:notion:data-source:${databaseId}:v1`;

export const getPrimaryDataSourceId = async (
  notion: Client,
  databaseId: string,
): Promise<string> => {
  const memoryHit = dataSourceIdMemoryCache.get(databaseId);
  if (memoryHit) {
    return memoryHit;
  }

  const existingInFlight = inFlightDataSourceId.get(databaseId);
  if (existingInFlight) {
    return existingInFlight;
  }

  const pending = (async () => {
    const env = await getWorkerEnv();
    const kv = env.BLOG_CACHE;

    if (kv) {
      try {
        const kvHit = await kv.get(kvKey(databaseId), {
          cacheTtl: DATA_SOURCE_EDGE_CACHE_TTL_SECONDS,
          type: "text",
        });

        if (kvHit) {
          dataSourceIdMemoryCache.set(databaseId, kvHit);
          return kvHit;
        }
      } catch {
        // Fall through to Notion API when KV lookup fails.
      }
    }

    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });

    if (database.object !== "database" || !("data_sources" in database)) {
      throw new Error(`Notion database ${databaseId} did not return a full database response.`);
    }

    const dataSourceId = database.data_sources[0]?.id;

    if (!dataSourceId) {
      throw new Error(`Notion database ${databaseId} does not expose a data source.`);
    }

    dataSourceIdMemoryCache.set(databaseId, dataSourceId);

    if (kv) {
      waitUntilInWorker(
        kv.put(kvKey(databaseId), dataSourceId, {
          expirationTtl: DATA_SOURCE_KV_TTL_SECONDS,
        }),
      );
    }

    return dataSourceId;
  })().finally(() => {
    inFlightDataSourceId.delete(databaseId);
  });

  inFlightDataSourceId.set(databaseId, pending);
  return pending;
};

export function resetDataSourceIdCacheForTest(): void {
  dataSourceIdMemoryCache.clear();
  inFlightDataSourceId.clear();
}
