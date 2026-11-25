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

export interface CloudflareKVGetOptions<Type extends "text" | "json" | "arrayBuffer" | "stream" = "text"> {
  cacheTtl?: number;
  type?: Type;
}

export interface KVNamespace {
  delete(key: string): Promise<void>;
  get(key: string): Promise<string | null>;
  get(key: string, type: "arrayBuffer"): Promise<ArrayBuffer | null>;
  get(key: string, type: "json"): Promise<unknown | null>;
  get(key: string, type: "stream"): Promise<ReadableStream<Uint8Array> | null>;
  get(key: string, type: "text"): Promise<string | null>;
  get(key: string, options: CloudflareKVGetOptions<"text">): Promise<string | null>;
  get(key: string, options: CloudflareKVGetOptions<"json">): Promise<unknown | null>;
  get(key: string, options: CloudflareKVGetOptions<"arrayBuffer">): Promise<ArrayBuffer | null>;
  get(key: string, options: CloudflareKVGetOptions<"stream">): Promise<ReadableStream<Uint8Array> | null>;
  get(keys: string[], type?: "text" | CloudflareKVGetOptions<"text">): Promise<Map<string, string | null>>;
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

export type CloudflareEnv = Cloudflare.Env;
