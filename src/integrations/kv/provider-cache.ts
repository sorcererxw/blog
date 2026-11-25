import type { KVNamespace } from "@/types/cloudflare";

export type ProviderCacheGetOptions = {
  cacheTtlSeconds?: number;
};

export type ProviderCache = {
  get: <T>(key: string, options?: ProviderCacheGetOptions) => Promise<T | null>;
  set: <T>(key: string, value: T, options?: { ttlSeconds?: number }) => Promise<void>;
};

export type ProviderCacheSwrEnvelope<T> = {
  __blog2ProviderCacheSwr: 1;
  cachedAt: number;
  fullReconcileAt?: number;
  value: T;
};

const DATE_MARKER = "__blog2ProviderCacheDate";
const SWR_MARKER = "__blog2ProviderCacheSwr";

type ProviderCacheInternalState = {
  inFlight: Map<string, Promise<unknown>>;
  lastVerifiedAt: Map<string, number>;
};

const cacheStateByInstance = new WeakMap<ProviderCache, ProviderCacheInternalState>();
const sharedKvState: ProviderCacheInternalState = {
  inFlight: new Map(),
  lastVerifiedAt: new Map(),
};
const kvBackedCaches = new WeakSet<ProviderCache>();

const getState = (cache: ProviderCache): ProviderCacheInternalState => {
  if (kvBackedCaches.has(cache)) {
    return sharedKvState;
  }

  let state = cacheStateByInstance.get(cache);

  if (!state) {
    state = {
      inFlight: new Map(),
      lastVerifiedAt: new Map(),
    };
    cacheStateByInstance.set(cache, state);
  }

  return state;
};

const encodeValue = (value: unknown): unknown => {
  if (value instanceof Date) {
    return { [DATE_MARKER]: value.toISOString() };
  }

  if (Array.isArray(value)) {
    return value.map(encodeValue);
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, encodeValue(entry)]),
    );
  }

  return value;
};

const decodeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(decodeValue);
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;

    if (
      Object.keys(record).length === 1 &&
      typeof record[DATE_MARKER] === "string"
    ) {
      return new Date(record[DATE_MARKER]);
    }

    return Object.fromEntries(
      Object.entries(record).map(([key, entry]) => [key, decodeValue(entry)]),
    );
  }

  return value;
};

const serialize = (value: unknown) => JSON.stringify(encodeValue(value));

const deserialize = <T>(value: string): T | null => {
  try {
    return decodeValue(JSON.parse(value)) as T;
  } catch {
    return null;
  }
};

const isSwrEnvelope = <T>(value: unknown): value is ProviderCacheSwrEnvelope<T> =>
  typeof value === "object" &&
  value !== null &&
  (value as Record<string, unknown>)[SWR_MARKER] === 1 &&
  typeof (value as Record<string, unknown>).cachedAt === "number" &&
  "value" in value;

export const createNoopProviderCache = (): ProviderCache => ({
  async get() {
    return null;
  },
  async set() {
    return undefined;
  },
});

export const createMemoryProviderCache = (): ProviderCache => {
  const store = new Map<string, string>();

  return {
    async get<T>(key: string) {
      const value = store.get(key);

      return value ? deserialize<T>(value) : null;
    },
    async set<T>(key: string, value: T) {
      store.set(key, serialize(value));
    },
  };
};

export const createKvProviderCache = (
  namespace: KVNamespace,
  defaultTtlSeconds: number,
): ProviderCache => {
  const cache: ProviderCache = {
    async get<T>(key: string, options?: ProviderCacheGetOptions) {
      const value =
        options?.cacheTtlSeconds && options.cacheTtlSeconds >= 60
          ? await namespace.get(key, {
              cacheTtl: options.cacheTtlSeconds,
              type: "text",
            })
          : await namespace.get(key, "text");

      return value ? deserialize<T>(value) : null;
    },
    async set<T>(key: string, value: T, options?: { ttlSeconds?: number }) {
      await namespace.put(key, serialize(value), {
        expirationTtl: options?.ttlSeconds ?? defaultTtlSeconds,
      });
    },
  };

  kvBackedCaches.add(cache);

  return cache;
};

