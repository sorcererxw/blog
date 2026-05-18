import { getWorkerEnvSync } from "@/lib/cloudflare-env";
import type { CloudflareEnv } from "@/types/cloudflare";
import type { SeoImage } from "./model";

export const SITE_NAME = "sorcererxw";
export const SITE_AUTHOR_NAME = "sorcererxw";
export const DEFAULT_SITE_ORIGIN = "https://sorcererxw.com";
export const DEFAULT_SOCIAL_IMAGE_PATH = "/favicon.svg";
export const SITE_EXTERNAL_PROFILES = [
  "https://github.com/sorcererxw",
  "https://jike.sorcererxw.com",
  "https://t.me/s/tech_bb",
] as const;

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getSiteOrigin(source: Partial<Pick<CloudflareEnv, "PUBLIC_SITE_URL">> = getWorkerEnvSync()) {
  const configured = typeof source.PUBLIC_SITE_URL === "string" && source.PUBLIC_SITE_URL.length > 0
    ? source.PUBLIC_SITE_URL.trim()
    : DEFAULT_SITE_ORIGIN;

  try {
    const url = new URL(configured);
    return stripTrailingSlash(url.origin);
  } catch {
    return DEFAULT_SITE_ORIGIN;
  }
}

export function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const withoutIndex = withLeadingSlash.replace(/\/index\.html$/, "/");
  const withoutHtml = withoutIndex.replace(/\.html$/, "");
  const normalized = withoutHtml.replace(/\/+$/, "");

  return normalized || "/";
}

export function buildAbsoluteUrl(
  pathname: string,
  source: Partial<Pick<CloudflareEnv, "PUBLIC_SITE_URL">> = getWorkerEnvSync(),
) {
  return `${getSiteOrigin(source)}${normalizePathname(pathname)}`;
}

export function getDefaultAuthor() {
  return {
    "@type": "Person" as const,
    name: SITE_AUTHOR_NAME,
    sameAs: [...SITE_EXTERNAL_PROFILES],
    url: getSiteOrigin(),
  };
}

export function getDefaultSocialImage(): SeoImage {
  return {
    url: buildAbsoluteUrl(DEFAULT_SOCIAL_IMAGE_PATH),
    alt: SITE_NAME,
  };
}
