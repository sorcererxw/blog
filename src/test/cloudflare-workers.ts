export const env: Partial<Cloudflare.Env> = {};

export function waitUntil(promise: Promise<unknown>): void {
  void promise.catch(() => undefined);
}
