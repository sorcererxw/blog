import type { KVNamespace } from "@/types/cloudflare";

export type ProviderCache = {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T, options?: { ttlSeconds?: number }) => Promise<void>;
};

const DATE_MARKER = "__blog2ProviderCacheDate";

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
): ProviderCache => ({
  async get<T>(key: string) {
    const value = await namespace.get(key, "text");

    return value ? deserialize<T>(value) : null;
  },
  async set<T>(key: string, value: T, options?: { ttlSeconds?: number }) {
    await namespace.put(key, serialize(value), {
      expirationTtl: options?.ttlSeconds ?? defaultTtlSeconds,
    });
  },
});

export async function readThroughProviderCache<T>(
  cache: ProviderCache,
  key: string,
  load: () => Promise<T>,
  options?: { ttlSeconds?: number },
): Promise<T> {
  const cached = await cache.get<T>(key);

  if (cached !== null) {
    return cached;
  }

  const value = await load();
  await cache.set(key, value, options);

  return value;
}
