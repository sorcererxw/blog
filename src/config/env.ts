export type EnvSource = Record<string, string | undefined>;

export function getRequiredEnv(name: string, source: EnvSource): string {
  const value = source[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOptionalEnv(
  name: string,
  source: EnvSource,
  fallback = "",
): string {
  const value = source[name];

  return typeof value === "string" && value.length > 0 ? value : fallback;
}
