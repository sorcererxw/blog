import type { KVNamespace } from "@/types/cloudflare";

export type CanonicalMediaRecord = {
  contentType: string;
  sourceUrl: string;
};

export type CanonicalMediaCache = {
  get: (id: string) => Promise<{ body: ArrayBuffer; record: CanonicalMediaRecord } | null>;
  set: (id: string, value: { body: ArrayBuffer; record: CanonicalMediaRecord }) => Promise<void>;
};

const bodyKey = (id: string) => `blog2:media:body:${id}`;
const metaKey = (id: string) => `blog2:media:meta:${id}`;

export const createNoopCanonicalMediaCache = (): CanonicalMediaCache => ({
  async get() {
    return null;
  },
  async set() {
    return undefined;
  },
});

export const createMemoryCanonicalMediaCache = (): CanonicalMediaCache => {
  const store = new Map<string, { body: ArrayBuffer; record: CanonicalMediaRecord }>();

  return {
    async get(id) {
      return store.get(id) ?? null;
    },
    async set(id, value) {
      store.set(id, value);
    },
  };
};

export const createKvCanonicalMediaCache = (namespace: KVNamespace): CanonicalMediaCache => ({
  async get(id) {
    const [body, metadata] = await Promise.all([
      namespace.get(bodyKey(id), "arrayBuffer"),
      namespace.get(metaKey(id), "json"),
    ]);

    if (!body || !metadata || typeof metadata !== "object") {
      return null;
    }

    const record = metadata as Partial<CanonicalMediaRecord>;

    if (!record.contentType || !record.sourceUrl) {
      return null;
    }

    return {
      body,
      record: {
        contentType: record.contentType,
        sourceUrl: record.sourceUrl,
      },
    };
  },

  async set(id, value) {
    await Promise.all([
      namespace.put(bodyKey(id), value.body),
      namespace.put(metaKey(id), JSON.stringify(value.record)),
    ]);
  },
});
