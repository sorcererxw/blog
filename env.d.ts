import type { KVNamespace } from "@/types/cloudflare";

declare global {
  interface CloudflareEnv {
    BLOG_CACHE: KVNamespace;
  }

  interface Env {
    BLOG_CACHE: KVNamespace;
    NOTION_TOKEN: string;
  }

  interface ExecutionContext {
    passThroughOnException(): void;
    waitUntil(promise: Promise<unknown>): void;
  }
}

declare module "cloudflare:workers" {
  const env: Partial<CloudflareEnv>;
  export { env };
}

export {};
