declare module "cloudflare:workers" {
  export const env: Cloudflare.Env;
  export function waitUntil(promise: Promise<unknown>): void;
}

declare const __APP_BUILD_ID__: string;
