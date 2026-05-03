import { getRequiredEnv } from "./env";
import type { CloudflareEnv } from "@/types/cloudflare";

export type RuntimeMode = "development" | "production" | "test";

export interface RuntimeConfig {
  app: "blog2";
  mode: RuntimeMode;
  isDevelopment: boolean;
  isProduction: boolean;
}

export function resolveRuntimeMode(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): RuntimeMode {
  if (nodeEnv === "production") {
    return "production";
  }

  if (nodeEnv === "test") {
    return "test";
  }

  return "development";
}

export function getRuntimeConfig(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): RuntimeConfig {
  const mode = resolveRuntimeMode(nodeEnv);

  return {
    app: "blog2",
    mode,
    isDevelopment: mode === "development",
    isProduction: mode === "production",
  };
}

export function getRequiredCloudflareBinding<K extends keyof CloudflareEnv>(
  env: Partial<CloudflareEnv>,
  name: K,
): CloudflareEnv[K] {
  const value = env[name];

  if (value === undefined || value === null) {
    throw new Error(`Missing required Cloudflare binding: ${String(name)}`);
  }

  return value;
}

export function getRequiredRuntimeEnv(name: string): string {
  return getRequiredEnv(name, process.env);
}