export type ReadThroughProviderCacheOptions<T> = {
  freshTtlSeconds?: number;
  kvEdgeCacheTtlSeconds?: number;
  now?: () => number;
  refreshLoad?: (
    staleValue: T,
    meta: { cachedAt: number; fullReconcileAt?: number },
  ) => Promise<{ fullReconcileAt?: number; value: T }>;
  scheduleBackground?: (promise: Promise<unknown>) => void;
  shouldCache?: (value: T) => boolean;
  staleTtlSeconds?: number;
  ttlSeconds?: number;
};

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export async function readThroughProviderCache<T>(
  cache: ProviderCache,
  key: string,
  load: () => Promise<T>,
  options: ReadThroughProviderCacheOptions<T> = {},
): Promise<T> {
  const {
    freshTtlSeconds,
    kvEdgeCacheTtlSeconds,
    now = () => Date.now(),
    refreshLoad,
    scheduleBackground,
    shouldCache,
    staleTtlSeconds,
    ttlSeconds,
  } = options;
  const state = getState(cache);
  const getOptions = kvEdgeCacheTtlSeconds
    ? { cacheTtlSeconds: kvEdgeCacheTtlSeconds }
    : undefined;
  const cachedRaw = await cache.get<T | ProviderCacheSwrEnvelope<T>>(key, getOptions);

  if (!freshTtlSeconds) {
    if (cachedRaw !== null) {
      return isSwrEnvelope<T>(cachedRaw) ? cachedRaw.value : cachedRaw;
    }

    const existingInFlight = state.inFlight.get(key) as Promise<T> | undefined;
    if (existingInFlight) {
      return existingInFlight;
    }

    const pending = (async () => {
      const value = await load();
      if (!shouldCache || shouldCache(value)) {
        await cache.set(key, value, ttlSeconds ? { ttlSeconds } : undefined);
      }
      return value;
    })().finally(() => {
      state.inFlight.delete(key);
    });

    state.inFlight.set(key, pending);
    return pending;
  }

  const writeTtlSeconds = staleTtlSeconds ?? ttlSeconds;
  const currentTime = now();

  if (cachedRaw !== null) {
    const envelope: ProviderCacheSwrEnvelope<T> = isSwrEnvelope<T>(cachedRaw)
      ? cachedRaw
      : {
          __blog2ProviderCacheSwr: 1,
          cachedAt: 0,
          value: cachedRaw,
        };
    const effectiveUpdatedAt = Math.max(
      envelope.cachedAt,
      state.lastVerifiedAt.get(key) ?? 0,
    );
    const isStale = currentTime - effectiveUpdatedAt >= freshTtlSeconds * 1000;

    if (isStale && scheduleBackground && !state.inFlight.has(key)) {
      const previousSerialized = serialize(envelope.value);
      const refreshPromise = (async () => {
        const refreshed = refreshLoad
          ? await refreshLoad(envelope.value, {
              cachedAt: envelope.cachedAt,
              fullReconcileAt: envelope.fullReconcileAt,
            })
          : {
              fullReconcileAt: envelope.fullReconcileAt ?? now(),
              value: await load(),
            };
        const refreshedAt = now();
        state.lastVerifiedAt.set(key, refreshedAt);

        if (shouldCache && !shouldCache(refreshed.value)) {
          return;
        }

        const nextSerialized = serialize(refreshed.value);
        const shouldPersistTimestamp = refreshedAt - envelope.cachedAt >= SIX_HOURS_MS;

        if (
          nextSerialized !== previousSerialized ||
          !isSwrEnvelope(cachedRaw) ||
          shouldPersistTimestamp ||
          refreshed.fullReconcileAt !== envelope.fullReconcileAt
        ) {
          const nextEnvelope: ProviderCacheSwrEnvelope<T> = {
            __blog2ProviderCacheSwr: 1,
            cachedAt: refreshedAt,
            fullReconcileAt: refreshed.fullReconcileAt ?? envelope.fullReconcileAt,
            value: refreshed.value,
          };
          await cache.set(
            key,
            nextEnvelope,
            writeTtlSeconds ? { ttlSeconds: writeTtlSeconds } : undefined,
          );
        }
      })().finally(() => {
        state.inFlight.delete(key);
      });

      state.inFlight.set(key, refreshPromise);
      scheduleBackground(refreshPromise);
    }

    return envelope.value;
  }

  const existingInFlight = state.inFlight.get(key) as Promise<T> | undefined;
  if (existingInFlight) {
    return existingInFlight;
  }

  const coldLoad = (async () => {
    const value = await load();
    const loadedAt = now();
    state.lastVerifiedAt.set(key, loadedAt);

    if (!shouldCache || shouldCache(value)) {
      const envelope: ProviderCacheSwrEnvelope<T> = {
        __blog2ProviderCacheSwr: 1,
        cachedAt: loadedAt,
        fullReconcileAt: loadedAt,
        value,
      };
      await cache.set(
        key,
        envelope,
        writeTtlSeconds ? { ttlSeconds: writeTtlSeconds } : undefined,
      );
    }

    return value;
  })().finally(() => {
    state.inFlight.delete(key);
  });

  state.inFlight.set(key, coldLoad);
  return coldLoad;
}

export function resetSharedProviderCacheStateForTest(): void {
  sharedKvState.inFlight.clear();
  sharedKvState.lastVerifiedAt.clear();
}
