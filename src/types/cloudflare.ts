export type CloudflareKVValue =
  | string
  | ArrayBuffer
  | ArrayBufferView
  | Blob
  | FormData
  | ReadableStream<Uint8Array>;

export interface CloudflareKVListOptions {
  cursor?: string;
  limit?: number;
  prefix?: string;
}

export interface CloudflareKVListResult {
  cursor: string;
  keys: Array<{
    expiration?: number;
    metadata?: unknown;
    name: string;
  }>;
  list_complete: boolean;
}

export interface KVNamespace {
  delete(key: string): Promise<void>;
  get(key: string): Promise<string | null>;
  get(key: string, type: "arrayBuffer"): Promise<ArrayBuffer | null>;
  get(key: string, type: "json"): Promise<unknown | null>;
  get(key: string, type: "stream"): Promise<ReadableStream<Uint8Array> | null>;
  get(key: string, type: "text"): Promise<string | null>;
  list(options?: CloudflareKVListOptions): Promise<CloudflareKVListResult>;
  put(
    key: string,
    value: CloudflareKVValue,
    options?: {
      expiration?: number;
      expirationTtl?: number;
      metadata?: unknown;
    },
  ): Promise<void>;
}

export interface CloudflareEnv {
  BLOG_CACHE: KVNamespace;
  NOTION_TOKEN: string;
}
