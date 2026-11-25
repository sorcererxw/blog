import { env as workerEnv, waitUntil as workerWaitUntil } from "cloudflare:workers";

import type { CloudflareEnv } from "@/types/cloudflare";

export type AppEnvironment = "development" | "production" | "test";

export type RuntimeInfo = {
  app: "blog2";
  mode: AppEnvironment;
  isDevelopment: boolean;
  isProduction: boolean;
};

const APP_ENV_VALUES = new Set<AppEnvironment>(["development", "production", "test"]);

export function getWorkerEnvSync(): Partial<CloudflareEnv> {
  try {
    return (workerEnv as Partial<CloudflareEnv> | undefined) ?? {};
  } catch {
    return {};
  }
}

export async function getWorkerEnv(): Promise<Partial<CloudflareEnv>> {
  return getWorkerEnvSync();
}

export function waitUntilInWorker(promise: Promise<unknown>): void {
  const safePromise = promise.catch(() => undefined);

  try {
    if (typeof workerWaitUntil === "function") {
      workerWaitUntil(safePromise);
      return;
    }
  } catch {
    // Fall through when called outside an active Cloudflare Worker request context.
  }

  void safePromise;
}

export function getAppEnvironment(env: Partial<CloudflareEnv> = getWorkerEnvSync()): AppEnvironment {
  const value = env.APP_ENV;

  return typeof value === "string" && APP_ENV_VALUES.has(value as AppEnvironment)
    ? (value as AppEnvironment)
    : "production";
}

export function getRuntimeInfo(env: Partial<CloudflareEnv> = getWorkerEnvSync()): RuntimeInfo {
  const mode = getAppEnvironment(env);

  return {
    app: "blog2",
    mode,
    isDevelopment: mode === "development",
    isProduction: mode === "production",
  };
}
